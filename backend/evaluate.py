"""Tiny synthetic smoke evaluation; NOT a representative labeled benchmark."""
import json,time
from pathlib import Path
from app.core import parse_document,heuristic_extract,validate
root=Path(__file__).resolve().parents[1]
truth={'invoice_001.csv':{'invoice_number':'INV-2026-001','invoice_date':'2026-10-25','supplier_name':'Demo Supplies Ltd','subtotal':100.0,'tax':15.0,'total':115.0,'currency':'BDT'},'invoice_bad_total.csv':{'invoice_number':'INV-2026-002','invoice_date':'2026-10-25','supplier_name':'Demo Supplies Ltd','subtotal':100.0,'tax':15.0,'total':140.0,'currency':'BDT'}}
start=time.perf_counter();correct=total=success=failed=0;details=[]
for filename,labels in truth.items():
    t=time.perf_counter()
    try:
        text=parse_document(root/'samples'/filename,'.csv')
        out=heuristic_extract(text)
        issues=validate(out)
        hits=sum(out.get(k)==v for k,v in labels.items())
        correct+=hits;total+=len(labels);success+=1
        details.append({'file':filename,'correct_fields':hits,'fields':len(labels),'issues':[i['code'] for i in issues],'duration_ms':round((time.perf_counter()-t)*1000,2)})
    except Exception as exc:
        failed+=1;details.append({'file':filename,'error':str(exc)})
report={'dataset':'2 synthetic CSV invoice fixtures; NOT real-world benchmark','documents':len(truth),'field_exact_match_accuracy':round(correct/total,4) if total else None,'document_success_rate':success/len(truth),'document_failure_rate':failed/len(truth),'total_processing_ms':round((time.perf_counter()-start)*1000,2),'details':details}
(root/'docs'/'SMOKE_EVALUATION.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
