from fastapi.testclient import TestClient
from app.main import app
from app.core import Session,Document

client=TestClient(app)

def test_health():
    assert client.get('/health').json()['status']=='ok'

def test_upload_and_correction():
    result=client.post('/documents',files=[('files',('invoice.csv',b'Invoice Number: A-1\nDate: 2026-01-01\nSupplier: Test\nSubtotal: 10\nTax: 2\nTotal: 12','text/csv'))])
    assert result.status_code==202
    doc_id=result.json()['ids'][0]
    response=client.get('/documents/'+doc_id)
    assert response.status_code==200
    correction=client.patch('/documents/'+doc_id,json={'data':{'total':12}})
    assert correction.status_code==200
    assert client.get('/documents/'+doc_id+'/history').status_code==200

def test_bad_extension():
    r=client.post('/documents',files=[('files',('bad.exe',b'bad','application/octet-stream'))])
    assert r.status_code==415
