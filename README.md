# AI-Powered Document Intelligence System

**Care Guide AI Engineer Assessment — runnable local prototype.**

## Features
- Multi-file upload; digital and scanned PDF, JPG/PNG/TIFF, XLS/XLSX, CSV ingestion
- OCR via installed Tesseract, multi-page PDF and multi-sheet Excel
- Rule-based extraction for predictable demo invoices, optional LLM-assisted JSON extraction
- Financial validation, missing fields, duplicate invoice checks, manual corrections
- REST API, processing history, retry failed jobs, keyword search
- Optional semantic search (sentence-transformers), React dashboard, automated tests

## Requirements
Python 3.10+, Node.js 18+, Tesseract OCR installed and available on PATH (needed for scans). On Windows install Tesseract and add its installation directory to PATH. Optional LLM API key. No API key is required for the sample demo.

## Quick start (two terminals)
**Terminal 1 — backend**
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
**Terminal 2 — frontend**
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 and API documentation at http://localhost:8000/docs. Upload `samples/invoice_001.csv` and inspect the result. Test cases:
```bash
cd backend
pytest -q
python evaluate.py  # small synthetic smoke metrics; see docs/SMOKE_EVALUATION.json
```

## Optional settings
Set environment variables (see `.env.example`) before starting backend. `APP_API_KEY` enables simple shared-key auth (send `x-api-key`); do not use this mechanism for multi-tenant production auth. `LLM_API_KEY` enables an OpenAI-compatible chat-completions endpoint. **Sensitive financial data is sent to the configured provider when enabled.** Never put credentials in frontend code or Git. `DATABASE_URL` can point to PostgreSQL when psycopg is installed; SQLite is the default local prototype DB. For optional semantic search: `pip install sentence-transformers`; first request downloads model weights and may take time.

## API endpoints
| Method | Path | Description |
|---|---|---|
| GET | /health | Liveness |
| POST | /documents | Multi-file upload; returns IDs |
| GET | /documents?q=&status= | Keyword search/list |
| GET | /documents/{id} | Extracted fields, validation, preview |
| GET | /documents/{id}/history | Processing audit trail |
| PATCH | /documents/{id} | Manual correction JSON: `{"data":{"total":115}}` |
| POST | /documents/{id}/retry | Retry failed processing |
| GET | /search/semantic?q= | Optional embeddings search |

## Architecture
See `docs/ARCHITECTURE.md`. Main pipeline: upload → persist file + DB row → background task → PDF/OCR/spreadsheet text → LLM or heuristic JSON → deterministic validation → store result → dashboard. File upload and OCR failures are captured as failed jobs.

## Limitations / next production steps
This is an **assessment prototype, not production-ready**. FastAPI BackgroundTasks is process-local and is not a durable queue: server restarts can lose queued work; replace with Redis + Celery/RQ for long-running 1000-page PDF jobs. LLM currently truncates text to 60k characters; large PDFs require page-wise extraction, batching, chunk reconciliation, and pagination. No document-to-document reconciliation, robust table extraction, antivirus scanning, full RBAC, cloud object storage, rate limits, migration system, tenant isolation, or vector index are implemented. OCR quality varies with scans; review uncertain fields. Semantic search uses in-memory embeddings over at most 500 documents; add pgvector for scale. The frontend provides keyword search, not semantic-search controls. The sample is synthetic and not a statistically valid accuracy benchmark. Restrict uploads and secure access before any real customer data is used.

## Submission checklist
- [x] Source, README, architecture + schema, backend, frontend, PDF/image/Excel/CSV parsing code, tests
- [ ] Run integration tests and collect real measurements in your own environment
- [ ] Record screen walkthrough showing successful processing and corrections
- [ ] Publish to your own GitHub repository and add its URL
- [ ] Obtain permission to share any real invoice data
- [ ] Include AI assistance disclosure in submission

## AI assistance disclosure
Initial prototype architecture, code, tests, and documentation were generated with assistance from ChatGPT (OpenAI). The candidate must personally review, run, debug, test, and be able to explain the work. Do not claim independently authored code or verified metrics unless substantiated.
