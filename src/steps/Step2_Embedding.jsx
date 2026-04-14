import { useState } from 'react';
import { MatrixViz, ShapeTag, Formula, SectionLabel } from '../components/MatrixViz.jsx';
import { CFG } from '../utils/llmEngine.js';

const TOKEN_COLORS = [
  { bg: '#F59E0B22', border: '#F59E0B', text: '#F59E0B' },
  { bg: '#10B98122', border: '#10B981', text: '#10B981' },
  { bg: '#06B6D422', border: '#06B6D4', text: '#06B6D4' },
  { bg: '#6366F122', border: '#6366F1', text: '#6366F1' },
  { bg: '#EC489922', border: '#EC4899', text: '#EC4899' },
  { bg: '#F9731622', border: '#F97316', text: '#F97316' },
  { bg: '#8B5CF622', border: '#8B5CF6', text: '#8B5CF6' },
  { bg: '#EF444422', border: '#EF4444', text: '#EF4444' },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function Callout({ color = '#6366F1', icon, title, children }) {
  return (
    <div
      style={{
        background: `${color}0D`,
        border: `1px solid ${color}55`,
        borderLeft: `3px solid ${color}`,
        borderRadius: '8px',
        padding: '14px 16px',
      }}
    >
      {title && (
        <div
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color,
            fontFamily: 'Space Mono, monospace',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {icon && <span>{icon}</span>}
          {title}
        </div>
      )}
      <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.8' }}>{children}</div>
    </div>
  );
}

function TechDef({ term, children }) {
  return (
    <div
      style={{
        background: '#0B0D17',
        border: '1px solid #1E2A45',
        borderRadius: '8px',
        padding: '14px 16px',
        marginBottom: '10px',
      }}
    >
      <div
        style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '12px',
          fontWeight: '700',
          color: '#06B6D4',
          marginBottom: '6px',
        }}
      >
        {term}
      </div>
      <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7' }}>{children}</div>
    </div>
  );
}

// Mini bar chart for a single embedding vector
function VectorBar({ vector, maxVal = 1 }) {
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '48px' }}>
      {vector.map((v, i) => {
        const pct = Math.abs(v) / maxVal;
        const isPos = v >= 0;
        return (
          <div
            key={i}
            title={`d${i} = ${v.toFixed(3)}`}
            style={{
              flex: 1,
              minWidth: '10px',
              height: `${Math.max(pct * 100, 8)}%`,
              background: isPos
                ? `rgba(6,182,212,${0.4 + pct * 0.6})`
                : `rgba(239,68,68,${0.4 + pct * 0.6})`,
              borderRadius: '2px 2px 0 0',
              cursor: 'default',
              transition: 'height 0.3s ease',
            }}
          />
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Step2_Embedding({ result }) {
  if (!result) return null;
  const { tokens, X_emb, usedRows } = result;
  const seqLen = tokens.length;

  const [selectedIdx, setSelectedIdx] = useState(0);       // which token is highlighted
  const [hoveredDim, setHoveredDim] = useState(null);       // hovered dimension index
  const [activeTab, setActiveTab] = useState('lookup');      // 'lookup' | 'vectors' | 'intuition'

  const selectedTok = tokens[selectedIdx];
  const selectedRow = usedRows[selectedIdx];
  const selectedColor = TOKEN_COLORS[selectedIdx % TOKEN_COLORS.length];

  const colLabels = Array.from({ length: CFG.EMBED_DIM }, (_, i) => `d${i}`);
  const rowLabels = tokens.map((t) => t.word);

  const TABS = [
    { id: 'lookup', label: 'Matrix Lookup', icon: '📖' },
    { id: 'vectors', label: 'Token Vectors', icon: '🔢' },
    { id: 'intuition', label: 'Intuition', icon: '💡' },
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── HEADER ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span
            style={{
              background: '#10B98122',
              border: '1px solid #10B981',
              borderRadius: '8px',
              padding: '4px 12px',
              fontFamily: 'Space Mono, monospace',
              fontSize: '11px',
              color: '#10B981',
              fontWeight: '700',
            }}
          >
            STEP 2 of 8
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#E2E8F0', margin: 0 }}>
            Embedding Lookup
          </h2>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
          Each integer token ID is traded for a dense vector of real numbers — the model's learned "meaning" of that token.
        </p>
      </div>

      {/* ── CORE CONCEPT ── */}
      <div className="viz-card">
        <SectionLabel>The Core Idea — Token IDs → Dense Vectors</SectionLabel>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {/* Token ID box */}
          <div
            style={{
              flex: 1, minWidth: '160px',
              background: '#0B0D17',
              border: '1px solid #1E2A45',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '10px' }}>FROM STEP 1</div>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔢</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '18px', fontWeight: '700', color: '#F59E0B' }}>
              [2, 8, 14, …]
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>Integer token IDs</div>
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '70px' }}>
            <div style={{ fontSize: '10px', color: '#10B981', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>E[id]</div>
            <div style={{ fontSize: '28px', color: '#10B981' }}>→</div>
            <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginTop: '4px' }}>row lookup</div>
          </div>

          {/* Embedding vector box */}
          <div
            style={{
              flex: 1, minWidth: '160px',
              background: '#0B0D17',
              border: '1px solid #10B981',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#10B981', fontFamily: 'Space Mono, monospace', marginBottom: '10px' }}>OUTPUT X_EMB</div>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📐</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: '700', color: '#10B981' }}>
              [[0.32,−0.17,…],<br />
              [0.11, 0.44,…],<br />
              [−0.5, 0.28,…]]
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>
              Matrix of real numbers ({seqLen}×{CFG.EMBED_DIM})
            </div>
          </div>
        </div>

        <Callout color="#F59E0B" icon="💡" title="Simple Analogy">
          Think of the embedding matrix E as a{' '}
          <strong style={{ color: '#E2E8F0' }}>giant lookup table in a library</strong>.
          Each row is a "book" about one word. When you arrive with token ID 8 ("love"),
          you don't read every book — you walk straight to shelf 8 and pull out that book's
          summary: a list of {CFG.EMBED_DIM} numbers that capture its meaning.
          <br /><br />
          Unlike the ID itself (just a number), the embedding vector can encode{' '}
          <strong style={{ color: '#E2E8F0' }}>semantic relationships</strong>:
          words with similar meanings end up with similar vectors after training.
        </Callout>
      </div>

      {/* ── WHAT IS AN EMBEDDING? ── */}
      <div className="viz-card">
        <SectionLabel>What Exactly Is an Embedding?</SectionLabel>

        <TechDef term="Embedding Matrix E  (shape: vocab_size × embed_dim)">
          A learned parameter matrix where row i stores the dense vector representation of token i.
          Formally: <span style={{ color: '#10B981', fontFamily: 'Space Mono, monospace' }}>X_emb = E[token_ids]</span> — this is simple
          row-indexing, not multiplication. No computation happens here; it is purely a table lookup.
          E is initialized randomly and updated via gradient descent during training.
        </TechDef>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '12px' }}>
          {[
            {
              icon: '📚',
              title: 'What it stores…',
              items: [
                `${CFG.VOCAB_SIZE} rows (one per word in vocab)`,
                `${CFG.EMBED_DIM} columns (dimensions)`,
                'All values are learned floats',
                'Updated millions of times in training',
              ],
              color: '#06B6D4',
            },
            {
              icon: '⚡',
              title: 'Why row lookup, not multiply?',
              items: [
                'O(1) — instantly grab any row',
                'No matrix multiply needed',
                'Memory efficient for inference',
                'Same effect as one-hot × E',
              ],
              color: '#6366F1',
            },
            {
              icon: '🎓',
              title: 'After training…',
              items: [
                '"king" and "queen" → similar vectors',
                '"AI" and "ML" → similar vectors',
                '"dog" and "cat" → nearby in space',
                'Direction encodes grammar roles',
              ],
              color: '#10B981',
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                background: '#0B0D17',
                border: `1px solid ${card.color}44`,
                borderRadius: '8px',
                padding: '14px',
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{card.icon}</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: card.color, fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                {card.title}
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {card.items.map((item) => (
                  <li key={item} style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px', lineHeight: '1.5' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── INTERACTIVE TABS ── */}
      <div className="viz-card">
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: `1.5px solid ${activeTab === tab.id ? '#10B981' : '#1E2A45'}`,
                background: activeTab === tab.id ? '#10B98122' : 'transparent',
                color: activeTab === tab.id ? '#10B981' : '#64748B',
                fontFamily: 'Space Mono, monospace',
                fontSize: '11px',
                fontWeight: activeTab === tab.id ? '700' : '400',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: LOOKUP ── */}
        {activeTab === 'lookup' && (
          <div>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '16px', lineHeight: '1.6' }}>
              Click a token below to see exactly which row is pulled from the embedding matrix E.
            </p>

            {/* Token selector */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {tokens.map((tok, i) => {
                const col = TOKEN_COLORS[i % TOKEN_COLORS.length];
                const isActive = i === selectedIdx;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedIdx(i)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: `2px solid ${isActive ? col.border : '#1E2A45'}`,
                      background: isActive ? col.bg : '#0B0D17',
                      color: isActive ? col.text : '#64748B',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '12px',
                      fontWeight: isActive ? '700' : '400',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <span style={{ fontSize: '13px' }}>"{tok.word}"</span>
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>id={tok.id}</span>
                  </button>
                );
              })}
            </div>

            {/* Lookup animation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              {/* Embedding matrix E (simplified) */}
              <div style={{ flex: '0 0 auto' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                  E [{CFG.VOCAB_SIZE} × {CFG.EMBED_DIM}]
                </div>
                <div
                  style={{
                    background: '#0B0D17',
                    border: '1px solid #1E2A45',
                    borderRadius: '8px',
                    padding: '10px',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '10px',
                    minWidth: '230px',
                  }}
                >
                  <div style={{ color: '#2a3a55', marginBottom: '4px' }}>row 0:  [–, –, –, –, …]  &lt;PAD&gt;</div>
                  <div style={{ color: '#2a3a55', marginBottom: '6px' }}>row 1:  [–, –, –, –, …]  &lt;UNK&gt;</div>
                  {tokens.map((tok, i) => {
                    const col = TOKEN_COLORS[i % TOKEN_COLORS.length];
                    const isSelected = i === selectedIdx;
                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedIdx(i)}
                        style={{
                          color: isSelected ? col.text : '#3a4a65',
                          marginBottom: '4px',
                          background: isSelected ? col.bg : 'transparent',
                          border: isSelected ? `1px solid ${col.border}` : '1px solid transparent',
                          borderLeft: `3px solid ${isSelected ? col.border : 'transparent'}`,
                          paddingLeft: '8px',
                          borderRadius: '0 4px 4px 0',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          padding: '3px 8px',
                          fontWeight: isSelected ? '700' : '400',
                        }}
                      >
                        row {tok.id}: [{usedRows[i].vector.slice(0, 3).map((v) => v.toFixed(2)).join(', ')}, …] "{tok.word}"
                      </div>
                    );
                  })}
                  <div style={{ color: '#1a2535', marginTop: '6px' }}>…</div>
                  <div style={{ color: '#1a2535' }}>row {CFG.VOCAB_SIZE - 1}: [–, –, …]</div>
                </div>
              </div>

              {/* Arrow with label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', minWidth: '60px' }}>
                <div style={{ fontSize: '10px', color: selectedColor.text, fontFamily: 'Space Mono, monospace', textAlign: 'center' }}>
                  E[{selectedTok.id}]
                </div>
                <div style={{ fontSize: '32px', color: selectedColor.text }}>→</div>
                <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', textAlign: 'center' }}>
                  row {selectedTok.id}
                </div>
              </div>

              {/* Resulting vector */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                  X_emb[{selectedIdx}]  &nbsp;(the {selectedIdx === 0 ? '1st' : selectedIdx === 1 ? '2nd' : selectedIdx === 2 ? '3rd' : `${selectedIdx + 1}th`} row of output)
                </div>
                <div
                  style={{
                    background: '#0B0D17',
                    border: `1.5px solid ${selectedColor.border}`,
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: selectedColor.text,
                      marginBottom: '10px',
                    }}
                  >
                    "{selectedTok.word}"  (id={selectedTok.id})
                  </div>
                  {/* Vector cells */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {selectedRow.vector.map((val, j) => {
                      const intensity = Math.abs(val) / 0.9;
                      const isHov = hoveredDim === j;
                      return (
                        <div
                          key={j}
                          onMouseEnter={() => setHoveredDim(j)}
                          onMouseLeave={() => setHoveredDim(null)}
                          style={{
                            width: '44px',
                            height: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            background: val >= 0
                              ? `rgba(6,182,212,${0.25 + intensity * 0.55})`
                              : `rgba(239,68,68,${0.25 + intensity * 0.55})`,
                            border: isHov ? '1.5px solid #fff' : '1px solid transparent',
                            fontFamily: 'Space Mono, monospace',
                            fontSize: '9px',
                            fontWeight: '700',
                            color: '#fff',
                            cursor: 'default',
                            transition: 'all 0.1s ease',
                            transform: isHov ? 'scale(1.1)' : 'scale(1)',
                          }}
                        >
                          {val.toFixed(2)}
                        </div>
                      );
                    })}
                  </div>
                  {hoveredDim !== null && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        background: '#131728',
                        borderRadius: '6px',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '10px',
                        color: '#94A3B8',
                      }}
                    >
                      dimension d{hoveredDim} = {selectedRow.vector[hoveredDim].toFixed(4)}
                      &nbsp;({selectedRow.vector[hoveredDim] >= 0 ? 'positive' : 'negative'})
                    </div>
                  )}
                  <VectorBar vector={selectedRow.vector} color={selectedColor.text} />
                </div>
              </div>
            </div>

            {/* Full output matrix */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                Full X_emb matrix &nbsp;<ShapeTag shape={[seqLen, CFG.EMBED_DIM]} />
                &nbsp;— highlighted row = selected token
              </div>
              <MatrixViz
                matrix={X_emb}
                rowLabels={rowLabels}
                colLabels={colLabels}
                size="md"
                showColorBar={true}
              />
            </div>
          </div>
        )}

        {/* ── TAB: VECTORS ── */}
        {activeTab === 'vectors' && (
          <div>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '16px', lineHeight: '1.6' }}>
              Each token becomes a row of {CFG.EMBED_DIM} numbers. Hover any cell to see its exact value.
              Blue = positive, Red = negative. Brighter = larger magnitude.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {usedRows.map((row, i) => {
                const col = TOKEN_COLORS[i % TOKEN_COLORS.length];
                return (
                  <div
                    key={i}
                    style={{
                      background: '#0B0D17',
                      border: `1px solid ${selectedIdx === i ? col.border : '#1E2A45'}`,
                      borderRadius: '8px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease',
                    }}
                    onClick={() => { setSelectedIdx(i); setActiveTab('lookup'); }}
                  >
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <div
                        style={{
                          padding: '3px 10px',
                          background: col.bg,
                          border: `1px solid ${col.border}`,
                          borderRadius: '6px',
                          fontFamily: 'Space Mono, monospace',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: col.text,
                          flexShrink: 0,
                        }}
                      >
                        "{row.word}"
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>
                        id={row.id} → E[{row.id}]
                      </div>
                      <div style={{ flex: 1 }} />
                      <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>
                        click to inspect →
                      </div>
                    </div>

                    {/* Vector cells */}
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                      {row.vector.map((val, j) => {
                        const intensity = Math.abs(val) / 0.9;
                        return (
                          <div
                            key={j}
                            title={`d${j} = ${val.toFixed(4)}`}
                            style={{
                              width: '38px',
                              height: '26px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '3px',
                              background: val >= 0
                                ? `rgba(6,182,212,${0.2 + intensity * 0.6})`
                                : `rgba(239,68,68,${0.2 + intensity * 0.6})`,
                              fontFamily: 'Space Mono, monospace',
                              fontSize: '8px',
                              fontWeight: '700',
                              color: '#fff',
                            }}
                          >
                            {val.toFixed(2)}
                          </div>
                        );
                      })}
                    </div>

                    {/* Mini bar */}
                    <div style={{ marginTop: '8px' }}>
                      <VectorBar vector={row.vector} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                background: '#131728',
                borderRadius: '8px',
                fontFamily: 'Space Mono, monospace',
                fontSize: '11px',
                color: '#64748B',
              }}
            >
              Each row above = one row of X_emb &nbsp;|&nbsp; X_emb.shape = ({seqLen}, {CFG.EMBED_DIM}) &nbsp;|&nbsp; Operation cost: O(1) per token
            </div>
          </div>
        )}

        {/* ── TAB: INTUITION ── */}
        {activeTab === 'intuition' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Callout color="#6366F1" icon="🗺️" title="Geometric Intuition">
              Every embedding vector is a{' '}
              <strong style={{ color: '#E2E8F0' }}>point in {CFG.EMBED_DIM}-dimensional space</strong>.
              Training nudges words with related meanings closer together in that space.
              By the end of training, the direction from "man" → "woman" is roughly the same
              as from "king" → "queen" — a famous result called the <em>king − man + woman ≈ queen</em> analogy.
            </Callout>

            <Callout color="#10B981" icon="🧲" title="Why Not Just Use the Integer ID?">
              Token IDs are arbitrary — "love" = 8, "hate" = 9, but numerically they're adjacent, which means nothing.
              With embeddings, <strong style={{ color: '#E2E8F0' }}>the distance between vectors carries real meaning</strong>.
              "love" and "adore" end up nearby; "love" and "table" end up far apart.
              The network can exploit that geometry in all later layers.
            </Callout>

            <Callout color="#F59E0B" icon="📏" title="What Do the Dimensions Mean?">
              In a real trained model, individual dimensions are{' '}
              <strong style={{ color: '#E2E8F0' }}>not human-interpretable</strong> — they are abstract learned features.
              Research has found some dimensions loosely correlate with gender, tense, or part-of-speech,
              but they emerge from data, not from explicit rules.
              In our toy model ({CFG.EMBED_DIM} dims vs GPT-2's 768), each number is still{' '}
              <em>learned</em> but carries less nuance.
            </Callout>

            {/* One-hot equivalence */}
            <div
              style={{
                background: '#0B0D17',
                border: '1px solid #1E2A45',
                borderRadius: '8px',
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#8B5CF6',
                  marginBottom: '10px',
                }}
              >
                MATH: Row Lookup = One-Hot Matrix Multiply
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.8' }}>
                A one-hot vector for token id=8 in a vocab of 50 is all zeros except position 8.
                Multiplying that by E gives exactly row 8. Conceptually:
              </div>
              <div
                style={{
                  margin: '10px 0',
                  padding: '10px',
                  background: '#131728',
                  borderRadius: '6px',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '11px',
                  color: '#10B981',
                }}
              >
                one_hot(8) @ E  ≡  E[8]   ← same result, row lookup is just faster
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                The reason we call it "embedding" and not "one-hot + multiply" is purely efficiency —
                we skip the giant sparse multiply and go straight to the row.
              </div>
            </div>

            {/* Training note */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '10px',
              }}
            >
              {[
                { phase: 'Init', desc: 'E filled with small random values (Xavier / truncated normal)', color: '#64748B' },
                { phase: 'Forward pass', desc: 'Rows are looked up → X_emb flows through the network', color: '#6366F1' },
                { phase: 'Backward pass', desc: 'Gradients flow back and update only the used rows of E', color: '#F59E0B' },
                { phase: 'After training', desc: 'Rows encode semantic similarity — geometry = meaning', color: '#10B981' },
              ].map((ph) => (
                <div
                  key={ph.phase}
                  style={{
                    background: '#0B0D17',
                    border: `1px solid ${ph.color}44`,
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: '700', color: ph.color, fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
                    {ph.phase.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>{ph.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── FORMULA ── */}
      <Formula>
        E shape    = ({CFG.VOCAB_SIZE}, {CFG.EMBED_DIM})    ← vocab_size × embed_dim (learnable params){'\n'}
        X_emb      = E[token_ids]          ← row indexing; no matrix multiply, O(1) per token{'\n'}
        X_emb.shape = ({seqLen}, {CFG.EMBED_DIM})           ← seq_len × embed_dim{'\n'}
        {'\n'}
        Each row of X_emb = learned dense representation of one token{'\n'}
        Starts random → converges after billions of gradient updates
      </Formula>

      {/* ── STATS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        {[
          { label: 'E matrix params', value: `${CFG.VOCAB_SIZE}×${CFG.EMBED_DIM}`, sub: `${CFG.VOCAB_SIZE * CFG.EMBED_DIM} floats total` },
          { label: 'Embed dim', value: CFG.EMBED_DIM, sub: 'GPT-2 uses 768' },
          { label: 'Output shape', value: `${seqLen}×${CFG.EMBED_DIM}`, sub: 'seq_len × dim' },
          { label: 'Complexity', value: 'O(1)', sub: 'per token lookup' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: '#131728',
              border: '1px solid #1E2A45',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'Space Mono, monospace', color: '#10B981' }}>
              {s.value}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{s.label}</div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
