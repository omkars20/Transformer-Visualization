import React, { useState } from 'react';
import {
  MatrixViz, ShapeTag, InsightBox, Formula, SectionLabel, FlowArrow,
} from '../components/MatrixViz.jsx';
import { CFG } from '../utils/llmEngine.js';

// ─── Local Callout component ───────────────────────────────────────────────
function Callout({ color = '#6366F1', icon, title, children }) {
  return (
    <div style={{
      background: `${color}0D`,
      border: `1px solid ${color}55`,
      borderLeft: `3px solid ${color}`,
      borderRadius: '8px',
      padding: '14px 16px',
    }}>
      {title && (
        <div style={{
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
        }}>
          {icon && <span>{icon}</span>}
          {title}
        </div>
      )}
      <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.8' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Token color palette ───────────────────────────────────────────────────
const TOKEN_COLORS = [
  '#F59E0B', '#10B981', '#06B6D4', '#6366F1',
  '#EC4899', '#F97316', '#8B5CF6', '#EF4444',
];

// ─── Small colored cell bar for a single token vector ─────────────────────
function TokenValueBar({ values, color, label }) {
  const max = Math.max(...values.map(Math.abs), 0.001);
  return (
    <div>
      {label && (
        <div style={{
          fontSize: '10px',
          color: '#64748B',
          fontFamily: 'Space Mono, monospace',
          marginBottom: '4px',
        }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
        {values.map((v, i) => {
          const intensity = Math.abs(v) / max;
          const isPos = v >= 0;
          const bg = isPos
            ? `rgba(16, 185, 129, ${0.15 + intensity * 0.65})`
            : `rgba(239, 68, 68, ${0.15 + intensity * 0.65})`;
          const border = isPos ? '#10B98155' : '#EF444455';
          return (
            <div
              key={i}
              title={`dim ${i}: ${v.toFixed(3)}`}
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '4px',
                background: bg,
                border: `1px solid ${border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '7px',
                color: isPos ? '#10B981' : '#EF4444',
                fontFamily: 'Space Mono, monospace',
                cursor: 'default',
              }}
            >
              {isPos ? '+' : '-'}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function Step6_FFN({ result }) {
  const [selectedTok, setSelectedTok] = useState(0);

  if (!result) return null;
  const { tokens, X2, ffn } = result;
  const seqLen = tokens.length;
  const tokenNames = tokens.map((t) => t.word);

  const rowLabels  = tokenNames;
  const colLabels8  = Array.from({ length: CFG.EMBED_DIM }, (_, i) => `d${i}`);
  const colLabels16 = Array.from({ length: CFG.FFN_DIM    }, (_, i) => `h${i}`);

  // Sparsity stats (all tokens combined)
  const totalHidden    = ffn.h1_relu.flat().length;
  const activatedCount = ffn.h1_relu.flat().filter((x) => x > 0).length;
  const activationPct  = Math.round((activatedCount / totalHidden) * 100);

  // Per-token sparsity
  const tokenSparsity = ffn.h1_relu.map((row) => {
    const fired = row.filter((x) => x > 0).length;
    return Math.round((fired / row.length) * 100);
  });

  // Selected token's journey
  const tokColor   = TOKEN_COLORS[selectedTok % TOKEN_COLORS.length];
  const tokInput   = X2[selectedTok];
  const tokPre     = ffn.h1_pre[selectedTok];
  const tokRelu    = ffn.h1_relu[selectedTok];
  const tokOutput  = ffn.output[selectedTok];
  const tokFired   = tokRelu.filter((x) => x > 0).length;
  const tokFirePct = Math.round((tokFired / tokRelu.length) * 100);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── 1. HEADER ─────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{
            background: '#EC489922',
            border: '1px solid #EC4899',
            borderRadius: '8px',
            padding: '4px 12px',
            fontFamily: 'Space Mono, monospace',
            fontSize: '11px',
            color: '#EC4899',
            fontWeight: '700',
            letterSpacing: '1px',
          }}>
            STEP 6 OF 8
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#E2E8F0', margin: 0 }}>
            Feed-Forward Network — Private Thinking Time
          </h2>
        </div>
        <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
          After the group discussion (attention), every word gets alone-time to process what it learned.
        </p>
      </div>

      {/* ── 2. ANALOGY CALLOUT ────────────────────────────────────────── */}
      <Callout color="#EC4899" icon="🧠" title="The Analogy">
        After a big group discussion, each person goes home to process everything privately.
        They <strong style={{ color: '#EC4899' }}>write out a long brainstorm</strong> (expand),{' '}
        <strong style={{ color: '#F59E0B' }}>cross out the unhelpful ideas</strong> (ReLU filter),
        then <strong style={{ color: '#10B981' }}>write a clean summary</strong> (shrink back).
        No one talks to anyone else during this phase — it is completely private, one word at a time.
      </Callout>

      {/* ── 3. THREE-STEP CARDS ───────────────────────────────────────── */}
      <div className="viz-card">
        <SectionLabel>What's the plan? — 3 steps, done independently for each word</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '4px' }}>

          {/* Step A: Expand */}
          <div style={{
            background: '#06B6D40D',
            border: '1px solid #06B6D455',
            borderTop: '3px solid #06B6D4',
            borderRadius: '10px',
            padding: '16px',
          }}>
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '10px',
              color: '#06B6D4',
              letterSpacing: '1px',
              fontWeight: '700',
              marginBottom: '8px',
            }}>
              STEP A
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#E2E8F0', marginBottom: '6px' }}>
              Expand
            </div>
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '13px',
              color: '#06B6D4',
              marginBottom: '10px',
            }}>
              {CFG.EMBED_DIM} → {CFG.FFN_DIM} dims
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.7' }}>
              Each word's {CFG.EMBED_DIM} numbers get stretched into {CFG.FFN_DIM} numbers.
              More space = room to think more deeply about different features.
            </div>
          </div>

          {/* Step B: Filter */}
          <div style={{
            background: '#F59E0B0D',
            border: '1px solid #F59E0B55',
            borderTop: '3px solid #F59E0B',
            borderRadius: '10px',
            padding: '16px',
          }}>
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '10px',
              color: '#F59E0B',
              letterSpacing: '1px',
              fontWeight: '700',
              marginBottom: '8px',
            }}>
              STEP B
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#E2E8F0', marginBottom: '6px' }}>
              Filter (ReLU)
            </div>
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '13px',
              color: '#F59E0B',
              marginBottom: '10px',
            }}>
              max(0, x)
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.7' }}>
              ReLU is the simplest filter imaginable: keep numbers above 0, throw away numbers below 0.
              That's it.
            </div>
          </div>

          {/* Step C: Shrink */}
          <div style={{
            background: '#10B9810D',
            border: '1px solid #10B98155',
            borderTop: '3px solid #10B981',
            borderRadius: '10px',
            padding: '16px',
          }}>
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '10px',
              color: '#10B981',
              letterSpacing: '1px',
              fontWeight: '700',
              marginBottom: '8px',
            }}>
              STEP C
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#E2E8F0', marginBottom: '6px' }}>
              Shrink Back
            </div>
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '13px',
              color: '#10B981',
              marginBottom: '10px',
            }}>
              {CFG.FFN_DIM} → {CFG.EMBED_DIM} dims
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.7' }}>
              The {CFG.FFN_DIM} filtered thoughts get compressed back into {CFG.EMBED_DIM} numbers —
              the same size as the input, but now enriched.
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. TOKEN SELECTOR ────────────────────────────────────────────── */}
      <div className="viz-card">
        <SectionLabel>Trace a Word's Private Journey</SectionLabel>
        <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '12px' }}>
          Pick any word below to watch it travel through all three FFN steps:
        </div>

        {/* Token picker buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {tokenNames.map((name, i) => {
            const color = TOKEN_COLORS[i % TOKEN_COLORS.length];
            const active = i === selectedTok;
            return (
              <button
                key={i}
                onClick={() => setSelectedTok(i)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: `1.5px solid ${color}`,
                  background: active ? color : `${color}22`,
                  color: active ? '#0B0D17' : color,
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* Journey display for selected token */}
        <div style={{
          background: '#0B0D17',
          border: `1px solid ${tokColor}44`,
          borderLeft: `3px solid ${tokColor}`,
          borderRadius: '10px',
          padding: '16px',
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            fontFamily: 'Space Mono, monospace',
            color: tokColor,
            marginBottom: '16px',
            letterSpacing: '0.5px',
          }}>
            "{tokenNames[selectedTok]}" — step by step
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Input */}
            <div>
              <div style={{
                fontSize: '11px',
                color: '#06B6D4',
                fontFamily: 'Space Mono, monospace',
                marginBottom: '5px',
              }}>
                Input ({CFG.EMBED_DIM} numbers, from attention output)
              </div>
              <TokenValueBar values={tokInput} color="#06B6D4" />
            </div>

            {/* Arrow A */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ height: '1px', flex: 1, background: '#1E2A45' }} />
              <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>
                multiply by W1, add b1 (expand {CFG.EMBED_DIM}→{CFG.FFN_DIM})
              </span>
              <div style={{ color: '#06B6D4', fontSize: '16px' }}>↓</div>
              <div style={{ height: '1px', flex: 1, background: '#1E2A45' }} />
            </div>

            {/* After expand (pre-ReLU) */}
            <div>
              <div style={{
                fontSize: '11px',
                color: '#EC4899',
                fontFamily: 'Space Mono, monospace',
                marginBottom: '5px',
              }}>
                After expanding ({CFG.FFN_DIM} numbers — mix of positive and negative)
              </div>
              <TokenValueBar values={tokPre} color="#EC4899" />
            </div>

            {/* Arrow B */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ height: '1px', flex: 1, background: '#1E2A45' }} />
              <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>
                ReLU filter: keep positives (+), zero out negatives (-)
              </span>
              <div style={{ color: '#F59E0B', fontSize: '16px' }}>↓</div>
              <div style={{ height: '1px', flex: 1, background: '#1E2A45' }} />
            </div>

            {/* After ReLU */}
            <div>
              <div style={{
                fontSize: '11px',
                color: '#F59E0B',
                fontFamily: 'Space Mono, monospace',
                marginBottom: '5px',
              }}>
                After ReLU filter ({tokFired} of {CFG.FFN_DIM} neurons "fired" — {tokFirePct}% active)
              </div>
              <TokenValueBar values={tokRelu} color="#F59E0B" />
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  height: '6px',
                  background: '#1E2A45',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  width: '100%',
                }}>
                  <div style={{
                    width: `${tokFirePct}%`,
                    height: '100%',
                    background: `linear-gradient(to right, #F59E0B, #F97316)`,
                    borderRadius: '3px',
                  }} />
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '3px' }}>
                  {tokFirePct}% of neurons said "this is relevant to me"
                </div>
              </div>
            </div>

            {/* Arrow C */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ height: '1px', flex: 1, background: '#1E2A45' }} />
              <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>
                multiply by W2, add b2 (shrink {CFG.FFN_DIM}→{CFG.EMBED_DIM})
              </span>
              <div style={{ color: '#10B981', fontSize: '16px' }}>↓</div>
              <div style={{ height: '1px', flex: 1, background: '#1E2A45' }} />
            </div>

            {/* Output */}
            <div>
              <div style={{
                fontSize: '11px',
                color: '#10B981',
                fontFamily: 'Space Mono, monospace',
                marginBottom: '5px',
              }}>
                Final output ({CFG.EMBED_DIM} numbers — same size as input, but richer)
              </div>
              <TokenValueBar values={tokOutput} color="#10B981" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. SPARSITY BAR CHART (all tokens) ───────────────────────────── */}
      <div className="viz-card">
        <SectionLabel>ReLU Sparsity — How Many Neurons "Fired" Per Word?</SectionLabel>
        <Callout color="#F59E0B" icon="💡" title="What sparsity means">
          After the ReLU filter, some neurons fire (positive) and others stay silent (zero).
          A neuron that stays silent is saying: "this feature is not relevant to this word right now."
          Sparsity is healthy — it means the network is being selective.
        </Callout>

        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tokenNames.map((name, i) => {
            const pct = tokenSparsity[i];
            const color = TOKEN_COLORS[i % TOKEN_COLORS.length];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '70px',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '11px',
                  color,
                  textAlign: 'right',
                  flexShrink: 0,
                }}>
                  {name}
                </div>
                <div style={{
                  flex: 1,
                  height: '18px',
                  background: '#1E2A45',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: `linear-gradient(to right, ${color}99, ${color})`,
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '6px',
                  }}>
                    <span style={{
                      fontSize: '9px',
                      color: '#0B0D17',
                      fontFamily: 'Space Mono, monospace',
                      fontWeight: '700',
                    }}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', width: '90px', flexShrink: 0 }}>
                  {ffn.h1_relu[i].filter((x) => x > 0).length}/{CFG.FFN_DIM} fired
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall sparsity bar */}
        <div style={{
          marginTop: '16px',
          background: '#0B0D17',
          border: '1px solid #1E2A45',
          borderRadius: '8px',
          padding: '12px',
        }}>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
            Overall: <strong style={{ color: '#F59E0B' }}>{activationPct}%</strong> of all hidden
            neurons are active across all words ({activatedCount} / {totalHidden})
          </div>
          <div style={{ height: '8px', background: '#1E2A45', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${activationPct}%`,
              height: '100%',
              background: 'linear-gradient(to right, #F59E0B, #F97316)',
              borderRadius: '4px',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      </div>

      {/* ── 6. FULL MATRIX VIEWS ──────────────────────────────────────────── */}
      <div className="viz-card">
        <SectionLabel>Layer 1: Expand ({CFG.EMBED_DIM} → {CFG.FFN_DIM}) — Full Matrix View</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#06B6D4', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
              Input X₂ <ShapeTag shape={[seqLen, CFG.EMBED_DIM]} />
            </div>
            <MatrixViz matrix={X2} rowLabels={rowLabels} colLabels={colLabels8} size="sm" />
          </div>
          <div style={{ paddingTop: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>
              @ W1 ({CFG.EMBED_DIM}×{CFG.FFN_DIM}) + b1
            </div>
            <div style={{ color: '#EC4899', fontSize: '22px' }}>→</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#EC4899', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
              h1_pre — before filter <ShapeTag shape={[seqLen, CFG.FFN_DIM]} />
            </div>
            <MatrixViz matrix={ffn.h1_pre} rowLabels={rowLabels} colLabels={colLabels16} size="sm" maxCols={8} />
            <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>
              showing first 8 of {CFG.FFN_DIM} dims →
            </div>
          </div>
        </div>
      </div>

      <div className="viz-card">
        <SectionLabel>ReLU Filter — Before vs After (negatives become zero)</SectionLabel>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#EC4899', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
              Before filter (h1_pre — has negatives)
            </div>
            <MatrixViz matrix={ffn.h1_pre} rowLabels={rowLabels} colLabels={colLabels16} size="sm" maxCols={8} />
          </div>
          <div style={{ paddingTop: '20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#F59E0B', marginBottom: '4px' }}>
              ReLU(x) = max(0, x)
            </div>
            <div style={{ color: '#F59E0B', fontSize: '22px' }}>→</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#F59E0B', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
              After filter (h1_relu — negatives zeroed out)
            </div>
            <MatrixViz matrix={ffn.h1_relu} rowLabels={rowLabels} colLabels={colLabels16} size="sm" maxCols={8} />
          </div>
        </div>
      </div>

      <div className="viz-card">
        <SectionLabel>Layer 2: Shrink Back ({CFG.FFN_DIM} → {CFG.EMBED_DIM}) — Full Matrix View</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#F59E0B', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
              h1_relu <ShapeTag shape={[seqLen, CFG.FFN_DIM]} />
            </div>
            <MatrixViz matrix={ffn.h1_relu} rowLabels={rowLabels} size="sm" maxCols={6} />
          </div>
          <div style={{ paddingTop: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>
              @ W2 ({CFG.FFN_DIM}×{CFG.EMBED_DIM}) + b2
            </div>
            <div style={{ color: '#10B981', fontSize: '22px' }}>→</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#10B981', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
              FFN output <ShapeTag shape={[seqLen, CFG.EMBED_DIM]} />
            </div>
            <MatrixViz matrix={ffn.output} rowLabels={rowLabels} colLabels={colLabels8} size="sm" showColorBar />
          </div>
        </div>
      </div>

      {/* ── 7. FORMULA + STATS ───────────────────────────────────────────── */}
      <Formula>
        FFN(x) = max(0, x @ W1 + b1) @ W2 + b2{'\n'}
        W1: ({CFG.EMBED_DIM}, {CFG.FFN_DIM})  b1: ({CFG.FFN_DIM},)   ← expand {CFG.EMBED_DIM}→{CFG.FFN_DIM}{'\n'}
        W2: ({CFG.FFN_DIM}, {CFG.EMBED_DIM})  b2: ({CFG.EMBED_DIM},) ← shrink {CFG.FFN_DIM}→{CFG.EMBED_DIM}{'\n'}
        Applied independently to each of the {seqLen} token rows{'\n'}
        Total FFN params: {CFG.EMBED_DIM}×{CFG.FFN_DIM} + {CFG.FFN_DIM} + {CFG.FFN_DIM}×{CFG.EMBED_DIM} + {CFG.EMBED_DIM} = {CFG.EMBED_DIM * CFG.FFN_DIM + CFG.FFN_DIM + CFG.FFN_DIM * CFG.EMBED_DIM + CFG.EMBED_DIM}
      </Formula>

      <InsightBox title="Why FFN After Attention?">
        <strong style={{ color: '#E2E8F0' }}>Attention mixes token information; FFN transforms it.</strong>
        {' '}Think of attention as "routing" — deciding which tokens to pay attention to.
        The FFN then takes each token's new blended representation and refines it through a nonlinear
        transformation. The expand-then-shrink shape lets the network compute richer features in the
        high-dimensional space, then compress back to the original size.
        In GPT-2, FFN dim = 4× embed_dim (3072 = 4×768) — about 66% of total parameters live in FFNs.
      </InsightBox>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {[
          { label: 'Expand ratio',    value: `${CFG.FFN_DIM / CFG.EMBED_DIM}×`,     sub: `${CFG.EMBED_DIM}→${CFG.FFN_DIM}→${CFG.EMBED_DIM}` },
          { label: 'Activation',      value: 'ReLU',                                 sub: 'max(0, x)' },
          { label: 'Active neurons',  value: `${activationPct}%`,                    sub: `${activatedCount}/${totalHidden}` },
          { label: 'Per-token',       value: 'Yes',                                  sub: 'no cross-token mixing' },
        ].map((s) => (
          <div key={s.label} style={{
            background: '#131728',
            border: '1px solid #1E2A45',
            borderRadius: '10px',
            padding: '12px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              fontFamily: 'Space Mono, monospace',
              color: '#EC4899',
            }}>
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
