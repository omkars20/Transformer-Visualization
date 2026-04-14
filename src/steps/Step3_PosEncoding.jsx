import { useState } from 'react';
import { MatrixViz, ShapeTag, Formula, SectionLabel } from '../components/MatrixViz.jsx';
import { CFG } from '../utils/llmEngine.js';

// ── palette ──────────────────────────────────────────────────────────────────
const POS_COLORS = [
  { bg: '#6366F122', border: '#6366F1', text: '#6366F1' },
  { bg: '#10B98122', border: '#10B981', text: '#10B981' },
  { bg: '#F59E0B22', border: '#F59E0B', text: '#F59E0B' },
  { bg: '#EC489922', border: '#EC4899', text: '#EC4899' },
  { bg: '#06B6D422', border: '#06B6D4', text: '#06B6D4' },
  { bg: '#8B5CF622', border: '#8B5CF6', text: '#8B5CF6' },
  { bg: '#F9731622', border: '#F97316', text: '#F97316' },
  { bg: '#EF444422', border: '#EF4444', text: '#EF4444' },
];

// ── helpers ───────────────────────────────────────────────────────────────────

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
            fontSize: '11px', fontWeight: '700', color,
            fontFamily: 'Space Mono, monospace', letterSpacing: '1px',
            textTransform: 'uppercase', marginBottom: '8px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          {icon && <span>{icon}</span>}{title}
        </div>
      )}
      <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.8' }}>{children}</div>
    </div>
  );
}

// SVG sine/cosine wave for a given (i, d_model) pair
function WaveViz({ dimPair, d_model, seqLen, color, label }) {
  const W = 200, H = 48, pad = 6;
  const denom = Math.pow(10000, (2 * dimPair) / d_model);
  // sin wave points (even dim)
  const sinPts = Array.from({ length: 80 }, (_, k) => {
    const x = pad + (k / 79) * (W - 2 * pad);
    const t = (k / 79) * (seqLen - 1);
    const y = H / 2 - (Math.sin(t / denom) * (H / 2 - pad));
    return `${x},${y}`;
  }).join(' ');
  // cos wave points (odd dim)
  const cosPts = Array.from({ length: 80 }, (_, k) => {
    const x = pad + (k / 79) * (W - 2 * pad);
    const t = (k / 79) * (seqLen - 1);
    const y = H / 2 - (Math.cos(t / denom) * (H / 2 - pad));
    return `${x},${y}`;
  }).join(' ');
  // position markers
  const markers = Array.from({ length: seqLen }, (_, pos) => {
    const x = pad + (pos / Math.max(seqLen - 1, 1)) * (W - 2 * pad);
    const sinY = H / 2 - Math.sin(pos / denom) * (H / 2 - pad);
    const cosY = H / 2 - Math.cos(pos / denom) * (H / 2 - pad);
    return { x, sinY, cosY, pos };
  });

  return (
    <div style={{ background: '#0B0D17', border: `1px solid ${color}44`, borderRadius: '8px', padding: '10px' }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color, marginBottom: '6px' }}>
        {label}  <span style={{ color: '#64748B' }}>freq = 1 / 10000^({2 * dimPair}/{d_model}) = {(1 / denom).toFixed(4)}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Grid line */}
        <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} stroke="#1E2A45" strokeWidth="1" />
        {/* Sin wave */}
        <polyline points={sinPts} fill="none" stroke={color} strokeWidth="1.5" opacity="0.9" />
        {/* Cos wave */}
        <polyline points={cosPts} fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" strokeDasharray="3,2" />
        {/* Position dots */}
        {markers.map(({ x, sinY, cosY, pos }) => (
          <g key={pos}>
            <circle cx={x} cy={sinY} r="3" fill={color} />
            <circle cx={x} cy={cosY} r="3" fill={color} opacity="0.4" />
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
        <span style={{ fontSize: '9px', color, fontFamily: 'Space Mono, monospace' }}>— sin (even dim d{2 * dimPair})</span>
        <span style={{ fontSize: '9px', color, opacity: 0.5, fontFamily: 'Space Mono, monospace' }}>--- cos (odd dim d{2 * dimPair + 1})</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Step3_PosEncoding({ result }) {
  if (!result) return null;
  const { tokens, X_emb, P, X1 } = result;
  const seqLen = tokens.length;

  const [selectedPos, setSelectedPos] = useState(0);
  const [selectedCell, setSelectedCell] = useState({ pos: 0, dim: 0 });
  const [activeTab, setActiveTab] = useState('problem');

  const rowLabels = tokens.map((t, i) => `pos${i} "${t.word}"`);
  const colLabels = Array.from({ length: CFG.EMBED_DIM }, (_, i) => `d${i}`);
  const posColor = POS_COLORS[selectedPos % POS_COLORS.length];

  // Recompute PE value for selected cell
  const { pos: cPos, dim: cDim } = selectedCell;
  const denom = Math.pow(10000, (2 * Math.floor(cDim / 2)) / CFG.EMBED_DIM);
  const cellPEval = cDim % 2 === 0 ? Math.sin(cPos / denom) : Math.cos(cPos / denom);
  const cellEmbVal = X_emb[cPos]?.[cDim] ?? 0;
  const cellX1val = X1[cPos]?.[cDim] ?? 0;

  const TABS = [
    { id: 'problem',   label: 'The Problem',      icon: '⚠️' },
    { id: 'formula',   label: 'PE Formula',        icon: '📐' },
    { id: 'explorer',  label: 'Position Explorer', icon: '🔍' },
    { id: 'addition',  label: 'X_emb + P = X₁',   icon: '➕' },
    { id: 'intuition', label: 'Why Sinusoidal?',   icon: '💡' },
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── HEADER ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span
            style={{
              background: '#06B6D422', border: '1px solid #06B6D4', borderRadius: '8px',
              padding: '4px 12px', fontFamily: 'Space Mono, monospace',
              fontSize: '11px', color: '#06B6D4', fontWeight: '700',
            }}
          >
            STEP 3 of 8
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#E2E8F0', margin: 0 }}>
            Positional Encoding
          </h2>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
          Attention sees all tokens simultaneously — it has no built-in sense of order.
          Positional encoding injects location signals so the model knows which token came first.
        </p>
      </div>

      {/* ── TABBED CONTENT ── */}
      <div className="viz-card">
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 14px', borderRadius: '8px',
                border: `1.5px solid ${activeTab === tab.id ? '#06B6D4' : '#1E2A45'}`,
                background: activeTab === tab.id ? '#06B6D422' : 'transparent',
                color: activeTab === tab.id ? '#06B6D4' : '#64748B',
                fontFamily: 'Space Mono, monospace', fontSize: '11px',
                fontWeight: activeTab === tab.id ? '700' : '400',
                cursor: 'pointer', transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: PROBLEM ── */}
        {activeTab === 'problem' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6', margin: 0 }}>
              After step 2, every token is a vector — but those vectors have no memory of
              where in the sentence they appeared. Consider two very different sentences:
            </p>

            {/* Side-by-side comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
              {/* Sentence A */}
              <div
                style={{
                  background: '#0B0D17', border: '1px solid #10B981',
                  borderRadius: '8px', padding: '14px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#10B981', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                  SENTENCE A
                </div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '15px', fontWeight: '700', color: '#E2E8F0', marginBottom: '10px' }}>
                  "I love AI"
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['I', 'love', 'AI'].map((w, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '4px 8px', borderRadius: '5px',
                        background: POS_COLORS[i].bg, border: `1px solid ${POS_COLORS[i].border}`,
                        fontFamily: 'Space Mono, monospace', fontSize: '11px',
                        color: POS_COLORS[i].text,
                      }}
                    >
                      pos{i}: "{w}"
                    </div>
                  ))}
                </div>
              </div>

              {/* vs */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#EF4444', fontFamily: 'Space Mono, monospace' }}>vs</div>
              </div>

              {/* Sentence B */}
              <div
                style={{
                  background: '#0B0D17', border: '1px solid #EF4444',
                  borderRadius: '8px', padding: '14px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#EF4444', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                  SENTENCE B
                </div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '15px', fontWeight: '700', color: '#E2E8F0', marginBottom: '10px' }}>
                  "AI love I"
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['AI', 'love', 'I'].map((w, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '4px 8px', borderRadius: '5px',
                        background: POS_COLORS[i].bg, border: `1px solid ${POS_COLORS[i].border}`,
                        fontFamily: 'Space Mono, monospace', fontSize: '11px',
                        color: POS_COLORS[i].text,
                      }}
                    >
                      pos{i}: "{w}"
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Problem callout */}
            <div
              style={{
                background: '#EF444411', border: '1px solid #EF444455',
                borderLeft: '3px solid #EF4444', borderRadius: '8px', padding: '14px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#EF4444', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                ⚠️  THE PROBLEM
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.8' }}>
                After embedding lookup, both sentences produce{' '}
                <strong style={{ color: '#E2E8F0' }}>the exact same set of row vectors</strong> — just in a different order.
                But self-attention <em>sums over all positions</em>, so it can't tell the order apart.
                <br /><br />
                Without positional encoding: <span style={{ fontFamily: 'Space Mono, monospace', color: '#EF4444' }}>Attention("I love AI") ≡ Attention("AI love I")</span>
                <br />
                After positional encoding: each token row gets a unique positional fingerprint added to it.
              </div>
            </div>

            {/* Solution preview */}
            <div
              style={{
                background: '#06B6D411', border: '1px solid #06B6D455',
                borderLeft: '3px solid #06B6D4', borderRadius: '8px', padding: '14px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#06B6D4', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                ✓  THE SOLUTION
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.8' }}>
                We compute a position matrix P (same shape as X_emb) and{' '}
                <strong style={{ color: '#E2E8F0' }}>add it element-wise</strong>:{' '}
                <span style={{ fontFamily: 'Space Mono, monospace', color: '#06B6D4' }}>X₁ = X_emb + P</span>.
                <br />
                Now each row is a unique blend of token meaning + position signal. "I" at position 0 looks
                different from "I" at position 2.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              {[
                { icon: '📏', label: 'Shape in', value: `(${seqLen}, ${CFG.EMBED_DIM})`, sub: 'X_emb (from step 2)', color: '#10B981' },
                { icon: '➕', label: 'Operation', value: 'element-wise +', sub: 'no learned weights', color: '#6366F1' },
                { icon: '📐', label: 'Shape out', value: `(${seqLen}, ${CFG.EMBED_DIM})`, sub: 'X₁ (into attention)', color: '#06B6D4' },
              ].map((s) => (
                <div key={s.label} style={{ background: '#0B0D17', border: `1px solid ${s.color}44`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>{s.icon}</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: '700', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: '9px', color: '#64748B' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: FORMULA ── */}
        {activeTab === 'formula' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6', margin: 0 }}>
              The original "Attention Is All You Need" paper uses fixed sine and cosine functions
              at geometrically decreasing frequencies — one frequency pair per embedding dimension pair.
            </p>

            {/* Formula box */}
            <div
              style={{
                background: '#0B0D17', border: '1px solid #06B6D4',
                borderRadius: '8px', padding: '16px',
                fontFamily: 'Space Mono, monospace',
              }}
            >
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '10px' }}>/* Vaswani et al., 2017 */</div>
              <div style={{ fontSize: '13px', color: '#06B6D4', marginBottom: '6px' }}>
                P[pos, 2i]   = sin( pos / 10000<sup style={{ fontSize: '9px' }}>2i/{CFG.EMBED_DIM}</sup> )
              </div>
              <div style={{ fontSize: '13px', color: '#6366F1', marginBottom: '14px' }}>
                P[pos, 2i+1] = cos( pos / 10000<sup style={{ fontSize: '9px' }}>2i/{CFG.EMBED_DIM}</sup> )
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                pos ∈ [0, {seqLen - 1}] &nbsp;|&nbsp; i ∈ [0, {CFG.EMBED_DIM / 2 - 1}] &nbsp;|&nbsp; d_model = {CFG.EMBED_DIM}
              </div>
            </div>

            {/* Dimension table */}
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                DIMENSION ASSIGNMENT — which formula each column uses
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Space Mono, monospace', fontSize: '11px' }}>
                  <thead>
                    <tr>
                      {['Dim', 'Formula', 'i (pair)', 'Frequency (1/denom)', 'Period (tokens)'].map((h) => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748B', borderBottom: '1px solid #1E2A45' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: CFG.EMBED_DIM }, (_, d) => {
                      const i = Math.floor(d / 2);
                      const denom2 = Math.pow(10000, (2 * i) / CFG.EMBED_DIM);
                      const freq = 1 / denom2;
                      const period = (2 * Math.PI) / freq;
                      const isSin = d % 2 === 0;
                      return (
                        <tr key={d} style={{ background: d % 2 === 0 ? '#0B0D1788' : 'transparent' }}>
                          <td style={{ padding: '6px 10px', color: '#E2E8F0' }}>d{d}</td>
                          <td style={{ padding: '6px 10px', color: isSin ? '#06B6D4' : '#6366F1' }}>
                            {isSin ? 'sin' : 'cos'}
                          </td>
                          <td style={{ padding: '6px 10px', color: '#94A3B8' }}>i={i}</td>
                          <td style={{ padding: '6px 10px', color: '#94A3B8' }}>{freq.toFixed(5)}</td>
                          <td style={{ padding: '6px 10px', color: '#94A3B8' }}>{period.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Wave visualizations */}
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                WAVE SHAPES — lower i = higher frequency (fast oscillation)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {[0, 1, CFG.EMBED_DIM / 2 - 1].map((i, idx) => (
                  <WaveViz
                    key={i}
                    dimPair={i}
                    d_model={CFG.EMBED_DIM}
                    seqLen={seqLen}
                    color={['#06B6D4', '#6366F1', '#F59E0B'][idx]}
                    label={`Pair i=${i}  →  d${2 * i} (sin) & d${2 * i + 1} (cos)`}
                  />
                ))}
              </div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748B', lineHeight: '1.6' }}>
                Each i-pair uses a different frequency. Low i = fast wave (distinguishes adjacent tokens).
                High i = slow wave (distinguishes far-apart tokens). Together they create a unique fingerprint for every position.
              </div>
            </div>

            {/* P matrix */}
            <div>
              <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                COMPUTED P MATRIX &nbsp;<ShapeTag shape={[seqLen, CFG.EMBED_DIM]} />&nbsp; — values ∈ [−1, 1] (bounded by sin/cos)
              </div>
              <MatrixViz
                matrix={P}
                rowLabels={rowLabels}
                colLabels={colLabels}
                showColorBar
                maxAbs={1.0}
              />
            </div>
          </div>
        )}

        {/* ── TAB: EXPLORER ── */}
        {activeTab === 'explorer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6', margin: 0 }}>
              Select a position to inspect its full PE vector. Then click any cell to see the exact computation.
            </p>

            {/* Position selector */}
            <div>
              <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                SELECT POSITION
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {tokens.map((tok, i) => {
                  const col = POS_COLORS[i % POS_COLORS.length];
                  const isActive = i === selectedPos;
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelectedPos(i); setSelectedCell({ pos: i, dim: selectedCell.dim }); }}
                      style={{
                        padding: '8px 14px', borderRadius: '8px',
                        border: `2px solid ${isActive ? col.border : '#1E2A45'}`,
                        background: isActive ? col.bg : '#0B0D17',
                        color: isActive ? col.text : '#64748B',
                        fontFamily: 'Space Mono, monospace', fontSize: '12px',
                        fontWeight: isActive ? '700' : '400', cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                      }}
                    >
                      <span>pos {i}</span>
                      <span style={{ fontSize: '10px', opacity: 0.75 }}>"{tok.word}"</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PE vector for selected position */}
            <div
              style={{
                background: '#0B0D17', border: `1.5px solid ${posColor.border}`,
                borderRadius: '8px', padding: '14px',
              }}
            >
              <div
                style={{
                  fontFamily: 'Space Mono, monospace', fontSize: '11px',
                  fontWeight: '700', color: posColor.text, marginBottom: '12px',
                }}
              >
                P[pos={selectedPos}] — "{tokens[selectedPos].word}"
              </div>

              {/* Clickable cells */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {P[selectedPos].map((val, d) => {
                  const intensity = Math.abs(val);
                  const isSelected = selectedCell.pos === selectedPos && selectedCell.dim === d;
                  const isSin = d % 2 === 0;
                  return (
                    <div
                      key={d}
                      onClick={() => setSelectedCell({ pos: selectedPos, dim: d })}
                      style={{
                        width: '48px', height: '36px', borderRadius: '5px', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: isSin
                          ? `rgba(6,182,212,${0.2 + intensity * 0.65})`
                          : `rgba(99,102,241,${0.2 + intensity * 0.65})`,
                        border: isSelected ? '2px solid #fff' : '1px solid transparent',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.12s ease',
                        fontFamily: 'Space Mono, monospace', fontSize: '8px', fontWeight: '700', color: '#fff',
                        gap: '1px',
                      }}
                    >
                      <span style={{ fontSize: '7px', opacity: 0.7 }}>d{d}</span>
                      <span>{val.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'Space Mono, monospace', color: '#06B6D4' }}>■ sin (even dims)</span>
                <span style={{ fontSize: '10px', fontFamily: 'Space Mono, monospace', color: '#6366F1' }}>■ cos (odd dims)</span>
              </div>

              {/* Selected cell breakdown */}
              {selectedCell.pos === selectedPos && (
                <div
                  style={{
                    background: '#131728', border: '1px solid #1E2A45',
                    borderRadius: '6px', padding: '10px',
                    fontFamily: 'Space Mono, monospace', fontSize: '11px',
                  }}
                >
                  <div style={{ color: '#64748B', marginBottom: '8px' }}>
                    CELL P[{selectedCell.pos}][{selectedCell.dim}] breakdown:
                  </div>
                  <div style={{ color: '#E2E8F0', marginBottom: '4px' }}>
                    pos = {selectedCell.pos},  dim = {selectedCell.dim},  i = {Math.floor(selectedCell.dim / 2)}
                  </div>
                  <div style={{ color: '#94A3B8', marginBottom: '4px' }}>
                    denom = 10000^(2×{Math.floor(selectedCell.dim / 2)}/{CFG.EMBED_DIM}) = {Math.pow(10000, (2 * Math.floor(selectedCell.dim / 2)) / CFG.EMBED_DIM).toFixed(4)}
                  </div>
                  <div style={{ color: selectedCell.dim % 2 === 0 ? '#06B6D4' : '#6366F1', marginBottom: '4px' }}>
                    {selectedCell.dim % 2 === 0
                      ? `sin(${selectedCell.pos} / ${Math.pow(10000, (2 * Math.floor(selectedCell.dim / 2)) / CFG.EMBED_DIM).toFixed(3)}) = ${cellPEval.toFixed(4)}`
                      : `cos(${selectedCell.pos} / ${Math.pow(10000, (2 * Math.floor(selectedCell.dim / 2)) / CFG.EMBED_DIM).toFixed(3)}) = ${cellPEval.toFixed(4)}`}
                  </div>
                  <div style={{ color: '#F59E0B', marginTop: '8px', borderTop: '1px solid #1E2A45', paddingTop: '8px' }}>
                    X_emb[{selectedCell.pos}][{selectedCell.dim}] = {cellEmbVal.toFixed(4)}
                    &nbsp;+&nbsp; P = {cellPEval.toFixed(4)}
                    &nbsp;= X₁ = {cellX1val.toFixed(4)}
                  </div>
                </div>
              )}
            </div>

            {/* Comparison: all positions, selected dimension */}
            <div>
              <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                P values across all positions for dimension d{selectedCell.dim} — how this dim's signal varies by position
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '60px' }}>
                {tokens.map((tok, pos) => {
                  const val = P[pos][selectedCell.dim];
                  const pct = ((val + 1) / 2) * 100;
                  const isActive = pos === selectedPos;
                  const col = POS_COLORS[pos % POS_COLORS.length];
                  return (
                    <div
                      key={pos}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                      onClick={() => { setSelectedPos(pos); setSelectedCell({ pos, dim: selectedCell.dim }); }}
                    >
                      <span style={{ fontSize: '8px', fontFamily: 'Space Mono, monospace', color: isActive ? col.text : '#64748B' }}>
                        {val.toFixed(2)}
                      </span>
                      <div
                        style={{
                          width: '100%', height: `${Math.max(pct * 0.5, 6)}px`,
                          background: isActive ? col.border : '#1E2A45',
                          borderRadius: '3px 3px 0 0',
                          border: isActive ? `1px solid ${col.border}` : 'none',
                          transition: 'all 0.15s',
                        }}
                      />
                      <span style={{ fontSize: '8px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>p{pos}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: ADDITION ── */}
        {activeTab === 'addition' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6', margin: 0 }}>
              X₁ = X_emb + P is pure element-wise addition — same shape in, same shape out.
              Select a position to trace the computation row by row.
            </p>

            {/* Position selector */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {tokens.map((tok, i) => {
                const col = POS_COLORS[i % POS_COLORS.length];
                const isActive = i === selectedPos;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedPos(i)}
                    style={{
                      padding: '6px 12px', borderRadius: '6px',
                      border: `1.5px solid ${isActive ? col.border : '#1E2A45'}`,
                      background: isActive ? col.bg : 'transparent',
                      color: isActive ? col.text : '#64748B',
                      fontFamily: 'Space Mono, monospace', fontSize: '11px',
                      fontWeight: isActive ? '700' : '400', cursor: 'pointer',
                    }}
                  >
                    pos{i} "{tok.word}"
                  </button>
                );
              })}
            </div>

            {/* Row-level addition trace */}
            <div
              style={{
                background: '#0B0D17', border: `1px solid ${posColor.border}`,
                borderRadius: '8px', padding: '14px',
              }}
            >
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: posColor.text, marginBottom: '12px' }}>
                Position {selectedPos} — "{tokens[selectedPos].word}" — row-by-row addition
              </div>

              {/* X_emb row */}
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', color: '#10B981', fontFamily: 'Space Mono, monospace' }}>X_emb[{selectedPos}]</span>
                <div style={{ display: 'flex', gap: '3px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {X_emb[selectedPos].map((v, d) => (
                    <div key={d} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: '44px', height: '28px', borderRadius: '4px',
                          background: v >= 0 ? `rgba(16,185,129,0.3)` : `rgba(239,68,68,0.3)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Space Mono, monospace', fontSize: '8px', fontWeight: '700', color: '#fff',
                        }}
                      >
                        {v.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '7px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginTop: '2px' }}>d{d}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* + sign */}
              <div style={{ fontSize: '18px', color: '#6366F1', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>+</div>

              {/* P row */}
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', color: '#06B6D4', fontFamily: 'Space Mono, monospace' }}>P[{selectedPos}]</span>
                <div style={{ display: 'flex', gap: '3px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {P[selectedPos].map((v, d) => (
                    <div key={d} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: '44px', height: '28px', borderRadius: '4px',
                          background: v >= 0 ? `rgba(6,182,212,0.3)` : `rgba(239,68,68,0.3)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Space Mono, monospace', fontSize: '8px', fontWeight: '700', color: '#fff',
                        }}
                      >
                        {v.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '7px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginTop: '2px' }}>d{d}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* = sign */}
              <div style={{ fontSize: '18px', color: '#6366F1', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>=</div>

              {/* X1 row */}
              <div>
                <span style={{ fontSize: '10px', color: '#F59E0B', fontFamily: 'Space Mono, monospace' }}>X₁[{selectedPos}]</span>
                <div style={{ display: 'flex', gap: '3px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {X1[selectedPos].map((v, d) => (
                    <div key={d} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: '44px', height: '28px', borderRadius: '4px',
                          background: v >= 0 ? `rgba(245,158,11,0.35)` : `rgba(239,68,68,0.35)`,
                          border: '1px solid #F59E0B55',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Space Mono, monospace', fontSize: '8px', fontWeight: '700', color: '#F59E0B',
                        }}
                      >
                        {v.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '7px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginTop: '2px' }}>d{d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Full matrices side by side */}
            <div>
              <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '10px' }}>
                FULL MATRICES — highlighted row = selected position
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#10B981', fontFamily: 'Space Mono, monospace', marginBottom: '4px', textAlign: 'center' }}>
                    X_emb <ShapeTag shape={[seqLen, CFG.EMBED_DIM]} />
                  </div>
                  <MatrixViz matrix={X_emb} rowLabels={rowLabels} size="sm" />
                </div>
                <div style={{ fontSize: '24px', color: '#6366F1', fontWeight: '700', paddingTop: '28px' }}>+</div>
                <div>
                  <div style={{ fontSize: '10px', color: '#06B6D4', fontFamily: 'Space Mono, monospace', marginBottom: '4px', textAlign: 'center' }}>
                    P <ShapeTag shape={[seqLen, CFG.EMBED_DIM]} />
                  </div>
                  <MatrixViz matrix={P} rowLabels={rowLabels} size="sm" maxAbs={1.0} />
                </div>
                <div style={{ fontSize: '24px', color: '#6366F1', fontWeight: '700', paddingTop: '28px' }}>=</div>
                <div>
                  <div style={{ fontSize: '10px', color: '#F59E0B', fontFamily: 'Space Mono, monospace', marginBottom: '4px', textAlign: 'center' }}>
                    X₁ <ShapeTag shape={[seqLen, CFG.EMBED_DIM]} />
                  </div>
                  <MatrixViz matrix={X1} rowLabels={rowLabels} size="sm" showColorBar />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: INTUITION ── */}
        {activeTab === 'intuition' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <Callout color="#06B6D4" icon="🎵" title="Sinusoidal = Unique Fingerprint">
              Each position gets a vector of sine and cosine values at different frequencies — like a{' '}
              <strong style={{ color: '#E2E8F0' }}>musical chord</strong>.
              Position 0 = one chord. Position 1 = a slightly different chord. No two positions produce the same pattern.
              <br /><br />
              The key property: the model can learn to compute{' '}
              <strong style={{ color: '#E2E8F0' }}>relative position</strong> from dot products between
              PE vectors, since sin(a)sin(b) + cos(a)cos(b) = cos(a − b). Relative distance is encoded geometrically.
            </Callout>

            <Callout color="#6366F1" icon="📡" title="Multiple Frequencies = Multiple Resolutions">
              Low-index dimensions (i=0) oscillate fast — they distinguish adjacent tokens.
              High-index dimensions (i={CFG.EMBED_DIM / 2 - 1}) oscillate slowly — they capture long-range structure.
              <br /><br />
              It is analogous to how a clock uses{' '}
              <strong style={{ color: '#E2E8F0' }}>seconds, minutes, and hours hands</strong> together —
              each hand encodes position at a different granularity, and together they uniquely identify any time.
            </Callout>

            <Callout color="#F59E0B" icon="🔁" title="Learned PE vs Fixed PE">
              Modern models like{' '}
              <strong style={{ color: '#E2E8F0' }}>GPT-2 use learned positional embeddings</strong> —
              same shape as sinusoidal PE, but the values are trained parameters that can be optimized.
              The sinusoidal approach needs no training and can generalize to sequence lengths
              beyond what was seen during training (useful for inference on long contexts).
              <br /><br />
              Newer architectures (LLaMA, Mistral) use{' '}
              <strong style={{ color: '#E2E8F0' }}>Rotary Position Embedding (RoPE)</strong> which encodes
              position in the attention operation itself rather than adding it to embeddings.
            </Callout>

            {/* Comparison table */}
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                POSITIONAL ENCODING COMPARISON
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Space Mono, monospace', fontSize: '11px' }}>
                  <thead>
                    <tr>
                      {['Method', 'Learned?', 'Generalizes?', 'Used in'].map((h) => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748B', borderBottom: '1px solid #1E2A45' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { method: 'Sinusoidal (this demo)', learned: 'No (fixed)', gen: 'Yes (any length)', used: 'Original Transformer, T5' },
                      { method: 'Learned Absolute PE', learned: 'Yes', gen: 'No (up to train length)', used: 'GPT-2, BERT, ViT' },
                      { method: 'RoPE', learned: 'No', gen: 'Yes (with scaling)', used: 'LLaMA, Mistral, Gemma' },
                      { method: 'ALiBi', learned: 'No', gen: 'Yes (linear bias)', used: 'MPT, BLOOM' },
                    ].map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#0B0D1788' : 'transparent' }}>
                        <td style={{ padding: '8px 10px', color: i === 0 ? '#06B6D4' : '#E2E8F0' }}>{row.method}</td>
                        <td style={{ padding: '8px 10px', color: '#94A3B8' }}>{row.learned}</td>
                        <td style={{ padding: '8px 10px', color: '#94A3B8' }}>{row.gen}</td>
                        <td style={{ padding: '8px 10px', color: '#94A3B8' }}>{row.used}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Key properties */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              {[
                { icon: '🔑', prop: 'Unique per position', desc: 'No two positions share the same PE vector', color: '#06B6D4' },
                { icon: '📐', prop: 'Bounded [-1, 1]', desc: 'sin/cos guarantee values stay in a fixed range', color: '#6366F1' },
                { icon: '➕', prop: 'Zero extra params', desc: 'Sinusoidal PE adds no trainable weights', color: '#10B981' },
                { icon: '🔄', prop: 'Relative distances', desc: 'PE dot-products encode token distance, not just absolute position', color: '#F59E0B' },
              ].map((p) => (
                <div
                  key={p.prop}
                  style={{
                    background: '#0B0D17', border: `1px solid ${p.color}44`,
                    borderRadius: '8px', padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '18px', marginBottom: '6px' }}>{p.icon}</div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: p.color, fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
                    {p.prop.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── FORMULA ── */}
      <Formula>
        P[pos, 2i]   = sin(pos / 10000^(2i/{CFG.EMBED_DIM}))   ← even dims{'\n'}
        P[pos, 2i+1] = cos(pos / 10000^(2i/{CFG.EMBED_DIM}))   ← odd dims{'\n'}
        {'\n'}
        X₁ = X_emb + P          ← element-wise addition, O(seq × dim){'\n'}
        X₁.shape = ({seqLen}, {CFG.EMBED_DIM})   ← shape unchanged; carries both meaning + position
      </Formula>

      {/* ── STATS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        {[
          { label: 'Operation', value: 'X_emb + P', sub: 'element-wise add' },
          { label: 'Extra params', value: '0', sub: 'fixed sinusoidal' },
          { label: 'Value range', value: '[−1, 1]', sub: 'bounded by sin/cos' },
          { label: 'Output shape', value: `${seqLen}×${CFG.EMBED_DIM}`, sub: 'unchanged from input' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: '#131728', border: '1px solid #1E2A45',
              borderRadius: '10px', padding: '12px', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '17px', fontWeight: '700', fontFamily: 'Space Mono, monospace', color: '#06B6D4' }}>
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
