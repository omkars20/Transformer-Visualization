import React, { useState } from 'react';

const DOC_TYPES = [
  { icon: '📕', ext: 'PDF', color: '#EF4444', desc: 'Reports, manuals, papers', note: 'Must extract text layer (OCR for scanned docs)' },
  { icon: '📝', ext: 'TXT / MD', color: '#10B981', desc: 'Plain text, README files', note: 'Simplest format — no extraction needed' },
  { icon: '🌐', ext: 'HTML / Web', color: '#06B6D4', desc: 'Web pages, documentation sites', note: 'Strip HTML tags, keep meaningful content' },
  { icon: '📊', ext: 'CSV / Excel', color: '#F59E0B', desc: 'Spreadsheets, tabular data', note: 'Each row can become a chunk; headers add context' },
  { icon: '🗂️', ext: 'JSON / YAML', color: '#8B5CF6', desc: 'Config files, API responses', note: 'Flatten nested keys or serialize to text' },
  { icon: '💻', ext: 'Code (.py, .js)', color: '#EC4899', desc: 'Source code, scripts', note: 'Split by functions/classes, not just lines' },
  { icon: '📧', ext: 'Email / DOCX', color: '#F97316', desc: 'Office documents, emails', note: 'Extract body text; preserve sender/date metadata' },
  { icon: '🖼️', ext: 'Images / PPT', color: '#64748B', desc: 'Slides, scanned images', note: 'Need OCR or multimodal models to extract text' },
];

const PIPELINE_STEPS = [
  { n: '1', label: 'Source', desc: 'Files from disk, S3, GDrive, URL, database…', color: '#10B981', icon: '📂' },
  { n: '2', label: 'Load', desc: 'Document loader reads raw bytes', color: '#06B6D4', icon: '⬇️' },
  { n: '3', label: 'Parse', desc: 'Extract plain text + preserve structure', color: '#6366F1', icon: '🔧' },
  { n: '4', label: 'Metadata', desc: 'Attach source, page, date, author tags', color: '#8B5CF6', icon: '🏷️' },
  { n: '5', label: 'Output', desc: 'Document objects ready for chunking', color: '#F97316', icon: '📄' },
];

const SAMPLE_DOC = `ACME Corp. – HR Manual
Section 4.2: Vacation Policy

Employees receive 15 paid vacation days per year.
Days accrue monthly at 1.25 days/month.
Unused days may roll over (up to 5 days) to Q1 of the next year.

Section 4.3: Sick Leave
Employees receive 10 sick days per year.
Sick days do not roll over.`;

const SAMPLE_META = {
  source: 'HR_Manual.pdf',
  page: 4,
  author: 'HR Department',
  created: '2024-01-15',
  doc_type: 'policy',
};

export default function RagStep2_Loading() {
  const [activeDoc, setActiveDoc] = useState(0);
  const [showMeta, setShowMeta] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Concept */}
      <div style={{
        background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '16px', padding: '24px',
      }}>
        <h3 style={{ color: '#10B981', fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>
          📥 Document Ingestion — Feeding RAG its Knowledge
        </h3>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: 0 }}>
          Before RAG can answer questions, you must <strong style={{ color: '#E2E8F0' }}>load your documents</strong> into the system.
          This means reading files, extracting their text content, and attaching metadata like file name, page number, or creation date.
          Metadata is crucial — it lets you later say <em style={{ color: '#10B981' }}>"This answer comes from HR_Manual.pdf, page 4"</em>.
        </p>
      </div>

      {/* Document Types */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Supported Document Types
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {DOC_TYPES.map((d, i) => (
            <button
              key={d.ext}
              onClick={() => setActiveDoc(i)}
              style={{
                background: activeDoc === i ? `${d.color}22` : '#0E1220',
                border: `1px solid ${activeDoc === i ? d.color : '#1E2A45'}`,
                borderRadius: '10px', padding: '14px 10px', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{d.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: d.color, marginBottom: '4px', fontFamily: 'Space Mono, monospace' }}>{d.ext}</div>
              <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.4' }}>{d.desc}</div>
            </button>
          ))}
        </div>
        {/* Detail for selected */}
        <div style={{
          marginTop: '12px', background: '#0E1220', border: `1px solid ${DOC_TYPES[activeDoc].color}44`,
          borderRadius: '10px', padding: '14px 18px',
          fontFamily: 'Space Mono, monospace', fontSize: '12px',
          color: DOC_TYPES[activeDoc].color,
        }}>
          💡 {DOC_TYPES[activeDoc].note}
        </div>
      </div>

      {/* Ingestion Pipeline */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Ingestion Pipeline
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', overflowX: 'auto' }}>
          {PIPELINE_STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{
                flex: 1, minWidth: '100px', background: '#0E1220',
                border: `1px solid ${s.color}44`, borderRadius: '10px',
                padding: '14px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{s.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: s.color, fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.4' }}>{s.desc}</div>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', color: '#2E3A55', fontSize: '20px', flexShrink: 0 }}>→</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Live Example */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Live Example — HR_Manual.pdf
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Raw doc */}
          <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📕</span> HR_Manual.pdf (raw text extracted)
            </div>
            <pre style={{
              margin: 0, color: '#94A3B8', fontSize: '11px', lineHeight: '1.7',
              whiteSpace: 'pre-wrap', fontFamily: 'Space Mono, monospace',
            }}>{SAMPLE_DOC}</pre>
          </div>

          {/* Document object */}
          <div style={{ background: '#0E1220', border: '1px solid #10B98133', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: '#10B981', fontFamily: 'Space Mono, monospace' }}>Document Object</span>
              <button
                onClick={() => setShowMeta(!showMeta)}
                style={{
                  padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px',
                  fontFamily: 'Space Mono, monospace', border: '1px solid #1E2A45',
                  background: showMeta ? '#10B98122' : 'transparent', color: showMeta ? '#10B981' : '#64748B',
                }}
              >{showMeta ? 'Hide' : 'Show'} metadata</button>
            </div>
            <pre style={{
              margin: 0, fontSize: '11px', lineHeight: '1.7',
              whiteSpace: 'pre-wrap', fontFamily: 'Space Mono, monospace',
            }}>
              <span style={{ color: '#6366F1' }}>{'{'}</span>{'\n'}
              <span style={{ color: '#64748B' }}>  page_content</span>
              <span style={{ color: '#94A3B8' }}>: </span>
              <span style={{ color: '#10B981' }}>"{SAMPLE_DOC.slice(0, 60)}…"</span>
              {'\n'}
              {showMeta && (
                <>
                  <span style={{ color: '#64748B' }}>  metadata</span>
                  <span style={{ color: '#94A3B8' }}>: {'{'}</span>
                  {'\n'}
                  {Object.entries(SAMPLE_META).map(([k, v]) => (
                    <span key={k}>
                      <span style={{ color: '#64748B' }}>    {k}</span>
                      <span style={{ color: '#94A3B8' }}>: </span>
                      <span style={{ color: '#F59E0B' }}>"{v}"</span>
                      {'\n'}
                    </span>
                  ))}
                  <span style={{ color: '#94A3B8' }}>  {'}'}</span>
                  {'\n'}
                </>
              )}
              <span style={{ color: '#6366F1' }}>{'}'}</span>
            </pre>
          </div>
        </div>
      </div>

      {/* Key Insight */}
      <div style={{
        background: '#0A1628', border: '1px solid #10B98144', borderRadius: '12px', padding: '18px 20px',
        display: 'flex', gap: '14px', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '24px', flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ color: '#10B981', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>Why metadata matters</div>
          <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
            When RAG retrieves a chunk, you want to know <em>where it came from</em>. Metadata (source file, page, section, date)
            lets you show citations like <em style={{ color: '#10B981' }}>"Source: HR_Manual.pdf, page 4"</em>.
            It also enables <strong style={{ color: '#E2E8F0' }}>filtering</strong> — e.g., "only search documents from 2024" or "only search the Finance department's docs".
          </p>
        </div>
      </div>
    </div>
  );
}
