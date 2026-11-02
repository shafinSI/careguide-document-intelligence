# Interview Preparation — AI Engineer Assessment

## 60-second introduction (English)
“I built a document intelligence prototype using React and FastAPI. It accepts PDFs, images, Excel and CSV files, extracts text with PyMuPDF or Tesseract OCR, and turns invoice content into structured JSON using either an optional LLM or a rule-based fallback. I validate financial fields using Decimal, flag missing or inconsistent values, and provide a dashboard for search and manual corrections. The API records job history and supports retrying failed documents. This is a working prototype; for production-scale thousand-page PDFs, I would add a durable queue, chunked processing, stronger security, and a vector database.”

## Common interview questions (English answers + Bangla explanation)

### 1. What problem does this solve?
**Answer:** “It reduces manual invoice data entry and highlights arithmetic errors. Human review remains necessary for uncertain or incorrect extractions.”
**বাংলা:** Invoice থেকে হাতে তথ্য তোলা ও হিসাব মিলানোর সময় কমায়।

### 2. Why FastAPI instead of Node.js?
**Answer:** “FastAPI integrates naturally with Python OCR, PDF and data processing libraries and provides typed APIs with automatic OpenAPI documentation.”
**বাংলা:** Python-এর OCR/PDF library ব্যবহার সহজ।

### 3. Digital PDF vs scanned PDF?
**Answer:** “A digital PDF often has selectable text, which PyMuPDF extracts directly. Scanned pages are images, so OCR converts pixels into text.”
**বাংলা:** ডিজিটাল PDF-এর লেখা সরাসরি পাওয়া যায়; স্ক্যান হলে OCR লাগে।

### 4. Why use OCR preprocessing?
**Answer:** “Grayscale, auto-contrast and contrast enhancement can improve recognition on low-quality scans, although results vary.”
**বাংলা:** ঝাপসা/কম কনট্রাস্ট ছবির লেখা পরিষ্কার করতে।

### 5. What is hallucination and how is it reduced?
**Answer:** “A language model can invent unsupported values. My extraction prompt requires null for missing fields, and deterministic checks flag missing or inconsistent outputs. This does not eliminate hallucinations.”
**বাংলা:** AI যেন অনুমান করে ভুল তথ্য না দেয়; missing হলে null।

### 6. How do you validate invoice totals?
**Answer:** “I compare subtotal plus tax with total using Decimal and a small tolerance of 0.02. I also compare line-item quantity times unit price against each amount.”
**বাংলা:** subtotal + tax = total কি না, প্রতিটি item-এর হিসাব মেলে কি না।

### 7. Why Decimal instead of float?
**Answer:** “Binary floating-point can introduce rounding artifacts; Decimal represents base-10 financial amounts more predictably.”
**বাংলা:** টাকার হিসাবের precision ঠিক রাখতে।

### 8. How are duplicates detected?
**Answer:** “I compare invoice number and supplier name against previously processed documents. A production system would also normalize names, check invoice dates, and use indexed duplicate fingerprints.”
**বাংলা:** একই supplier + invoice number থাকলে duplicate flag।

### 9. How are long-running jobs handled?
**Answer:** “The demo uses FastAPI BackgroundTasks. It is not a durable queue; for high volume I would use Celery and Redis, with retries, dead-letter queues and page checkpoints.”
**বাংলা:** এখন demo background task; production-এ Redis/Celery।

### 10. How does semantic search differ from keyword search?
**Answer:** “Keyword search matches text patterns. Semantic search compares embeddings so similar meanings can match even with different wording. My prototype has an optional embeddings endpoint, not a production vector index.”
**বাংলা:** একই শব্দ না থাকলেও অর্থের মিল খুঁজতে embeddings।

### 11. How would you handle a 1000-page PDF?
**Answer:** “Split it into bounded page batches, stream and checkpoint each batch, OCR only pages that need it, process jobs in durable workers, and aggregate invoice records with provenance and duplicate reconciliation.”
**বাংলা:** পুরো ১০০০ পৃষ্ঠা একবারে LLM-এ না দিয়ে ভাগ করে process।

### 12. How would you measure accuracy?
**Answer:** “Use a held-out labeled set, normalize comparable fields, compute exact-match field accuracy and precision/recall where appropriate, then measure per-document latency and success/failure rates. Never report guessed metrics.”
**বাংলা:** সঠিক label-এর সঙ্গে AI output তুলনা করে বাস্তব result।

### 13. What security risks exist?
**Answer:** “Malicious files, prompt injection in document text, unauthorized access, and leakage of financial data to external APIs. I would add file signatures, malware scanning, access controls, encryption, quotas and audit logging.”
**বাংলা:** PDF-এ malicious content, sensitive financial data leakage—সবই risk।

### 14. What did AI help you with?
**Answer:** “I used ChatGPT to assist with initial scaffolding, design, documentation and tests. I reviewed the implementation, ran the system and evaluated the results myself.”
**বাংলা:** শেষ বাক্যটি কেবল নিজে সত্যিই run/test করলে বলবে।

### 15. What is incomplete in this prototype?
**Answer:** “Durable distributed workers, full document cross-verification, large-PDF chunk reconciliation, production authentication, vector indexing and comprehensive benchmark coverage are future work.”
**বাংলা:** অসম্পূর্ণ ফিচারকে completed বলবে না।

## Walkthrough script (2–3 minutes)
1. Explain the problem and architecture diagram.
2. Open React UI; upload synthetic sample CSV and a digital PDF.
3. Show processing status, JSON fields, validation issues, and keyword search.
4. Edit an incorrect amount; show the issue being recalculated.
5. Open `/docs` and show upload, inspect, retry, and history APIs.
6. Run `pytest -q` and explain which cases are covered.
7. Clearly describe limitations, actual benchmark results, and AI assistance.

## Interview preparation checklist
- Be able to explain `parse_document`, `extract`, `validate`, `process`, and each REST endpoint.
- Know the difference between OCR, LLM extraction and deterministic validation.
- Explain why local BackgroundTasks is insufficient for high-scale processing.
- Show your own test logs and actual evaluation results; never fabricate them.
