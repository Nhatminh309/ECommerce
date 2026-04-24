import { useState } from 'react';
import { generateReport } from '../services/aiService';

const SUGGESTIONS = [
  'Doanh thu tháng này bao nhiêu?',
  'Top 5 sản phẩm bán chạy nhất',
  'Số đơn hàng theo trạng thái',
  'Người dùng mới trong 7 ngày',
];

export default function ReportPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (q) => {
    const text = (q ?? query).trim();
    if (!text || loading) return;
    setQuery(text);
    setLoading(true);
    setReport(null);
    setError(null);
    try {
      const res = await generateReport(text);
      setReport(res?.data ?? res);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">AI Report Generator</h1>
        <p className="mt-1 text-sm text-slate-500">
          Describe what you want to know in plain language and the AI will query the database for you.
        </p>
      </div>

      {/* Input */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="Doanh thu tháng này bao nhiêu?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading || !query.trim()}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-slate-400">Try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSubmit(s)}
              disabled={loading}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <span className="text-slate-500">Generating report...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Report output */}
      {report && !loading && (
        <div className="space-y-6">
          {/* Summary */}
          {report.summary && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-2 text-base font-medium text-slate-700">Summary</h2>
              <p className="leading-relaxed text-slate-600">{report.summary}</p>
            </section>
          )}

          {/* SQL query */}
          {report.sql && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-2 text-base font-medium text-slate-700">Generated SQL</h2>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-sm leading-relaxed text-green-300 whitespace-pre-wrap">
                {report.sql}
              </pre>
            </section>
          )}

          {/* Results table */}
          {report.rows && report.rows.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-base font-medium text-slate-700">
                Results
                <span className="ml-2 text-sm font-normal text-slate-400">
                  ({report.rows.length} row{report.rows.length !== 1 ? 's' : ''})
                </span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {(report.columns ?? Object.keys(report.rows[0])).map((col) => (
                        <th
                          key={col}
                          className="px-4 py-2 text-left font-medium text-slate-600"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {(report.columns ?? Object.keys(report.rows[0])).map((col) => (
                          <td key={col} className="px-4 py-2 text-slate-700">
                            {row[col] === null || row[col] === undefined
                              ? <span className="text-slate-300">—</span>
                              : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {report.rows && report.rows.length === 0 && (
            <p className="text-center text-sm text-slate-400">No results found for this query.</p>
          )}
        </div>
      )}
    </div>
  );
}
