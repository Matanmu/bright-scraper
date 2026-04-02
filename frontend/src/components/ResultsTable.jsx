import { useState } from 'react';

export default function ResultsTable({ data }) {
  const [copied, setCopied] = useState(false);

  if (!data || data.length === 0) return null;

  const headers = Object.keys(data[0]);

  if (headers.length === 0) return null;

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const exportCSV = () => {
    const rows = [headers, ...data.map((row) => headers.map((h) => row[h] ?? ''))];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scrape-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="results-table">
      <div className="results-header">
        <span className="results-count">{data.length} results</span>
        <div className="results-actions">
          <button className="export-btn" onClick={copyJSON} aria-live="polite">{copied ? '✓ Copied' : 'Copy JSON'}</button>
          <button className="export-btn" onClick={exportCSV}>Export CSV</button>
        </div>
      </div>
      <div className="results-table-wrapper">
        <table>
          <thead>
            <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {headers.map((h) => <td key={h}>{row[h] ?? '-'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
