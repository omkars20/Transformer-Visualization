import React, { useState } from 'react';

const VECTOR_DBS = [
  {
    name: 'FAISS',
    by: 'Meta (Facebook)',
    type: 'Library',
    color: '#6366F1',
    icon: '⚡',
    hosted: false,
    open: true,
    dims: 'Any',
    scale: 'Millions',
    best: 'Local dev, research, small-medium apps',
    notes: 'No server needed. Runs in-memory or on disk. Very fast. No filtering. No persistence by default.',
    indexTypes: ['Flat (exact)', 'IVF (approximate)', 'HNSW'],
  },
  {
    name: 'Chroma',
    by: 'Chroma',
    type: 'Embedded DB',
    color: '#10B981',
    icon: '🟢',
    hosted: false,
    open: true,
    dims: 'Any',
    scale: 'Millions',
    best: 'Local dev, prototyping with metadata filtering',
    notes: 'Python-first. Supports metadata filters. Can run in-process or as server. Easiest to start with.',
    indexTypes: ['HNSW'],
  },
  {
    name: 'Pinecone',
    by: 'Pinecone',
    type: 'Managed Cloud',
    color: '#06B6D4',
    icon: '☁️',
    hosted: true,
    open: false,
    dims: 'Up to 20K',
    scale: 'Billions',
    best: 'Production, no-ops, enterprise',
    notes: 'Fully managed. Handles scaling automatically. Paid. Great for large-scale production.',
    indexTypes: ['HNSW', 'Proprietary'],
  },
  {
    name: 'Weaviate',
    by: 'Weaviate',
    type: 'Vector DB',
    color: '#8B5CF6',
    icon: '🔷',
    hosted: true,
    open: true,
    dims: 'Any',
    scale: 'Billions',
    best: 'Production with hybrid search + filtering',
    notes: 'Supports BM25 + vector hybrid search. Schema-based. Self-host or cloud.',
    indexTypes: ['HNSW'],
  },
  {
    name: 'Qdrant',
    by: 'Qdrant',
    type: 'Vector DB',
    color: '#EC4899',
    icon: '🔴',
    hosted: true,
    open: true,
    dims: 'Any',
    scale: 'Billions',
    best: 'High performance, filtering, payloads',
    notes: 'Rust-based, very fast. Rich payload filtering. Self-host or cloud. Growing fast.',
    indexTypes: ['HNSW'],
  },
  {
    name: 'Milvus',
    by: 'Zilliz',
    type: 'Vector DB',
    color: '#F59E0B',
    icon: '🟡',
    hosted: true,
    open: true,
    dims: 'Any',
    scale: 'Billions+',
    best: 'Enterprise scale, Kubernetes',
    notes: 'Most mature open-source vector DB. Multiple index types. Kubernetes-native.',
    indexTypes: ['IVF_FLAT', 'HNSW', 'DISKANN', 'IVF_PQ'],
  },
  {
    name: 'pgvector',
    by: 'PostgreSQL ext.',
    type: 'SQL Extension',
    color: '#F97316',
    icon: '🐘',
    hosted: false,
    open: true,
    dims: 'Up to 2000',
    scale: 'Millions',
    best: 'Already using PostgreSQL',
    notes: 'Add vectors to existing Postgres DB. Use SQL for filtering. No new infrastructure.',
    indexTypes: ['HNSW', 'IVFFlat'],
  },
  {
    name: 'Redis',
    by: 'Redis',
    type: 'In-Memory DB',
    color: '#EF4444',
    icon: '🔴',
    hosted: true,
    open: true,
    dims: 'Any',
    scale: 'Millions',
    best: 'Low-latency, caching, real-time',
    notes: 'Extends Redis with vector search. Very fast. Data in RAM. Good for real-time apps.',
    indexTypes: ['HNSW', 'FLAT'],
  },
];

const INDEX_TYPES = [
  {
    name: 'Flat (Brute Force)',
    color: '#10B981',
    complexity: 'O(n)',
    accuracy: '100%',
    speed: 'Slow at scale',
    desc: 'Compare query vector to every stored vector. Perfect accuracy. Only feasible for <100K vectors.',
    use: 'Small datasets, accuracy-critical',
  },
  {
    name: 'IVF (Inverted File)',
    color: '#6366F1',
    complexity: 'O(√n)',
    accuracy: '95-99%',
    speed: 'Fast',
    desc: 'Cluster vectors into buckets. Only search the nearest buckets. Trade-off: misses some matches.',
    use: 'Large datasets (1M+), balanced',
  },
  {
    name: 'HNSW (Hierarchical Navigable Small World)',
    color: '#8B5CF6',
    complexity: 'O(log n)',
    accuracy: '95-99%',
    speed: 'Very fast',
    desc: 'Graph-based index. Navigate a multi-layer graph to find nearest neighbors. Industry standard.',
    use: 'Most production use cases',
  },
  {
    name: 'PQ (Product Quantization)',
    color: '#F59E0B',
    complexity: 'O(n/m)',
    accuracy: '90-95%',
    speed: 'Very fast',
    desc: 'Compress vectors to save RAM. Each vector is stored as short codes. Less accurate but uses 8-32x less memory.',
    use: 'Billions of vectors, memory-limited',
  },
];

export default function RagStep5_VectorStore() {
  const [selectedDb, setSelectedDb] = useState(0);
  const [activeTab, setActiveTab] = useState('dbs'); // dbs | index | ops

  const db = VECTOR_DBS[selectedDb];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Concept */}
      <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ color: '#8B5CF6', fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>
          🗄️ Vector Store — Your AI's Long-Term Memory
        </h3>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: '0 0 12px' }}>
          After embedding your chunks into vectors, you need to <strong style={{ color: '#8B5CF6' }}>store them</strong> so you can
          search them at query time. A regular database stores and retrieves by exact key — a
          <strong style={{ color: '#E2E8F0' }}> vector database</strong> stores vectors and retrieves by similarity (nearest neighbors).
        </p>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: 0 }}>
          The database also stores the original chunk text and metadata alongside the vector,
          so when retrieval finds a vector, you can return the actual text to the LLM.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #1E2A45', paddingBottom: '0' }}>
        {[
          { id: 'dbs', label: '🗄️ Vector Databases' },
          { id: 'index', label: '📊 Index Types' },
          { id: 'ops', label: '⚙️ Insert & Query' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: 'Space Mono, monospace', fontSize: '11px',
            color: activeTab === t.id ? '#8B5CF6' : '#64748B',
            borderBottom: activeTab === t.id ? '2px solid #8B5CF6' : '2px solid transparent',
            transition: 'all 0.15s ease',
          }}>{t.label}</button>
        ))}
      </div>

      {/* DB Explorer */}
      {activeTab === 'dbs' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {VECTOR_DBS.map((d, i) => (
              <button
                key={d.name}
                onClick={() => setSelectedDb(i)}
                style={{
                  padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                  fontFamily: 'Space Mono, monospace', fontSize: '11px',
                  border: `1px solid ${selectedDb === i ? d.color : '#1E2A45'}`,
                  background: selectedDb === i ? `${d.color}22` : 'transparent',
                  color: selectedDb === i ? d.color : '#64748B',
                }}
              >{d.icon} {d.name}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: '#0E1220', border: `1px solid ${db.color}44`, borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '28px' }}>{db.icon}</span>
                <div>
                  <div style={{ color: db.color, fontWeight: '700', fontSize: '16px' }}>{db.name}</div>
                  <div style={{ color: '#64748B', fontSize: '12px', fontFamily: 'Space Mono, monospace' }}>{db.by} · {db.type}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <Tag color={db.open ? '#10B981' : '#EF4444'}>{db.open ? '✅ Open Source' : '🔒 Closed'}</Tag>
                <Tag color={db.hosted ? '#06B6D4' : '#F59E0B'}>{db.hosted ? '☁️ Cloud Hosted' : '💻 Self-Hosted'}</Tag>
                <Tag color="#8B5CF6">📐 {db.dims} dims</Tag>
                <Tag color="#6366F1">📈 {db.scale}</Tag>
              </div>
              <div style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.7', marginBottom: '12px' }}>{db.notes}</div>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>Index types: {db.indexTypes.join(', ')}</div>
            </div>

            <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '12px' }}>BEST FOR</div>
              <div style={{ background: `${db.color}11`, border: `1px solid ${db.color}33`, borderRadius: '8px', padding: '14px', color: db.color, fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                {db.best}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '10px' }}>QUICK START (Python)</div>
              <pre style={{
                background: '#131728', border: '1px solid #1E2A45', borderRadius: '8px',
                padding: '12px', margin: 0, fontSize: '11px', lineHeight: '1.7',
                fontFamily: 'Space Mono, monospace', overflowX: 'auto',
              }}>
                <span style={{ color: '#6366F1' }}>from</span>
                <span style={{ color: '#E2E8F0' }}> langchain.vectorstores </span>
                <span style={{ color: '#6366F1' }}>import</span>
                <span style={{ color: '#F59E0B' }}> {db.name}{'\n'}</span>
                <span style={{ color: '#E2E8F0' }}>db </span>
                <span style={{ color: '#94A3B8' }}>= </span>
                <span style={{ color: '#F59E0B' }}>{db.name}</span>
                <span style={{ color: '#94A3B8' }}>.from_documents({'\n'}  docs, embeddings{'\n'})</span>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Index Types */}
      {activeTab === 'index' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
            A vector index is a data structure that lets you find the <strong style={{ color: '#8B5CF6' }}>nearest neighbors</strong> of a query vector
            quickly — without comparing to every single stored vector (brute force). Each index type trades accuracy for speed.
          </p>
          {INDEX_TYPES.map(idx => (
            <div key={idx.name} style={{
              background: '#0E1220', border: `1px solid ${idx.color}44`,
              borderRadius: '12px', padding: '18px',
              display: 'grid', gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 1.5fr',
              gap: '12px', alignItems: 'center',
            }}>
              <div>
                <div style={{ color: idx.color, fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>{idx.name}</div>
                <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.5' }}>{idx.desc}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>COMPLEXITY</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#E2E8F0' }}>{idx.complexity}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>ACCURACY</div>
                <div style={{ fontSize: '12px', color: idx.color, fontWeight: '700' }}>{idx.accuracy}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>SPEED</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>{idx.speed}</div>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>Use: {idx.use}</div>
            </div>
          ))}
          <div style={{ background: '#0A1628', border: '1px solid #8B5CF644', borderRadius: '10px', padding: '14px 18px', fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#8B5CF6' }}>
            💡 HNSW is the default choice for 99% of RAG applications. It's fast, accurate, and well-supported everywhere.
          </div>
        </div>
      )}

      {/* Insert & Query ops */}
      {activeTab === 'ops' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            {
              phase: 'INDEX TIME (offline)',
              color: '#10B981',
              steps: [
                { n: 1, label: 'Load chunks', code: 'chunks = ["AI is...", "RAG combines..."]' },
                { n: 2, label: 'Embed all chunks', code: 'vectors = model.embed(chunks)  # shape [N, 1536]' },
                { n: 3, label: 'Insert into store', code: 'db.upsert(ids, vectors, metadata)' },
              ],
            },
            {
              phase: 'QUERY TIME (online)',
              color: '#6366F1',
              steps: [
                { n: 1, label: 'Embed query', code: 'q_vec = model.embed("What is RAG?")' },
                { n: 2, label: 'ANN search', code: 'results = db.query(q_vec, top_k=5)' },
                { n: 3, label: 'Return text chunks', code: '# results.texts, results.scores, results.metadata' },
              ],
            },
          ].map(phase => (
            <div key={phase.phase} style={{ background: '#0E1220', border: `1px solid ${phase.color}44`, borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', letterSpacing: '2px', color: phase.color, textTransform: 'uppercase', marginBottom: '14px' }}>
                {phase.phase}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {phase.steps.map(s => (
                  <div key={s.n} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                      background: `${phase.color}22`, border: `1px solid ${phase.color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Space Mono, monospace', fontSize: '11px', color: phase.color,
                    }}>{s.n}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '4px' }}>{s.label}</div>
                      <code style={{
                        display: 'block', background: '#131728', border: '1px solid #1E2A45',
                        borderRadius: '6px', padding: '8px 12px', fontFamily: 'Space Mono, monospace',
                        fontSize: '11px', color: '#10B981',
                      }}>{s.code}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Tag({ color, children }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
      fontFamily: 'Space Mono, monospace', fontWeight: '600',
      background: `${color}22`, border: `1px solid ${color}44`, color,
    }}>{children}</span>
  );
}
