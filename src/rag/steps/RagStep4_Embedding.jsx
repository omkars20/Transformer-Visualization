import React, { useState } from 'react';

// Fake but realistic 2D projections of word clusters
const WORD_POINTS = [
  // AI/Tech cluster
  { word: 'AI',           x: 72, y: 28, cluster: 'tech',    color: '#6366F1' },
  { word: 'machine',      x: 62, y: 22, cluster: 'tech',    color: '#6366F1' },
  { word: 'neural net',   x: 80, y: 34, cluster: 'tech',    color: '#6366F1' },
  { word: 'algorithm',    x: 68, y: 18, cluster: 'tech',    color: '#6366F1' },
  // Medical cluster
  { word: 'doctor',       x: 20, y: 72, cluster: 'medical', color: '#10B981' },
  { word: 'hospital',     x: 28, y: 78, cluster: 'medical', color: '#10B981' },
  { word: 'medicine',     x: 16, y: 65, cluster: 'medical', color: '#10B981' },
  { word: 'patient',      x: 24, y: 84, cluster: 'medical', color: '#10B981' },
  // Food cluster
  { word: 'pizza',        x: 82, y: 78, cluster: 'food',    color: '#F59E0B' },
  { word: 'burger',       x: 88, y: 70, cluster: 'food',    color: '#F59E0B' },
  { word: 'sushi',        x: 76, y: 82, cluster: 'food',    color: '#F59E0B' },
  // Finance cluster
  { word: 'bank',         x: 22, y: 26, cluster: 'finance', color: '#EC4899' },
  { word: 'investment',   x: 14, y: 32, cluster: 'finance', color: '#EC4899' },
  { word: 'revenue',      x: 28, y: 18, cluster: 'finance', color: '#EC4899' },
];

const EXAMPLE_TEXTS = [
  'The cat sat on the mat.',
  'AI is transforming healthcare.',
  'Machine learning models learn from data.',
  'The quick brown fox jumps over the lazy dog.',
];

// Fake embedding preview (truncated)
const FAKE_EMBEDDING = [0.213, -0.847, 0.032, 0.619, -0.234, 0.481, -0.123, 0.756, 0.089, -0.412, 0.334, -0.668, 0.221, 0.509, -0.342];

const EMBEDDING_MODELS = [
  { name: 'text-embedding-3-large', provider: 'OpenAI', dims: 3072, note: 'Best quality, paid API' },
  { name: 'text-embedding-3-small', provider: 'OpenAI', dims: 1536, note: 'Good quality, cheaper' },
  { name: 'bge-large-en-v1.5',      provider: 'BAAI',   dims: 1024, note: 'Best open-source model' },
  { name: 'all-MiniLM-L6-v2',       provider: 'SBERT',  dims: 384,  note: 'Fast, free, local' },
  { name: 'embed-english-v3.0',      provider: 'Cohere', dims: 1024, note: 'Great for RAG' },
  { name: 'nomic-embed-text',        provider: 'Nomic',  dims: 768,  note: 'Open, 8K context' },
];

const DISTANCE_METRICS = [
  {
    name: 'Cosine Similarity',
    formula: 'cos(θ) = A·B / (|A||B|)',
    range: '-1 to 1 (higher = more similar)',
    color: '#6366F1',
    best: 'Most common for text. Measures angle between vectors — ignores magnitude.',
  },
  {
    name: 'Dot Product',
    formula: 'A · B = Σ(aᵢ × bᵢ)',
    range: 'Any real number',
    color: '#10B981',
    best: 'Fast. Works well with normalized vectors (same as cosine then).',
  },
  {
    name: 'Euclidean Distance',
    formula: 'd = √Σ(aᵢ - bᵢ)²',
    range: '0 to ∞ (lower = more similar)',
    color: '#F59E0B',
    best: 'Good for image embeddings. Less common for text.',
  },
];

export default function RagStep4_Embedding() {
  const [selectedText, setSelectedText] = useState(0);
  const [hoveredWord, setHoveredWord] = useState(null);
  const [showAllDims, setShowAllDims] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Concept */}
      <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ color: '#6366F1', fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>
          🔢 Embeddings — Turning Words into Numbers
        </h3>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: '0 0 12px' }}>
          Computers don't understand text — they understand numbers. An <strong style={{ color: '#6366F1' }}>embedding model</strong> converts
          a piece of text into a list of hundreds or thousands of floating-point numbers called a <strong style={{ color: '#E2E8F0' }}>vector</strong>.
        </p>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: 0 }}>
          The magic: texts with <strong style={{ color: '#10B981' }}>similar meaning</strong> produce vectors that are
          <strong style={{ color: '#10B981' }}> close together in space</strong>. "Doctor" and "hospital" will be near each other.
          "Doctor" and "pizza" will be far apart.
        </p>
      </div>

      {/* Text → Vector Demo */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Text → Vector
        </div>
        <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {EXAMPLE_TEXTS.map((t, i) => (
              <button
                key={i}
                onClick={() => setSelectedText(i)}
                style={{
                  padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                  fontFamily: 'Space Mono, monospace',
                  border: `1px solid ${selectedText === i ? '#6366F1' : '#1E2A45'}`,
                  background: selectedText === i ? '#6366F122' : 'transparent',
                  color: selectedText === i ? '#6366F1' : '#64748B',
                }}
              >"{t.slice(0, 22)}…"</button>
            ))}
          </div>

          {/* Input text */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>INPUT TEXT</div>
            <div style={{ background: '#131728', border: '1px solid #1E2A45', borderRadius: '8px', padding: '12px', color: '#E2E8F0', fontSize: '13px' }}>
              "{EXAMPLE_TEXTS[selectedText]}"
            </div>
          </div>

          {/* Arrow */}
          <div style={{ textAlign: 'center', color: '#6366F1', fontSize: '18px', margin: '8px 0' }}>
            ↓ <span style={{ fontSize: '11px', fontFamily: 'Space Mono, monospace', color: '#6366F1' }}>text-embedding-3-small</span>
          </div>

          {/* Output vector */}
          <div>
            <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
              OUTPUT VECTOR (1536 dimensions — showing {showAllDims ? 15 : 8})
            </div>
            <div style={{ background: '#131728', border: '1px solid #6366F133', borderRadius: '8px', padding: '14px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <span style={{ color: '#6366F1', fontFamily: 'Space Mono, monospace', fontSize: '12px' }}>[</span>
              {FAKE_EMBEDDING.slice(0, showAllDims ? 15 : 8).map((v, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: 'Space Mono, monospace', fontSize: '11px',
                    color: v > 0 ? '#10B981' : '#EF4444',
                    padding: '3px 6px', background: v > 0 ? '#10B98111' : '#EF444411',
                    borderRadius: '4px',
                  }}
                >{v.toFixed(3)}</span>
              ))}
              <span style={{ color: '#64748B', fontFamily: 'Space Mono, monospace', fontSize: '11px' }}>
                {showAllDims ? '…' : '… 1528 more'}
              </span>
              <span style={{ color: '#6366F1', fontFamily: 'Space Mono, monospace', fontSize: '12px' }}>]</span>
              <button
                onClick={() => setShowAllDims(!showAllDims)}
                style={{
                  marginLeft: 'auto', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '10px', fontFamily: 'Space Mono, monospace', border: '1px solid #1E2A45',
                  background: 'transparent', color: '#64748B',
                }}
              >{showAllDims ? 'show less' : 'show more'}</button>
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#475569', marginTop: '6px' }}>
              Each number encodes a different semantic feature. Positive = present, Negative = absent.
            </div>
          </div>
        </div>
      </div>

      {/* 2D Embedding Space */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Semantic Space — similar words cluster together (2D projection)
        </div>
        <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px', padding: '20px' }}>
          <svg width="100%" viewBox="0 0 400 280" style={{ display: 'block' }}>
            {/* Grid */}
            {[0, 1, 2, 3, 4].map(i => (
              <React.Fragment key={i}>
                <line x1={i * 100} y1={0} x2={i * 100} y2={280} stroke="#1E2A45" strokeWidth="1" />
                <line x1={0} y1={i * 70} x2={400} y2={i * 70} stroke="#1E2A45" strokeWidth="1" />
              </React.Fragment>
            ))}
            {/* Cluster labels */}
            {[
              { label: 'AI / Tech', cx: 285, cy: 60, color: '#6366F1' },
              { label: 'Medical', cx: 95, cy: 240, color: '#10B981' },
              { label: 'Food', cx: 330, cy: 260, color: '#F59E0B' },
              { label: 'Finance', cx: 78, cy: 70, color: '#EC4899' },
            ].map(c => (
              <text key={c.label} x={c.cx} y={c.cy} fill={c.color} fontSize="11" fontFamily="Space Mono, monospace" opacity="0.5" textAnchor="middle">{c.label}</text>
            ))}
            {/* Points */}
            {WORD_POINTS.map(p => {
              const cx = (p.x / 100) * 400;
              const cy = (p.y / 100) * 280;
              const isHovered = hoveredWord === p.word;
              return (
                <g key={p.word}
                  onMouseEnter={() => setHoveredWord(p.word)}
                  onMouseLeave={() => setHoveredWord(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={cx} cy={cy} r={isHovered ? 7 : 5} fill={p.color} opacity={isHovered ? 1 : 0.75} />
                  <text
                    x={cx + 8} y={cy + 4}
                    fill={p.color} fontSize="10" fontFamily="Space Mono, monospace"
                    opacity={isHovered ? 1 : 0.7}
                    fontWeight={isHovered ? 'bold' : 'normal'}
                  >{p.word}</text>
                </g>
              );
            })}
            {/* Axis labels */}
            <text x="2" y="12" fill="#475569" fontSize="9" fontFamily="Space Mono, monospace">dim-1</text>
            <text x="350" y="275" fill="#475569" fontSize="9" fontFamily="Space Mono, monospace">dim-2</text>
          </svg>
          <p style={{ color: '#475569', fontFamily: 'Space Mono, monospace', fontSize: '11px', margin: '10px 0 0', lineHeight: '1.6' }}>
            In reality, vectors have 1,000+ dimensions. This is a 2D projection for visualization.
            Hover over a word to highlight it.
          </p>
        </div>
      </div>

      {/* Distance Metrics */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Similarity metrics — how do we measure "closeness"?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {DISTANCE_METRICS.map(m => (
            <div key={m.name} style={{
              background: '#0E1220', border: `1px solid ${m.color}44`,
              borderRadius: '10px', padding: '16px',
              display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 2fr', gap: '12px', alignItems: 'center',
            }}>
              <div style={{ color: m.color, fontWeight: '700', fontSize: '13px' }}>{m.name}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#E2E8F0' }}>{m.formula}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748B' }}>{m.range}</div>
              <div style={{ color: '#94A3B8', fontSize: '12px' }}>{m.best}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Embedding Models */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Popular embedding models
        </div>
        <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 2fr', background: '#131728' }}>
            {['Model', 'Provider', 'Dimensions', 'Note'].map(h => (
              <div key={h} style={{ padding: '10px 14px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748B', borderBottom: '1px solid #1E2A45' }}>{h}</div>
            ))}
          </div>
          {EMBEDDING_MODELS.map((m, i) => (
            <div key={m.name} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 2fr',
              borderBottom: i < EMBEDDING_MODELS.length - 1 ? '1px solid #131728' : 'none',
            }}>
              <div style={{ padding: '10px 14px', fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#E2E8F0' }}>{m.name}</div>
              <div style={{ padding: '10px 14px', fontSize: '12px', color: '#6366F1' }}>{m.provider}</div>
              <div style={{ padding: '10px 14px', fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#F59E0B' }}>{m.dims}</div>
              <div style={{ padding: '10px 14px', fontSize: '12px', color: '#94A3B8' }}>{m.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key insight */}
      <div style={{ background: '#0A1628', border: '1px solid #6366F144', borderRadius: '12px', padding: '18px 20px', display: 'flex', gap: '14px' }}>
        <span style={{ fontSize: '24px', flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ color: '#6366F1', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>Same model for query AND documents</div>
          <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
            You must embed your query and your stored chunks with the <strong style={{ color: '#E2E8F0' }}>exact same model</strong>.
            If you store chunks with <em>bge-large</em> and query with <em>text-embedding-3-small</em>,
            the vectors live in completely different spaces and similarity scores will be meaningless.
          </p>
        </div>
      </div>
    </div>
  );
}
