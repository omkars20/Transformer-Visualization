import React, { useState } from 'react';

const problems = [
  {
    icon: '📅', title: 'Knowledge Cutoff', color: '#F59E0B',
    desc: 'LLMs are trained on data up to a certain date. They know nothing about events after that.',
    example: '"Who won last week\'s match?" → LLM makes up a plausible but wrong answer.',
  },
  {
    icon: '💭', title: 'Hallucinations', color: '#EF4444',
    desc: 'LLMs confidently generate false facts. They cannot distinguish what they know from what they invent.',
    example: '"What is our product\'s return rate?" → LLM: "3.7%" (completely made up).',
  },
  {
    icon: '🔒', title: 'No Private Data Access', color: '#8B5CF6',
    desc: 'LLMs have never seen your company\'s internal documents, emails, or databases.',
    example: '"Summarize last quarter\'s board meeting notes" → LLM cannot do this.',
  },
  {
    icon: '📏', title: 'Context Window Limits', color: '#06B6D4',
    desc: 'You cannot paste 10,000 documents into a prompt. Token limits make that impossible.',
    example: 'A 500-page manual can\'t fit in a single prompt to a GPT model.',
  },
];

const PIPELINE = [
  { icon: '📄', label: 'Documents', color: '#10B981' },
  { icon: '✂️', label: 'Chunk', color: '#06B6D4' },
  { icon: '🔢', label: 'Embed', color: '#6366F1' },
  { icon: '🗄️', label: 'Store', color: '#8B5CF6' },
  { icon: '❓', label: 'Query', color: '#F59E0B' },
  { icon: '🔍', label: 'Retrieve', color: '#EC4899' },
  { icon: '⬆️', label: 'Rerank', color: '#EF4444' },
  { icon: '✨', label: 'Generate', color: '#F97316' },
];

export default function RagStep1_Problem() {
  const [showRag, setShowRag] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0E1220 0%, #131728 100%)',
        border: '1px solid #1E2A45', borderRadius: '16px', padding: '28px',
      }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🤔</div>
        <h2 style={{ color: '#E2E8F0', fontSize: '22px', fontWeight: '700', margin: '0 0 14px' }}>
          What Problem Does RAG Solve?
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: '0 0 14px' }}>
          Large Language Models are powerful text generators — but they are <strong style={{ color: '#EF4444' }}>frozen in time</strong>.
          They only know what was in their training data, and they sometimes <strong style={{ color: '#EF4444' }}>make things up</strong> when they don't know the answer.
        </p>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: 0 }}>
          <strong style={{ color: '#10B981' }}>RAG (Retrieval-Augmented Generation)</strong> fixes this by giving the LLM a "cheat sheet" —
          relevant documents retrieved from a knowledge base — right before it answers your question.
        </p>
      </div>

      {/* Problems Grid */}
      <div>
        <div style={{
          fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px',
          color: '#64748B', textTransform: 'uppercase', marginBottom: '14px',
        }}>Problems with vanilla LLMs</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {problems.map(p => (
            <div key={p.title} style={{
              background: '#0E1220', border: `1px solid ${p.color}44`,
              borderRadius: '12px', padding: '18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '22px' }}>{p.icon}</span>
                <span style={{ color: p.color, fontWeight: '700', fontSize: '13px' }}>{p.title}</span>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.6', margin: '0 0 10px' }}>{p.desc}</p>
              <div style={{
                background: '#131728', border: '1px solid #1E2A45', borderRadius: '8px',
                padding: '10px 12px', fontFamily: 'Space Mono, monospace', fontSize: '11px',
                color: '#64748B', fontStyle: 'italic',
              }}>{p.example}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Comparison */}
      <div>
        <div style={{
          fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px',
          color: '#64748B', textTransform: 'uppercase', marginBottom: '14px',
        }}>See the difference live</div>
        <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {[
              { val: false, label: '❌ Without RAG', col: '#EF4444' },
              { val: true,  label: '✅ With RAG',    col: '#10B981' },
            ].map(opt => (
              <button key={String(opt.val)} onClick={() => setShowRag(opt.val)} style={{
                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                fontFamily: 'Space Mono, monospace', fontSize: '11px',
                border: `1px solid ${showRag === opt.val ? opt.col : '#1E2A45'}`,
                background: showRag === opt.val ? `${opt.col}22` : 'transparent',
                color: showRag === opt.val ? opt.col : '#64748B',
              }}>{opt.label}</button>
            ))}
          </div>

          {/* Question */}
          <Label>User Question</Label>
          <Box>💬 "What does our company's vacation policy say about rollover days?"</Box>

          {/* Retrieved context — RAG only */}
          {showRag && (
            <>
              <Arrow />
              <Label>Retrieved Context (from your HR Manual)</Label>
              <Box accent="#10B981">
                📄 <em>HR_Manual.pdf, Section 4.2:</em> "Employees may roll over up to <strong>5 unused vacation days</strong> to the following year. Rollover days must be used within Q1 of the next calendar year or they are forfeited."
              </Box>
            </>
          )}

          <Arrow />
          <Label>LLM Answer</Label>
          <Box accent={showRag ? '#10B981' : '#EF4444'}>
            🤖 {showRag
              ? 'According to your HR Manual (Section 4.2), employees may roll over up to 5 unused vacation days to the following year. These rollover days must be used within Q1 of the next year or they are forfeited.'
              : 'Most companies typically allow 5–10 days of vacation rollover per year, though some follow a "use it or lose it" policy. I recommend checking with HR for your specific company policy.'}
          </Box>
          <div style={{
            marginTop: '10px', padding: '10px 14px', borderRadius: '8px',
            fontFamily: 'Space Mono, monospace', fontSize: '12px',
            background: showRag ? '#10B98111' : '#EF444411',
            color: showRag ? '#10B981' : '#EF4444',
          }}>
            {showRag
              ? '✅ Grounded in your actual document. Accurate, specific, and citable.'
              : '❌ Generic advice — not from your company\'s actual policy. Potentially wrong!'}
          </div>
        </div>
      </div>

      {/* Full pipeline overview */}
      <div>
        <div style={{
          fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px',
          color: '#64748B', textTransform: 'uppercase', marginBottom: '14px',
        }}>Full RAG Pipeline — what you'll learn in the next steps</div>
        <div style={{
          background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px',
          padding: '20px', display: 'flex', alignItems: 'center', gap: '8px',
          overflowX: 'auto', flexWrap: 'wrap',
        }}>
          {PIPELINE.map((item, i) => (
            <React.Fragment key={item.label}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                padding: '12px 14px', background: `${item.color}11`,
                border: `1px solid ${item.color}44`, borderRadius: '10px', flexShrink: 0,
              }}>
                <span style={{ fontSize: '22px' }}>{item.icon}</span>
                <span style={{ fontSize: '10px', color: item.color, fontFamily: 'Space Mono, monospace', fontWeight: '600' }}>
                  {item.label}
                </span>
              </div>
              {i < PIPELINE.length - 1 && (
                <span style={{ color: '#2E3A55', fontSize: '18px', flexShrink: 0 }}>→</span>
              )}
            </React.Fragment>
          ))}
        </div>
        <p style={{ color: '#475569', fontFamily: 'Space Mono, monospace', fontSize: '11px', marginTop: '10px', lineHeight: '1.6' }}>
          Offline (index-time): Documents → Chunk → Embed → Store &nbsp;|&nbsp; Online (query-time): Query → Retrieve → Rerank → Generate
        </p>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '6px', marginTop: '0' }}>
      {children}
    </div>
  );
}
function Box({ children, accent }) {
  return (
    <div style={{
      background: '#131728', border: `1px solid ${accent ? `${accent}33` : '#1E2A45'}`,
      borderRadius: '8px', padding: '12px 14px', color: '#E2E8F0',
      fontSize: '13px', lineHeight: '1.7', marginBottom: '4px',
    }}>{children}</div>
  );
}
function Arrow() {
  return <div style={{ color: '#2E3A55', fontSize: '20px', margin: '8px 0', textAlign: 'center' }}>↓</div>;
}
