import React, { useState } from 'react';

const QUERIES = [
  { q: 'What is our vacation rollover policy?', match: [0, 2, 4] },
  { q: 'How does machine learning work?',       match: [1, 3, 5] },
  { q: 'What are the best foods for energy?',   match: [2, 4, 6] },
];

const CHUNKS = [
  { id: 0, text: 'Employees may roll over up to 5 unused vacation days to the following year.', source: 'HR_Manual.pdf §4.2', score: 0.94 },
  { id: 1, text: 'Machine learning allows computers to learn from data without being explicitly programmed.', source: 'AI_Guide.pdf §1.1', score: 0.91 },
  { id: 2, text: 'Vacation days accrue monthly at a rate of 1.25 days per month for full-time employees.', source: 'HR_Manual.pdf §4.1', score: 0.88 },
  { id: 3, text: 'Neural networks are a type of machine learning model inspired by the human brain.', source: 'AI_Guide.pdf §2.3', score: 0.85 },
  { id: 4, text: 'Rollover days must be used within Q1 of the following year or they will be forfeited.', source: 'HR_Manual.pdf §4.2', score: 0.83 },
  { id: 5, text: 'Deep learning is a subfield of machine learning that uses multi-layer neural networks.', source: 'AI_Guide.pdf §3.1', score: 0.79 },
  { id: 6, text: 'Complex carbohydrates provide sustained energy by releasing glucose slowly into the bloodstream.', source: 'Nutrition.pdf §7', score: 0.72 },
];

const RETRIEVAL_TYPES = [
  {
    id: 'dense',
    label: 'Dense Retrieval',
    icon: '🔢',
    color: '#6366F1',
    desc: 'Use semantic embedding similarity. Finds conceptually related chunks even if they don\'t share exact words.',
    example: '"vehicle" matches "car" even though the word is different.',
    pros: ['Semantic matching', 'Handles paraphrases', 'Works across languages'],
    cons: ['Needs embedding model', 'Slower indexing', 'Out-of-vocabulary terms'],
  },
  {
    id: 'sparse',
    label: 'Sparse / BM25',
    icon: '📝',
    color: '#F59E0B',
    desc: 'TF-IDF / BM25 keyword matching. Scores chunks based on exact term overlap with query.',
    example: '"Python function" returns chunks that literally contain those words.',
    pros: ['Fast, no GPU needed', 'Great for exact terms', 'Explainable scores'],
    cons: ['No semantic understanding', 'Misses synonyms', 'Order of words ignored'],
  },
  {
    id: 'hybrid',
    label: 'Hybrid Search',
    icon: '🔀',
    color: '#10B981',
    desc: 'Combine dense + sparse scores (Reciprocal Rank Fusion). Best of both worlds. Industry standard.',
    example: '"Python error: NameError" — exact match + semantic context.',
    pros: ['Best retrieval quality', 'Handles jargon + semantics', 'Robust to edge cases'],
    cons: ['More complex setup', 'Two indexes to maintain', 'Slightly slower'],
  },
  {
    id: 'mmr',
    label: 'MMR (Diversity)',
    icon: '🎯',
    color: '#EC4899',
    desc: 'Maximal Marginal Relevance — balances relevance AND diversity. Avoids returning 5 nearly identical chunks.',
    example: 'Returns 5 different aspects of "ML" rather than 5 definitions of the same concept.',
    pros: ['Diverse results', 'Less redundancy', 'Better context coverage'],
    cons: ['More iterations', 'Slightly lower precision', 'λ tuning needed'],
  },
];

export default function RagStep6_Retrieval() {
  const [activeQuery, setActiveQuery] = useState(0);
  const [topK, setTopK]               = useState(3);
  const [threshold, setThreshold]     = useState(0.75);
  const [activeType, setActiveType]   = useState(0);

  const q = QUERIES[activeQuery];
  const retrievedChunks = CHUNKS
    .map(c => ({ ...c, score: q.match.includes(c.id) ? c.score : Math.max(0.2, c.score - 0.5 + Math.random() * 0.1) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(c => c.score >= threshold);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Concept */}
      <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ color: '#EC4899', fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>
          🔍 Retrieval — Finding the Relevant Needles in the Haystack
        </h3>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: '0 0 12px' }}>
          At query time, your user's question is embedded into a vector and compared against all stored chunk vectors.
          The system returns the <strong style={{ color: '#EC4899' }}>top-K most similar chunks</strong> — these become the context for the LLM.
        </p>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: 0 }}>
          The retrieval step is <strong style={{ color: '#E2E8F0' }}>the most critical part of RAG</strong>.
          If you retrieve wrong chunks, even the best LLM will produce wrong or irrelevant answers. Garbage in, garbage out.
        </p>
      </div>

      {/* Interactive Demo */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Interactive Retrieval Demo
        </div>
        <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px', padding: '20px' }}>
          {/* Query selector */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>SELECT QUERY:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setActiveQuery(i)}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                    border: `1px solid ${activeQuery === i ? '#EC4899' : '#1E2A45'}`,
                    background: activeQuery === i ? '#EC489922' : '#131728',
                    color: activeQuery === i ? '#EC4899' : '#94A3B8',
                    fontSize: '13px',
                  }}
                >
                  {activeQuery === i ? '▶ ' : '  '}"{q.q}"
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                TOP-K = {topK} (retrieve this many chunks)
              </div>
              <input
                type="range" min="1" max="7" value={topK}
                onChange={e => setTopK(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#EC4899' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', fontFamily: 'Space Mono, monospace' }}>
                <span>1 (precise)</span><span>7 (broad)</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                THRESHOLD = {threshold.toFixed(2)} (min similarity)
              </div>
              <input
                type="range" min="0" max="0.95" step="0.05" value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#EC4899' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', fontFamily: 'Space Mono, monospace' }}>
                <span>0 (all)</span><span>0.95 (strict)</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '10px' }}>
            RETRIEVED {retrievedChunks.length} CHUNK{retrievedChunks.length !== 1 ? 'S' : ''}
          </div>
          {retrievedChunks.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontFamily: 'Space Mono, monospace', fontSize: '12px', border: '1px dashed #1E2A45', borderRadius: '8px' }}>
              No chunks pass the threshold. Lower the threshold or increase top-K.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {retrievedChunks.map((c, rank) => (
                <div key={c.id} style={{
                  background: '#131728', border: `1px solid ${rank === 0 ? '#EC489944' : '#1E2A4566'}`,
                  borderLeft: `3px solid ${rank === 0 ? '#EC4899' : '#2E3A55'}`,
                  borderRadius: '8px', padding: '12px 14px',
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                }}>
                  <div style={{
                    flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: rank === 0 ? '#EC489922' : '#1E2A45',
                      border: `1px solid ${rank === 0 ? '#EC4899' : '#2E3A55'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Space Mono, monospace', fontSize: '11px',
                      color: rank === 0 ? '#EC4899' : '#64748B', fontWeight: '700',
                    }}>#{rank + 1}</div>
                    {/* Score bar */}
                    <div style={{
                      width: '28px', height: `${c.score * 60}px`, borderRadius: '3px',
                      background: `hsl(${c.score * 120}, 70%, 50%)`,
                      opacity: 0.7, transition: 'height 0.3s ease',
                    }} />
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#64748B' }}>
                      {c.score.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#E2E8F0', fontSize: '13px', lineHeight: '1.6', marginBottom: '4px' }}>{c.text}</div>
                    <div style={{ color: '#475569', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>📄 {c.source}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Retrieval Types */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Retrieval strategies
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {RETRIEVAL_TYPES.map((t, i) => (
            <button key={t.id} onClick={() => setActiveType(i)} style={{
              padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
              fontFamily: 'Space Mono, monospace', fontSize: '11px',
              border: `1px solid ${activeType === i ? t.color : '#1E2A45'}`,
              background: activeType === i ? `${t.color}22` : 'transparent',
              color: activeType === i ? t.color : '#64748B',
            }}>{t.icon} {t.label}</button>
          ))}
        </div>
        {(() => {
          const t = RETRIEVAL_TYPES[activeType];
          return (
            <div style={{ background: '#0E1220', border: `1px solid ${t.color}44`, borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '24px' }}>{t.icon}</span>
                <div style={{ color: t.color, fontWeight: '700', fontSize: '15px' }}>{t.label}</div>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.7', margin: '0 0 12px' }}>{t.desc}</p>
              <div style={{ background: '#131728', border: '1px solid #1E2A45', borderRadius: '8px', padding: '10px 14px', fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#64748B', marginBottom: '14px' }}>
                Example: {t.example}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#10B98111', border: '1px solid #10B98133', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ color: '#10B981', fontSize: '11px', fontWeight: '700', marginBottom: '8px', fontFamily: 'Space Mono, monospace' }}>✅ PROS</div>
                  {t.pros.map(p => <div key={p} style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.6' }}>• {p}</div>)}
                </div>
                <div style={{ background: '#EF444411', border: '1px solid #EF444433', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ color: '#EF4444', fontSize: '11px', fontWeight: '700', marginBottom: '8px', fontFamily: 'Space Mono, monospace' }}>❌ CONS</div>
                  {t.cons.map(c => <div key={c} style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.6' }}>• {c}</div>)}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Key insight */}
      <div style={{ background: '#0A1628', border: '1px solid #EC489944', borderRadius: '12px', padding: '18px 20px', display: 'flex', gap: '14px' }}>
        <span style={{ fontSize: '24px', flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ color: '#EC4899', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>How to choose top-K?</div>
          <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
            More chunks = more context = less chance of missing the answer, BUT also more noise for the LLM to deal with.
            Start with <strong style={{ color: '#E2E8F0' }}>K=3–5</strong> for most use cases. If answers are missing key info, increase K.
            If answers are confused or have wrong info mixed in, decrease K or raise the threshold.
          </p>
        </div>
      </div>
    </div>
  );
}
