import React, { useState, useMemo } from 'react';
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

export default function Step7_LayerNorm({ result }) {
  if (!result) return null;
  const { tokens, X1, X2, attn, ffn, ln1, ln2 } = result;
  const seqLen  = tokens.length;
  const names   = tokens.map(t => t.word);

  const [view, setView]             = useState('after_attn');
  const [showNormMath, setShowNormMath] = useState(false);

  const views = [
    { id: 'after_attn', label: 'After Attention', color: '#6366F1' },
    { id: 'after_ffn',  label: 'After FFN',       color: '#EC4899' },
  ];

  const cur = view === 'after_attn'
    ? { before: X1, residual: attn.output, added: ln1.added, normed: ln1.normed, label: 'Attention', color: '#6366F1' }
    : { before: X2, residual: ffn.output,  added: ln2.added, normed: ln2.normed, label: 'FFN',       color: '#EC4899' };

  // Stats table
  const rowStats = cur.added.map((row, i) => {
    const mean = row.reduce((a, b) => a + b, 0) / row.length;
    const variance = row.reduce((a, b) => a + (b - mean) ** 2, 0) / row.length;
    const std = Math.sqrt(variance);
    const nr = cur.normed[i];
    const nm = nr.reduce((a, b) => a + b, 0) / nr.length;
    const ns = Math.sqrt(nr.reduce((a, b) => a + (b - nm) ** 2, 0) / nr.length);
    return { token: names[i], mean: r(mean, 3), std: r(std, 3), normMean: r(nm, 3), normStd: r(ns, 3) };
  });

  // Full layer-norm drill-down for token 0
  const normMath = useMemo(() => {
    const row = cur.added[0];
    const n   = row.length;
    const mean = row.reduce((a, b) => a + b, 0) / n;
    const diffs = row.map(x => x - mean);
    const squaredDiffs = diffs.map(d => d * d);
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
    const eps = 1e-5;
    const std = Math.sqrt(variance + eps);
    const normalized = row.map(x => (x - mean) / std);
    return {
      row:          row.map(x => r(x, 4)),
      mean:         r(mean, 4),
      diffs:        diffs.map(x => r(x, 4)),
      squaredDiffs: squaredDiffs.map(x => r(x, 5)),
      variance:     r(variance, 5),
      std:          r(std, 4),
      normalized:   normalized.map(x => r(x, 4)),
      n,
    };
  }, [cur]);

  const col8 = Array.from({ length: CFG.EMBED_DIM }, (_, i) => `f${i}`);

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
            Residual + Layer Norm — Keeping Numbers Healthy
          </h2>
        </div>
        <p style={{ color: '#64748B', fontSize: '13px', margin: 0, lineHeight: '1.7' }}>
          After big computations (Attention, FFN), numbers can explode to millions or collapse
          toward zero. These two operations — <strong style={{ color: '#6366F1' }}>residual connection</strong> and{' '}
          <strong style={{ color: '#10B981' }}>layer normalization</strong> — reset everything to a
          stable range so learning can continue. This happens <strong style={{ color: '#C4B5FD' }}>twice</strong> per transformer block.
        </p>
      </div>

      {/* ── THE PROBLEM ── */}
      <div className="viz-card">
        <SectionLabel>Why Do We Need This? — The Problem With Deep Networks</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Box color="#EF4444" icon="💥" title="Exploding activations">
            Imagine multiplying any number by 1.1 over and over — after 100 layers,
            a value of 1 becomes <strong style={{ color: '#FCA5A5' }}>1.1¹⁰⁰ ≈ 13,780</strong>.
            Attention scores become enormous, gradients overflow, and training crashes.
          </Box>
          <Box color="#6366F1" icon="🫥" title="Vanishing gradients">
            The opposite: multiply by 0.9 each layer. After 100 layers,
            a gradient of 1 becomes <strong style={{ color: '#A5B4FC' }}>0.9¹⁰⁰ ≈ 0.000027</strong>.
            The signal to learn disappears before it reaches early layers.
          </Box>
          <Box color="#10B981" icon="✅" title="Solution: residual + layer norm">
            <strong style={{ color: '#6EE7B7' }}>Residual</strong> gives gradients a direct highway
            backwards — they don't have to pass through every operation.
            <strong style={{ color: '#6EE7B7' }}> Layer Norm</strong> rescales each token vector
            to mean=0, std=1 so values never drift into dangerous ranges.
          </Box>
        </div>
      </div>

      {/* ── TWO CONCEPTS OVERVIEW ── */}
      <div className="viz-card">
        <SectionLabel>The Two Operations — Overview</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{
            background: '#6366F10D', border: '1px solid #6366F133',
            borderLeft: '3px solid #6366F1', borderRadius: '8px', padding: '16px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#6366F1', fontFamily: 'Space Mono, monospace', letterSpacing: '1px', marginBottom: '10px' }}>
              PART A — RESIDUAL CONNECTION
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0', marginBottom: '8px' }}>
              "Keep the original, add the new"
            </div>
            <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.8' }}>
              Before normalizing, we add the token vector from <em>before the sublayer</em> back
              into the result. Like revising an essay while keeping the original draft clipped on.
              The network only has to learn <em>what changed</em>, not relearn everything.
            </div>
            <div style={{ marginTop: '12px', padding: '10px 12px', background: '#0B0D17', borderRadius: '6px', fontFamily: 'Space Mono, monospace', fontSize: '12px', lineHeight: '2' }}>
              <div><span style={{ color: '#64748B' }}>X_before</span>  <span style={{ color: '#6366F1' }}>+ sublayer(X_before)</span></div>
              <div><span style={{ color: '#F59E0B' }}>= X_combined</span></div>
            </div>
          </div>
          <div style={{
            background: '#10B9810D', border: '1px solid #10B98133',
            borderLeft: '3px solid #10B981', borderRadius: '8px', padding: '16px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#10B981', fontFamily: 'Space Mono, monospace', letterSpacing: '1px', marginBottom: '10px' }}>
              PART B — LAYER NORMALIZATION
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0', marginBottom: '8px' }}>
              "Rescale to mean=0, spread=1"
            </div>
            <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.8' }}>
              For each token independently: subtract its own mean, divide by its own standard
              deviation. Relative ordering is preserved (high is still high) but values now
              live in a predictable range the next layer can rely on.
            </div>
            <div style={{ marginTop: '12px', padding: '10px 12px', background: '#0B0D17', borderRadius: '6px', fontFamily: 'Space Mono, monospace', fontSize: '12px', lineHeight: '2' }}>
              <div><span style={{ color: '#F59E0B' }}>X_combined</span>  <span style={{ color: '#10B981' }}>→  subtract mean  →  ÷ std</span></div>
              <div><span style={{ color: '#10B981' }}>= X_normed</span>  <span style={{ color: '#475569' }}>(mean≈0, std≈1)</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB SELECTOR ── */}
      <div>
        <div style={{ fontSize: '12px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '10px' }}>
          THIS HAPPENS TWICE — pick which one to inspect:
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {views.map(v => (
            <button key={v.id} onClick={() => { setView(v.id); setShowNormMath(false); }} style={{
              padding: '8px 20px', borderRadius: '8px', border: `2px solid ${v.color}`,
              background: view === v.id ? `${v.color}22` : 'transparent',
              color: view === v.id ? v.color : '#64748B',
              fontFamily: 'Space Mono, monospace', fontSize: '11px',
              fontWeight: view === v.id ? '700' : '400', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── STEP-BY-STEP ── */}
      <div className="viz-card">
        <SectionLabel>Step-by-Step: After {cur.label}</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '8px' }}>

          {/* STEP 1: Residual */}
          <StepRow n="1" color="#6366F1" title={`Add the residual — X_before + ${cur.label} output`}>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 14px' }}>
              The token vector from <em>before</em> the {cur.label} sublayer is added element-by-element
              to the sublayer's output. Shape stays <Chip>({seqLen}×{CFG.EMBED_DIM})</Chip> throughout.
              This is a simple element-wise addition — no learned weights involved.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
                  X before {cur.label}
                </div>
                <MatrixViz matrix={cur.before} rowLabels={names} size="sm" showColorBar />
              </div>
              <div style={{ paddingTop: '18px', textAlign: 'center' }}>
                <div style={{ color: '#6366F1', fontSize: '26px', fontWeight: '700' }}>+</div>
                <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'Space Mono, monospace' }}>element</div>
                <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'Space Mono, monospace' }}>-wise</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: cur.color, fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
                  {cur.label} output
                </div>
                <MatrixViz matrix={cur.residual} rowLabels={names} size="sm" showColorBar />
              </div>
              <div style={{ paddingTop: '18px', color: '#F59E0B', fontSize: '22px' }}>→</div>
              <div>
                <div style={{ fontSize: '11px', color: '#F59E0B', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
                  Combined (before norm)
                </div>
                <MatrixViz matrix={cur.added} rowLabels={names} colLabels={col8} size="sm" showColorBar />
              </div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#475569', lineHeight: '1.7' }}>
              Each cell: <Chip color="#6366F1">combined[i][j] = before[i][j] + sublayer_out[i][j]</Chip>
              — nothing more. The token now contains its original information <em>plus</em> what the
              sublayer learned.
            </div>
          </StepRow>

          {/* STEP 2: Layer Norm */}
          <StepRow n="2" color="#10B981" title="Layer Normalization — 4 sub-steps applied to each token row">
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
              Each token's row of {CFG.EMBED_DIM} numbers is normalized <em>independently</em>.
              Token 1 does not look at token 2's numbers at all — every row gets its own personal rescaling.
              Here are the 4 sub-steps:
            </p>

            {/* Sub-steps overview */}
            <div style={{
              fontFamily: 'Space Mono, monospace', fontSize: '12px',
              background: '#0B0D17', border: '1px solid #10B98133',
              borderRadius: '8px', padding: '14px', lineHeight: '2.2', marginBottom: '14px',
            }}>
              <div><span style={{ color: '#64748B' }}>1.</span> <span style={{ color: '#06B6D4' }}>mean = average of all 8 numbers in this row</span></div>
              <div><span style={{ color: '#64748B' }}>2.</span> <span style={{ color: '#6366F1' }}>diffs = each number − mean</span>  <span style={{ color: '#475569' }}>(shift so average is 0)</span></div>
              <div><span style={{ color: '#64748B' }}>3.</span> <span style={{ color: '#F59E0B' }}>std = √( average of diffs² )</span>  <span style={{ color: '#475569' }}>(measure of spread)</span></div>
              <div><span style={{ color: '#64748B' }}>4.</span> <span style={{ color: '#10B981' }}>output = diffs / std</span>  <span style={{ color: '#475569' }}>(rescale so spread = 1)</span></div>
            </div>

            {/* Toggle */}
            <button
              onClick={() => setShowNormMath(v => !v)}
              style={{
                padding: '8px 16px', borderRadius: '6px', marginBottom: '14px',
                border: '1px solid #10B981', background: showNormMath ? '#10B98122' : 'transparent',
                color: '#10B981', fontFamily: 'Space Mono, monospace', fontSize: '11px',
                fontWeight: '700', cursor: 'pointer',
              }}
            >
              {showNormMath ? '▼' : '▶'} SHOW ALL 4 SUB-STEPS: normalizing token "{names[0]}"
            </button>

            {showNormMath && (
              <div style={{
                background: '#0B0D17', border: '1px solid #10B98133',
                borderRadius: '8px', padding: '18px', marginBottom: '14px',
                fontFamily: 'Space Mono, monospace', fontSize: '12px',
              }}>
                {/* Input */}
                <div style={{ color: '#64748B', marginBottom: '12px' }}>
                  Input row (token "{names[0]}", {normMath.n} numbers):
                </div>
                <div style={{ color: '#94A3B8', marginBottom: '16px', lineHeight: '1.8' }}>
                  [{normMath.row.join(',  ')}]
                </div>

                {/* Sub-step 1: mean */}
                <div style={{ borderLeft: '2px solid #06B6D4', paddingLeft: '12px', marginBottom: '16px' }}>
                  <div style={{ color: '#06B6D4', fontWeight: '700', marginBottom: '6px' }}>
                    Sub-step 1 — Compute mean
                  </div>
                  <div style={{ color: '#475569', fontSize: '11px', marginBottom: '6px' }}>
                    Add all {normMath.n} values and divide by {normMath.n}:
                  </div>
                  <div style={{ color: '#94A3B8' }}>
                    ({normMath.row.join(' + ')})
                  </div>
                  <div style={{ color: '#94A3B8' }}>
                    ÷ {normMath.n} = <span style={{ color: '#06B6D4', fontWeight: '700' }}>{normMath.mean}</span>
                  </div>
                </div>

                {/* Sub-step 2: subtract mean */}
                <div style={{ borderLeft: '2px solid #6366F1', paddingLeft: '12px', marginBottom: '16px' }}>
                  <div style={{ color: '#6366F1', fontWeight: '700', marginBottom: '6px' }}>
                    Sub-step 2 — Subtract mean from each value
                  </div>
                  <div style={{ color: '#475569', fontSize: '11px', marginBottom: '6px' }}>
                    diffs[i] = row[i] − {normMath.mean}:
                  </div>
                  {normMath.row.map((v, i) => (
                    <div key={i} style={{ color: '#94A3B8', lineHeight: '1.8' }}>
                      {v.toFixed(4)} − {normMath.mean} = <span style={{ color: '#6366F1' }}>{normMath.diffs[i].toFixed(4)}</span>
                    </div>
                  ))}
                </div>

                {/* Sub-step 3: variance and std */}
                <div style={{ borderLeft: '2px solid #F59E0B', paddingLeft: '12px', marginBottom: '16px' }}>
                  <div style={{ color: '#F59E0B', fontWeight: '700', marginBottom: '6px' }}>
                    Sub-step 3 — Compute variance and std
                  </div>
                  <div style={{ color: '#475569', fontSize: '11px', marginBottom: '6px' }}>
                    Square each diff, average them:
                  </div>
                  <div style={{ color: '#94A3B8', lineHeight: '1.8' }}>
                    diffs²: [{normMath.squaredDiffs.map(x => x.toFixed(5)).join(', ')}]
                  </div>
                  <div style={{ color: '#94A3B8' }}>
                    variance = sum ÷ {normMath.n} = <span style={{ color: '#F59E0B' }}>{normMath.variance}</span>
                  </div>
                  <div style={{ color: '#94A3B8' }}>
                    std = √({normMath.variance} + ε) = <span style={{ color: '#F59E0B', fontWeight: '700' }}>{normMath.std}</span>
                    <span style={{ color: '#475569', fontSize: '10px' }}> (ε=1e-5 prevents ÷0)</span>
                  </div>
                </div>

                {/* Sub-step 4: divide */}
                <div style={{ borderLeft: '2px solid #10B981', paddingLeft: '12px' }}>
                  <div style={{ color: '#10B981', fontWeight: '700', marginBottom: '6px' }}>
                    Sub-step 4 — Divide diffs by std
                  </div>
                  <div style={{ color: '#475569', fontSize: '11px', marginBottom: '6px' }}>
                    normalized[i] = diffs[i] ÷ {normMath.std}:
                  </div>
                  {normMath.diffs.map((d, i) => (
                    <div key={i} style={{ color: '#94A3B8', lineHeight: '1.8' }}>
                      {d.toFixed(4)} ÷ {normMath.std} = <span style={{ color: '#10B981', fontWeight: '700' }}>{normMath.normalized[i].toFixed(4)}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '10px', color: '#475569', fontSize: '11px' }}>
                    Mean of output: {r(normMath.normalized.reduce((a, b) => a + b, 0) / normMath.n, 4)} ≈ 0  ✓
                    <br />
                    Spread of output: ≈ 1  ✓
                  </div>
                </div>
              </div>
            )}

            {/* Stats table */}
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #1E2A45', marginBottom: '16px' }}>
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
                      <td style={{ padding: '8px 14px', color: cur.color, fontWeight: '700' }}>"{s.token}"</td>
                      <td style={{ padding: '8px 14px', color: '#94A3B8' }}>{s.mean}</td>
                      <td style={{ padding: '8px 14px', color: '#94A3B8' }}>{s.std}</td>
                      <td style={{ padding: '8px 14px', color: Math.abs(s.normMean) < 0.05 ? '#10B981' : '#F59E0B', fontWeight: '600' }}>
                        {s.normMean} {Math.abs(s.normMean) < 0.05 ? '✓' : '≈ 0'}
                      </td>
                      <td style={{ padding: '8px 14px', color: Math.abs(s.normStd - 1) < 0.15 ? '#10B981' : '#F59E0B', fontWeight: '600' }}>
                        {s.normStd} {Math.abs(s.normStd - 1) < 0.15 ? '✓' : '≈ 1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Before / After matrices */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#F59E0B', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
                  Before norm (combined)
                </div>
                <MatrixViz matrix={cur.added} rowLabels={names} size="sm" showColorBar />
              </div>
              <div style={{ paddingTop: '18px', textAlign: 'center' }}>
                <div style={{ color: '#10B981', fontFamily: 'Space Mono, monospace', fontSize: '11px' }}>Layer</div>
                <div style={{ color: '#10B981', fontFamily: 'Space Mono, monospace', fontSize: '11px' }}>Norm</div>
                <div style={{ color: '#10B981', fontSize: '24px' }}>→</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#10B981', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
                  After norm (mean≈0, std≈1)
                </div>
                <MatrixViz matrix={cur.normed} rowLabels={names} colLabels={col8} size="sm" showColorBar />
              </div>
            </div>
            <div style={{ marginTop: '10px', padding: '10px 14px', background: '#10B9810D', border: '1px solid #10B98133', borderRadius: '6px', fontSize: '12px', color: '#94A3B8', lineHeight: '1.6' }}>
              The colour <em>patterns</em> are similar (relative ordering preserved) but the overall
              scale is now consistent. High values are still high, low still low — just normalised.
            </div>
          </StepRow>

          {/* STEP 3: Done */}
          <StepRow n="3" color="#8B5CF6" title="Result — normalised output passes to the next step" last>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: 0 }}>
              The normed matrix has shape <Chip>({seqLen}×{CFG.EMBED_DIM})</Chip> — identical to the
              input. Every token still carries its contextual information, but in a stable numerical range.
              This feeds directly into the next sublayer or the output head.
            </p>
          </StepRow>

        </div>
      </div>

      {/* ── FORMULA ── */}
      <Formula>
        {`// Part A — Residual Connection (no learned weights)
X_combined[i] = X_before[i] + Sublayer(X_before)[i]     ← element-wise for each token i

// Part B — Layer Norm (applied independently to each token row)
mean[i]   = average( X_combined[i] )                     ← single number per token
variance[i] = average( (X_combined[i][j] - mean[i])^2 )  ← spread
std[i]    = sqrt( variance[i] + 1e-5 )                   ← +1e-5 prevents divide-by-zero
X_normed[i][j] = ( X_combined[i][j] - mean[i] ) / std[i] ← rescale each element

// Result: mean(X_normed[i]) ≈ 0,  std(X_normed[i]) ≈ 1  for every token i`}
      </Formula>

      {/* ── INSIGHT ── */}
      <InsightBox title="Why These Two Operations Are Inseparable">
        The <strong style={{ color: '#E2E8F0' }}>residual</strong> solves the vanishing gradient
        problem: during backpropagation, gradients can flow directly through the addition shortcut
        without shrinking — this is why transformers can be 96+ layers deep and still train.
        <br /><br />
        The <strong style={{ color: '#E2E8F0' }}>layer norm</strong> solves the scale problem:
        even with the residual shortcut, the summed values can still be very large or variable.
        Normalising ensures the next layer always starts from a consistent, well-behaved distribution.
        <br /><br />
        Together they appear <strong style={{ color: '#C4B5FD' }}>twice per block</strong> — once
        after attention, once after FFN — giving the model four "clean slate" moments per layer.
      </InsightBox>

    </div>
  );
}
