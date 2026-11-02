from pathlib import Path
from app.core import heuristic_extract,validate,parse_document

def test_extract():
    d=heuristic_extract('Invoice Number: INV-12\nDate: 2026-10-20\nSupplier: Example Ltd\nSubtotal: 100\nTax: 15\nTotal: 115\nUSD')
    assert d['invoice_number']=='INV-12'
    assert d['total']==115
    assert d['currency']=='USD'
    assert not validate(d)

def test_invalid_total():
    d={'invoice_number':'A','invoice_date':'2026-01-01','supplier_name':'X','subtotal':100,'tax':5,'total':200,'line_items':[]}
    assert any(x['code']=='TOTAL_MISMATCH' for x in validate(d))

def test_missing_fields():
    assert any(x['code']=='MISSING_FIELD' for x in validate({}))

def test_line_items():
    d={'invoice_number':'A','invoice_date':'2026-01-01','supplier_name':'X','subtotal':10,'tax':0,'total':10,'line_items':[{'quantity':2,'unit_price':5,'amount':9}]}
    assert any(x['code']=='LINE_MISMATCH' for x in validate(d))

def test_csv(tmp_path):
    p=tmp_path/'data.csv';p.write_text('name,amount\nAlice,100\n')
    assert 'Alice' in parse_document(p,'.csv')

def test_xlsx(tmp_path):
    from openpyxl import Workbook
    p=tmp_path/'data.xlsx';w=Workbook();w.active['A1']='Invoice';w.create_sheet('Second')['A1']='Other';w.save(p)
    out=parse_document(p,'.xlsx')
    assert 'Invoice' in out and 'Other' in out

def test_corrupted_pdf(tmp_path):
    import pytest
    p=tmp_path/'broken.pdf';p.write_bytes(b'not a pdf')
    with pytest.raises(Exception):parse_document(p,'.pdf')
