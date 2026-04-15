import React, { useState } from 'react';

const RAW_QUERY = 'how does attention work';

const TECHNIQUES = [
  {
    id: 'rewrite',
    icon: '✏️',
    label: 'Query Rewriting',
    color: '#A78BFA',
    desc: 'LLM rewrites the raw user input into a cleaner, more specific search query using proper terminology.',
    why: 'User queries are often short, informal, or ambiguous. A rewritten query retrieves far more precise chunks.',
    before: '"how does attention work"',
    afterLines: ['"How does the self-attention mechanism function in transformer architectures, and what role do Q-K-V matrices play?"'],
    afterLabel: '1 rewritten query',
    chunks: [
      { text: 'Self-attention computes relevance scores between tokens using QKᵀ / √d', level: 'high' },
      { text: 'Multi-head attention projects into multiple subspaces for richer representations', level: 'high' },
      { text: 'Transformers replaced recurrence with attention for parallelism', level: 'med' },
    ],
    interview: 'How do you improve retrieval quality beyond tuning top-K?',
    interviewHint: 'Mention query rewriting → better terminology → higher precision retrieval.',
  },
  {
    id: 'multi',
    icon: '🔀',
    label: 'Multi-Query',
    color: '#10B981',
    desc: 'LLM generates N variations of the user query. Each variation is run through retrieval. All results are merged (union).',
    why: 'Different phrasings surface different chunks. Union of results gives much higher recall than any single query alone.',
    before: '"how does attention work"',
    afterLines: [
      '1. "What is the attention mechanism in transformer models?"',
      '2. "How does self-attention compute similarity between tokens?"',
      '3. "Explain query, key, value in transformer attention"',
    ],
    afterLabel: '3 query variations → union of results',
    chunks: [
      { text: '[Q1] Self-attention scores every token pair and mixes information accordingly', level: 'high' },
      { text: '[Q2] Queries and keys are learned projections; dot product gives attention weight', level: 'high' },
      { text: '[Q3] Values hold the content; attention weights decide how much each contributes', level: 'high' },
      { text: '[Union bonus] More diverse chunks retrieved — higher recall overall', level: 'bonus' },
    ],
    interview: 'How do you handle cases where retrieval misses key context?',
    interviewHint: 'Explain multi-query → union retrieval → higher recall at the cost of slightly more LLM calls.',
  },
  {
    id: 'hyde',
    icon: '🧠',
    label: 'HyDE',
    color: '#F59E0B',
    desc: 'Hypothetical Document Embeddings: LLM first generates a fake answer, then that fake answer (not the query) is embedded and used for retrieval.',
    why: 'A hypothetical answer lives in the same embedding space as real document chunks. A short query does not. HyDE dramatically improves dense retrieval quality.',
    before: '"how does attention work"',
    afterLines: [
      '"The attention mechanism works by computing a weighted sum of value vectors,',
      ' where weights come from comparing query vectors with key vectors via dot products,',
      ' normalized by softmax. This allows each token to attend to all other tokens..."',
    ],
    afterLabel: 'Hypothetical answer → embedded for search (not shown to user)',
    chunks: [
      { text: 'Attention(Q,K,V) = softmax(QKᵀ / √d_k)V — the core formula', level: 'high' },
      { text: 'Keys and queries are dot-product scored; softmax turns them into probabilities', level: 'high' },
      { text: 'Value vectors are then mixed proportionally to the attention weights', level: 'high' },
    ],
    interview: 'What is HyDE and when would you use it?',
    interviewHint: 'HyDE = embed a fake answer instead of the query. Use it when queries are too short or ambiguous for dense retrieval to work well.',
  },
];

const LEVEL_META = {
  high:  { label: 'Strong match', color: '#10B981', bg: '#10B98111' },
  med:   { label: 'Partial match', color: '#F59E0B', bg: '#F59E0B11' },
  bonus: { label: 'Union bonus',   color: '#A78BFA', bg: '#A78BFA11' },
};

export default function RagStep10_QueryTransformation() {
  const [active, setActive] = useState(0);
  const t = TECHNIQUES[active];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Concept */}
      <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ color: '#A78BFA', fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>
          🔄 Query Transformation — Real Systems Don't Use Raw Queries
        </h3>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: '0 0 10px' }}>
          A user types <em style={{ color: '#E2E8F0' }}>"how does attention work"</em> — short, informal, ambiguous.
          Production RAG systems <strong style={{ color: '#A78BFA' }}>transform this query</strong> before retrieval to get better chunks.
        </p>
        <div style={{ background: '#131728', border: '1px solid #A78BFA33', borderRadius: '8px', padding: '12px 16px', fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#A78BFA' }}>
          Raw query → transformation → better query → better retrieval → better answer
        </div>
      </div>

      {/* Technique selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {TECHNIQUES.map((tech, i) => (
          <button key={tech.id} onClick={() => setActive(i)} style={{
            padding: '10px 18px', borderRadius: '8px', cursor: 'pointer',
            fontFamily: 'Space Mono, monospace', fontSize: '11px',
            border: `1px solid ${active === i ? tech.color : '#1E2A45'}`,
            background: active === i ? `${tech.color}22` : 'transparent',
            color: active === i ? tech.color : '#64748B',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span>{tech.icon}</span> {tech.label}
          </button>
        ))}
      </div>

      {/* Technique detail */}
      <div style={{ background: '#0E1220', border: `1px solid ${t.color}44`, borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Description */}
        <div>
          <div style={{ color: t.color, fontWeight: '700', fontSize: '15px', marginBottom: '8px' }}>
            {t.icon} {t.label}
          </div>
          <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.8', margin: '0 0 10px' }}>{t.desc}</p>
          <div style={{ background: `${t.color}11`, border: `1px solid ${t.color}33`, borderRadius: '8px', padding: '10px 14px', color: t.color, fontSize: '12px' }}>
            💡 Why: {t.why}
          </div>
        </div>

        {/* Before / After */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '14px' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#EF4444', marginBottom: '8px', letterSpacing: '1px' }}>
              ❌ RAW USER QUERY
            </div>
            <div style={{ background: '#131728', border: '1px solid #EF444433', borderRadius: '8px', padding: '14px', fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#94A3B8', lineHeight: '1.6' }}>
              {t.before}
            </div>
            <div style={{ marginTop: '6px', color: '#475569', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>short · informal · ambiguous</div>
          </div>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#10B981', marginBottom: '8px', letterSpacing: '1px' }}>
              ✅ AFTER TRANSFORMATION — {t.afterLabel}
            </div>
            <div style={{ background: '#131728', border: `1px solid ${t.color}44`, borderRadius: '8px', padding: '14px', fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#E2E8F0', lineHeight: '1.8' }}>
              {t.afterLines.map((line, i) => (
                <div key={i} style={{ color: i === 0 ? t.color : '#94A3B8' }}>{line}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Chunks retrieved */}
        <div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748B', marginBottom: '10px', letterSpacing: '1px' }}>
            CHUNKS RETRIEVED AFTER TRANSFORMATION
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {t.chunks.map((chunk, i) => {
              const meta = LEVEL_META[chunk.level];
              return (
                <div key={i} style={{
                  background: '#131728', border: `1px solid ${meta.color}33`,
                  borderLeft: `3px solid ${meta.color}`, borderRadius: '8px',
                  padding: '10px 14px', display: 'flex', gap: '12px', alignItems: 'center',
                }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#64748B', flexShrink: 0 }}>#{i + 1}</div>
                  <div style={{ flex: 1, color: '#94A3B8', fontSize: '12px', lineHeight: '1.6' }}>{chunk.text}</div>
                  <div style={{ flexShrink: 0, padding: '3px 10px', borderRadius: '20px', background: meta.bg, color: meta.color, fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>
                    {meta.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interview callout */}
        <div style={{ background: '#0A1628', border: '1px solid #F59E0B44', borderRadius: '10px', padding: '14px 16px' }}>
          <div style={{ color: '#F59E0B', fontWeight: '700', fontSize: '12px', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
            🎯 INTERVIEW QUESTION
          </div>
          <div style={{ color: '#E2E8F0', fontSize: '13px', marginBottom: '8px' }}>"{t.interview}"</div>
          <div style={{ color: '#64748B', fontSize: '12px', lineHeight: '1.6', fontFamily: 'Space Mono, monospace' }}>
            → {t.interviewHint}
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Quick comparison
        </div>
        <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.2fr', background: '#131728' }}>
            {['Technique', 'LLM calls', 'Recall', 'Precision', 'Best for'].map(h => (
              <div key={h} style={{ padding: '10px 14px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748B', borderBottom: '1px solid #1E2A45' }}>{h}</div>
            ))}
          </div>
          {[
            ['Query Rewriting', '1', '⭐⭐⭐', '⭐⭐⭐⭐', 'Informal / short user queries'],
            ['Multi-Query', '1 + N retrievals', '⭐⭐⭐⭐⭐', '⭐⭐⭐', 'Complex / multi-faceted questions'],
            ['HyDE', '1 (fake answer)', '⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', 'Dense retrieval on technical docs'],
          ].map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.2fr', borderBottom: i < 2 ? '1px solid #131728' : 'none' }}>
              {row.map((cell, j) => (
                <div key={j} style={{ padding: '10px 14px', fontSize: '12px', color: j === 0 ? '#E2E8F0' : '#94A3B8', fontFamily: j === 0 ? 'inherit' : undefined }}>{cell}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Key insight */}
      <div style={{ background: '#0A1628', border: '1px solid #A78BFA44', borderRadius: '12px', padding: '18px 20px', display: 'flex', gap: '14px' }}>
        <span style={{ fontSize: '24px', flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ color: '#A78BFA', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>
            One-line to remember
          </div>
          <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
            <strong style={{ color: '#E2E8F0' }}>Query transformation happens before retrieval.</strong>{' '}
            It does not change chunking, embedding, or the vector DB — it only improves what you search with.
            Layer these techniques: rewrite first, use multi-query for complex questions, HyDE when your queries are too short for dense retrieval.
          </p>
        </div>
      </div>
    </div>
  );
}
