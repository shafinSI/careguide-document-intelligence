
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const BASE = '';

const icons = {
  dashboard: '▦',
  documents: '▤',
  upload: '↑',
  history: '◷',
  settings: '⚙',
  search: '⌕',
  refresh: '↻',
  file: '▧',
  check: '✓',
  warning: '!',
  error: '×',
};


// Readable overview of extracted invoice fields. The JSON editor remains the source
// of the draft values, so the overview updates as corrections are typed.
function firstValue(data, keys) {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') return 'Not available';
  if (typeof value === 'object') return 'Not available';
  return String(value);
}

function InvoiceOverview({ data, status }) {
  const invoice = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const supplier = firstValue(invoice, ['supplier_name', 'supplier', 'vendor_name', 'vendor', 'seller_name']);
  const fields = [
    { label: 'Invoice Number', value: firstValue(invoice, ['invoice_number', 'invoice_no', 'invoice_id', 'number']) },
    { label: 'Supplier', value: typeof supplier === 'object' ? firstValue(supplier, ['name', 'company']) : supplier },
    { label: 'Subtotal', value: firstValue(invoice, ['subtotal', 'sub_total', 'subtotal_amount']) },
    { label: 'Tax', value: firstValue(invoice, ['tax', 'tax_amount', 'total_tax', 'vat']) },
    { label: 'Total', value: firstValue(invoice, ['total', 'total_amount', 'grand_total', 'invoice_total']) },
    { label: 'Status', value: status },
  ];
  const hasInvoiceData = fields.slice(0, 5).some(field => field.value !== null);

  return (
    <section className="invoice-overview" aria-label="Invoice overview">
      <div className="invoice-overview-header">
        <div>
          <h3>Invoice Overview</h3>
          <p>Quick summary of extracted data</p>
        </div>
        <span className="invoice-overview-tag">LIVE PREVIEW</span>
      </div>
      {!hasInvoiceData && <p className="invoice-overview-note">No recognized invoice fields available in this document.</p>}
      <div className="invoice-overview-grid">
        {fields.map(field => (
          <div className="invoice-overview-card" key={field.label}>
            <span className="invoice-overview-label">{field.label}</span>
            <strong className="invoice-overview-value" title={displayValue(field.value)}>
              {displayValue(field.value)}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function App() {
  const [docs, setDocs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState('');
  const [edit, setEdit] = useState('{}');
  const [key, setKey] = useState(localStorage.getItem('api_key') || '');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInput = useRef(null);

  async function api(path, opts = {}) {
    const r = await fetch(BASE + path, {
      ...opts,
      headers: {
        ...(key ? { 'x-api-key': key } : {}),
        ...(opts.headers || {}),
      },
    });
    if (!r.ok) throw Error((await r.text()).slice(0, 200));
    return r.json();
  }

  async function refresh() {
    try {
      const data = await api('/documents?q=' + encodeURIComponent(query));
      setDocs(data);
    } catch (e) {
      setMsg(e.message);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3500);
    return () => clearInterval(id);
  }, [query, key]);

  async function upload() {
    if (!files.length || uploading) return;
    setUploading(true);
    try {
      const form = new FormData();
      for (const f of files) form.append('files', f);
      await api('/documents', { method: 'POST', body: form });
      setMsg('Documents uploaded successfully. Processing started.');
      setFiles([]);
      if (fileInput.current) fileInput.current.value = '';
      await refresh();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function open(d) {
    setLoading(true);
    try {
      const x = await api('/documents/' + d.id);
      setSelected(x);
      setEdit(JSON.stringify(x.data ?? {}, null, 2));
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!selected) return;
    try {
      const d = await api('/documents/' + selected.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: JSON.parse(edit) }),
      });
      setSelected(d);
      setEdit(JSON.stringify(d.data ?? {}, null, 2));
      setMsg('Corrections saved successfully.');
      refresh();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function retry() {
    if (!selected) return;
    try {
      await api('/documents/' + selected.id + '/retry', { method: 'POST' });
      setMsg('Document requeued for processing.');
      refresh();
    } catch (e) {
      setMsg(e.message);
    }
  }

  function addFiles(newFiles) {
    const incoming = Array.from(newFiles || []);
    setFiles(previous => {
      const merged = [...previous, ...incoming];
      return merged.slice(0, 20);
    });
  }

  const stats = [
    { label: 'Total Documents', value: docs.length, icon: '▤', tone: 'blue' },
    { label: 'Completed', value: docs.filter(d => d.status === 'completed').length, icon: '✓', tone: 'green' },
    { label: 'Needs Review', value: docs.filter(d => d.status === 'review').length, icon: '!', tone: 'orange' },
    { label: 'Failed', value: docs.filter(d => d.status === 'failed').length, icon: '×', tone: 'red' },
  ];

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    { id: 'documents', label: 'Documents', icon: icons.documents },
    { id: 'upload', label: 'Upload Files', icon: icons.upload },
    { id: 'settings', label: 'Settings', icon: icons.settings },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>Care Guide</strong>
            <span>Document Intelligence</span>
          </div>
        </div>

        <div className="nav-caption">WORKSPACE</div>
        <nav className="nav-menu">
          {navigation.map(item => (
            <button
              key={item.id}
              className={'nav-item ' + (activeTab === item.id ? 'active' : '')}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span>✦</span>
            <strong>AI-Powered Workflow</strong>
            <p>Extract, validate and review your documents in one place.</p>
          </div>
          <div className="sidebar-footer">Assessment Demo · v1.0</div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> {navigation.find(n => n.id === activeTab)?.label}</div>
          <div className="topbar-right">
            <span className="live-indicator"><i /> Local Demo</span>
            <div className="avatar">CG</div>
          </div>
        </header>

        <main className="main-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">DOCUMENT PROCESSING PLATFORM</span>
              <h1>{activeTab === 'settings' ? 'Settings' : activeTab === 'upload' ? 'Upload Documents' : activeTab === 'documents' ? 'Document Library' : 'Dashboard Overview'}</h1>
              <p>Manage document extraction, validation and review with confidence.</p>
            </div>
            <button className="outline-btn" onClick={refresh}>
              <span>{icons.refresh}</span> Refresh Data
            </button>
          </div>

          {activeTab === 'settings' ? (
            <section className="panel settings-panel">
              <div className="section-heading">
                <div>
                  <h2>API Configuration</h2>
                  <p>Configure an optional API key for your local environment.</p>
                </div>
              </div>
              <label htmlFor="api-key">API Key</label>
              <input
                id="api-key"
                type="password"
                value={key}
                onChange={e => {
                  setKey(e.target.value);
                  localStorage.setItem('api_key', e.target.value);
                }}
                placeholder="Optional local demo"
              />
              <p className="hint">This setting is saved in this browser for the local demo.</p>
            </section>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <section className="stats">
                  {stats.map(stat => (
                    <article className="stat-card" key={stat.label}>
                      <div className="stat-top">
                        <span>{stat.label}</span>
                        <span className={'stat-icon ' + stat.tone}>{stat.icon}</span>
                      </div>
                      <strong>{stat.value}</strong>
                      <div className="stat-bottom">Document processing overview</div>
                    </article>
                  ))}
                </section>
              )}

              {(activeTab === 'dashboard' || activeTab === 'upload') && (
                <section className="panel upload-panel">
                  <div className="section-heading">
                    <div>
                      <h2>Upload Documents</h2>
                      <p>Add your invoices and let the system extract important information.</p>
                    </div>
                    <span className="section-tag">MULTI-FORMAT</span>
                  </div>

                  <div
                    className={'dropzone ' + (dragging ? 'dragging' : '')}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={e => { e.preventDefault(); setDragging(false); }}
                    onDrop={e => {
                      e.preventDefault();
                      setDragging(false);
                      addFiles(e.dataTransfer.files);
                    }}
                  >
                    <div className="upload-symbol">↑</div>
                    <h3>Drag and drop your files here</h3>
                    <p>or browse from your computer to get started</p>
                    <input
                      ref={fileInput}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff,.xlsx,.xls,.csv"
                      onChange={e => addFiles(e.target.files)}
                      hidden
                    />
                    <button className="outline-btn" onClick={() => fileInput.current?.click()}>
                      Browse Files
                    </button>
                    <div className="upload-hint">PDF, PNG, JPG, TIFF, XLS, XLSX, CSV · Max 25 MB per file</div>
                  </div>

                  {files.length > 0 && (
                    <div className="selected-files">
                      <div className="selected-heading">
                        <strong>Selected Files ({files.length})</strong>
                        <button className="text-btn" onClick={() => {
                          setFiles([]);
                          if (fileInput.current) fileInput.current.value = '';
                        }}>Clear all</button>
                      </div>
                      <div className="file-chips">
                        {files.map((f, i) => (
                          <span className="file-chip" key={i}>
                            ▧ {f.name}
                            <button aria-label={'Remove ' + f.name} onClick={() => setFiles(files.filter((_, j) => i !== j))}>×</button>
                          </span>
                        ))}
                      </div>
                      <button className="primary-btn" disabled={uploading} onClick={upload}>
                        {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
                      </button>
                    </div>
                  )}
                </section>
              )}

              <section className="content-grid">
                <div className="panel documents-panel">
                  <div className="section-heading documents-heading">
                    <div>
                      <h2>Recent Documents</h2>
                      <p>View and manage your processed files.</p>
                    </div>
                    <span className="count-label">{docs.length} files</span>
                  </div>

                  <div className="search-box">
                    <span>⌕</span>
                    <input
                      placeholder="Search documents by keyword..."
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                    />
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>DOCUMENT</th>
                          <th>STATUS</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {docs.map(d => (
                          <tr key={d.id} className={selected?.id === d.id ? 'selected-row' : ''}>
                            <td>
                              <div className="file-cell">
                                <span className="file-icon">▧</span>
                                <span className="filename">{d.filename}</span>
                              </div>
                            </td>
                            <td><span className={'pill ' + d.status}>{d.status}</span></td>
                            <td><button className="inspect-btn" onClick={() => open(d)}>Inspect →</button></td>
                          </tr>
                        ))}
                        {!docs.length && (
                          <tr><td colSpan="3" className="empty-table">No documents found. Upload a file to get started.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="panel inspector-panel">
                  <div className="section-heading">
                    <div>
                      <h2>Document Inspector</h2>
                      <p>Review extraction results and make corrections.</p>
                    </div>
                  </div>

                  {loading ? <p>Loading document...</p> : selected ? (
                    <div className="inspector-body">
                      <div className="inspected-file">
                        <span className="file-icon">▧</span>
                        <div>
                          <strong>{selected.filename}</strong>
                          <span className={'pill ' + selected.status}>{selected.status}</span>
                        </div>
                      </div>

                      <div className="subheading">VALIDATION RESULTS</div>
                      {selected.issues?.length ? (
                        <div className="issues-list">
                          {selected.issues.map((issue, i) => (
                            <div className="issue-item" key={i}>
                              <span className="issue-symbol">!</span>
                              <div><strong>{issue.code}</strong><p>{issue.message}</p></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="success-message"><span>✓</span> No validation issues detected.</div>
                      )}

                      {selected.error && <div className="error-message">{selected.error}</div>}

                      {(() => {
                        let draftData = selected.data ?? {};
                        let invalidJson = false;
                        try {
                          draftData = JSON.parse(edit);
                        } catch {
                          invalidJson = true;
                        }
                        return (
                          <>
                            {invalidJson && <p className="invoice-overview-note">JSON is incomplete or invalid. Showing the last saved invoice overview.</p>}
                            <InvoiceOverview data={draftData} status={selected.status} />
                          </>
                        );
                      })()}

                      <div className="editor-heading">
                        <div className="subheading">EXTRACTED DATA / MANUAL CORRECTION</div>
                        <span className="json-tag">JSON</span>
                      </div>
                      <textarea
                        className="json-editor"
                        value={edit}
                        onChange={e => setEdit(e.target.value)}
                        rows="13"
                        spellCheck={false}
                      />

                      <div className="inspector-actions">
                        <button className="primary-btn" onClick={save}>Save Corrections</button>
                        {selected.status === 'failed' && (
                          <button className="outline-btn" onClick={retry}>Retry Processing</button>
                        )}
                      </div>

                      {selected.text_preview && (
                        <details className="preview-details">
                          <summary>View Extracted Text</summary>
                          <pre>{selected.text_preview}</pre>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div className="empty-inspector">
                      <div className="empty-icon">▤</div>
                      <h3>No document selected</h3>
                      <p>Choose a document from the list to inspect extracted data and validation results.</p>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          <footer>
            Care Guide Document Intelligence · Technical Assessment Demo
            <span>Financial data should be manually verified before use.</span>
          </footer>
        </main>
      </div>

      {msg && (
        <div className="toast" role="status" onClick={() => setMsg('')}>
          {msg} <span>×</span>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
