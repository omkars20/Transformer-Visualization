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

const LEARN_TABS = [
  { id: 'pipeline', label: 'PDF → Vector Pipeline', icon: '📄', color: '#6366F1' },
  { id: 'metadata', label: 'Metadata Deep Dive',    icon: '🏷️', color: '#F59E0B' },
  { id: 'sparse',   label: 'Sparse Internals',      icon: '📝', color: '#10B981' },
  { id: 'combo',    label: 'Retriever + Reranker',  icon: '🔄', color: '#EF4444' },
];

export default function RagStep6_Retrieval() {
  const [activeQuery, setActiveQuery] = useState(0);
  const [topK, setTopK]               = useState(3);
  const [threshold, setThreshold]     = useState(0.75);
  const [activeType, setActiveType]   = useState(0);
  const [learnTab, setLearnTab]        = useState(0);

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

      {/* ── Basic → Advanced Learning Section ── */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Learn — Basic to Advanced
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '0' }}>
          {LEARN_TABS.map((t, i) => (
            <button key={t.id} onClick={() => setLearnTab(i)} style={{
              padding: '8px 14px', borderRadius: '8px 8px 0 0', cursor: 'pointer',
              fontFamily: 'Space Mono, monospace', fontSize: '11px',
              border: `1px solid ${learnTab === i ? t.color : '#1E2A45'}`,
              borderBottom: learnTab === i ? `1px solid #0E1220` : `1px solid #1E2A45`,
              background: learnTab === i ? '#0E1220' : 'transparent',
              color: learnTab === i ? t.color : '#64748B',
              position: 'relative', zIndex: learnTab === i ? 1 : 0,
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {/* Tab panel */}
        <div style={{
          background: '#0E1220', border: `1px solid ${LEARN_TABS[learnTab].color}44`,
          borderRadius: '0 8px 8px 8px', padding: '24px',
          position: 'relative', zIndex: 0,
        }}>

          {/* ── Tab 0: PDF → Vector Pipeline ── */}
          {learnTab === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ color: '#6366F1', fontWeight: '700', fontSize: '15px', marginBottom: '8px' }}>
                  📄 How does a PDF become a searchable vector?
                </div>
                <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.8', margin: '0 0 16px' }}>
                  You <strong style={{ color: '#EF4444' }}>cannot</strong> embed a PDF directly. The pipeline always goes:
                  <strong style={{ color: '#E2E8F0' }}> PDF → text → chunks → embeddings → vector DB</strong>.
                </p>

                {/* Visual flow */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                  {[
                    { label: 'PDF (100 pages)', icon: '📄', color: '#6366F1' },
                    { label: 'Text Extraction', icon: '🔤', color: '#8B5CF6' },
                    { label: 'Chunking\n(~300–800 tokens)', icon: '✂️', color: '#F59E0B' },
                    { label: 'Embedding Model\n(OpenAI / BAAI)', icon: '🧠', color: '#10B981' },
                    { label: 'Vector DB\n(FAISS / Chroma)', icon: '🗄️', color: '#EC4899' },
                  ].map((step, i, arr) => (
                    <React.Fragment key={step.label}>
                      <div style={{
                        background: '#131728', border: `1px solid ${step.color}44`,
                        borderRadius: '8px', padding: '10px 14px', textAlign: 'center', minWidth: '100px',
                      }}>
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>{step.icon}</div>
                        <div style={{ color: step.color, fontSize: '11px', fontWeight: '700', whiteSpace: 'pre-line', lineHeight: '1.4' }}>{step.label}</div>
                      </div>
                      {i < arr.length - 1 && <div style={{ color: '#2E3A55', fontSize: '18px', flexShrink: 0 }}>→</div>}
                    </React.Fragment>
                  ))}
                </div>

                {/* Chunking details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#131728', border: '1px solid #F59E0B33', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ color: '#F59E0B', fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>✂️ Why Chunking?</div>
                    <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.8' }}>
                      • LLM has a context window limit — it cannot read 100 pages at once<br />
                      • Retrieval must be <strong style={{ color: '#E2E8F0' }}>granular</strong> — a chunk about "attention" should not be mixed with a chunk about "optimizer"<br />
                      • 100 pages ≈ 300–500 chunks (depending on chunk size)
                    </div>
                  </div>
                  <div style={{ background: '#131728', border: '1px solid #6366F133', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ color: '#6366F1', fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>⚙️ Best Practices</div>
                    <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.8' }}>
                      • Chunk size: <strong style={{ color: '#E2E8F0' }}>300–800 tokens</strong> (experiment per domain)<br />
                      • Overlap: <strong style={{ color: '#E2E8F0' }}>50–100 tokens</strong> (prevents context loss at boundaries)<br />
                      • Query time: <strong style={{ color: '#E2E8F0' }}>all chunks searched</strong> using fast ANN (not brute force)
                    </div>
                  </div>
                </div>
              </div>

              {/* What is stored */}
              <div>
                <div style={{ color: '#10B981', fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>
                  💾 What exactly is stored in the Vector DB?
                </div>
                <div style={{
                  background: '#131728', border: '1px solid #10B98133', borderRadius: '8px',
                  padding: '14px 16px', fontFamily: 'Space Mono, monospace', fontSize: '12px',
                  color: '#94A3B8', lineHeight: '1.8',
                }}>
                  <span style={{ color: '#6366F1' }}>{'{'}</span><br />
                  {'  '}<span style={{ color: '#F59E0B' }}>"id"</span>: <span style={{ color: '#10B981' }}>"chunk_45"</span>,<br />
                  {'  '}<span style={{ color: '#F59E0B' }}>"text"</span>: <span style={{ color: '#10B981' }}>"Transformer uses attention mechanism..."</span>,<br />
                  {'  '}<span style={{ color: '#F59E0B' }}>"embedding"</span>: <span style={{ color: '#94A3B8' }}>[0.234, -0.876, 0.112, ...]</span>,{'  '}
                  <span style={{ color: '#EC4899', fontSize: '10px' }}>← for search</span><br />
                  {'  '}<span style={{ color: '#F59E0B' }}>"metadata"</span>: {'{'} <span style={{ color: '#94A3B8' }}>source, page, chunk_id, ...</span> {'}'}<br />
                  <span style={{ color: '#6366F1' }}>{'}'}</span>
                </div>
                <div style={{ marginTop: '8px', padding: '10px 14px', background: '#6366F111', border: '1px solid #6366F133', borderRadius: '8px', color: '#6366F1', fontSize: '12px', fontFamily: 'Space Mono, monospace' }}>
                  YES — text + embedding + metadata are ALL stored together. Vector for search. Text for LLM. Metadata for filtering.
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 1: Metadata Deep Dive ── */}
          {learnTab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ color: '#F59E0B', fontWeight: '700', fontSize: '15px', marginBottom: '8px' }}>
                  🏷️ Metadata — the identity card of every chunk
                </div>
                <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.8', margin: '0 0 16px' }}>
                  Metadata is <strong style={{ color: '#E2E8F0' }}>not embedded as a vector</strong>. It is attached alongside the chunk for
                  filtering, source display, and debugging. The <strong style={{ color: '#E2E8F0' }}>text chunk</strong> is what gets embedded.
                </p>

                {/* Full metadata example */}
                <div style={{ background: '#131728', border: '1px solid #F59E0B33', borderRadius: '8px', padding: '14px 16px', fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#94A3B8', lineHeight: '1.8', marginBottom: '16px' }}>
                  <span style={{ color: '#6366F1' }}>{'{'}</span><br />
                  {'  '}<span style={{ color: '#F59E0B' }}>"text"</span>: <span style={{ color: '#10B981' }}>"Transformer uses attention mechanism..."</span>,<br />
                  {'  '}<span style={{ color: '#F59E0B' }}>"embedding"</span>: <span style={{ color: '#64748B' }}>[0.234, 0.876, ...]</span>,<br />
                  {'  '}<span style={{ color: '#F59E0B' }}>"metadata"</span>: <span style={{ color: '#6366F1' }}>{'{'}</span><br />
                  {'    '}<span style={{ color: '#EC4899' }}>"source"</span>: <span style={{ color: '#10B981' }}>"attention.pdf"</span>,{'   '}
                  <span style={{ color: '#64748B', fontSize: '10px' }}>← MUST have</span><br />
                  {'    '}<span style={{ color: '#EC4899' }}>"page"</span>: <span style={{ color: '#F59E0B' }}>12</span>,{'             '}
                  <span style={{ color: '#64748B', fontSize: '10px' }}>← MUST have</span><br />
                  {'    '}<span style={{ color: '#EC4899' }}>"chunk_id"</span>: <span style={{ color: '#10B981' }}>"12_3"</span>,{'         '}
                  <span style={{ color: '#64748B', fontSize: '10px' }}>← MUST have</span><br />
                  {'    '}<span style={{ color: '#94A3B8' }}>"section"</span>: <span style={{ color: '#10B981' }}>"Introduction"</span>,<br />
                  {'    '}<span style={{ color: '#94A3B8' }}>"doc_type"</span>: <span style={{ color: '#10B981' }}>"research_paper"</span>,<br />
                  {'    '}<span style={{ color: '#94A3B8' }}>"timestamp"</span>: <span style={{ color: '#10B981' }}>"2026-04-15"</span><br />
                  {'  '}<span style={{ color: '#6366F1' }}>{'}'}</span><br />
                  <span style={{ color: '#6366F1' }}>{'}'}</span>
                </div>

                {/* How metadata is used */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { icon: '🔍', title: 'Filtering', color: '#6366F1', desc: 'Query only page 10–20, or only a specific PDF. Narrows search before ANN runs.' },
                    { icon: '🖥️', title: 'Source Display', color: '#10B981', desc: '"Answer from Page 12 of attention.pdf" — users trust answers with citations.' },
                    { icon: '🐛', title: 'Debugging', color: '#F59E0B', desc: 'See exactly which chunk was retrieved when a wrong answer appears.' },
                  ].map(item => (
                    <div key={item.title} style={{ background: '#131728', border: `1px solid ${item.color}33`, borderRadius: '8px', padding: '14px' }}>
                      <div style={{ fontSize: '20px', marginBottom: '6px' }}>{item.icon}</div>
                      <div style={{ color: item.color, fontWeight: '700', fontSize: '12px', marginBottom: '6px' }}>{item.title}</div>
                      <div style={{ color: '#64748B', fontSize: '11px', lineHeight: '1.6' }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced: embed metadata in text */}
              <div style={{ background: '#0A1628', border: '1px solid #F59E0B44', borderRadius: '10px', padding: '16px' }}>
                <div style={{ color: '#F59E0B', fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>
                  ⚡ Advanced: Inject metadata into the text before embedding
                </div>
                <p style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.7', margin: '0 0 10px' }}>
                  Sometimes important metadata (section heading, title) is prepended to the chunk text before creating the embedding.
                  This improves retrieval because the model has context.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ color: '#EF4444', fontSize: '10px', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>❌ WITHOUT injection</div>
                    <div style={{ background: '#131728', border: '1px solid #EF444433', borderRadius: '6px', padding: '10px', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#64748B' }}>
                      "Transformer uses attention mechanism"
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#10B981', fontSize: '10px', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>✅ WITH injection</div>
                    <div style={{ background: '#131728', border: '1px solid #10B98133', borderRadius: '6px', padding: '10px', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#E2E8F0' }}>
                      "Page 12 | attention.pdf | Introduction | Transformer uses attention mechanism"
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', color: '#64748B', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>
                  Rule: inject section/title/headings. Do NOT inject IDs, timestamps, or random numbers.
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 2: Sparse Internals ── */}
          {learnTab === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ color: '#10B981', fontWeight: '700', fontSize: '15px', marginBottom: '8px' }}>
                  📝 How Sparse Search Actually Works Inside
                </div>
                <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.8', margin: '0 0 16px' }}>
                  Sparse search does <strong style={{ color: '#EF4444' }}>NOT use embeddings</strong>. It builds an
                  <strong style={{ color: '#10B981' }}> Inverted Index</strong> — a map of every word to the documents that contain it,
                  with scoring metadata. Tools like Elasticsearch / BM25 use this structure.
                </p>

                {/* Inverted index visual */}
                <div style={{ background: '#131728', border: '1px solid #10B98133', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ color: '#10B981', fontSize: '12px', fontWeight: '700', fontFamily: 'Space Mono, monospace', marginBottom: '12px' }}>
                    INVERTED INDEX (built at index time)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <div style={{ color: '#64748B', fontSize: '10px', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>DOCUMENTS</div>
                      {[
                        'Doc1: "Transformer uses attention mechanism"',
                        'Doc2: "Neural networks are powerful"',
                        'Doc3: "Attention is all you need paper"',
                      ].map((d, i) => (
                        <div key={i} style={{ color: '#94A3B8', fontSize: '11px', fontFamily: 'Space Mono, monospace', lineHeight: '1.8' }}>{d}</div>
                      ))}
                    </div>
                    <div>
                      <div style={{ color: '#64748B', fontSize: '10px', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>INDEX</div>
                      {[
                        ['"attention"', '→ [Doc1, Doc3]'],
                        ['"transformer"', '→ [Doc1]'],
                        ['"neural"', '→ [Doc2]'],
                        ['"paper"', '→ [Doc3]'],
                      ].map(([word, docs]) => (
                        <div key={word} style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', lineHeight: '1.8' }}>
                          <span style={{ color: '#F59E0B' }}>{word}</span>
                          <span style={{ color: '#64748B' }}> {docs}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Query matching step by step */}
                <div style={{ background: '#131728', border: '1px solid #10B98133', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ color: '#10B981', fontSize: '12px', fontWeight: '700', fontFamily: 'Space Mono, monospace', marginBottom: '12px' }}>
                    QUERY: "attention paper" — step by step
                  </div>
                  {[
                    { step: '1', label: 'Tokenize query', code: '["attention", "paper"]', color: '#6366F1' },
                    { step: '2', label: 'Lookup each token', code: '"attention" → [Doc1, Doc3]    "paper" → [Doc3]', color: '#F59E0B' },
                    { step: '3', label: 'BM25 scoring', code: 'Doc3 → high (both words)\nDoc1 → medium (one word)\nDoc2 → 0 (no match)', color: '#10B981' },
                    { step: '4', label: 'Return top-K', code: '[Doc3, Doc1]', color: '#EC4899' },
                  ].map(item => (
                    <div key={item.step} style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'flex-start' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `${item.color}22`, border: `1px solid ${item.color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'Space Mono, monospace', fontSize: '10px', color: item.color, fontWeight: '700' }}>{item.step}</div>
                      <div>
                        <div style={{ color: item.color, fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>{item.label}</div>
                        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#94A3B8', whiteSpace: 'pre-line', lineHeight: '1.6' }}>{item.code}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dense vs Sparse infra comparison */}
                <div style={{ background: '#0A1628', border: '1px solid #1E2A45', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ color: '#E2E8F0', fontSize: '12px', fontWeight: '700', marginBottom: '10px' }}>Infrastructure: Dense vs Sparse</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', fontFamily: 'Space Mono, monospace' }}>
                    {['Feature', 'Dense (FAISS/Chroma)', 'Sparse (Elasticsearch)', 'Hybrid'].map(h => (
                      <div key={h} style={{ fontSize: '10px', color: '#64748B', borderBottom: '1px solid #1E2A45', paddingBottom: '6px' }}>{h}</div>
                    ))}
                    {[
                      ['Index type', 'Vector index', 'Inverted index', 'Both'],
                      ['Matching', 'Cosine similarity', 'Keyword + BM25', 'Score fusion'],
                      ['Structure', 'HNSW / IVF', 'Posting lists', 'Parallel'],
                      ['Query vector?', '✅ Embedding', '❌ Tokens only', '✅ + ❌'],
                    ].map(row => row.map((cell, i) => (
                      <div key={`${row[0]}-${i}`} style={{ fontSize: '11px', color: i === 0 ? '#475569' : '#94A3B8', lineHeight: '1.6', paddingBottom: '4px' }}>{cell}</div>
                    )))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 3: Retriever + Reranker Combo ── */}
          {learnTab === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ color: '#EF4444', fontWeight: '700', fontSize: '15px', marginBottom: '8px' }}>
                  🔄 Why You Need Both — Retriever AND Reranker
                </div>
                <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.8', margin: '0 0 16px' }}>
                  Using only a retriever leaves noise. Using only a reranker on the entire DB is too slow.
                  The standard production pattern: <strong style={{ color: '#E2E8F0' }}>Retriever (Top 10–20) → Reranker (Top 3–5) → LLM.</strong>
                </p>

                {/* Full flow */}
                <div style={{ background: '#131728', border: '1px solid #EF444433', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'User Query', color: '#94A3B8', detail: '"LLM me attention kaise kaam karta hai?"' },
                      { label: 'Retriever (Top K = 10)', color: '#6366F1', detail: 'Fast ANN search — semantic similarity — broad candidate set', badge: '⚡ Fast but rough' },
                      { label: 'Re-ranker (Top K = 3)', color: '#EF4444', detail: 'Cross-encoder scores query + chunk together — deep understanding', badge: '🎯 Slow but accurate' },
                      { label: 'LLM', color: '#F59E0B', detail: 'Receives clean, high-quality context — generates precise answer' },
                    ].map((item, i, arr) => (
                      <React.Fragment key={item.label}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ width: '3px', alignSelf: 'stretch', background: `${item.color}44`, borderRadius: '2px', flexShrink: 0, minHeight: '44px' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ color: item.color, fontWeight: '700', fontSize: '12px' }}>{item.label}</span>
                              {item.badge && (
                                <span style={{ background: `${item.color}22`, color: item.color, fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontFamily: 'Space Mono, monospace' }}>{item.badge}</span>
                              )}
                            </div>
                            <div style={{ color: '#64748B', fontSize: '11px', lineHeight: '1.6' }}>{item.detail}</div>
                          </div>
                        </div>
                        {i < arr.length - 1 && <div style={{ color: '#2E3A55', fontSize: '14px', paddingLeft: '7px' }}>↓</div>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Concrete example */}
                <div style={{ background: '#131728', border: '1px solid #6366F133', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ color: '#6366F1', fontSize: '12px', fontWeight: '700', fontFamily: 'Space Mono, monospace', marginBottom: '10px' }}>EXAMPLE — same query, two passes</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ color: '#6366F1', fontSize: '10px', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>RETRIEVER OUTPUT (rough order)</div>
                      {['Chunk A – attention basic', 'Chunk B – transformer intro', 'Chunk C – multi-head attention', 'Chunk D – unrelated but similar words', 'Chunk E – partial match'].map((c, i) => (
                        <div key={i} style={{ color: '#94A3B8', fontSize: '11px', fontFamily: 'Space Mono, monospace', lineHeight: '1.8' }}>
                          {i + 1}. {c}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ color: '#EF4444', fontSize: '10px', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>RE-RANKER OUTPUT (precision order)</div>
                      {[
                        ['Chunk C', '#10B981', '↑ was 3rd, now 1st'],
                        ['Chunk A', '#10B981', '↑ stays near top'],
                        ['Chunk E', '#F59E0B', '↑ was 5th, promoted'],
                      ].map(([chunk, color, note]) => (
                        <div key={chunk} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ color: '#E2E8F0', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>{chunk}</span>
                          <span style={{ color, fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>{note}</span>
                        </div>
                      ))}
                      <div style={{ color: '#EF4444', fontSize: '10px', fontFamily: 'Space Mono, monospace', marginTop: '6px' }}>Chunks B, D dropped ✂️</div>
                    </div>
                  </div>
                </div>

                {/* Comparison table */}
                <div style={{ background: '#0A1628', border: '1px solid #1E2A45', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', fontFamily: 'Space Mono, monospace' }}>
                    {['Feature', 'Retriever', 'Re-ranker'].map(h => (
                      <div key={h} style={{ fontSize: '10px', color: '#64748B', borderBottom: '1px solid #1E2A45', paddingBottom: '6px' }}>{h}</div>
                    ))}
                    {[
                      ['Speed', '⚡ Fast', '🐢 Slower'],
                      ['Accuracy', '⭐⭐⭐ Medium', '⭐⭐⭐⭐⭐ High'],
                      ['Scope', 'Entire DB', 'Retrieved chunks only'],
                      ['Input', 'Query alone', 'Query + each chunk'],
                      ['Output', 'Top K candidates', 'Re-ordered / filtered'],
                      ['Tech', 'ANN / BM25', 'Cross-encoder'],
                    ].map(row => row.map((cell, i) => (
                      <div key={`${row[0]}-${i}`} style={{ fontSize: '11px', color: i === 0 ? '#475569' : '#94A3B8', lineHeight: '1.7', paddingBottom: '2px' }}>{cell}</div>
                    )))}
                  </div>
                  <div style={{ marginTop: '12px', padding: '8px 12px', background: '#EF444411', border: '1px solid #EF444433', borderRadius: '6px', color: '#EF4444', fontSize: '12px', fontWeight: '700', fontFamily: 'Space Mono, monospace' }}>
                    One-line: Retriever finds candidates. Re-ranker finds winners.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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

      {/* Better understanding */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Better understanding — dense vs sparse vs hybrid
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {[
            {
              title: 'Dense Search',
              color: '#6366F1',
              icon: '🔢',
              flow: 'Query → embedding → vector DB → top-K chunks',
              note: 'Uses a query embedding. Matches meaning, not just exact words.',
              stack: 'FAISS, Chroma, Pinecone, Weaviate, Qdrant',
            },
            {
              title: 'Sparse Search',
              color: '#F59E0B',
              icon: '📝',
              flow: 'Query → tokenize → inverted index / BM25 → top-K chunks',
              note: 'Does not use a dense embedding. Matches keywords, counts, and rarity of words.',
              stack: 'BM25, TF-IDF, Elasticsearch, OpenSearch',
            },
            {
              title: 'Hybrid Search',
              color: '#10B981',
              icon: '🔀',
              flow: 'Query → dense search + sparse search → merge scores → top-K chunks',
              note: 'Combines semantic understanding with exact keyword matching.',
              stack: 'Dense index + keyword index together',
            },
          ].map((item) => (
            <div key={item.title} style={{
              background: '#0E1220',
              border: `1px solid ${item.color}44`,
              borderRadius: '12px',
              padding: '18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '22px' }}>{item.icon}</span>
                <div style={{ color: item.color, fontWeight: '700', fontSize: '14px' }}>{item.title}</div>
              </div>
              <div style={{
                fontFamily: 'Space Mono, monospace', fontSize: '11px', lineHeight: '1.7',
                color: '#E2E8F0', background: '#131728', border: '1px solid #1E2A45',
                borderRadius: '8px', padding: '10px 12px', marginBottom: '10px',
              }}>
                {item.flow}
              </div>
              <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.7', marginBottom: '10px' }}>{item.note}</div>
              <div style={{ color: '#64748B', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>{item.stack}</div>
            </div>
          ))}
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
          <p style={{ color: '#64748B', fontSize: '11px', lineHeight: '1.7', margin: '8px 0 0', fontFamily: 'Space Mono, monospace' }}>
            Quick rule: vector DB only = dense, BM25 only = sparse, both together = hybrid.
          </p>
        </div>
      </div>
    </div>
  );
}
