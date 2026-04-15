import React, { useState } from 'react';

// Before reranking (bi-encoder scores from vector search)
const INITIAL_RESULTS = [
  { id: 0, text: 'Vacation days accrue monthly at 1.25 days per month for full-time employees.', source: 'HR_Manual §4.1', biScore: 0.89, crossScore: 0.42 },
  { id: 1, text: 'Employees may roll over up to 5 unused vacation days to the following year.', source: 'HR_Manual §4.2', biScore: 0.87, crossScore: 0.96 },
  { id: 2, text: 'All employees are entitled to paid sick leave and vacation time as outlined herein.', source: 'HR_Manual §4.0', biScore: 0.85, crossScore: 0.38 },
  { id: 3, text: 'Rollover days must be used within Q1 of the next calendar year or they are forfeited.', source: 'HR_Manual §4.2', biScore: 0.82, crossScore: 0.91 },
  { id: 4, text: 'Employees who work part-time accrue vacation at a proportional rate.', source: 'HR_Manual §4.3', biScore: 0.80, crossScore: 0.31 },
];

const QUERY = 'What is the vacation rollover policy?';

const RERANKER_MODELS = [
  { name: 'cross-encoder/ms-marco-MiniLM-L-6-v2', provider: 'HuggingFace', speed: '⚡⚡', quality: '⭐⭐⭐⭐', note: 'Best free option. Small, fast, accurate.' },
  { name: 'rerank-english-v3.0',                  provider: 'Cohere',      speed: '⚡⚡⚡', quality: '⭐⭐⭐⭐⭐', note: 'Best commercial reranker. API-based.' },
  { name: 'bge-reranker-large',                   provider: 'BAAI',        speed: '⚡',    quality: '⭐⭐⭐⭐⭐', note: 'Excellent open source. GPU recommended.' },
  { name: 'jina-reranker-v2-base-multilingual',   provider: 'Jina AI',     speed: '⚡⚡',  quality: '⭐⭐⭐⭐',  note: 'Multilingual support. API available.' },
  { name: 'GPT-4 (LLM-as-reranker)',              provider: 'OpenAI',      speed: '🐢',   quality: '⭐⭐⭐⭐⭐', note: 'Use LLM to score relevance. Slow but powerful.' },
];

function getRerankedResults() {
  return [...INITIAL_RESULTS].sort((a, b) => b.crossScore - a.crossScore);
}

export default function RagStep7_Reranking() {
  const [showReranked, setShowReranked] = useState(false);
  const [hoveredId, setHoveredId]       = useState(null);

  const displayedResults = showReranked ? getRerankedResults() : INITIAL_RESULTS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Concept */}
      <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ color: '#EF4444', fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>
          ⬆️ Reranking — Polishing Your Retrieval Results
        </h3>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: '0 0 12px' }}>
          Vector search uses a <strong style={{ color: '#6366F1' }}>bi-encoder</strong> model — it encodes the query and
          all chunks independently, then compares vectors. This is <strong style={{ color: '#E2E8F0' }}>fast</strong> but
          misses fine-grained relevance because the query and chunk never "see" each other directly.
        </p>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: 0 }}>
          A <strong style={{ color: '#EF4444' }}>cross-encoder reranker</strong> takes the query + each chunk together,
          reads both simultaneously, and outputs a precise relevance score. It's <strong style={{ color: '#E2E8F0' }}>10-20× slower</strong>
          but dramatically more accurate. The standard pattern: <em style={{ color: '#EF4444' }}>retrieve 20, rerank to top 3.</em>
        </p>
      </div>

      {/* Bi-encoder vs Cross-encoder */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          How encoders differ
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {[
            {
              name: 'Bi-Encoder',
              color: '#6366F1',
              icon: '🔢',
              how: 'Encodes query → vector A. Encodes chunk → vector B. Score = cosine(A, B)',
              speed: 'Very fast (ANN search)',
              quality: 'Good (misses nuance)',
              use: 'First-pass retrieval (top 20-50)',
              issue: 'Query and chunk never interact — relevance is approximate',
            },
            {
              name: 'Cross-Encoder',
              color: '#EF4444',
              icon: '🔄',
              how: 'Input: [QUERY] [SEP] [CHUNK TEXT]. Model reads both together → score 0–1.',
              speed: 'Slower (one pass per chunk)',
              quality: 'Excellent (full context)',
              use: 'Second-pass reranking (top 3-5)',
              issue: 'Too slow to use on thousands of chunks',
            },
          ].map(e => (
            <div key={e.name} style={{ background: '#0E1220', border: `1px solid ${e.color}44`, borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '22px' }}>{e.icon}</span>
                <div style={{ color: e.color, fontWeight: '700', fontSize: '14px' }}>{e.name}</div>
              </div>
              <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.6', fontFamily: 'Space Mono, monospace', background: '#131728', borderRadius: '6px', padding: '10px', marginBottom: '12px' }}>
                {e.how}
              </div>
              {[['Speed', e.speed], ['Quality', e.quality], ['Use for', e.use]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '12px' }}>
                  <span style={{ color: '#475569', fontFamily: 'Space Mono, monospace', minWidth: '60px' }}>{k}:</span>
                  <span style={{ color: '#94A3B8' }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: '10px', padding: '8px 12px', background: `${e.color}11`, borderRadius: '6px', color: e.color, fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>
                ⚠ {e.issue}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Reranking Demo */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Live demo — watch scores change after reranking
        </div>
        <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px', padding: '20px' }}>
          {/* Query */}
          <div style={{ background: '#131728', border: '1px solid #1E2A45', borderRadius: '8px', padding: '12px 14px', color: '#E2E8F0', fontSize: '13px', marginBottom: '16px' }}>
            ❓ Query: <strong>"{QUERY}"</strong>
          </div>

          {/* Toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[
              { val: false, label: '1st Pass: Bi-Encoder (vector search)', color: '#6366F1' },
              { val: true,  label: '2nd Pass: Cross-Encoder (reranked)',   color: '#EF4444' },
            ].map(opt => (
              <button key={String(opt.val)} onClick={() => setShowReranked(opt.val)} style={{
                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                fontFamily: 'Space Mono, monospace', fontSize: '11px',
                border: `1px solid ${showReranked === opt.val ? opt.color : '#1E2A45'}`,
                background: showReranked === opt.val ? `${opt.color}22` : 'transparent',
                color: showReranked === opt.val ? opt.color : '#64748B',
              }}>{opt.label}</button>
            ))}
          </div>

          {/* Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {displayedResults.map((r, rank) => {
              const score = showReranked ? r.crossScore : r.biScore;
              const isTop = rank < 3;
              return (
                <div
                  key={r.id}
                  onMouseEnter={() => setHoveredId(r.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    background: hoveredId === r.id ? '#1A2540' : '#131728',
                    border: `1px solid ${isTop ? (showReranked ? '#EF444444' : '#6366F144') : '#1E2A45'}`,
                    borderLeft: `3px solid ${isTop ? (showReranked ? '#EF4444' : '#6366F1') : '#2E3A55'}`,
                    borderRadius: '8px', padding: '10px 14px',
                    display: 'flex', gap: '12px', alignItems: 'center',
                    transition: 'all 0.2s ease', cursor: 'default',
                  }}
                >
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: isTop ? (showReranked ? '#EF444422' : '#6366F122') : '#1E2A45',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: '700',
                    color: isTop ? (showReranked ? '#EF4444' : '#6366F1') : '#64748B',
                    flexShrink: 0,
                  }}>#{rank + 1}</div>

                  {/* Score bar */}
                  <div style={{ width: '80px', flexShrink: 0 }}>
                    <div style={{ height: '6px', borderRadius: '3px', background: '#1E2A45', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${score * 100}%`,
                        background: `hsl(${score * 120}, 70%, 50%)`,
                        borderRadius: '3px', transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748B', marginTop: '3px', textAlign: 'right' }}>
                      {score.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#E2E8F0', fontSize: '12px', lineHeight: '1.5' }}>{r.text}</div>
                    <div style={{ color: '#475569', fontSize: '10px', fontFamily: 'Space Mono, monospace', marginTop: '3px' }}>📄 {r.source}</div>
                  </div>

                  {/* Score delta indicator */}
                  {showReranked && (() => {
                    const delta = r.crossScore - r.biScore;
                    return (
                      <div style={{
                        flexShrink: 0, fontFamily: 'Space Mono, monospace', fontSize: '11px',
                        color: delta > 0 ? '#10B981' : '#EF4444',
                        padding: '3px 8px', borderRadius: '6px',
                        background: delta > 0 ? '#10B98111' : '#EF444411',
                      }}>
                        {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {showReranked && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#EF444411', borderRadius: '8px', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#EF4444' }}>
              ⬆️ Notice: Chunks #2 and #4 jumped to the top because cross-encoder caught that they directly mention "rollover" — exactly what the query asks about.
            </div>
          )}
        </div>
      </div>

      {/* MMR */}
      <div style={{ background: '#0E1220', border: '1px solid #EC489944', borderRadius: '12px', padding: '20px' }}>
        <div style={{ color: '#EC4899', fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>🎯 MMR — Maximal Marginal Relevance</div>
        <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.7', margin: '0 0 12px' }}>
          Even after reranking, your top-5 results might all say the same thing. MMR balances
          <strong style={{ color: '#E2E8F0' }}> relevance vs diversity</strong>: each new result must be relevant to the query
          AND different from already-selected results.
        </p>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', background: '#131728', padding: '12px', borderRadius: '8px', color: '#94A3B8' }}>
          MMR score = λ × Relevance(doc, query) − (1−λ) × max_Similarity(doc, selected)
        </div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#64748B', marginTop: '8px' }}>
          λ = 1 → pure relevance (same as regular reranking) | λ = 0 → pure diversity | λ = 0.5 → balanced
        </div>
      </div>

      {/* Reranker Models */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Popular reranker models
        </div>
        <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.7fr 0.7fr 2fr', background: '#131728' }}>
            {['Model', 'Provider', 'Speed', 'Quality', 'Note'].map(h => (
              <div key={h} style={{ padding: '10px 14px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748B', borderBottom: '1px solid #1E2A45' }}>{h}</div>
            ))}
          </div>
          {RERANKER_MODELS.map((m, i) => (
            <div key={m.name} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 0.7fr 0.7fr 2fr',
              borderBottom: i < RERANKER_MODELS.length - 1 ? '1px solid #131728' : 'none',
            }}>
              <div style={{ padding: '10px 14px', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#E2E8F0' }}>{m.name}</div>
              <div style={{ padding: '10px 14px', fontSize: '12px', color: '#EF4444' }}>{m.provider}</div>
              <div style={{ padding: '10px 14px', fontSize: '12px', color: '#94A3B8' }}>{m.speed}</div>
              <div style={{ padding: '10px 14px', fontSize: '12px', color: '#94A3B8' }}>{m.quality}</div>
              <div style={{ padding: '10px 14px', fontSize: '12px', color: '#64748B' }}>{m.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
