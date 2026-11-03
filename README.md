# AI-Powered Document Intelligence System

**Care Guide AI Engineer Assessment — Runnable Local Prototype**

A full-stack document intelligence prototype that extracts structured invoice information from PDF, image, Excel, and CSV files, validates financial information, and provides a dashboard for reviewing and correcting results.

## Features

- Multi-file document upload
- PDF, JPG, PNG, TIFF, XLS, XLSX, and CSV ingestion
- OCR using Tesseract for scanned documents
- Multi-page PDF and multi-sheet Excel processing
- Rule-based invoice extraction with optional LLM assistance
- Financial validation and duplicate invoice detection
- Manual corrections and processing history
- Retry failed processing jobs
- REST API with FastAPI
- React-based frontend dashboard with invoice overview
- Keyword search and optional semantic search
- Automated backend tests

## Technology Stack

| Component | Technology |
|---|---|
| Backend | Python, FastAPI |
| Frontend | React, Vite |
| Database | SQLite, SQLAlchemy |
| OCR | Tesseract, pytesseract |
| PDF Processing | PyMuPDF |
| Excel Processing | pandas |
| Testing | pytest |
| Optional AI | OpenAI-compatible LLM |
| Optional Semantic Search | sentence-transformers |

## Requirements

- Python 3.10+
- Node.js and npm compatible with the installed Vite version
- Tesseract OCR installed and available in PATH
- Git

No LLM API key is required for the sample demonstration.

## Installation and Setup

### Step 1 — Clone the Repository

```bash
git clone https://github.com/shafinSI/careguide-document-intelligence.git
cd careguide-document-intelligence
```

### Step 2 — Start Backend

Open Terminal 1 (Windows PowerShell):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

For macOS/Linux, activate the environment with `source .venv/bin/activate` and then run the corresponding installation and Uvicorn commands.

Backend API: http://127.0.0.1:8001

Swagger API Documentation: http://127.0.0.1:8001/docs

Health Check: http://127.0.0.1:8001/health

### Step 3 — Start Frontend

Open Terminal 2 from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the frontend URL printed by Vite, normally http://localhost:5173. If port 5173 is busy, Vite may use http://localhost:5174 or another available port.

**Local API connection:** The frontend uses relative API paths such as `/documents`. `frontend/vite.config.js` forwards those requests to `http://127.0.0.1:8001` during local development. No `VITE_API_URL` configuration is needed for this setup.

**Production-build note:** The Vite development proxy does not operate when the built static files are deployed. Production hosting requires a suitable reverse proxy or separate API configuration and security review. A successful `npm run build` does not establish deployment readiness.

## Supported Document Formats

| Format | Processing Method | Local Test |
|---|---|---|
| PDF | Text extraction / OCR fallback | Passed |
| CSV | Structured text parsing | Passed |
| Excel | Spreadsheet parsing | Passed |
| PNG Image | Tesseract OCR | Passed |

The reported tests use local sample invoices, not a representative production dataset.

## Automated Testing

From the backend directory:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Latest observed local result:

- 10 tests passed
- 0 tests failed
- 1 dependency deprecation warning
- Execution time: 10.90 seconds

## Evaluation

Run the evaluation from the backend directory:

```powershell
.\.venv\Scripts\python.exe evaluate.py
```

### Observed Evaluation Results

| Metric | Result |
|---|---|
| Dataset | 2 synthetic CSV invoices |
| Field Exact-Match Accuracy | 100% |
| Document Success Rate | 100% |
| Document Failure Rate | 0% |
| Total Processing Time | 11.22 ms |

The incorrect-total invoice correctly generated a `TOTAL_MISMATCH` validation issue.

**Important:** These metrics describe only two synthetic CSV fixtures. They are not a statistically valid estimate of real-world accuracy, performance, or reliability.

## Image OCR Verification

A local PNG invoice was successfully processed through the FastAPI backend.

| Field | Extracted Value |
|---|---|
| Invoice Number | INV-2026-006 |
| Supplier | Image Test Supplies |
| Subtotal | 4000 |
| Tax | 600 |
| Total | 4600 |
| Currency | BDT |
| Status | completed |
| Validation Issues | None |
| Processing Time | 1391 ms |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/documents` | Upload documents |
| GET | `/documents` | List and search documents |
| GET | `/documents/{id}` | Document details |
| GET | `/documents/{id}/history` | Processing history |
| PATCH | `/documents/{id}` | Manual correction |
| POST | `/documents/{id}/retry` | Retry processing |
| GET | `/search/semantic` | Optional semantic search |

## Architecture

See `docs/ARCHITECTURE.md` for the architecture diagram and database schema.

Processing pipeline:

1. Upload document
2. Store file and database record
3. Start background processing
4. Extract document text
5. Generate structured invoice fields
6. Validate extracted information
7. Save results and processing history
8. Display results in the dashboard

## Optional Configuration

Refer to `.env.example` for backend configuration.

- `APP_API_KEY` — optional shared-key authentication
- `LLM_API_KEY` — optional LLM integration
- `DATABASE_URL` — database connection configuration

When LLM integration is enabled, sensitive document content may be transmitted to the configured provider. Never commit credentials to GitHub.

## Limitations

This is an assessment prototype, not a production-ready financial document processing platform.

- BackgroundTasks is not a durable job queue.
- Large PDFs require more robust batching and chunking.
- OCR accuracy depends on document quality.
- Complex invoice tables may require additional extraction logic.
- Production authentication and tenant isolation are not implemented.
- Antivirus scanning, rate limiting, and production-grade access controls are not implemented.
- Semantic search is optional and limited in scale.
- The frontend currently focuses on keyword search.
- The frontend's Vite proxy is for local development, not production hosting.
- Evaluation results are based on a very small synthetic dataset.

Production deployment would require stronger security, scalable background processing, additional evaluation data, and operational monitoring.

## Submission Checklist

- [x] Backend and frontend implementation
- [x] PDF, CSV, Excel, and image OCR processing
- [x] Automated backend tests
- [x] Local processing verification
- [x] Synthetic evaluation results
- [x] Architecture and database schema documentation
- [x] GitHub repository published
- [x] AI assistance disclosure documented
- [ ] Record screen walkthrough
- [ ] Complete final submission review

Only synthetic sample invoices are included in the demonstrated evaluation. Permission must be obtained before sharing any real customer invoices.

## GitHub Repository

https://github.com/shafinSI/careguide-document-intelligence

## AI Assistance Disclosure

ChatGPT (OpenAI) assisted with the initial architecture, code generation, tests, documentation, and debugging guidance.

The candidate subsequently ran, reviewed, debugged, and tested the application locally. AI assistance is disclosed transparently, and the reported measurements are limited to the tests actually performed.
