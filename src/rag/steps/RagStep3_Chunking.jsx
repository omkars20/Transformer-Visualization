import React, { useState, useMemo } from 'react';

const SAMPLE_TEXT = `Artificial intelligence (AI) is transforming every industry on the planet. From healthcare to finance, AI tools are making processes faster and more accurate than ever before. Machine learning, a subset of AI, allows computers to learn from data without being explicitly programmed. Deep learning goes even further by using neural networks with many layers. Natural language processing (NLP) enables machines to understand human language. RAG systems combine retrieval and generation to answer questions accurately.`;

// ── Chunking algorithms ──────────────────────────────────────────────────────

function fixedSizeChunk(text, size, overlap) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start += size - overlap;
  }
  return chunks;
}

function sentenceChunk(text) {
  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
  const chunks = [];
  let buf = '';
  for (const s of sentences) {
    if ((buf + s).length > 200 && buf.length > 0) {
      chunks.push(buf.trim());
      buf = s;
    } else {
      buf += s;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
}

function recursiveChunk(text, maxSize = 200) {
  if (text.length <= maxSize) return [text];
  const separators = ['\n\n', '\n', '. ', '! ', '? ', ', ', ' '];
  for (const sep of separators) {
    const parts = text.split(sep);
    if (parts.length <= 1) continue;
    const chunks = [];
    let current = '';
    for (const part of parts) {
      const candidate = current ? current + sep + part : part;
      if (candidate.length <= maxSize) {
        current = candidate;
      } else {
        if (current) chunks.push(current.trim());
        current = part;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    if (chunks.length > 1) return chunks;
  }
  return fixedSizeChunk(text, maxSize, 0);
}

function semanticChunk(text) {
  // Simulated semantic chunking: group sentences by topic
  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [];
  const groups = [];
  let group = [];
  // Simple heuristic: new group when keyword shift happens
  const topicKeywords = [
    ['AI', 'artificial intelligence', 'transforming', 'industry'],
    ['machine learning', 'computers', 'data', 'programmed'],
    ['deep learning', 'neural', 'layers'],
    ['NLP', 'natural language', 'language'],
    ['RAG', 'retrieval', 'generation'],
  ];
  let lastTopic = -1;
  for (const s of sentences) {
    const lower = s.toLowerCase();
    let topic = topicKeywords.findIndex(kws => kws.some(kw => lower.includes(kw.toLowerCase())));
    if (topic === -1) topic = lastTopic;
    if (topic !== lastTopic && group.length > 0) {
      groups.push(group.join(' ').trim());
      group = [];
    }
    group.push(s.trim());
    lastTopic = topic;
  }
  if (group.length) groups.push(group.join(' ').trim());
  return groups;
}

function tokenChunk(text, tokensPerChunk = 50) {
  // Rough: 1 token ≈ 4 chars
  const charLimit = tokensPerChunk * 4;
  return fixedSizeChunk(text, charLimit, Math.floor(charLimit * 0.15));
}

// ── Strategy definitions ─────────────────────────────────────────────────────

const STRATEGIES = [
  {
    id: 'fixed',
    label: 'Fixed-Size',
    icon: '📏',
    color: '#F59E0B',
    desc: 'Split text every N characters, with optional overlap. Fast and simple.',
    pros: ['Predictable chunk sizes', 'Very fast', 'Works on any text'],
    cons: ['Cuts mid-sentence', 'No semantic awareness', 'Overlap = wasted tokens'],
    params: { size: 150, overlap: 30 },
    fn: (t, p) => fixedSizeChunk(t, p.size, p.overlap),
    paramLabel: 'Chunk Size: 150 chars | Overlap: 30 chars',
  },
  {
    id: 'sentence',
    label: 'Sentence',
    icon: '📖',
    color: '#10B981',
    desc: 'Split at sentence boundaries (.!?). Preserves grammatical units.',
    pros: ['No mid-sentence cuts', 'Human-readable chunks', 'Good for QA'],
    cons: ['Variable chunk sizes', 'Very long sentences = large chunks', 'Language-dependent'],
    params: {},
    fn: (t) => sentenceChunk(t),
    paramLabel: 'Splits on: . ! ? boundaries',
  },
  {
    id: 'recursive',
    label: 'Recursive',
    icon: '🔄',
    color: '#6366F1',
    desc: 'LangChain\'s default. Tries \\n\\n → \\n → . → space → char in order. Preserves structure.',
    pros: ['Respects document structure', 'Balanced sizes', 'Industry default'],
    cons: ['More complex', 'Slightly slower', 'Tuning needed'],
    params: { maxSize: 200 },
    fn: (t, p) => recursiveChunk(t, p.maxSize),
    paramLabel: 'Separators: \\n\\n → \\n → . → space → char',
  },
  {
    id: 'semantic',
    label: 'Semantic',
    icon: '🧠',
    color: '#8B5CF6',
    desc: 'Groups semantically related sentences together using embedding similarity. Best quality.',
    pros: ['Topic-coherent chunks', 'Best retrieval quality', 'Handles topic shifts'],
    cons: ['Slowest (needs embeddings)', 'Most expensive', 'Variable sizes'],
    params: {},
    fn: (t) => semanticChunk(t),
    paramLabel: 'Groups sentences with similar embeddings',
  },
  {
    id: 'token',
    label: 'Token-Based',
    icon: '🔢',
    color: '#EC4899',
    desc: 'Split by token count (1 token ≈ 4 chars). Precise for LLM context windows.',
    pros: ['Exact token control', 'Fits LLM windows perfectly', 'Predictable cost'],
    cons: ['Tokenizer required', 'Cuts mid-word sometimes', 'Model-specific'],
    params: { tokensPerChunk: 50 },
    fn: (t, p) => tokenChunk(t, p.tokensPerChunk),
    paramLabel: '~50 tokens per chunk (≈ 200 chars)',
  },
];

const CHUNK_COLORS = ['#F59E0B', '#10B981', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#06B6D4'];

export default function RagStep3_Chunking() {
  const [activeStrategy, setActiveStrategy] = useState(0);
  const strategy = STRATEGIES[activeStrategy];

  const chunks = useMemo(
    () => strategy.fn(SAMPLE_TEXT, strategy.params),
    [activeStrategy]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Concept */}
      <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ color: '#06B6D4', fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>
          ✂️ Chunking — Why You Can't Just Use the Whole Document
        </h3>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: '0 0 12px' }}>
          LLMs have context limits (e.g. 4K–128K tokens). But more importantly, when you search for relevant content,
          you don't want to retrieve an <em>entire 100-page document</em> — you want the <strong style={{ color: '#06B6D4' }}>2–3 paragraphs</strong> that actually answer the question.
        </p>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: 0 }}>
          Chunking splits documents into small, searchable pieces. The chunk strategy you choose
          dramatically affects retrieval quality — the wrong strategy can split a key sentence across two chunks
          and make it unfindable.
        </p>
      </div>

      {/* Strategy Selector */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Choose a chunking strategy
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {STRATEGIES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveStrategy(i)}
              style={{
                padding: '10px 16px', borderRadius: '8px', cursor: 'pointer',
                fontFamily: 'Space Mono, monospace', fontSize: '11px',
                border: `1px solid ${activeStrategy === i ? s.color : '#1E2A45'}`,
                background: activeStrategy === i ? `${s.color}22` : 'transparent',
                color: activeStrategy === i ? s.color : '#64748B',
                transition: 'all 0.15s ease',
              }}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Detail */}
      <div style={{
        background: '#0E1220', border: `1px solid ${strategy.color}44`,
        borderRadius: '12px', padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span style={{ fontSize: '24px' }}>{strategy.icon}</span>
          <div>
            <div style={{ color: strategy.color, fontWeight: '700', fontSize: '15px' }}>{strategy.label} Chunking</div>
            <div style={{ color: '#64748B', fontFamily: 'Space Mono, monospace', fontSize: '10px' }}>{strategy.paramLabel}</div>
          </div>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.7', margin: '0 0 14px' }}>{strategy.desc}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: '#10B98111', border: '1px solid #10B98133', borderRadius: '8px', padding: '12px' }}>
            <div style={{ color: '#10B981', fontSize: '11px', fontWeight: '700', marginBottom: '8px', fontFamily: 'Space Mono, monospace' }}>✅ PROS</div>
            {strategy.pros.map(p => (
              <div key={p} style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.6' }}>• {p}</div>
            ))}
          </div>
          <div style={{ background: '#EF444411', border: '1px solid #EF444433', borderRadius: '8px', padding: '12px' }}>
            <div style={{ color: '#EF4444', fontSize: '11px', fontWeight: '700', marginBottom: '8px', fontFamily: 'Space Mono, monospace' }}>❌ CONS</div>
            {strategy.cons.map(c => (
              <div key={c} style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.6' }}>• {c}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Result Visualization */}
      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px',
          color: '#64748B', textTransform: 'uppercase', marginBottom: '14px',
        }}>
          <span>Result — same text, {chunks.length} chunks produced</span>
          <span style={{ color: strategy.color }}>{strategy.label}</span>
        </div>

        {/* Visual strip */}
        <div style={{
          display: 'flex', gap: '3px', marginBottom: '16px', flexWrap: 'wrap',
        }}>
          {chunks.map((chunk, i) => (
            <div
              key={i}
              title={chunk}
              style={{
                height: '10px', borderRadius: '3px', flexShrink: 0,
                background: CHUNK_COLORS[i % CHUNK_COLORS.length],
                width: `${Math.max(20, (chunk.length / SAMPLE_TEXT.length) * 600)}px`,
                opacity: 0.8,
              }}
            />
          ))}
        </div>

        {/* Chunk cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {chunks.map((chunk, i) => (
            <div key={i} style={{
              background: '#0E1220',
              border: `1px solid ${CHUNK_COLORS[i % CHUNK_COLORS.length]}44`,
              borderLeft: `3px solid ${CHUNK_COLORS[i % CHUNK_COLORS.length]}`,
              borderRadius: '8px', padding: '12px 14px',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <div style={{
                flexShrink: 0, width: '28px', height: '28px', borderRadius: '6px',
                background: `${CHUNK_COLORS[i % CHUNK_COLORS.length]}22`,
                border: `1px solid ${CHUNK_COLORS[i % CHUNK_COLORS.length]}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Space Mono, monospace', fontSize: '10px', fontWeight: '700',
                color: CHUNK_COLORS[i % CHUNK_COLORS.length],
              }}>#{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#E2E8F0', fontSize: '12px', lineHeight: '1.6' }}>{chunk}</div>
                <div style={{ color: '#475569', fontSize: '10px', fontFamily: 'Space Mono, monospace', marginTop: '4px' }}>
                  {chunk.length} chars · ~{Math.round(chunk.length / 4)} tokens
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Quick comparison
        </div>
        <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.4fr 1fr', background: '#131728' }}>
            {['Strategy', 'Speed', 'Quality', 'Best For', 'Tool'].map(h => (
              <div key={h} style={{ padding: '10px 14px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748B', borderBottom: '1px solid #1E2A45' }}>{h}</div>
            ))}
          </div>
          {[
            ['Fixed-Size',   '⚡ Fast',    '⭐⭐',       'Quick prototypes',   'any'],
            ['Sentence',     '⚡ Fast',    '⭐⭐⭐',     'QA, chatbots',       'NLTK, spaCy'],
            ['Recursive',    '🔥 Medium',  '⭐⭐⭐⭐',   'General purpose',    'LangChain'],
            ['Semantic',     '🐢 Slow',    '⭐⭐⭐⭐⭐', 'High-quality RAG',   'LlamaIndex'],
            ['Token-Based',  '⚡ Fast',    '⭐⭐⭐',     'Cost control',       'tiktoken'],
          ].map((row, ri) => (
            <div key={ri} style={{
              display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.4fr 1fr',
              background: STRATEGIES[ri]?.id === strategy.id ? `${STRATEGIES[ri].color}11` : 'transparent',
              borderBottom: ri < 4 ? '1px solid #131728' : 'none',
            }}>
              {row.map((cell, ci) => (
                <div key={ci} style={{
                  padding: '10px 14px', fontSize: '12px',
                  color: ci === 0 && STRATEGIES[ri]?.id === strategy.id ? STRATEGIES[ri].color : '#94A3B8',
                  fontFamily: ci === 0 ? 'Space Mono, monospace' : undefined,
                  fontWeight: ci === 0 ? '600' : '400',
                }}>{cell}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Overlap explanation */}
      <div style={{ background: '#0A1628', border: '1px solid #F59E0B44', borderRadius: '12px', padding: '18px 20px', display: 'flex', gap: '14px' }}>
        <span style={{ fontSize: '24px', flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ color: '#F59E0B', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>What is chunk overlap?</div>
          <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
            Overlap means the last N characters of chunk #1 are repeated at the start of chunk #2.
            This prevents a key piece of information from being split <em>exactly</em> at a boundary and becoming un-findable.
            Typical overlap is <strong style={{ color: '#E2E8F0' }}>10–20% of chunk size</strong>.
            Too much overlap wastes tokens and storage; too little risks losing context at boundaries.
          </p>
        </div>
      </div>
    </div>
  );
}
