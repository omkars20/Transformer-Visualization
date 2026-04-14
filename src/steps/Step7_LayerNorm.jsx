import { useState, useMemo } from 'react';
import {
  MatrixViz, InsightBox, Formula, SectionLabel,
} from '../components/MatrixViz.jsx';
import { CFG, r } from '../utils/llmEngine.js';

// ─── Helpers ────────────────────────────────────────────────────────────────
function Box({ color = '#6366F1', icon, title, children }) {
  return (
    <div style={{
      background: `${color}0D`, border: `1px solid ${color}44`,
      borderLeft: `3px solid ${color}`, borderRadius: '8px', padding: '14px 16px',
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
      <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.8' }}>{children}</div>
    </div>
  );
}

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
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0', marginBottom: '12px', marginTop: '2px' }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

function Chip({ children, color = '#6366F1' }) {
  return (
    <span style={{
      fontFamily: 'Space Mono, monospace', fontSize: '11px',
      background: `${color}22`, border: `1px solid ${color}55`,
      borderRadius: '4px', padding: '1px 6px', color,
    }}>{children}</span>
  );
}

function ShapeEq({ a, op = '@', b, c, color }) {
  return (
    <div style={{
      fontFamily: 'Space Mono, monospace', fontSize: '12px',
      background: '#0B0D17', border: `1px solid ${color}44`,
      borderRadius: '8px', padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
    }}>
      <span style={{ color: '#94A3B8' }}>{a}</span>
      <span style={{ color: '#475569' }}>{op}</span>
      <span style={{ color: '#94A3B8' }}>{b}</span>
      <span style={{ color: '#475569' }}>=</span>
      <span style={{ color, fontWeight: '700' }}>{c}</span>
    </div>
  );
}

export default function Step7_LayerNorm({ result }) {
  if (!result) return null;
  const { tokens, X1, X2, attn, ffn, ln1, ln2 } = result;
  const seqLen = tokens.length;
  const names  = tokens.map(t => t.word);

  const [view, setView]                     = useState('after_attn');
  const [showNormMath, setShowNormMath]     = useState(false);
  const [showW1Math, setShowW1Math]         = useState(false);
  const [showResMath, setShowResMath]       = useState(false);

  // ── Derived data ──────────────────────────────────────────────────────────
  const col8  = Array.from({ length: CFG.EMBED_DIM }, (_, i) => `f${i}`);
  const col16 = Array.from({ length: CFG.FFN_DIM },   (_, i) => `h${i}`);

  // Layer-norm math for the currently visible normed matrix
  const normInput = view === 'after_attn' ? ln1.added  : ln2.added;
  const normedOut = view === 'after_attn' ? ln1.normed : ln2.normed;

  const normMath = useMemo(() => {
    const row  = normInput[0];
    const n    = row.length;
    const mean = row.reduce((a, b) => a + b, 0) / n;
    const diffs = row.map(x => x - mean);
    const sq    = diffs.map(d => d * d);
    const variance = sq.reduce((a, b) => a + b, 0) / n;
    const std  = Math.sqrt(variance + 1e-5);
    const norm = row.map(x => (x - mean) / std);
    return {
      row:      row.map(x => r(x, 4)),
      mean:     r(mean, 4),
      diffs:    diffs.map(x => r(x, 4)),
      sq:       sq.map(x => r(x, 5)),
      variance: r(variance, 5),
      std:      r(std, 4),
      norm:     norm.map(x => r(x, 4)),
      n,
    };
  }, [normInput]);

  // W1 dot product drill-down: h1_pre[0][0] = X2[0] · W1[:,0] + b1[0]
  const w1Math = useMemo(() => {
    const x   = X2[0];          // first token input (length 8)
    const col = ffn.W1.map(row => row[0]);  // first column of W1 (length 8)
    const b   = ffn.b1[0];
    const terms = x.map((xi, i) => ({ xi: r(xi, 4), wi: r(col[i], 4), prod: r(xi * col[i], 4) }));
    const dotSum = r(terms.reduce((s, t) => s + t.prod, 0), 4);
    const result = r(dotSum + b, 4);
    return { terms, dotSum, b: r(b, 4), result };
  }, [X2, ffn]);

  // Row stats for stats table
  const rowStats = normInput.map((row, i) => {
    const mean = row.reduce((a, b) => a + b, 0) / row.length;
    const variance = row.reduce((a, b) => a + (b - mean) ** 2, 0) / row.length;
    const std = Math.sqrt(variance);
    const nr = normedOut[i];
    const nm = nr.reduce((a, b) => a + b, 0) / nr.length;
    const ns = Math.sqrt(nr.reduce((a, b) => a + (b - nm) ** 2, 0) / nr.length);
    return { token: names[i], mean: r(mean, 3), std: r(std, 3), nm: r(nm, 3), ns: r(ns, 3) };
  });

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── HEADER ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{
            background: '#EF444422', border: '1px solid #EF4444', borderRadius: '8px',
            padding: '4px 12px', fontFamily: 'Space Mono, monospace', fontSize: '11px',
            color: '#EF4444', fontWeight: '700', letterSpacing: '1px',
          }}>STEP 7 OF 8</span>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#E2E8F0', margin: 0 }}>
            Residual + Layer Norm — Full Transformer Block
          </h2>
        </div>
        <p style={{ color: '#64748B', fontSize: '13px', margin: 0, lineHeight: '1.7' }}>
          This step ties everything together. We trace the <strong style={{ color: '#6366F1' }}>attention path</strong> and
          the <strong style={{ color: '#EC4899' }}>FFN path</strong> (W1, b1, W2, b2) all the way to the final
          normalized output — showing exactly where every number comes from.
        </p>
      </div>

      {/* ── FULL PIPELINE DIAGRAM ── */}
      <div className="viz-card">
        <SectionLabel>The Full Transformer Block — Where We Are</SectionLabel>
        <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 14px' }}>
          One transformer block contains <strong style={{ color: '#E2E8F0' }}>two identical "sublayer + residual + norm"
          patterns</strong>. The first uses attention, the second uses the FFN.
          Step 7 covers BOTH of them.
        </p>
        <div style={{
          fontFamily: 'Space Mono, monospace', fontSize: '12px',
          background: '#0B0D17', border: '1px solid #1E2A45',
          borderRadius: '10px', padding: '20px', lineHeight: '2.6',
        }}>
          <div style={{ color: '#06B6D4' }}>X1   ← input (after pos encoding)</div>
          <div style={{ display: 'flex', gap: '0', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px' }}>
              <div style={{ color: '#475569' }}>↓ ┌─────────────────────────────┐</div>
              <div style={{ color: '#6366F1' }}>  │   Multi-Head Attention       │  ← Step 5</div>
              <div style={{ color: '#475569' }}>  └─────────────────────────────┘</div>
            </div>
          </div>
          <div style={{ color: '#6366F1', paddingLeft: '16px' }}>
            attn.output  ← the new information attention found
          </div>
          <div style={{ color: '#475569', paddingLeft: '16px' }}>
            ↓ X1 + attn.output  ← <span style={{ color: '#6366F1' }}>residual (keep original + add new)</span>
          </div>
          <div style={{ color: '#6366F1', paddingLeft: '16px' }}>
            ↓ LayerNorm  →  <span style={{ color: '#10B981' }}>X2  ← "After Attention" tab</span>
          </div>
          <div style={{ display: 'flex', gap: '0', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px' }}>
              <div style={{ color: '#475569' }}>↓ ┌────────────────────────────────────────┐</div>
              <div style={{ color: '#EC4899' }}>  │   FFN:  X2 @ W1 + b1 → ReLU → @ W2 + b2  │  ← Step 6</div>
              <div style={{ color: '#475569' }}>  └────────────────────────────────────────┘</div>
            </div>
          </div>
          <div style={{ color: '#EC4899', paddingLeft: '16px' }}>
            ffn.output  ← each token thinks privately
          </div>
          <div style={{ color: '#475569', paddingLeft: '16px' }}>
            ↓ X2 + ffn.output  ← <span style={{ color: '#EC4899' }}>residual</span>
          </div>
          <div style={{ color: '#EC4899', paddingLeft: '16px' }}>
            ↓ LayerNorm  →  <span style={{ color: '#10B981' }}>X3  ← "After FFN" tab</span>
          </div>
          <div style={{ color: '#F97316' }}>X3  → Step 8 (output prediction)</div>
        </div>
      </div>

      {/* ── TAB SELECTOR ── */}
      <div>
        <div style={{ fontSize: '12px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '10px' }}>
          SELECT WHICH SUBLAYER TO TRACE IN DETAIL:
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { id: 'after_attn', label: 'After Attention (first sublayer)',  color: '#6366F1' },
            { id: 'after_ffn',  label: 'After FFN (second sublayer)',       color: '#EC4899' },
          ].map(v => (
            <button key={v.id} onClick={() => { setView(v.id); setShowNormMath(false); setShowW1Math(false); setShowResMath(false); }} style={{
              padding: '10px 22px', borderRadius: '8px', border: `2px solid ${v.color}`,
              background: view === v.id ? `${v.color}22` : 'transparent',
              color: view === v.id ? v.color : '#64748B',
              fontFamily: 'Space Mono, monospace', fontSize: '11px',
              fontWeight: view === v.id ? '700' : '400', cursor: 'pointer', transition: 'all 0.15s',
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          AFTER ATTENTION VIEW
      ═══════════════════════════════════════════════════════════════════════ */}
      {view === 'after_attn' && (
        <div className="viz-card">
          <SectionLabel>After Attention — Step by Step</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '8px' }}>

            {/* STEP 1: What came from attention */}
            <StepRow n="1" color="#6366F1" title="What arrived from Multi-Head Attention (Step 5)">
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
                Multi-Head Attention produced a new matrix <Chip color="#6366F1">attn.output</Chip> —
                same shape as the input <Chip>({seqLen}×{CFG.EMBED_DIM})</Chip>.
                Every token's row is now a <em>context-aware blend</em> of all tokens' value vectors,
                but it hasn't been added back to the original yet.
              </p>
              <div style={{ fontSize: '11px', color: '#6366F1', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
                attn.output — what Multi-Head Attention produced ({seqLen}×{CFG.EMBED_DIM}):
              </div>
              <MatrixViz matrix={attn.output} rowLabels={names} colLabels={col8} size="sm" showColorBar />
            </StepRow>

            {/* STEP 2: Residual */}
            <StepRow n="2" color="#F59E0B" title="Residual Addition — X1 + attn.output">
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
                <strong style={{ color: '#E2E8F0' }}>Why add the original back?</strong>
                Attention rewrites the token vectors. But rewriting from scratch loses the original
                information. Adding X1 back means: "keep everything you knew before, then ADD what
                attention found on top." This is why it's called a <em>residual</em> — it's the
                leftover/original that we preserve.
              </p>
              <Box color="#F59E0B" icon="✏️" title="Essay analogy">
                You write a first draft (X1). A review committee (Attention) gives you notes (attn.output).
                Instead of throwing away your draft and rewriting, you keep the draft and
                <em> add the notes on top</em>. That's exactly what this addition does.
              </Box>

              <button onClick={() => setShowResMath(v => !v)} style={{
                padding: '8px 16px', borderRadius: '6px', margin: '12px 0',
                border: '1px solid #F59E0B', background: showResMath ? '#F59E0B22' : 'transparent',
                color: '#F59E0B', fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
              }}>
                {showResMath ? '▼' : '▶'} SHOW: how combined["{names[0]}"][0] is computed
              </button>

              {showResMath && (
                <div style={{
                  background: '#0B0D17', border: '1px solid #F59E0B33', borderRadius: '8px',
                  padding: '16px', marginBottom: '12px', fontFamily: 'Space Mono, monospace', fontSize: '12px', lineHeight: '2',
                }}>
                  <div style={{ color: '#64748B', marginBottom: '8px' }}>
                    combined["{names[0]}"] = X1["{names[0]}"] + attn.output["{names[0]}"]
                    &nbsp;← element by element
                  </div>
                  {X1[0].map((v, j) => (
                    <div key={j} style={{ color: j % 2 === 0 ? '#E2E8F0' : '#94A3B8' }}>
                      dim[{j}]: {r(v, 4).toFixed(4)}
                      &nbsp;+&nbsp;{r(attn.output[0][j], 4).toFixed(4)}
                      &nbsp;=&nbsp;<span style={{ color: '#F59E0B', fontWeight: '700' }}>{r(X1[0][j] + attn.output[0][j], 4).toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>X1 (original before attention)</div>
                  <MatrixViz matrix={X1} rowLabels={names} size="sm" />
                </div>
                <div style={{ paddingTop: '18px', textAlign: 'center' }}>
                  <div style={{ color: '#F59E0B', fontSize: '26px', fontWeight: '700' }}>+</div>
                  <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'Space Mono, monospace' }}>element-wise</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6366F1', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>attn.output (new context)</div>
                  <MatrixViz matrix={attn.output} rowLabels={names} size="sm" />
                </div>
                <div style={{ paddingTop: '18px', color: '#F59E0B', fontSize: '22px' }}>→</div>
                <div>
                  <div style={{ fontSize: '11px', color: '#F59E0B', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>Combined (before norm)</div>
                  <MatrixViz matrix={ln1.added} rowLabels={names} colLabels={col8} size="sm" showColorBar />
                </div>
              </div>
            </StepRow>

            {/* STEP 3: Layer Norm */}
            <StepRow n="3" color="#10B981" title="Layer Normalization — rescale each token to mean=0, std=1" last>
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
                Each token's row of {CFG.EMBED_DIM} numbers is rescaled <em>independently</em>.
                The 4 sub-steps: compute mean → subtract it → compute std → divide by it.
                Relative ordering preserved, scale made consistent.
              </p>

              <button onClick={() => setShowNormMath(v => !v)} style={{
                padding: '8px 16px', borderRadius: '6px', marginBottom: '12px',
                border: '1px solid #10B981', background: showNormMath ? '#10B98122' : 'transparent',
                color: '#10B981', fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
              }}>
                {showNormMath ? '▼' : '▶'} SHOW LAYER NORM MATH for token "{names[0]}"
              </button>

              {showNormMath && (
                <div style={{
                  background: '#0B0D17', border: '1px solid #10B98133', borderRadius: '8px',
                  padding: '18px', marginBottom: '14px', fontFamily: 'Space Mono, monospace', fontSize: '12px',
                }}>
                  <div style={{ color: '#64748B', marginBottom: '10px' }}>
                    Input row (token "{names[0]}", {normMath.n} numbers):
                  </div>
                  <div style={{ color: '#94A3B8', marginBottom: '16px' }}>[{normMath.row.join(',  ')}]</div>

                  <div style={{ borderLeft: '2px solid #06B6D4', paddingLeft: '12px', marginBottom: '14px' }}>
                    <div style={{ color: '#06B6D4', fontWeight: '700', marginBottom: '4px' }}>Sub-step 1 — mean</div>
                    <div style={{ color: '#94A3B8' }}>
                      ({normMath.row.join(' + ')}) ÷ {normMath.n} = <span style={{ color: '#06B6D4', fontWeight: '700' }}>{normMath.mean}</span>
                    </div>
                  </div>

                  <div style={{ borderLeft: '2px solid #6366F1', paddingLeft: '12px', marginBottom: '14px' }}>
                    <div style={{ color: '#6366F1', fontWeight: '700', marginBottom: '4px' }}>Sub-step 2 — subtract mean from each value</div>
                    {normMath.row.map((v, i) => (
                      <div key={i} style={{ color: i % 2 === 0 ? '#E2E8F0' : '#94A3B8', lineHeight: '1.8' }}>
                        {v.toFixed(4)} − {normMath.mean} = <span style={{ color: '#6366F1' }}>{normMath.diffs[i].toFixed(4)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderLeft: '2px solid #F59E0B', paddingLeft: '12px', marginBottom: '14px' }}>
                    <div style={{ color: '#F59E0B', fontWeight: '700', marginBottom: '4px' }}>Sub-step 3 — compute std</div>
                    <div style={{ color: '#94A3B8', lineHeight: '1.8' }}>
                      diffs²: [{normMath.sq.join(', ')}]
                    </div>
                    <div style={{ color: '#94A3B8' }}>variance = sum ÷ {normMath.n} = <span style={{ color: '#F59E0B' }}>{normMath.variance}</span></div>
                    <div style={{ color: '#94A3B8' }}>std = √({normMath.variance} + 1e-5) = <span style={{ color: '#F59E0B', fontWeight: '700' }}>{normMath.std}</span></div>
                  </div>

                  <div style={{ borderLeft: '2px solid #10B981', paddingLeft: '12px' }}>
                    <div style={{ color: '#10B981', fontWeight: '700', marginBottom: '4px' }}>Sub-step 4 — divide each diff by std</div>
                    {normMath.diffs.map((d, i) => (
                      <div key={i} style={{ color: i % 2 === 0 ? '#E2E8F0' : '#94A3B8', lineHeight: '1.8' }}>
                        {d.toFixed(4)} ÷ {normMath.std} = <span style={{ color: '#10B981', fontWeight: '700' }}>{normMath.norm[i].toFixed(4)}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: '8px', color: '#475569', fontSize: '11px' }}>
                      mean of output ≈ {r(normMath.norm.reduce((a, b) => a + b, 0) / normMath.n, 4)} ≈ 0 ✓  &nbsp;&nbsp; spread ≈ 1 ✓
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#F59E0B', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>Before norm</div>
                  <MatrixViz matrix={ln1.added} rowLabels={names} size="sm" showColorBar />
                </div>
                <div style={{ paddingTop: '18px', textAlign: 'center' }}>
                  <div style={{ color: '#10B981', fontFamily: 'Space Mono, monospace', fontSize: '10px' }}>Layer Norm</div>
                  <div style={{ color: '#10B981', fontSize: '24px' }}>→</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#10B981', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>After norm = X2 (feeds into FFN)</div>
                  <MatrixViz matrix={ln1.normed} rowLabels={names} colLabels={col8} size="sm" showColorBar />
                </div>
              </div>
            </StepRow>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          AFTER FFN VIEW
      ═══════════════════════════════════════════════════════════════════════ */}
      {view === 'after_ffn' && (
        <div className="viz-card">
          <SectionLabel>After FFN — Full Story: W1, b1, ReLU, W2, b2, Residual, LayerNorm</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '8px' }}>

            {/* STEP 1: Input to FFN */}
            <StepRow n="1" color="#EC4899" title="Starting point — X2 (output of first residual+norm)">
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
                X2 is the result of the first residual+norm (the "After Attention" tab).
                It has shape <Chip>({seqLen}×{CFG.EMBED_DIM})</Chip>.
                This is the input to the FFN. Every token processes itself privately from here.
              </p>
              <div style={{ fontSize: '11px', color: '#EC4899', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
                X2 — input to FFN ({seqLen}×{CFG.EMBED_DIM}):
              </div>
              <MatrixViz matrix={X2} rowLabels={names} colLabels={col8} size="sm" showColorBar />
            </StepRow>

            {/* STEP 2: W1 and b1 */}
            <StepRow n="2" color="#06B6D4" title={`W1 + b1 — Expand from ${CFG.EMBED_DIM} to ${CFG.FFN_DIM} dimensions`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* What is W1 */}
                <Box color="#06B6D4" icon="🔬" title={`What is W1? — shape (${CFG.EMBED_DIM}×${CFG.FFN_DIM})`}>
                  W1 is a learned weight matrix with <strong style={{ color: '#67E8F9' }}>{CFG.EMBED_DIM} rows and {CFG.FFN_DIM} columns</strong>.
                  <br /><br />
                  When you multiply a token vector <Chip color="#06B6D4">(1×{CFG.EMBED_DIM})</Chip> by W1 <Chip color="#06B6D4">({CFG.EMBED_DIM}×{CFG.FFN_DIM})</Chip>
                  you get a new vector <Chip color="#06B6D4">(1×{CFG.FFN_DIM})</Chip>.
                  <br /><br />
                  Think of each of the {CFG.FFN_DIM} output dimensions as a different "question" the FFN asks:
                  "how much does this token's {CFG.EMBED_DIM} features activate concept #0?
                  concept #1? … concept #15?"
                  W1 holds the {CFG.EMBED_DIM}×{CFG.FFN_DIM} = {CFG.EMBED_DIM * CFG.FFN_DIM} learned weights for all those questions.
                </Box>

                {/* What is b1 */}
                <Box color="#8B5CF6" icon="➕" title={`What is b1? — shape (${CFG.FFN_DIM},)`}>
                  b1 is a <strong style={{ color: '#C4B5FD' }}>bias vector</strong> with {CFG.FFN_DIM} numbers — one per hidden dimension.
                  <br /><br />
                  After the matrix multiply (X2 @ W1), we ADD b1 to every row.
                  Each bias adjusts the "default activation level" of that hidden dimension before any input is considered.
                  <br /><br />
                  Without bias: if all inputs were 0, all outputs would be 0.
                  With bias: even with zero input, each hidden unit starts at its own learned baseline.
                </Box>

                {/* The shape equation */}
                <ShapeEq
                  a={`X2  (${seqLen}×${CFG.EMBED_DIM})`}
                  b={`W1  (${CFG.EMBED_DIM}×${CFG.FFN_DIM})`}
                  c={`h1_pre  (${seqLen}×${CFG.FFN_DIM})  ← then + b1`}
                  color="#06B6D4"
                />

                {/* The expansion */}
                <div style={{
                  fontFamily: 'Space Mono, monospace', fontSize: '12px',
                  background: '#0B0D17', border: '1px solid #06B6D433',
                  borderRadius: '8px', padding: '14px', lineHeight: '2.2',
                }}>
                  <div style={{ color: '#64748B' }}>Why expand {CFG.EMBED_DIM} → {CFG.FFN_DIM}?</div>
                  <div style={{ color: '#94A3B8', marginTop: '6px' }}>
                    More dimensions = more "thinking room". The FFN can represent richer
                    intermediate concepts in the high-dimensional space before compressing
                    back down. This is exactly why FFN_DIM = 2× EMBED_DIM in this model
                    ({CFG.FFN_DIM} = {CFG.EMBED_DIM * 2}). Real GPT uses 4× ({768}→{3072}).
                  </div>
                </div>

                {/* W1 dot product drill-down */}
                <button onClick={() => setShowW1Math(v => !v)} style={{
                  padding: '8px 16px', borderRadius: '6px',
                  border: '1px solid #06B6D4', background: showW1Math ? '#06B6D422' : 'transparent',
                  color: '#06B6D4', fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                }}>
                  {showW1Math ? '▼' : '▶'} SHOW HOW h1_pre["{names[0]}"][0] is computed from W1 and b1
                </button>

                {showW1Math && (
                  <div style={{
                    background: '#0B0D17', border: '1px solid #06B6D433', borderRadius: '8px',
                    padding: '18px', fontFamily: 'Space Mono, monospace', fontSize: '12px', lineHeight: '2',
                  }}>
                    <div style={{ color: '#64748B', marginBottom: '10px' }}>
                      h1_pre["{names[0]}"][dim 0] = X2["{names[0]}"] · W1[:,0]  +  b1[0]
                    </div>
                    <div style={{ color: '#475569', fontSize: '11px', marginBottom: '8px' }}>
                      = sum of (each input value × each weight in column 0 of W1), then + bias:
                    </div>

                    {w1Math.terms.map((t, i) => (
                      <div key={i} style={{ color: i % 2 === 0 ? '#E2E8F0' : '#94A3B8' }}>
                        X2[{i}]={t.xi.toFixed(4)}  ×  W1[{i}][0]={t.wi.toFixed(4)}
                        {'  =  '}<span style={{ color: '#06B6D4' }}>{t.prod.toFixed(4)}</span>
                      </div>
                    ))}

                    <div style={{ borderTop: '1px solid #06B6D433', paddingTop: '10px', marginTop: '8px' }}>
                      <div style={{ color: '#94A3B8' }}>
                        dot product sum: <span style={{ color: '#06B6D4' }}>{w1Math.dotSum.toFixed(4)}</span>
                      </div>
                      <div style={{ color: '#94A3B8' }}>
                        + b1[0] = <span style={{ color: '#8B5CF6' }}>{w1Math.b.toFixed(4)}</span>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ color: '#64748B' }}>h1_pre["{names[0]}"][0] = </span>
                        <span style={{ color: '#06B6D4', fontWeight: '700', fontSize: '14px' }}>{w1Math.result.toFixed(4)}</span>
                      </div>
                    </div>
                    <div style={{ color: '#475569', fontSize: '11px', marginTop: '10px', lineHeight: '1.7' }}>
                      Repeat this for all {CFG.FFN_DIM} output dimensions → one full row of h1_pre.
                      Repeat for all {seqLen} tokens → the full h1_pre matrix.
                    </div>
                  </div>
                )}

                {/* W1 matrix */}
                <div>
                  <div style={{ fontSize: '11px', color: '#06B6D4', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
                    W1 — the weight matrix ({CFG.EMBED_DIM}×{CFG.FFN_DIM}):
                  </div>
                  <MatrixViz matrix={ffn.W1} colLabels={col16} size="sm" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#8B5CF6', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
                    b1 — the bias vector ({CFG.FFN_DIM},) — one number per hidden dim:
                  </div>
                  <MatrixViz matrix={[ffn.b1]} colLabels={col16} size="sm" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#06B6D4', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
                    h1_pre = X2 @ W1 + b1 — result before ReLU ({seqLen}×{CFG.FFN_DIM}):
                  </div>
                  <MatrixViz matrix={ffn.h1_pre} rowLabels={names} colLabels={col16} size="sm" maxCols={CFG.FFN_DIM} showColorBar />
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>
                    Mix of positive and negative values. Next step kills all the negatives.
                  </div>
                </div>
              </div>
            </StepRow>

            {/* STEP 3: ReLU */}
            <StepRow n="3" color="#F59E0B" title="ReLU — kill all negative values">
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
                <Chip color="#F59E0B">ReLU(x) = max(0, x)</Chip>
                <br /><br />
                The simplest possible filter: if a number is negative → set it to 0. If positive → keep it.
                Why? A negative hidden value means "this concept does NOT apply here."
                Setting it to zero tells the next layer to ignore that concept completely.
                Only the neurons that "fire" (positive) carry information forward.
              </p>
              <div style={{
                fontFamily: 'Space Mono, monospace', fontSize: '12px',
                background: '#0B0D17', border: '1px solid #F59E0B33',
                borderRadius: '8px', padding: '14px', lineHeight: '2', marginBottom: '12px',
              }}>
                <div style={{ color: '#64748B' }}>Example values from h1_pre["{names[0]}"]:  (showing first 6)</div>
                {ffn.h1_pre[0].slice(0, 6).map((v, i) => (
                  <div key={i} style={{ color: '#94A3B8' }}>
                    dim[{i}]: {r(v, 4).toFixed(4)}
                    {'  →  ReLU →  '}
                    <span style={{ color: v >= 0 ? '#10B981' : '#EF4444', fontWeight: '700' }}>
                      {v >= 0 ? r(v, 4).toFixed(4) : '0.0000'}
                    </span>
                    <span style={{ color: '#475569', fontSize: '10px', marginLeft: '8px' }}>
                      {v >= 0 ? '✓ kept' : '✗ zeroed'}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#EC4899', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>Before ReLU (h1_pre)</div>
                  <MatrixViz matrix={ffn.h1_pre} rowLabels={names} size="sm" maxCols={CFG.FFN_DIM} showColorBar />
                </div>
                <div style={{ paddingTop: '18px', textAlign: 'center' }}>
                  <div style={{ color: '#F59E0B', fontFamily: 'Space Mono, monospace', fontSize: '10px' }}>max(0,x)</div>
                  <div style={{ color: '#F59E0B', fontSize: '24px' }}>→</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#F59E0B', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>After ReLU (h1_relu) — negatives are 0</div>
                  <MatrixViz matrix={ffn.h1_relu} rowLabels={names} colLabels={col16} size="sm" maxCols={CFG.FFN_DIM} showColorBar />
                </div>
              </div>
            </StepRow>

            {/* STEP 4: W2 and b2 */}
            <StepRow n="4" color="#10B981" title={`W2 + b2 — Shrink back from ${CFG.FFN_DIM} to ${CFG.EMBED_DIM}`}>
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
                W2 is shape <Chip color="#10B981">({CFG.FFN_DIM}×{CFG.EMBED_DIM})</Chip> — the reverse of W1.
                It compresses the {CFG.FFN_DIM} filtered concepts back into the {CFG.EMBED_DIM}-dim space.
                b2 is a ({CFG.EMBED_DIM},) bias, one per output dimension.
              </p>
              <Box color="#10B981" icon="🗜️" title="Why shrink back?">
                We expanded to {CFG.FFN_DIM} to get more "thinking room", but the rest of the
                transformer (next layers, attention, output) all expect {CFG.EMBED_DIM}-dim vectors.
                W2 summarises the expanded thinking back into the standard size.
                Think of it as: brainstorm freely in a big space, then write a concise summary.
              </Box>
              <div style={{ marginTop: '12px' }}>
                <ShapeEq
                  a={`h1_relu  (${seqLen}×${CFG.FFN_DIM})`}
                  b={`W2  (${CFG.FFN_DIM}×${CFG.EMBED_DIM})`}
                  c={`ffn.output  (${seqLen}×${CFG.EMBED_DIM})  ← then + b2`}
                  color="#10B981"
                />
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#10B981', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
                    ffn.output — result ({seqLen}×{CFG.EMBED_DIM}):
                  </div>
                  <MatrixViz matrix={ffn.output} rowLabels={names} colLabels={col8} size="sm" showColorBar />
                </div>
              </div>
            </StepRow>

            {/* STEP 5: Second Residual */}
            <StepRow n="5" color="#F59E0B" title="Second Residual — X2 + ffn.output">
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
                Same pattern as after attention: keep the original (X2) and ADD the FFN's contribution on top.
                X2 has the attention-enriched information; ffn.output has the private-thinking
                contribution. Together they form the most complete representation of each token so far.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>X2 (before FFN)</div>
                  <MatrixViz matrix={X2} rowLabels={names} size="sm" />
                </div>
                <div style={{ paddingTop: '18px', textAlign: 'center' }}>
                  <div style={{ color: '#F59E0B', fontSize: '26px', fontWeight: '700' }}>+</div>
                  <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'Space Mono, monospace' }}>element-wise</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#10B981', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>ffn.output (FFN contribution)</div>
                  <MatrixViz matrix={ffn.output} rowLabels={names} size="sm" />
                </div>
                <div style={{ paddingTop: '18px', color: '#F59E0B', fontSize: '22px' }}>→</div>
                <div>
                  <div style={{ fontSize: '11px', color: '#F59E0B', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>Combined (before 2nd norm)</div>
                  <MatrixViz matrix={ln2.added} rowLabels={names} colLabels={col8} size="sm" showColorBar />
                </div>
              </div>
            </StepRow>

            {/* STEP 6: Second Layer Norm */}
            <StepRow n="6" color="#10B981" title="Second Layer Norm — normalize to mean=0, std=1 → X3" last>
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
                Same 4-sub-step normalization as before. After this, we have X3 — the final
                hidden state that goes to Step 8 for prediction.
              </p>
              <button onClick={() => setShowNormMath(v => !v)} style={{
                padding: '8px 16px', borderRadius: '6px', marginBottom: '12px',
                border: '1px solid #10B981', background: showNormMath ? '#10B98122' : 'transparent',
                color: '#10B981', fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
              }}>
                {showNormMath ? '▼' : '▶'} SHOW LAYER NORM MATH for token "{names[0]}"
              </button>

              {showNormMath && (
                <div style={{
                  background: '#0B0D17', border: '1px solid #10B98133', borderRadius: '8px',
                  padding: '18px', marginBottom: '14px', fontFamily: 'Space Mono, monospace', fontSize: '12px',
                }}>
                  <div style={{ color: '#64748B', marginBottom: '10px' }}>
                    Input: combined["{names[0]}"] = [{normMath.row.join(', ')}]
                  </div>
                  <div style={{ color: '#06B6D4' }}>mean = {normMath.mean}</div>
                  <div style={{ color: '#6366F1' }}>diffs = [{normMath.diffs.join(', ')}]</div>
                  <div style={{ color: '#F59E0B' }}>std = √({normMath.variance} + 1e-5) = {normMath.std}</div>
                  <div style={{ color: '#10B981', fontWeight: '700' }}>normalized = [{normMath.norm.join(', ')}]</div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#F59E0B', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>Before norm</div>
                  <MatrixViz matrix={ln2.added} rowLabels={names} size="sm" showColorBar />
                </div>
                <div style={{ paddingTop: '18px', textAlign: 'center' }}>
                  <div style={{ color: '#10B981', fontFamily: 'Space Mono, monospace', fontSize: '10px' }}>Layer Norm</div>
                  <div style={{ color: '#10B981', fontSize: '24px' }}>→</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#10B981', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>X3 = after norm → goes to Step 8</div>
                  <MatrixViz matrix={ln2.normed} rowLabels={names} colLabels={col8} size="sm" showColorBar />
                </div>
              </div>

              {/* Stats table */}
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #1E2A45', marginTop: '16px' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: 'Space Mono, monospace', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#0B0D17' }}>
                      {['Token', 'Mean before', 'Std before', 'Mean after (→ ~0)', 'Std after (→ ~1)'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', borderBottom: '1px solid #1E2A45', fontWeight: '700', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rowStats.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #131728' }}>
                        <td style={{ padding: '8px 14px', color: '#EC4899', fontWeight: '700' }}>"{s.token}"</td>
                        <td style={{ padding: '8px 14px', color: '#94A3B8' }}>{s.mean}</td>
                        <td style={{ padding: '8px 14px', color: '#94A3B8' }}>{s.std}</td>
                        <td style={{ padding: '8px 14px', color: Math.abs(s.nm) < 0.05 ? '#10B981' : '#F59E0B', fontWeight: '600' }}>
                          {s.nm} {Math.abs(s.nm) < 0.05 ? '✓' : '≈ 0'}
                        </td>
                        <td style={{ padding: '8px 14px', color: Math.abs(s.ns - 1) < 0.15 ? '#10B981' : '#F59E0B', fontWeight: '600' }}>
                          {s.ns} {Math.abs(s.ns - 1) < 0.15 ? '✓' : '≈ 1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </StepRow>

          </div>
        </div>
      )}

      {/* ── FORMULA ── */}
      <Formula>
        {`// After Attention:
X_combined = X1 + attn.output            ← residual (element-wise add)
X2 = LayerNorm(X_combined)               ← normalize each token row

// FFN (applied independently to each token):
h1_pre  = X2 @ W1 + b1                  W1:(${CFG.EMBED_DIM}×${CFG.FFN_DIM})  b1:(${CFG.FFN_DIM},)  → expand ${CFG.EMBED_DIM}→${CFG.FFN_DIM}
h1_relu = max(0, h1_pre)                ← ReLU: kill negatives
ffn_out = h1_relu @ W2 + b2             W2:(${CFG.FFN_DIM}×${CFG.EMBED_DIM})  b2:(${CFG.EMBED_DIM},)  → shrink ${CFG.FFN_DIM}→${CFG.EMBED_DIM}

// After FFN:
X_combined2 = X2 + ffn_out              ← residual
X3 = LayerNorm(X_combined2)             ← normalize → goes to Step 8`}
      </Formula>

      {/* ── INSIGHT ── */}
      <InsightBox title="Why All Four Operations (W1, b1, W2, b2) Together?">
        <strong style={{ color: '#E2E8F0' }}>W1 + b1</strong> is the "brainstorm" step —
        expand into a larger space and explore richer intermediate concepts.
        Without bias (b1), zero-input tokens would always produce zero intermediate values,
        limiting expressiveness.
        <br /><br />
        <strong style={{ color: '#E2E8F0' }}>ReLU</strong> introduces non-linearity —
        without it, two matrix multiplies (W1 and W2) would collapse into one, making the FFN no
        more powerful than a single linear layer.
        <br /><br />
        <strong style={{ color: '#E2E8F0' }}>W2 + b2</strong> is the "summarise" step —
        compress the rich intermediate representation back to the model's working size.
        <br /><br />
        The two <strong style={{ color: '#E2E8F0' }}>residuals + layer norms</strong> ensure the
        model can be stacked dozens of times without gradients exploding or vanishing.
      </InsightBox>

    </div>
  );
}
