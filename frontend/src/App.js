import React, { useState, useRef } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [cleanResult, setCleanResult] = useState(null);
  const [detectResult, setDetectResult] = useState(null);
  const [insightResult, setInsightResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const inputRef = useRef(null);

  const handleFile = (selected) => {
    setFile(selected);
    setResult(null);
    setCleanResult(null);
    setDetectResult(null);
    setInsightResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://localhost:8000/upload', { method: 'POST', body: formData });
      const data = await res.json();
      setResult(data);
      setActiveTab('overview');
    } catch (err) {
      alert('Upload failed. Make sure backend is running.');
    }
    setLoading(false);
  };

  const handleClean = async () => {
    if (!file) return;
    setCleaning(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://localhost:8000/clean', { method: 'POST', body: formData });
      const data = await res.json();
      setCleanResult(data);
      setActiveTab('clean_report');
    } catch (err) {
      alert('Cleaning failed. Make sure backend is running.');
    }
    setCleaning(false);
  };

  const handleDetect = async () => {
    if (!file) return;
    setDetecting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://localhost:8000/detect', { method: 'POST', body: formData });
      const data = await res.json();
      setDetectResult(data);
      setActiveTab('smart_detect');
    } catch (err) {
      alert('Detection failed. Make sure backend is running.');
    }
    setDetecting(false);
  };

  const handleInsights = async () => {
    if (!file) return;
    setLoadingInsight(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://localhost:8000/insights', { method: 'POST', body: formData });
      const data = await res.json();
      setInsightResult(data);
      setActiveTab('ai_insights');
    } catch (err) {
      alert('AI Insights failed. Make sure backend is running.');
    }
    setLoadingInsight(false);
  };

  const handleDownload = () => {
    if (!cleanResult) return;
    const blob = new Blob([cleanResult.csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned_${cleanResult.filename.replace(/\.[^.]+$/, '')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setCleanResult(null);
    setDetectResult(null);
    setInsightResult(null);
    if (inputRef.current) inputRef.current.value = null;
  };

  const tabStyle = (tab) => ({
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    backgroundColor: activeTab === tab ? '#6366f1' : '#1e293b',
    color: activeTab === tab ? 'white' : '#94a3b8',
    marginRight: '0.5rem',
    marginBottom: '0.5rem'
  });

  const severityColor = (severity) => {
    if (severity === 'error') return '#f87171';
    if (severity === 'warning') return '#f59e0b';
    return '#6366f1';
  };

  const severityBadge = (severity) => ({
    display: 'inline-block',
    padding: '0.2rem 0.6rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    backgroundColor: severity === 'error' ? '#7f1d1d' : severity === 'warning' ? '#78350f' : '#1e1b4b',
    color: severityColor(severity),
    marginLeft: '0.5rem'
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: result ? 'flex-start' : 'center',
      fontFamily: 'sans-serif',
      color: 'white',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
        DataFlow <span style={{ color: '#6366f1' }}>AI</span>
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: result ? '1.5rem' : '3rem' }}>
        Upload your data and let AI do the rest
      </p>

      {/* Upload Box */}
      {!result && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          style={{
            width: '100%',
            maxWidth: '500px',
            border: `2px dashed ${dragging ? '#6366f1' : '#334155'}`,
            borderRadius: '16px',
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: dragging ? '#1e1b4b' : '#1e293b',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
            Drag and drop your CSV or Excel file here
          </p>
          <label style={{
            backgroundColor: '#6366f1',
            color: 'white',
            padding: '0.6rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}>
            Browse File
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFile(e.target.files[0])}
              onClick={(e) => { e.target.value = null; }}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {/* File selected */}
      {file && !result && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#4ade80', marginBottom: '1rem' }}>✓ {file.name} selected</p>
          <button
            onClick={handleUpload}
            disabled={loading}
            style={{
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Analysing...' : 'Analyse Data'}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ width: '100%', maxWidth: '900px' }}>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>

            {!cleanResult && (
              <div style={{
                flex: 1, minWidth: '220px', backgroundColor: '#1e293b',
                border: '1px solid #6366f1', borderRadius: '12px',
                padding: '1rem 1.5rem', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between', gap: '1rem'
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>🧹 Auto Clean</p>
                  <p style={{ margin: '0.3rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Fix missing values, duplicates & more
                  </p>
                </div>
                <button onClick={handleClean} disabled={cleaning} style={{
                  backgroundColor: '#6366f1', color: 'white', border: 'none',
                  padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem',
                  cursor: cleaning ? 'not-allowed' : 'pointer',
                  opacity: cleaning ? 0.7 : 1, whiteSpace: 'nowrap'
                }}>
                  {cleaning ? 'Cleaning...' : 'Run'}
                </button>
              </div>
            )}

            {!detectResult && (
              <div style={{
                flex: 1, minWidth: '220px', backgroundColor: '#1e293b',
                border: '1px solid #f59e0b', borderRadius: '12px',
                padding: '1rem 1.5rem', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between', gap: '1rem'
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>🔎 Smart Detect</p>
                  <p style={{ margin: '0.3rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Detect outliers, skew & inconsistencies
                  </p>
                </div>
                <button onClick={handleDetect} disabled={detecting} style={{
                  backgroundColor: '#f59e0b', color: '#0f172a', border: 'none',
                  padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem',
                  fontWeight: 'bold', cursor: detecting ? 'not-allowed' : 'pointer',
                  opacity: detecting ? 0.7 : 1, whiteSpace: 'nowrap'
                }}>
                  {detecting ? 'Detecting...' : 'Run'}
                </button>
              </div>
            )}

            {!insightResult && (
              <div style={{
                flex: 1, minWidth: '220px', backgroundColor: '#1e293b',
                border: '1px solid #a855f7', borderRadius: '12px',
                padding: '1rem 1.5rem', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between', gap: '1rem'
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>✨ AI Insights</p>
                  <p style={{ margin: '0.3rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Gemini analyses your data & explains it
                  </p>
                </div>
                <button onClick={handleInsights} disabled={loadingInsight} style={{
                  backgroundColor: '#a855f7', color: 'white', border: 'none',
                  padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem',
                  fontWeight: 'bold', cursor: loadingInsight ? 'not-allowed' : 'pointer',
                  opacity: loadingInsight ? 0.7 : 1, whiteSpace: 'nowrap'
                }}>
                  {loadingInsight ? 'Thinking...' : 'Run'}
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap' }}>
            <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>📊 Overview</button>
            <button style={tabStyle('summary')} onClick={() => setActiveTab('summary')}>🔍 Column Summary</button>
            <button style={tabStyle('preview')} onClick={() => setActiveTab('preview')}>👁️ Data Preview</button>
            {cleanResult && (
              <>
                <button style={tabStyle('clean_report')} onClick={() => setActiveTab('clean_report')}>🧹 Clean Report</button>
                <button style={tabStyle('clean_preview')} onClick={() => setActiveTab('clean_preview')}>✅ Cleaned Data</button>
              </>
            )}
            {detectResult && (
              <button style={tabStyle('smart_detect')} onClick={() => setActiveTab('smart_detect')}>
                🔎 Smart Detect {detectResult.total_findings > 0 && `(${detectResult.total_findings})`}
              </button>
            )}
            {insightResult && (
              <button style={tabStyle('ai_insights')} onClick={() => setActiveTab('ai_insights')}>✨ AI Insights</button>
            )}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '1.5rem', border: '1px solid #334155' }}>
              <h2 style={{ color: '#6366f1', marginTop: 0 }}>📊 Dataset Overview</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'File', value: result.filename, icon: '📁' },
                  { label: 'Rows', value: result.rows.toLocaleString(), icon: '📏' },
                  { label: 'Columns', value: result.columns.length, icon: '📋' },
                  { label: 'Missing Values', value: result.summary.reduce((a, b) => a + b.missing, 0).toLocaleString(), icon: '⚠️' },
                ].map((item) => (
                  <div key={item.label} style={{
                    backgroundColor: '#0f172a', borderRadius: '10px', padding: '1rem 1.5rem',
                    flex: '1', minWidth: '150px', border: '1px solid #334155'
                  }}>
                    <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.3rem' }}>{item.label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '0.2rem' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Column Summary Tab */}
          {activeTab === 'summary' && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '1.5rem', border: '1px solid #334155' }}>
              <h2 style={{ color: '#6366f1', marginTop: 0 }}>🔍 Column Summary</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      {['Column', 'Type', 'Missing', 'Missing %', 'Min', 'Mean', 'Max'].map(h => (
                        <th key={h} style={{ padding: '0.6rem', backgroundColor: '#0f172a', color: '#6366f1', textAlign: 'left', borderBottom: '1px solid #334155' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.summary.map((row, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#1e293b' : '#0f172a' }}>
                        <td style={{ padding: '0.6rem', color: '#e2e8f0', borderBottom: '1px solid #334155' }}>{row.column}</td>
                        <td style={{ padding: '0.6rem', color: '#94a3b8', borderBottom: '1px solid #334155' }}>{row.type}</td>
                        <td style={{ padding: '0.6rem', color: row.missing > 0 ? '#f87171' : '#4ade80', borderBottom: '1px solid #334155' }}>{row.missing}</td>
                        <td style={{ padding: '0.6rem', color: row.missing_pct > 0 ? '#f87171' : '#4ade80', borderBottom: '1px solid #334155' }}>{row.missing_pct}%</td>
                        <td style={{ padding: '0.6rem', color: '#cbd5e1', borderBottom: '1px solid #334155' }}>{row.min ?? '—'}</td>
                        <td style={{ padding: '0.6rem', color: '#cbd5e1', borderBottom: '1px solid #334155' }}>{row.mean ?? '—'}</td>
                        <td style={{ padding: '0.6rem', color: '#cbd5e1', borderBottom: '1px solid #334155' }}>{row.max ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '1.5rem', border: '1px solid #334155' }}>
              <h2 style={{ color: '#6366f1', marginTop: 0 }}>👁️ Data Preview (first 5 rows)</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      {result.columns.map(col => (
                        <th key={col} style={{ padding: '0.6rem', backgroundColor: '#0f172a', color: '#6366f1', textAlign: 'left', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((row, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#1e293b' : '#0f172a' }}>
                        {result.columns.map(col => (
                          <td key={col} style={{ padding: '0.6rem', borderBottom: '1px solid #334155', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{String(row[col])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Clean Report Tab */}
          {activeTab === 'clean_report' && cleanResult && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '1.5rem', border: '1px solid #334155' }}>
              <h2 style={{ color: '#6366f1', marginTop: 0 }}>🧹 Cleaning Report</h2>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Original Rows', value: cleanResult.original_rows.toLocaleString(), icon: '📏' },
                  { label: 'Cleaned Rows', value: cleanResult.cleaned_rows.toLocaleString(), icon: '✅' },
                  { label: 'Original Columns', value: cleanResult.original_columns, icon: '📋' },
                  { label: 'Issues Fixed', value: cleanResult.report.length, icon: '🔧' },
                ].map((item) => (
                  <div key={item.label} style={{
                    backgroundColor: '#0f172a', borderRadius: '10px', padding: '1rem 1.5rem',
                    flex: '1', minWidth: '150px', border: '1px solid #334155'
                  }}>
                    <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.3rem' }}>{item.label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '0.2rem' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {cleanResult.report.length === 0 ? (
                <div style={{ padding: '1rem', backgroundColor: '#0f172a', borderRadius: '8px', color: '#4ade80', textAlign: 'center' }}>
                  ✅ Your dataset was already clean! No issues found.
                </div>
              ) : (
                cleanResult.report.map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: '#0f172a', borderRadius: '10px', padding: '1rem 1.5rem',
                    marginBottom: '0.75rem', borderLeft: `4px solid ${severityColor(item.severity)}`
                  }}>
                    <div style={{ fontWeight: 'bold', color: severityColor(item.severity) }}>{item.issue}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.3rem' }}>{item.detail}</div>
                    {item.examples && item.examples.length > 0 && (
                      <div style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '0.3rem' }}>{item.examples.join(' | ')}</div>
                    )}
                  </div>
                ))
              )}
              <button onClick={handleDownload} style={{
                marginTop: '1rem', backgroundColor: '#4ade80', color: '#0f172a',
                border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px',
                fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer'
              }}>
                ⬇️ Download Cleaned CSV
              </button>
            </div>
          )}

          {/* Cleaned Data Preview Tab */}
          {activeTab === 'clean_preview' && cleanResult && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '1.5rem', border: '1px solid #334155' }}>
              <h2 style={{ color: '#6366f1', marginTop: 0 }}>✅ Cleaned Data Preview (first 5 rows)</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      {cleanResult.columns.map(col => (
                        <th key={col} style={{ padding: '0.6rem', backgroundColor: '#0f172a', color: '#4ade80', textAlign: 'left', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cleanResult.preview.map((row, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#1e293b' : '#0f172a' }}>
                        {cleanResult.columns.map(col => (
                          <td key={col} style={{ padding: '0.6rem', borderBottom: '1px solid #334155', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{String(row[col])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleDownload} style={{
                marginTop: '1rem', backgroundColor: '#4ade80', color: '#0f172a',
                border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px',
                fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer'
              }}>
                ⬇️ Download Cleaned CSV
              </button>
            </div>
          )}

          {/* Smart Detect Tab */}
          {activeTab === 'smart_detect' && detectResult && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '1.5rem', border: '1px solid #334155' }}>
              <h2 style={{ color: '#f59e0b', marginTop: 0 }}>🔎 Smart Detect Report</h2>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Findings', value: detectResult.total_findings, icon: '🔎' },
                  { label: 'Errors', value: detectResult.findings.filter(f => f.severity === 'error').length, icon: '🔴' },
                  { label: 'Warnings', value: detectResult.findings.filter(f => f.severity === 'warning').length, icon: '🟡' },
                  { label: 'Info', value: detectResult.findings.filter(f => f.severity === 'info').length, icon: '🔵' },
                ].map((item) => (
                  <div key={item.label} style={{
                    backgroundColor: '#0f172a', borderRadius: '10px', padding: '1rem 1.5rem',
                    flex: '1', minWidth: '130px', border: '1px solid #334155'
                  }}>
                    <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.3rem' }}>{item.label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '0.2rem' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {detectResult.findings.length === 0 ? (
                <div style={{ padding: '1rem', backgroundColor: '#0f172a', borderRadius: '8px', color: '#4ade80', textAlign: 'center' }}>
                  ✅ No issues detected. Your dataset looks great!
                </div>
              ) : (
                detectResult.findings.map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: '#0f172a', borderRadius: '10px', padding: '1rem 1.5rem',
                    marginBottom: '0.75rem', borderLeft: `4px solid ${severityColor(item.severity)}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', color: severityColor(item.severity) }}>{item.title}</span>
                      <span style={severityBadge(item.severity)}>{item.severity.toUpperCase()}</span>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem' }}>{item.detail}</div>
                    <div style={{
                      marginTop: '0.5rem', padding: '0.4rem 0.8rem',
                      backgroundColor: '#1e293b', borderRadius: '6px',
                      color: '#cbd5e1', fontSize: '0.85rem'
                    }}>
                      💡 {item.suggestion}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* AI Insights Tab */}
          {activeTab === 'ai_insights' && insightResult && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '1.5rem', border: '1px solid #a855f7' }}>
              <h2 style={{ color: '#a855f7', marginTop: 0 }}>✨ AI Insights</h2>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'File', value: insightResult.filename, icon: '📁' },
                  { label: 'Rows Analysed', value: insightResult.rows.toLocaleString(), icon: '📏' },
                  { label: 'Columns Analysed', value: insightResult.columns, icon: '📋' },
                  { label: 'Powered by', value: 'Gemini AI', icon: '🤖' },
                ].map((item) => (
                  <div key={item.label} style={{
                    backgroundColor: '#0f172a', borderRadius: '10px', padding: '1rem 1.5rem',
                    flex: '1', minWidth: '130px', border: '1px solid #334155'
                  }}>
                    <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.3rem' }}>{item.label}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '0.2rem' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{
                backgroundColor: '#0f172a',
                borderRadius: '10px',
                padding: '1.5rem',
                border: '1px solid #a855f7',
                lineHeight: '1.8',
                color: '#e2e8f0',
                fontSize: '0.95rem'
              }}>
                <div style={{ marginBottom: '0.75rem', color: '#a855f7', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  GEMINI AI ANALYSIS
                </div>
                {insightResult.insight}
              </div>
            </div>
          )}

          {/* Reset */}
          <button onClick={handleReset} style={{
            marginTop: '1.5rem', backgroundColor: 'transparent', color: '#94a3b8',
            border: '1px solid #334155', padding: '0.5rem 1.2rem',
            borderRadius: '8px', cursor: 'pointer'
          }}>
            ← Upload another file
          </button>
        </div>
      )}
    </div>
  );
}

export default App;