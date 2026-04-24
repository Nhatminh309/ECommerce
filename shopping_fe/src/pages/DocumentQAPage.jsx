import { useEffect, useRef, useState } from 'react';
import { askDocument, listDocuments, uploadDocument, deleteDocument } from '../services/aiService';

function SourceItem({ source, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-2 text-left text-sm font-medium text-slate-700"
        onClick={() => setOpen((p) => !p)}
      >
        <span>Source {index + 1} {source.doc_id ? `— doc #${source.doc_id}` : ''}</span>
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-slate-200 px-4 py-3 font-mono text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">
          {source.chunk}
        </div>
      )}
    </div>
  );
}

export default function DocumentQAPage() {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [selectedDocId, setSelectedDocId] = useState('');
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [askError, setAskError] = useState(null);

  const fileInputRef = useRef(null);

  const fetchDocs = () => {
    listDocuments()
      .then((res) => {
        const list = res?.data ?? res;
        setDocs(Array.isArray(list) ? list : []);
      })
      .catch(() => setDocs([]));
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      await uploadDocument(file);
      fetchDocs();
    } catch (err) {
      setUploadError(err?.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocument(docId);
      fetchDocs();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleAsk = async () => {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setAnswer(null);
    setAskError(null);
    try {
      const res = await askDocument(q, selectedDocId || null);
      setAnswer(res?.data ?? res);
    } catch (err) {
      setAskError(err?.response?.data?.message || 'Could not get an answer. Please try again.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-semibold">Document Q&A</h1>

      {/* Upload section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">Uploaded Documents</h2>
        <div className="mb-4 flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : '+ Upload PDF'}
          </button>
          {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
        </div>

        {docs.length === 0 ? (
          <p className="text-sm text-slate-400">No documents uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {docs.map((doc) => (
              <li
                key={doc.id ?? doc.doc_id ?? doc.filename}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="text-lg">📄</span>
                <span className="flex-1 text-sm text-slate-700">{doc.filename ?? doc.name ?? `Document #${doc.id ?? doc.doc_id}`}</span>
                {(doc.id ?? doc.doc_id) && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    #{doc.id ?? doc.doc_id}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id ?? doc.doc_id)}
                  className="rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  title="Delete document"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Q&A section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">Ask a Question</h2>

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Search in
          </label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
          >
            <option value="">All documents</option>
            {docs.map((doc) => (
              <option
                key={doc.id ?? doc.doc_id ?? doc.filename}
                value={doc.id ?? doc.doc_id ?? ''}
              >
                {doc.filename ?? doc.name ?? `Document #${doc.id ?? doc.doc_id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="Ask a question about your documents..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            disabled={asking}
          />
          <button
            type="button"
            onClick={handleAsk}
            disabled={asking || !question.trim()}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {asking ? 'Asking...' : 'Ask'}
          </button>
        </div>

        {askError && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{askError}</p>
        )}
      </section>

      {/* Answer section */}
      {answer && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-medium">Answer</h2>
          <p className="mb-5 leading-relaxed text-slate-700">{answer.answer}</p>

          {answer.sources && answer.sources.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-500">
                Sources ({answer.sources.length})
              </h3>
              {answer.sources.map((src, i) => (
                <SourceItem key={i} source={src} index={i} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
