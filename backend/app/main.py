import os, uuid, hashlib, json, re
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import or_
from .core import Session, Document, History, STORE, now, event, process, validate, serialize

app=FastAPI(title='Document Intelligence API',version='1.0')
app.add_middleware(CORSMiddleware,allow_origins=os.getenv('CORS_ORIGINS','http://localhost:5173').split(','),allow_methods=['*'],allow_headers=['*'])
EXT={'.pdf','.jpg','.jpeg','.png','.tif','.tiff','.xlsx','.xls','.csv'}
MAX=int(os.getenv('MAX_UPLOAD_MB','25'))*1024*1024

def auth(x_api_key: str|None=Header(default=None)):
    secret=os.getenv('APP_API_KEY')
    if secret and x_api_key!=secret: raise HTTPException(401,'Invalid API key')

class Correction(BaseModel):
    data:dict

@app.get('/health')
def health():return {'status':'ok'}

@app.post('/documents',dependencies=[Depends(auth)],status_code=202)
async def upload(background_tasks:BackgroundTasks,files:list[UploadFile]=File(...)):
    if len(files)>20:raise HTTPException(400,'Max 20 files per request')
    ids=[]
    for file in files:
        name=Path(file.filename or '').name
        suffix=Path(name).suffix.lower()
        if suffix not in EXT:raise HTTPException(415,f'Unsupported file type: {name}')
        doc_id=str(uuid.uuid4());path=STORE/(doc_id+suffix)
        digest=hashlib.sha256();size=0
        try:
            with path.open('wb') as dest:
                while chunk:=await file.read(1024*1024):
                    size+=len(chunk)
                    if size>MAX:raise HTTPException(413,f'File too large: {name}')
                    digest.update(chunk);dest.write(chunk)
            if size==0:raise HTTPException(400,f'Empty file: {name}')
            with Session() as db:
                db.add(Document(id=doc_id,filename=name,sha256=digest.hexdigest(),status='queued',created_at=now(),updated_at=now()))
                event(db,doc_id,'queued');db.commit()
            ids.append(doc_id);background_tasks.add_task(process,doc_id)
        except Exception:
            path.unlink(missing_ok=True);raise
        finally:await file.close()
    return {'ids':ids,'message':'Queued for background processing (single-server demo mode)'}

@app.get('/documents',dependencies=[Depends(auth)])
def documents(q:str='',status:str='',limit:int=50):
    with Session() as db:
        query=db.query(Document)
        if status:query=query.filter(Document.status==status)
        if q:query=query.filter(or_(Document.filename.ilike(f'%{q}%'),Document.extracted_text.ilike(f'%{q}%'),Document.data_json.ilike(f'%{q}%')))
        return [serialize(x) for x in query.order_by(Document.created_at.desc()).limit(min(max(limit,1),200)).all()]

@app.get('/documents/{doc_id}',dependencies=[Depends(auth)])
def document(doc_id:str):
    with Session() as db:
        doc=db.get(Document,doc_id)
        if not doc:raise HTTPException(404,'Not found')
        return serialize(doc)|{'text_preview':(doc.extracted_text or '')[:20000]}

@app.get('/documents/{doc_id}/history',dependencies=[Depends(auth)])
def history(doc_id:str):
    with Session() as db:
        return [{'event':x.event,'timestamp':x.timestamp,'detail':x.detail} for x in db.query(History).filter_by(document_id=doc_id).order_by(History.id).all()]

@app.patch('/documents/{doc_id}',dependencies=[Depends(auth)])
def correct(doc_id:str,body:Correction):
    with Session() as db:
        doc=db.get(Document,doc_id)
        if not doc:raise HTTPException(404,'Not found')
        original=json.loads(doc.data_json or '{}')
        allowed={'invoice_number','invoice_date','supplier_name','customer_name','subtotal','tax','total','currency','line_items'}
        if not set(body.data).issubset(allowed):raise HTTPException(400,'Unexpected fields')
        original.update(body.data)
        issues=validate(original,db,doc_id)
        doc.data_json=json.dumps(original);doc.issues_json=json.dumps(issues)
        doc.status='review' if issues else 'completed';doc.updated_at=now()
        event(db,doc_id,'manual_correction',json.dumps(list(body.data)))
        db.commit();return serialize(doc)

@app.post('/documents/{doc_id}/retry',dependencies=[Depends(auth)],status_code=202)
def retry(doc_id:str,background_tasks:BackgroundTasks):
    with Session() as db:
        doc=db.get(Document,doc_id)
        if not doc:raise HTTPException(404,'Not found')
        if doc.status!='failed':raise HTTPException(409,'Only failed jobs may be retried')
        doc.status='queued';doc.updated_at=now();event(db,doc_id,'requeued');db.commit()
    background_tasks.add_task(process,doc_id)
    return {'id':doc_id,'status':'queued'}

@app.get('/search/semantic',dependencies=[Depends(auth)])
def semantic_search(q:str,limit:int=10):
    # Optional sentence-transformers dependency; explicitly error if unavailable.
    try:from sentence_transformers import SentenceTransformer
    except ImportError:raise HTTPException(503,'Install sentence-transformers for semantic search')
    import numpy as np
    with Session() as db:
        docs=db.query(Document).filter(Document.extracted_text!='').limit(500).all()
        if not docs:return []
        model=SentenceTransformer(os.getenv('EMBEDDING_MODEL','all-MiniLM-L6-v2'))
        embeddings=model.encode([q]+[(d.extracted_text or '')[:5000] for d in docs],normalize_embeddings=True)
        scores=np.asarray(embeddings[1:])@embeddings[0]
        order=np.argsort(-scores)[:min(max(limit,1),50)]
        return [{'id':docs[int(i)].id,'filename':docs[int(i)].filename,'score':float(scores[i])} for i in order]
