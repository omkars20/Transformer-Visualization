import React, { useState, useMemo } from 'react';
import {
  MatrixViz, AttentionHeatmap, InsightBox, SectionLabel,
} from '../components/MatrixViz.jsx';
import { CFG, matMul, transpose, r } from '../utils/llmEngine.js';

// ─── Coloured callout box ────────────────────────────────────────────────────
function Box({ color = '#6366F1', icon, title, children }) {
  return (
    <div style={{
      background: `${color}0D`,
      border: `1px solid ${color}44`,
      borderLeft: `3px solid ${color}`,
      borderRadius: '8px',
      padding: '14px 16px',
    }}>
      {title && (
        <div style={{
          fontSize: '11px', fontWeight: '700', color,
          fontFamily: 'Space Mono, monospace', letterSpacing: '1px',
          textTransform: 'uppercase', marginBottom: '8px',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          {icon && <span>{icon}</span>}{title}
        </div>
      )}
      <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.8' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Numbered step row with vertical connector line ──────────────────────────
function StepRow({ n, color, title, children, last = false }) {
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: `${color}22`, border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Space Mono, monospace', fontSize: '12px',
          fontWeight: '700', color, flexShrink: 0,
        }}>{n}</div>
        {!last && (
          <div style={{ width: '2px', flex: 1, background: `${color}33`, marginTop: '4px', minHeight: '24px' }} />
        )}
      </div>
      <div style={{ flex: 1, paddingBottom: last ? '0' : '28px' }}>
        <div style={{
          fontSize: '14px', fontWeight: '700', color: '#E2E8F0',
          marginBottom: '12px', marginTop: '2px',
        }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

// ─── Inline code chip ────────────────────────────────────────────────────────
function Chip({ children, color = '#6366F1' }) {
  return (
    <span style={{
      fontFamily: 'Space Mono, monospace', fontSize: '11px',
      background: `${color}22`, border: `1px solid ${color}55`,
      borderRadius: '4px', padding: '1px 6px', color,
    }}>{children}</span>
  );
}

// ─── Shape arrow: A × B = C ──────────────────────────────────────────────────
function ShapeEq({ a, b, c, color }) {
  return (
    <div style={{
      fontFamily: 'Space Mono, monospace', fontSize: '12px',
      background: '#0B0D17', border: `1px solid ${color}44`,
      borderRadius: '8px', padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
    }}>
      <span style={{ color: '#94A3B8' }}>{a}</span>
      <span style={{ color: '#475569' }}>@</span>
      <span style={{ color: '#94A3B8' }}>{b}</span>
      <span style={{ color: '#475569' }}>=</span>
      <span style={{ color, fontWeight: '700' }}>{c}</span>
    </div>
  );
}

const HEAD_COLORS = ['#6366F1', '#EC4899'];

export default function Step5_MultiHead({ result }) {
  if (!result) return null;
  const { tokens, X2, mha } = result;
  const seqLen   = tokens.length;
  const names    = tokens.map(t => t.word);

  const [selectedHead, setSelectedHead]       = useState(0);
  const [showScoreMath, setShowScoreMath]     = useState(false);
  const [showSoftmaxMath, setShowSoftmaxMath] = useState(false);
  const [showValueMath, setShowValueMath]     = useState(false);

  const head = mha.heads[selectedHead];
  const hc   = HEAD_COLORS[selectedHead];

  // Raw scores (scaled, pre-softmax) for the selected head
  const rawScores = useMemo(() => {
    const KT = transpose(head.K);
    return matMul(head.Q, KT).map(row =>
      row.map(x => r(x / Math.sqrt(CFG.HEAD_DIM)))
    );
  }, [head]);

  // Dot-product drill-down: scores[0][0] = Q[0] · K[0]
  const scoreMath = useMemo(() => {
    const q = head.Q[0];
    const k = head.K[0];
    const terms = q.map((qi, i) => ({
      qi: r(qi, 4), ki: r(k[i], 4), prod: r(qi * k[i], 4),
    }));
    const rawSum  = r(terms.reduce((s, t) => s + t.prod, 0), 4);
    const scaled  = r(rawSum / Math.sqrt(CFG.HEAD_DIM), 4);
    return { terms, rawSum, scaled };
  }, [head]);

  // Softmax drill-down: row 0 of rawScores
  const softmaxMath = useMemo(() => {
    const row    = rawScores[0];
    const maxVal = Math.max(...row);
    const exps   = row.map(x => r(Math.exp(x - maxVal), 4));
    const sum    = r(exps.reduce((a, b) => a + b, 0), 4);
    const out    = exps.map(x => r(x / sum, 4));
    return { row: row.map(x => r(x, 4)), maxVal: r(maxVal, 4), exps, sum, out };
  }, [rawScores]);

  // Weighted-value drill-down: output[0] = attn_weights[0] @ V
  const valueMath = useMemo(() => {
    const w     = head.scores[0];
    const terms = w.map((wi, i) => ({
      wi: r(wi, 4),
      v:  head.V[i].map(x => r(x, 4)),
      wv: head.V[i].map(x => r(wi * x, 4)),
    }));
    const out = head.V[0].map((_, j) =>
      r(terms.reduce((s, t) => s + t.wv[j], 0), 4)
    );
    return { terms, out };
  }, [head]);

  const colH = Array.from({ length: CFG.HEAD_DIM }, (_, i) => `f${i}`);
  const col8 = Array.from({ length: CFG.EMBED_DIM }, (_, i) => `f${i}`);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── HEADER ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{
            background: '#8B5CF622', border: '1px solid #8B5CF6', borderRadius: '8px',
            padding: '4px 12px', fontFamily: 'Space Mono, monospace', fontSize: '11px',
            color: '#8B5CF6', fontWeight: '700', letterSpacing: '1px',
          }}>STEP 5 OF 8</span>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#E2E8F0', margin: 0 }}>
            Multi-Head Attention — Every Step, Every Number
          </h2>
        </div>
        <p style={{ color: '#64748B', fontSize: '13px', margin: 0, lineHeight: '1.7' }}>
          We run the full attention mechanism <strong style={{ color: '#C4B5FD' }}>{CFG.NUM_HEADS} times
          in parallel</strong> with different learned weight slices.
          Below you can trace the exact math behind every matrix multiply, softmax,
          and weighted sum — for your specific input sentence.
        </p>
      </div>

      {/* ── INTUITION FIRST ── */}
      <div className="viz-card">
        <SectionLabel>Before Any Math — What Problem Are We Solving?</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Box color="#F59E0B" icon="🔦" title="Single attention = one viewpoint">
            One attention pass produces <em>one set of weights</em> — one pattern of "who looks at whom".
            It can only notice one type of relationship at a time. If it learns grammar structure,
            it might completely miss semantic (meaning) connections.
          </Box>
          <Box color="#8B5CF6" icon="🔦🔦" title="Multi-head = multiple viewpoints simultaneously">
            Run attention <strong style={{ color: '#C4B5FD' }}>{CFG.NUM_HEADS} times with {CFG.NUM_HEADS} different
            "lenses"</strong>. Each head asks a slightly different question about the same tokens.
            Their outputs are then concatenated and blended.
            <br /><br />
            Key equation: <strong style={{ color: '#C4B5FD' }}>HEAD_DIM = EMBED_DIM ÷ NUM_HEADS
            = {CFG.EMBED_DIM} ÷ {CFG.NUM_HEADS} = {CFG.HEAD_DIM}</strong>
            <br />
            So {CFG.NUM_HEADS} heads × {CFG.HEAD_DIM} features = {CFG.EMBED_DIM} features — back to the original size.
          </Box>
        </div>
      </div>

      {/* ── DIMENSION CARD ── */}
      <div className="viz-card">
        <SectionLabel>Dimensions — Memorise These, Everything Else Follows</SectionLabel>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
        }}>
          {[
            { label: 'Tokens (seq_len)',  val: seqLen,        color: '#06B6D4' },
            { label: 'Embedding dim',     val: CFG.EMBED_DIM, color: '#6366F1' },
            { label: 'Number of heads',   val: CFG.NUM_HEADS, color: '#8B5CF6' },
            { label: 'Head dim',          val: CFG.HEAD_DIM,  color: '#EC4899' },
            { label: '√HEAD_DIM (scale)', val: `√${CFG.HEAD_DIM}≈${Math.sqrt(CFG.HEAD_DIM).toFixed(2)}`, color: '#F59E0B' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{
              background: `${color}0D`, border: `1px solid ${color}33`,
              borderRadius: '8px', padding: '12px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '22px', color, fontWeight: '700' }}>{val}</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', lineHeight: '1.4' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INPUT X ── */}
      <div className="viz-card">
        <SectionLabel>The Input — Matrix X</SectionLabel>
        <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
          This is X2 — the output of the previous add-&amp;-norm step.
          Shape <Chip color="#06B6D4">({seqLen} × {CFG.EMBED_DIM})</Chip>: {seqLen} tokens, each described by {CFG.EMBED_DIM} numbers.
          <br />
          <strong style={{ color: '#E2E8F0' }}>Every head receives this exact same X.</strong> What
          makes heads different is the weight matrices they use to transform it.
        </p>
        <MatrixViz matrix={X2} rowLabels={names} colLabels={col8} size="sm" showColorBar />
      </div>

      {/* ── WEIGHT SLICING ── */}
      <div className="viz-card">
        <SectionLabel>The Secret: We SLICE the Weight Matrices by Columns</SectionLabel>
        <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 14px' }}>
          We have one big Wq of shape <Chip>({CFG.EMBED_DIM}×{CFG.EMBED_DIM})</Chip>.
          Instead of creating separate matrices for each head, we <strong style={{ color: '#F59E0B' }}>cut it vertically</strong>:
          each head gets a {CFG.HEAD_DIM}-column slice.
        </p>
        <div style={{
          fontFamily: 'Space Mono, monospace', fontSize: '12px',
          background: '#0B0D17', border: '1px solid #1E2A45',
          borderRadius: '8px', padding: '16px', lineHeight: '2.2',
        }}>
          <div style={{ color: '#64748B' }}>Wq  ({CFG.EMBED_DIM} rows × {CFG.EMBED_DIM} cols) — visualised as one row:</div>
          <div style={{ marginTop: '6px', fontSize: '18px', letterSpacing: '2px' }}>
            {'['}
            <span style={{ color: HEAD_COLORS[0] }}>{'█'.repeat(CFG.HEAD_DIM)}</span>
            <span style={{ color: HEAD_COLORS[1] }}>{'█'.repeat(CFG.HEAD_DIM)}</span>
            {']'}
          </div>
          <div style={{ color: HEAD_COLORS[0], marginTop: '8px' }}>
            Head 1 slice:  Wq[:, 0:{CFG.HEAD_DIM}]   →  shape ({CFG.EMBED_DIM}, {CFG.HEAD_DIM})
          </div>
          <div style={{ color: HEAD_COLORS[1] }}>
            Head 2 slice:  Wq[:, {CFG.HEAD_DIM}:{CFG.EMBED_DIM}]  →  shape ({CFG.EMBED_DIM}, {CFG.HEAD_DIM})
          </div>
          <div style={{ color: '#475569', fontSize: '11px', marginTop: '8px' }}>
            Same slicing applies to Wk and Wv. Wo is used once at the very end (shape {CFG.EMBED_DIM}×{CFG.EMBED_DIM}).
          </div>
        </div>
      </div>

      {/* ── HEAD SELECTOR ── */}
      <div className="viz-card">
        <SectionLabel>Walk Through One Head — Full Step-by-Step</SectionLabel>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
          {mha.heads.map((h, i) => (
            <button key={i} onClick={() => { setSelectedHead(i); setShowScoreMath(false); setShowSoftmaxMath(false); setShowValueMath(false); }} style={{
              padding: '10px 26px', borderRadius: '8px',
              border: `2px solid ${HEAD_COLORS[i]}`,
              background: selectedHead === i ? `${HEAD_COLORS[i]}22` : 'transparent',
              color: selectedHead === i ? HEAD_COLORS[i] : '#64748B',
              fontFamily: 'Space Mono, monospace', fontSize: '12px',
              fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {i === 0 ? '📐' : '💡'} Head {i + 1}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>

          {/* ─ STEP 1: COMPUTE Q ─ */}
          <StepRow n="1" color={hc} title={`Compute Q${head.head} — the "Questions" matrix`}>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 10px' }}>
              <strong style={{ color: '#E2E8F0' }}>Intuition:</strong> every token needs to ask
              "which other tokens should I pay attention to?" Q is the matrix of all those questions.
              <br />
              Each row of Q is one token's 4-number "question vector" — a compressed version of
              its original 8-number embedding, projected through Head {head.head}'s lens.
            </p>
            <ShapeEq
              a={`X  (${seqLen}×${CFG.EMBED_DIM})`}
              b={`Wq_h${head.head}  (${CFG.EMBED_DIM}×${CFG.HEAD_DIM})`}
              c={`Q${head.head}  (${seqLen}×${CFG.HEAD_DIM})`}
              color={hc}
            />
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
                Q{head.head} — each row = one token's question vector:
              </div>
              <MatrixViz matrix={head.Q} rowLabels={names} colLabels={colH} size="sm" />
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
              How to read: row "{names[0]}" is Head {head.head}'s projection of token "{names[0]}"
              into {CFG.HEAD_DIM}-dimensional question-space.
              The values themselves are not directly interpretable — what matters is how similar
              they are to other tokens' key vectors (computed next).
            </div>
          </StepRow>

          {/* ─ STEP 2: COMPUTE K ─ */}
          <StepRow n="2" color={hc} title={`Compute K${head.head} — the "Labels" matrix`}>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 10px' }}>
              <strong style={{ color: '#E2E8F0' }}>Intuition:</strong> while Q asks the question,
              K is the label each token puts on itself — "here is what I am".
              When a query and a key point in the same direction (high dot product), there is a match.
              <br />
              Same shape transform as Q.
            </p>
            <ShapeEq
              a={`X  (${seqLen}×${CFG.EMBED_DIM})`}
              b={`Wk_h${head.head}  (${CFG.EMBED_DIM}×${CFG.HEAD_DIM})`}
              c={`K${head.head}  (${seqLen}×${CFG.HEAD_DIM})`}
              color={hc}
            />
            <div style={{ marginTop: '12px' }}>
              <MatrixViz matrix={head.K} rowLabels={names} colLabels={colH} size="sm" />
            </div>
          </StepRow>

          {/* ─ STEP 3: COMPUTE V ─ */}
          <StepRow n="3" color={hc} title={`Compute V${head.head} — the "Content" matrix`}>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 10px' }}>
              <strong style={{ color: '#E2E8F0' }}>Intuition:</strong> Q and K decide
              <em> who talks to whom</em>. V is <em>what gets actually transferred</em>.
              Think of it this way:
            </p>
            <Box color="#06B6D4" icon="📚" title="Library analogy">
              You (Q) enter a library asking <em>"books on transformers"</em>.
              Each book has a title card (K). You match your query against title cards.
              Then you carry away <em>the books themselves</em> (V) in proportion to how well
              each title matched your query.
            </Box>
            <div style={{ marginTop: '12px' }}>
              <ShapeEq
                a={`X  (${seqLen}×${CFG.EMBED_DIM})`}
                b={`Wv_h${head.head}  (${CFG.EMBED_DIM}×${CFG.HEAD_DIM})`}
                c={`V${head.head}  (${seqLen}×${CFG.HEAD_DIM})`}
                color={hc}
              />
              <div style={{ marginTop: '10px' }}>
                <MatrixViz matrix={head.V} rowLabels={names} colLabels={colH} size="sm" />
              </div>
            </div>
          </StepRow>

          {/* ─ STEP 4: RAW SCORES ─ */}
          <StepRow n="4" color={hc} title={`Raw Attention Scores = Q${head.head} @ K${head.head}ᵀ ÷ √${CFG.HEAD_DIM}`}>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 10px' }}>
              We transpose K from <Chip>({seqLen}×{CFG.HEAD_DIM})</Chip> → <Chip>({CFG.HEAD_DIM}×{seqLen})</Chip>,
              then multiply with Q:
            </p>
            <ShapeEq
              a={`Q${head.head}  (${seqLen}×${CFG.HEAD_DIM})`}
              b={`K${head.head}ᵀ  (${CFG.HEAD_DIM}×${seqLen})`}
              c={`scores  (${seqLen}×${seqLen})`}
              color={hc}
            />
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '12px 0 10px' }}>
              Cell <Chip color={hc}>[i][j]</Chip> = dot product of token i's query with token j's key
              = "how interested is token i in token j?"
              <br />
              Then divide every cell by <Chip color="#F59E0B">√{CFG.HEAD_DIM} ≈ {Math.sqrt(CFG.HEAD_DIM).toFixed(2)}</Chip> to
              prevent very large values from saturating the softmax.
            </p>

            {/* SHOW MATH TOGGLE */}
            <button
              onClick={() => setShowScoreMath(v => !v)}
              style={{
                padding: '8px 16px', borderRadius: '6px', marginBottom: '12px',
                border: `1px solid ${hc}`, background: showScoreMath ? `${hc}22` : 'transparent',
                color: hc, fontFamily: 'Space Mono, monospace', fontSize: '11px',
                fontWeight: '700', cursor: 'pointer',
              }}
            >
              {showScoreMath ? '▼' : '▶'} SHOW THE DOT PRODUCT: how scores[0][0] is computed
            </button>

            {showScoreMath && (
              <div style={{
                background: '#0B0D17', border: `1px solid ${hc}44`, borderRadius: '8px',
                padding: '16px', marginBottom: '12px',
                fontFamily: 'Space Mono, monospace', fontSize: '12px',
              }}>
                <div style={{ color: '#64748B', marginBottom: '10px' }}>
                  scores[0][0] = Q{head.head}["{names[0]}"] · K{head.head}["{names[0]}"]
                </div>
                <div style={{ color: '#475569', fontSize: '11px', marginBottom: '8px' }}>
                  = sum of (each Q value × each K value), across {CFG.HEAD_DIM} dimensions:
                </div>
                {scoreMath.terms.map((t, i) => (
                  <div key={i} style={{ color: i % 2 === 0 ? '#E2E8F0' : '#94A3B8', lineHeight: '1.9' }}>
                    {'  '}Q[{i}]={t.qi.toFixed(3)}  ×  K[{i}]={t.ki.toFixed(3)}
                    {'  =  '}<span style={{ color: hc }}>{t.prod.toFixed(3)}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${hc}33`, paddingTop: '10px', marginTop: '8px', lineHeight: '2' }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Raw sum: </span>
                    <span style={{ color: '#E2E8F0' }}>{scoreMath.rawSum.toFixed(3)}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>÷ √{CFG.HEAD_DIM} = ÷{Math.sqrt(CFG.HEAD_DIM).toFixed(3)}: </span>
                    <span style={{ color: hc, fontWeight: '700' }}>{scoreMath.scaled.toFixed(3)}</span>
                    <span style={{ color: '#64748B' }}>  ← this is scores[0][0]</span>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '10px', lineHeight: '1.7' }}>
                  Meaning: in Head {head.head}'s view, token "{names[0]}" attending to itself
                  has a raw score of {scoreMath.scaled.toFixed(3)}.
                  After softmax this becomes a probability — how much of its attention to allocate there.
                </div>
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
              Full scaled score matrix ({seqLen}×{seqLen}) — before softmax:
            </div>
            <MatrixViz
              matrix={rawScores}
              rowLabels={names}
              colLabels={names}
              size="sm"
              showColorBar
            />
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px' }}>
              Row = "who is asking". Column = "who is being asked about".
              Bright cyan = high interest. Dark = low interest. Red = negative (this head actively
              suppresses that relationship).
            </div>
          </StepRow>

          {/* ─ STEP 5: SOFTMAX ─ */}
          <StepRow n="5" color={hc} title="Softmax → Attention Weights (rows sum to 1)">
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 10px' }}>
              <strong style={{ color: '#E2E8F0' }}>What softmax does:</strong> takes any numbers
              and converts them into <em>probabilities that sum to exactly 1.0</em> per row.
              Larger scores → larger probability. This gives us the actual attention percentages.
            </p>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
              Formula: <Chip color="#F59E0B">softmax(x)ᵢ = exp(xᵢ) / Σ exp(xⱼ)</Chip>
            </p>

            <button
              onClick={() => setShowSoftmaxMath(v => !v)}
              style={{
                padding: '8px 16px', borderRadius: '6px', marginBottom: '12px',
                border: `1px solid ${hc}`, background: showSoftmaxMath ? `${hc}22` : 'transparent',
                color: hc, fontFamily: 'Space Mono, monospace', fontSize: '11px',
                fontWeight: '700', cursor: 'pointer',
              }}
            >
              {showSoftmaxMath ? '▼' : '▶'} SHOW THE SOFTMAX: computing attention weights for "{names[0]}"
            </button>

            {showSoftmaxMath && (
              <div style={{
                background: '#0B0D17', border: `1px solid ${hc}44`, borderRadius: '8px',
                padding: '16px', marginBottom: '12px',
                fontFamily: 'Space Mono, monospace', fontSize: '12px', lineHeight: '2',
              }}>
                <div style={{ color: '#64748B', marginBottom: '4px' }}>
                  Row 0 (token "{names[0]}") raw scaled scores:
                </div>
                <div style={{ color: '#94A3B8' }}>
                  [{softmaxMath.row.map(x => x.toFixed(3)).join(',  ')}]
                </div>

                <div style={{ color: '#475569', fontSize: '11px', marginTop: '6px' }}>
                  Step 1: subtract max ({softmaxMath.maxVal.toFixed(3)}) from each — numerical stability trick
                  (prevents exp() overflow; does not change the result)
                </div>
                <div style={{ color: '#94A3B8' }}>
                  shifted: [{softmaxMath.row.map(x => r(x - softmaxMath.maxVal, 3).toFixed(3)).join(',  ')}]
                </div>

                <div style={{ color: '#475569', fontSize: '11px', marginTop: '6px' }}>
                  Step 2: apply exp() to each
                </div>
                <div style={{ color: '#94A3B8' }}>
                  exp():  [{softmaxMath.exps.map(x => x.toFixed(4)).join(',  ')}]
                </div>

                <div style={{ color: '#475569', fontSize: '11px', marginTop: '6px' }}>
                  Step 3: divide each by sum ({softmaxMath.sum.toFixed(4)})
                </div>
                <div style={{ color: hc, fontWeight: '700' }}>
                  weights: [{softmaxMath.out.map(x => x.toFixed(4)).join(',  ')}]
                </div>
                <div style={{ color: '#10B981', fontSize: '11px' }}>
                  ✓ Sum = {r(softmaxMath.out.reduce((a, b) => a + b, 0), 3).toFixed(3)}
                </div>

                <div style={{ marginTop: '10px', color: '#475569', fontSize: '11px', lineHeight: '1.7' }}>
                  Token "{names[0]}" allocates its attention as:{' '}
                  {softmaxMath.out.map((w, i) => `${(w * 100).toFixed(1)}% → "${names[i]}"`).join(', ')}
                </div>
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
              Full attention weight matrix (post-softmax) — each row sums to 1.0:
            </div>
            <AttentionHeatmap
              weights={head.scores}
              rowTokens={names}
              colTokens={names}
            />
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px', lineHeight: '1.6' }}>
              Bright yellow = that token is paying a lot of attention there.
              Dark = ignoring. Every row sums to 1.0 — these are percentages.
            </div>
          </StepRow>

          {/* ─ STEP 6: WEIGHTED SUM OF VALUES ─ */}
          <StepRow n="6" color={hc} title={`Head Output = Attention Weights @ V${head.head}`} last>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 10px' }}>
              <strong style={{ color: '#E2E8F0' }}>This is the actual information transfer.</strong>
              Each output token is a <em>weighted mixture of all tokens' value vectors</em>.
              If token A pays 80% attention to token B, then A's output will be 80% B's value vector
              and 20% everything else.
            </p>
            <ShapeEq
              a={`weights  (${seqLen}×${seqLen})`}
              b={`V${head.head}  (${seqLen}×${CFG.HEAD_DIM})`}
              c={`output  (${seqLen}×${CFG.HEAD_DIM})`}
              color={hc}
            />

            <button
              onClick={() => setShowValueMath(v => !v)}
              style={{
                padding: '8px 16px', borderRadius: '6px', margin: '12px 0',
                border: `1px solid ${hc}`, background: showValueMath ? `${hc}22` : 'transparent',
                color: hc, fontFamily: 'Space Mono, monospace', fontSize: '11px',
                fontWeight: '700', cursor: 'pointer',
              }}
            >
              {showValueMath ? '▼' : '▶'} SHOW THE WEIGHTED SUM: computing output["{names[0]}"]
            </button>

            {showValueMath && (
              <div style={{
                background: '#0B0D17', border: `1px solid ${hc}44`, borderRadius: '8px',
                padding: '16px', marginBottom: '12px',
                fontFamily: 'Space Mono, monospace', fontSize: '12px', lineHeight: '2',
              }}>
                <div style={{ color: '#64748B', marginBottom: '8px' }}>
                  output["{names[0]}"] = weighted sum of all V rows:
                </div>
                {valueMath.terms.map((t, i) => (
                  <div key={i} style={{ lineHeight: '1.9' }}>
                    <span style={{ color: '#475569' }}>{t.wi.toFixed(4)} × V["{names[i]}"]</span>
                    <span style={{ color: '#475569' }}> = [{t.wv.map(x => x.toFixed(3)).join(', ')}]</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${hc}33`, paddingTop: '10px', marginTop: '8px' }}>
                  <span style={{ color: '#64748B' }}>Add all rows: </span>
                  <span style={{ color: hc, fontWeight: '700' }}>
                    [{valueMath.out.map(x => x.toFixed(3)).join(', ')}]
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '10px', lineHeight: '1.7' }}>
                  This is Head {head.head}'s new representation of token "{names[0]}".
                  It is no longer a pure self-description — it contains borrowed information
                  from every other token, in proportion to the attention weights.
                </div>
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
              Head {head.head} output — shape ({seqLen}×{CFG.HEAD_DIM}):
            </div>
            <MatrixViz matrix={head.output} rowLabels={names} colLabels={colH} size="sm" />
          </StepRow>

        </div>
      </div>

      {/* ── BOTH HEADS SIDE BY SIDE ── */}
      <div className="viz-card">
        <SectionLabel>Both Heads Run Simultaneously — Compare Their Attention Patterns</SectionLabel>
        <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 16px' }}>
          Head 2 ran the exact same 6 steps in parallel, but used columns {CFG.HEAD_DIM}–{CFG.EMBED_DIM - 1}
          of Wq, Wk, Wv. Neither head knows the other exists — they are completely independent.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {mha.heads.map((hd, i) => (
            <div key={i}>
              <div style={{
                fontSize: '12px', fontWeight: '700', color: HEAD_COLORS[i],
                fontFamily: 'Space Mono, monospace', marginBottom: '8px',
              }}>
                {i === 0 ? '📐' : '💡'} Head {hd.head} — Attention Heatmap
              </div>
              <AttentionHeatmap weights={hd.scores} rowTokens={names} colTokens={names} />
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px', lineHeight: '1.6' }}>
                Output: ({seqLen}×{CFG.HEAD_DIM})
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '14px' }}>
          <Box color="#F59E0B" icon="👀" title="Notice: the patterns are different">
            If both heads had identical patterns, there would be no benefit to having two.
            The model learns during training to make each head specialise in
            something different — one might track syntax, another semantics.
          </Box>
        </div>
      </div>

      {/* ── CONCATENATION ── */}
      <div className="viz-card">
        <SectionLabel>Concatenation — Staple Both Heads' Outputs Together</SectionLabel>
        <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 14px' }}>
          No new math here — purely structural.
          For each token, we place Head 1's {CFG.HEAD_DIM} numbers <em>immediately followed by</em> Head 2's {CFG.HEAD_DIM} numbers.
          The result is a ({seqLen}×{CFG.EMBED_DIM}) matrix — back to the original embedding size.
        </p>
        <div style={{
          fontFamily: 'Space Mono, monospace', fontSize: '12px',
          background: '#0B0D17', border: '1px solid #1E2A45',
          borderRadius: '8px', padding: '14px', marginBottom: '14px', lineHeight: '2',
        }}>
          <div style={{ color: '#64748B' }}>For each token row i:</div>
          <div>
            <span style={{ color: HEAD_COLORS[0] }}>[ h1_f0, h1_f1, h1_f2, h1_f3 </span>
            <span style={{ color: HEAD_COLORS[1] }}>,  h2_f0, h2_f1, h2_f2, h2_f3 ]</span>
          </div>
          <div style={{ color: '#475569', fontSize: '11px' }}>
            {CFG.HEAD_DIM} numbers from Head 1  +  {CFG.HEAD_DIM} numbers from Head 2  =  {CFG.EMBED_DIM} numbers total
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: HEAD_COLORS[0], fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
              📐 Head 1 ({seqLen}×{CFG.HEAD_DIM})
            </div>
            <MatrixViz matrix={mha.heads[0].output} rowLabels={names} size="sm" />
          </div>
          <span style={{ color: '#8B5CF6', fontSize: '20px', paddingTop: '20px' }}>‖</span>
          <div>
            <div style={{ fontSize: '11px', color: HEAD_COLORS[1], fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
              💡 Head 2 ({seqLen}×{CFG.HEAD_DIM})
            </div>
            <MatrixViz matrix={mha.heads[1].output} rowLabels={names} size="sm" />
          </div>
          <span style={{ color: '#8B5CF6', fontSize: '22px', paddingTop: '20px' }}>→</span>
          <div>
            <div style={{ fontSize: '11px', color: '#8B5CF6', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
              Concatenated ({seqLen}×{CFG.EMBED_DIM})
            </div>
            <MatrixViz matrix={mha.concat} rowLabels={names} colLabels={col8} size="sm" />
          </div>
        </div>
      </div>

      {/* ── OUTPUT PROJECTION ── */}
      <div className="viz-card">
        <SectionLabel>Final Projection × Wₒ — Make the Two Heads Talk to Each Other</SectionLabel>
        <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
          After concatenation, Head 1's 4 numbers and Head 2's 4 numbers sit in the same row
          but have <em>never interacted</em>. Multiplying by <strong style={{ color: '#10B981' }}>Wₒ ({CFG.EMBED_DIM}×{CFG.EMBED_DIM})</strong>
          mixes every feature with every other feature — this is where the two heads' knowledge
          actually blends together.
        </p>
        <ShapeEq
          a={`concat  (${seqLen}×${CFG.EMBED_DIM})`}
          b={`Wₒ  (${CFG.EMBED_DIM}×${CFG.EMBED_DIM})`}
          c={`output  (${seqLen}×${CFG.EMBED_DIM})`}
          color="#10B981"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#8B5CF6', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
              Concatenated input
            </div>
            <MatrixViz matrix={mha.concat} rowLabels={names} size="sm" />
          </div>
          <div style={{ textAlign: 'center', paddingTop: '20px' }}>
            <div style={{ color: '#10B981', fontFamily: 'Space Mono, monospace', fontSize: '13px' }}>× Wₒ</div>
            <div style={{ color: '#475569', fontSize: '10px' }}>({CFG.EMBED_DIM}×{CFG.EMBED_DIM})</div>
          </div>
          <span style={{ color: '#10B981', fontSize: '22px', paddingTop: '20px' }}>→</span>
          <div>
            <div style={{ fontSize: '11px', color: '#10B981', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
              MHA output
            </div>
            <MatrixViz matrix={mha.output} rowLabels={names} colLabels={col8} size="sm" showColorBar />
          </div>
        </div>
      </div>

      {/* ── BEFORE / AFTER ── */}
      <div className="viz-card">
        <SectionLabel>Before vs After — Same Shape, Richer Content</SectionLabel>
        <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 14px' }}>
          Both matrices are ({seqLen}×{CFG.EMBED_DIM}). But the output vectors now contain
          <strong style={{ color: '#C4B5FD' }}> borrowed context from every other token</strong>,
          seen through two independent lenses.
        </p>
        <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
              BEFORE — X into MHA
            </div>
            <MatrixViz matrix={X2} rowLabels={names} colLabels={col8} size="sm" showColorBar />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#10B981', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
              AFTER — MHA output
            </div>
            <MatrixViz matrix={mha.output} rowLabels={names} colLabels={col8} size="sm" showColorBar />
          </div>
        </div>
      </div>

      {/* ── COMPLETE SUMMARY ── */}
      <InsightBox title="Complete Pipeline at a Glance">
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', lineHeight: '2.4' }}>
          <div><span style={{ color: '#06B6D4' }}>Input X</span> — shape ({seqLen},{CFG.EMBED_DIM})</div>
          <div style={{ paddingLeft: '16px', color: '#475569' }}>↓  slice Wq/Wk/Wv columns: [0:{CFG.HEAD_DIM}] → Head 1,  [{CFG.HEAD_DIM}:{CFG.EMBED_DIM}] → Head 2</div>
          <div style={{ paddingLeft: '16px', color: HEAD_COLORS[0] }}>
            Head 1:  Q₁@K₁ᵀ/√{CFG.HEAD_DIM} → softmax → ×V₁  →  ({seqLen},{CFG.HEAD_DIM})
          </div>
          <div style={{ paddingLeft: '16px', color: HEAD_COLORS[1] }}>
            Head 2:  Q₂@K₂ᵀ/√{CFG.HEAD_DIM} → softmax → ×V₂  →  ({seqLen},{CFG.HEAD_DIM})
          </div>
          <div style={{ paddingLeft: '16px', color: '#475569' }}>↓  concatenate side-by-side</div>
          <div><span style={{ color: '#8B5CF6' }}>Concat</span> — [{CFG.HEAD_DIM} head1 | {CFG.HEAD_DIM} head2] = ({seqLen},{CFG.EMBED_DIM})</div>
          <div style={{ paddingLeft: '16px', color: '#475569' }}>↓  × Wₒ  — mix the two heads</div>
          <div><span style={{ color: '#10B981' }}>Output</span> — ({seqLen},{CFG.EMBED_DIM})  — context-aware token representations</div>
        </div>
      </InsightBox>

    </div>
  );
}
