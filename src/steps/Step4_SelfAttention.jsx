import { useState } from 'react';
import { AttentionHeatmap } from '../components/MatrixViz.jsx';
import { CFG } from '../utils/llmEngine.js';

// ─── Callout ──────────────────────────────────────────────────────────────────
function Callout({ color = '#6366F1', icon, title, children }) {
  return (
    <div style={{
      background: `${color}0D`, border: `1px solid ${color}44`,
      borderLeft: `4px solid ${color}`, borderRadius: '8px', padding: '14px 18px',
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

// ─── Colored number chip ──────────────────────────────────────────────────────
function Chip({ value, size = 'md' }) {
  if (typeof value !== 'number') return <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#64748B' }}>{value}</span>;
  const abs = Math.min(Math.abs(value) / 1.5, 1);
  const bg = value >= 0
    ? `rgba(6,182,212,${0.2 + abs * 0.6})`
    : `rgba(239,68,68,${0.2 + abs * 0.6})`;
  const fontSize = size === 'sm' ? '9px' : size === 'lg' ? '14px' : '10px';
  const padding = size === 'sm' ? '2px 5px' : size === 'lg' ? '5px 10px' : '3px 7px';
  return (
    <span style={{
      background: bg, borderRadius: '4px', padding, display: 'inline-block',
      fontFamily: 'Space Mono, monospace', fontSize, fontWeight: '700', color: '#fff',
    }}>
      {value.toFixed(3)}
    </span>
  );
}

// ─── Vector displayed as a row of colored cells ───────────────────────────────
function Vec({ vec, label, color = '#06B6D4', dimLabels = null, compact = false }) {
  const dims = dimLabels || Array.from({ length: vec.length }, (_, i) => `d${i}`);
  const w = compact ? '28px' : '36px';
  const h = compact ? '20px' : '26px';
  const fs = compact ? '7px' : '8px';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {label && (
        <div style={{
          fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: '700',
          color, minWidth: compact ? '60px' : '96px',
        }}>{label} =</div>
      )}
      <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
        {vec.map((v, i) => {
          const abs = Math.min(Math.abs(v) / 1.5, 1);
          const bg = v >= 0
            ? `rgba(6,182,212,${0.15 + abs * 0.6})`
            : `rgba(239,68,68,${0.15 + abs * 0.6})`;
          return (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '7px', color: '#475569', fontFamily: 'Space Mono, monospace', marginBottom: '2px' }}>
                {dims[i]}
              </div>
              <div style={{
                width: w, height: h,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '4px', background: bg,
                fontFamily: 'Space Mono, monospace', fontSize: fs, fontWeight: '700', color: '#fff',
              }}>
                {v.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Token button ─────────────────────────────────────────────────────────────
function TBtn({ word, idx, selected, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 13px', borderRadius: '8px', cursor: 'pointer',
      border: `2px solid ${selected ? color : '#1E2A45'}`,
      background: selected ? `${color}20` : 'transparent',
      color: selected ? color : '#64748B',
      fontFamily: 'Space Mono, monospace', fontSize: '11px',
      fontWeight: selected ? '700' : '400', transition: 'all 0.15s',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
    }}>
      <span>"{word}"</span>
      <span style={{ fontSize: '8px', opacity: 0.6 }}>t{idx}</span>
    </button>
  );
}

// ─── Numbered step circle ─────────────────────────────────────────────────────
function Circle({ n, color }) {
  return (
    <div style={{
      width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
      background: `${color}22`, border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: '700', color,
    }}>{n}</div>
  );
}

// ─── Letter badge (A / B / C / D) ────────────────────────────────────────────
function Badge({ n, color }) {
  return (
    <div style={{
      width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
      background: `${color}22`, border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Space Mono, monospace', fontSize: '12px', fontWeight: '700', color,
    }}>{n}</div>
  );
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6', '#EF4444', '#F97316'];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Step4_SelfAttention({ result }) {
  if (!result) return null;
  const { tokens, X1, attn } = result;
  const seqLen = tokens.length;
  const tokenNames = tokens.map((t) => t.word);
  const EMBED = CFG.EMBED_DIM; // 8
  const embDims = Array.from({ length: EMBED }, (_, i) => `d${i}`);

  const [activeTab, setActiveTab] = useState(0);
  const [focusTok, setFocusTok] = useState(0);
  const [focusRow, setFocusRow] = useState(0);
  const [focusCol, setFocusCol] = useState(Math.min(1, seqLen - 1));

  // Scoring data for the selected pair (focusRow attends to focusCol)
  const qR = attn.Q[focusRow];
  const kC = attn.K[focusCol];
  const vC = attn.V[focusCol];
  const terms = qR.map((q, i) => q * kC[i]);
  const dot = terms.reduce((a, b) => a + b, 0);
  const scaled = dot / attn.scale;

  const tabs = [
    { id: 0, label: '🌟 What & Why', color: '#6366F1' },
    { id: 1, label: '📥 Input X₁', color: '#06B6D4' },
    { id: 2, label: '🔑 Create Q·K·V', color: '#F59E0B' },
    { id: 3, label: '📊 Score & Softmax', color: '#10B981' },
    { id: 4, label: '🔬 Full Trace', color: '#EC4899' },
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* HEADER */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{
            background: '#6366F122', border: '1px solid #6366F1',
            borderRadius: '6px', padding: '3px 10px',
            fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#6366F1', fontWeight: '700',
          }}>STEP 4 of 8</span>
          <h2 style={{ fontSize: '21px', fontWeight: '700', color: '#E2E8F0', margin: 0 }}>
            Self-Attention — Words Helping Each Other
          </h2>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0, lineHeight: '1.7' }}>
          Every word looks at every other word and asks:{' '}
          <em style={{ color: '#C7D2FE' }}>"How much should I care about you?"</em>
          {' '}Then it borrows information from the words it cares about most — getting richer, context-aware meaning.
        </p>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '8px 15px', borderRadius: '8px', cursor: 'pointer',
            border: `2px solid ${activeTab === t.id ? t.color : '#1E2A45'}`,
            background: activeTab === t.id ? `${t.color}20` : 'transparent',
            color: activeTab === t.id ? t.color : '#64748B',
            fontFamily: 'Space Mono, monospace', fontSize: '11px',
            fontWeight: activeTab === t.id ? '700' : '400', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══ TAB 0: WHAT & WHY ══════════════════════════════════════════════════ */}
      {activeTab === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <Callout color="#6366F1" icon="📚" title="Think of it like a Library Search System">
            Imagine walking into a library with a <strong style={{ color: '#C7D2FE' }}>search query</strong> on a card.
            <br /><br />
            <span style={{ display: 'block', marginBottom: '5px' }}>🔍 <strong style={{ color: '#818CF8' }}>Your search card</strong> = <strong style={{ color: '#6366F1' }}>Query (Q)</strong> — "What am I looking for?"</span>
            <span style={{ display: 'block', marginBottom: '5px' }}>🔑 <strong style={{ color: '#FCD34D' }}>Book title tags</strong> = <strong style={{ color: '#F59E0B' }}>Key (K)</strong> — "What does this book contain?"</span>
            <span style={{ display: 'block', marginBottom: '5px' }}>📦 <strong style={{ color: '#6EE7B7' }}>Book contents</strong> = <strong style={{ color: '#10B981' }}>Value (V)</strong> — "The actual information inside"</span>
            <br />
            You match your query (Q) against all title tags (K). Books that match get high scores. Then you
            read proportional amounts of their content (V). The better the match, the more info you absorb.
          </Callout>

          {/* Q / K / V role cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { r: 'Q', color: '#6366F1', e: '🔍', title: 'Query', sub: 'What am I looking for?',
                ex: '"bank" might search for river-words or money-words depending on context.' },
              { r: 'K', color: '#F59E0B', e: '🔑', title: 'Key', sub: 'What do I advertise I have?',
                ex: '"river" advertises: geography, water, nature, flow.' },
              { r: 'V', color: '#10B981', e: '📦', title: 'Value', sub: 'What info do I actually give?',
                ex: 'When "bank" matches "river", it receives river\'s actual content.' },
            ].map(({ r, color, e, title, sub, ex }) => (
              <div key={r} style={{
                background: `${color}0C`, border: `1px solid ${color}44`,
                borderRadius: '10px', padding: '14px',
              }}>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{e}</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px', fontWeight: '700', color, marginBottom: '3px' }}>
                  {r} — {title}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic', marginBottom: '8px' }}>{sub}</div>
                <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.6' }}>{ex}</div>
              </div>
            ))}
          </div>

          {/* Q K V all come from same X */}
          <div style={{
            background: '#0B1221', border: '2px solid #6366F133', borderRadius: '10px', padding: '16px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', marginBottom: '10px' }}>
              ⚡ Critical: Q, K, V all come from the SAME input X
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#94A3B8', lineHeight: '2.2' }}>
              <span style={{ color: '#6366F1' }}>Q</span> = X × <span style={{ color: '#6366F1' }}>Wq</span>
              {'  '}<span style={{ color: '#475569', fontSize: '11px' }}>(learned weight matrix — "query extractor")</span><br />
              <span style={{ color: '#F59E0B' }}>K</span> = X × <span style={{ color: '#F59E0B' }}>Wk</span>
              {'  '}<span style={{ color: '#475569', fontSize: '11px' }}>(learned weight matrix — "key extractor")</span><br />
              <span style={{ color: '#10B981' }}>V</span> = X × <span style={{ color: '#10B981' }}>Wv</span>
              {'  '}<span style={{ color: '#475569', fontSize: '11px' }}>(learned weight matrix — "value extractor")</span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '10px', lineHeight: '1.6' }}>
              Wq, Wk, Wv are <strong style={{ color: '#E2E8F0' }}>learned during training</strong>. They stay fixed for every input —
              it's the input word embedding that differs, giving each word unique Q, K, V vectors.
            </div>
          </div>

          {/* 4-step process */}
          <div style={{ background: '#0B1221', border: '1px solid #1E2A45', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', marginBottom: '14px' }}>
              🔄 The 4-step computation (every word does this simultaneously):
            </div>
            {[
              { n: '1', c: '#6366F1', l: 'Create Q, K, V for every word',
                d: 'Each word\'s embedding is multiplied by 3 weight matrices (Wq, Wk, Wv) to produce 3 different vectors.' },
              { n: '2', c: '#06B6D4', l: 'Score every pair: Q[i] · K[j]',
                d: 'Word i gets a relevance score with word j by taking the dot product of its Query and j\'s Key. All pairs at once.' },
              { n: '3', c: '#F59E0B', l: 'Softmax: convert scores to percentages',
                d: 'Raw scores are normalized to attention weights that sum to 100%. Higher score = bigger weight.' },
              { n: '4', c: '#10B981', l: 'Blend Values: output = Σ weight × V[j]',
                d: 'Each word\'s final output is a weighted blend of all Value vectors — high-attention words contribute more.' },
            ].map(({ n, c, l, d }, idx, arr) => (
              <div key={n} style={{
                display: 'flex', gap: '14px',
                paddingBottom: idx < arr.length - 1 ? '12px' : '0',
                marginBottom: idx < arr.length - 1 ? '12px' : '0',
                borderBottom: idx < arr.length - 1 ? '1px solid #0F172A' : 'none',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: `${c}22`, border: `2px solid ${c}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: '700', color: c,
                }}>{n}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', marginBottom: '2px' }}>{l}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.6' }}>{d}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Formula */}
          <div style={{
            background: '#060B14', border: '1px solid #6366F133', borderRadius: '10px',
            padding: '16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: '#6366F1', fontFamily: 'Space Mono, monospace', letterSpacing: '2px', marginBottom: '8px' }}>
              THE ATTENTION FORMULA
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '17px', color: '#E2E8F0', letterSpacing: '2px' }}>
              Attention(<span style={{ color: '#6366F1' }}>Q</span>, <span style={{ color: '#F59E0B' }}>K</span>, <span style={{ color: '#10B981' }}>V</span>)
              {' '}= softmax(<span style={{ color: '#6366F1' }}>Q</span>·<span style={{ color: '#F59E0B' }}>K</span>ᵀ / √d_k) · <span style={{ color: '#10B981' }}>V</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px', flexWrap: 'wrap' }}>
              {[
                { s: 'Q', desc: 'Query matrix', c: '#6366F1' },
                { s: 'Kᵀ', desc: 'Key transposed', c: '#F59E0B' },
                { s: '√d_k', desc: `scale = √${CFG.HEAD_DIM} = ${attn.scale.toFixed(3)}`, c: '#06B6D4' },
                { s: 'V', desc: 'Value matrix', c: '#10B981' },
              ].map(({ s, desc, c }) => (
                <div key={s} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: '700', color: c }}>{s}</div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 1: INPUT X₁ ════════════════════════════════════════════════════ */}
      {activeTab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Callout color="#06B6D4" icon="📥" title="Starting Point: X₁ from Step 3">
            Self-attention receives <strong style={{ color: '#67E8F9' }}>X₁</strong> — the matrix produced at the end of Step 3
            (embedding + positional encoding). Each row = one word, each column = one dimension.
            <br /><br />
            These {EMBED} numbers per word are the word's current "profile": meaning + position bundled together.
            Self-attention will <strong style={{ color: '#67E8F9' }}>enrich these profiles</strong> by letting each word absorb context from its neighbors.
          </Callout>

          {/* X1 matrix */}
          <div style={{ background: '#0B1221', border: '1px solid #1E2A45', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', marginBottom: '4px' }}>
              X₁ matrix — shape ({seqLen} tokens × {EMBED} dimensions)
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
              One row per word. Each row = an {EMBED}-dimensional vector that captures meaning + position.
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'separate', borderSpacing: '3px' }}>
                <thead>
                  <tr>
                    <th style={{ fontSize: '9px', color: '#475569', fontFamily: 'Space Mono, monospace', textAlign: 'left', padding: '3px 8px', fontWeight: '400' }}>token</th>
                    {embDims.map((l) => (
                      <th key={l} style={{ fontSize: '9px', color: '#475569', fontFamily: 'Space Mono, monospace', padding: '3px 5px', fontWeight: '400', textAlign: 'center' }}>{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((tok, r) => (
                    <tr key={r}>
                      <td style={{
                        fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: '700',
                        color: COLORS[r % COLORS.length], padding: '3px 8px', whiteSpace: 'nowrap',
                      }}>"{tok.word}"</td>
                      {X1[r].map((v, c) => {
                        const abs = Math.min(Math.abs(v) / 2, 1);
                        const bg = v >= 0
                          ? `rgba(6,182,212,${0.12 + abs * 0.5})`
                          : `rgba(239,68,68,${0.12 + abs * 0.5})`;
                        return (
                          <td key={c} style={{
                            background: bg, borderRadius: '3px',
                            fontFamily: 'Space Mono, monospace', fontSize: '9px', fontWeight: '700',
                            color: '#fff', textAlign: 'center', padding: '5px 4px', minWidth: '44px',
                          }}>{v.toFixed(3)}</td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* What happens next */}
          <div style={{ background: '#0B1221', border: '1px solid #1E2A45', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', marginBottom: '10px' }}>
              🔜 What happens to each row?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { from: `xᵢ (${EMBED} numbers)`, to: `× Wq  →  Query vector qᵢ (${EMBED} numbers)`, c: '#6366F1' },
                { from: `xᵢ (${EMBED} numbers)`, to: `× Wk  →  Key vector kᵢ (${EMBED} numbers)`, c: '#F59E0B' },
                { from: `xᵢ (${EMBED} numbers)`, to: `× Wv  →  Value vector vᵢ (${EMBED} numbers)`, c: '#10B981' },
              ].map(({ from, to, c }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#64748B' }}>{from}</div>
                  <div style={{ color: '#334155' }}>→</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: c, fontWeight: '700' }}>{to}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748B', lineHeight: '1.6' }}>
              Wq, Wk, Wv are each ({EMBED}×{EMBED}) matrices of numbers the model{' '}
              <strong style={{ color: '#E2E8F0' }}>learned during training</strong>.
              They stay the same for every input sentence — only xᵢ changes.
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 2: CREATE Q·K·V ════════════════════════════════════════════════ */}
      {activeTab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Callout color="#F59E0B" icon="🔑" title="How Each Word Gets its Q, K, V">
            For every word: take its embedding xᵢ and multiply by three weight matrices (Wq, Wk, Wv).
            Each gives a different <strong style={{ color: '#FCD34D' }}>"lens"</strong> — what it searches for, what it advertises, what it shares.
          </Callout>

          {/* Token selector */}
          <div>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>Choose a word to see its Q, K, V computation:</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {tokens.map((tok, i) => (
                <TBtn key={i} word={tok.word} idx={i}
                  selected={focusTok === i} color={COLORS[i % COLORS.length]}
                  onClick={() => setFocusTok(i)} />
              ))}
            </div>
          </div>

          {/* Main transformation block */}
          <div style={{
            background: '#0B1221',
            border: `1px solid ${COLORS[focusTok % COLORS.length]}44`,
            borderRadius: '10px', padding: '18px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS[focusTok % COLORS.length], marginBottom: '14px' }}>
              Computing Q, K, V for "{tokenNames[focusTok]}"
            </div>

            {/* Input x vector */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
                <strong style={{ color: '#E2E8F0' }}>Start:</strong>{' '}
                x_{focusTok + 1} = embedding of "{tokenNames[focusTok]}" from Step 3 ({EMBED} numbers):
              </div>
              <Vec vec={X1[focusTok]} label={`x_"${tokenNames[focusTok]}"`} color="#94A3B8" dimLabels={embDims} />
            </div>

            <div style={{
              background: '#060B14', borderRadius: '6px', padding: '8px 12px',
              marginBottom: '16px', textAlign: 'center',
              fontSize: '12px', color: '#475569',
            }}>
              ↓ multiply by each weight matrix ↓{'  '}
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#334155' }}>
                x ({EMBED}) × W ({EMBED}×{EMBED}) = output ({EMBED})
              </span>
            </div>

            {/* Q, K, V results */}
            {[
              { role: 'Q', vec: attn.Q[focusTok], color: '#6366F1', emoji: '🔍', wmat: 'Wq', desc: 'What am I looking for?' },
              { role: 'K', vec: attn.K[focusTok], color: '#F59E0B', emoji: '🔑', wmat: 'Wk', desc: 'What do I contain?' },
              { role: 'V', vec: attn.V[focusTok], color: '#10B981', emoji: '📦', wmat: 'Wv', desc: 'What info I give' },
            ].map(({ role, vec, color, emoji, wmat, desc }) => (
              <div key={role} style={{
                background: `${color}08`, border: `1px solid ${color}30`,
                borderRadius: '8px', padding: '12px', marginBottom: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', fontWeight: '700', color }}>
                    {emoji} {role} — "{desc}"
                  </span>
                  <span style={{ fontSize: '10px', color: '#475569', fontFamily: 'Space Mono, monospace' }}>
                    = x_{focusTok + 1} × {wmat}
                  </span>
                </div>
                <Vec vec={vec} label={`${role.toLowerCase()}_"${tokenNames[focusTok]}"`} color={color} dimLabels={embDims} />
              </div>
            ))}

            {/* How matrix mult works — show actual arithmetic for d0 */}
            <div style={{
              background: '#060B14', border: '1px solid #1E2A45', borderRadius: '8px',
              padding: '14px', marginTop: '6px',
            }}>
              <div style={{ fontSize: '11px', fontFamily: 'Space Mono, monospace', color: '#6366F1', marginBottom: '8px', letterSpacing: '1px' }}>
                HOW DOES x × Wq WORK? — exact arithmetic for q[d0]:
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.8', marginBottom: '10px' }}>
                To get the first number of Q (q[d0]): take every element of x, multiply by the
                matching element in <em>column 0</em> of Wq, then sum all 8 products.
                <br />
                Then repeat for d1, d2, ..., d7 using the other columns of Wq.
              </div>
              {/* Show the real computation */}
              <div style={{ padding: '10px', background: '#0B1221', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontFamily: 'Space Mono, monospace', color: '#F59E0B', marginBottom: '6px' }}>
                  REAL MATH: q_"{tokenNames[focusTok]}"[d0] step by step
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'separate', borderSpacing: '3px' }}>
                    <thead>
                      <tr>
                        <th style={{ fontSize: '8px', color: '#475569', fontFamily: 'Space Mono, monospace', padding: '2px 5px', fontWeight: '400' }}>dim</th>
                        {embDims.map((l) => (
                          <th key={l} style={{ fontSize: '8px', color: '#475569', fontFamily: 'Space Mono, monospace', padding: '2px 5px', fontWeight: '400', textAlign: 'center' }}>{l}</th>
                        ))}
                        <th style={{ fontSize: '8px', color: '#475569', fontFamily: 'Space Mono, monospace', padding: '2px 5px', fontWeight: '400' }}>= q[d0]</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#06B6D4', padding: '2px 5px', fontWeight: '700' }}>x</td>
                        {X1[focusTok].map((v, i) => (
                          <td key={i} style={{ textAlign: 'center', padding: '2px 2px' }}>
                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '8px', color: '#06B6D4', fontWeight: '700' }}>
                              {v.toFixed(3)}
                            </span>
                          </td>
                        ))}
                        <td />
                      </tr>
                      <tr>
                        <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#8B5CF6', padding: '2px 5px', fontWeight: '700' }}>Wq[·][0]</td>
                        {X1[focusTok].map((_, i) => (
                          <td key={i} style={{ textAlign: 'center', padding: '2px 2px' }}>
                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '8px', color: '#8B5CF6', fontWeight: '700' }}>
                              {attn.Wq[i][0].toFixed(3)}
                            </span>
                          </td>
                        ))}
                        <td />
                      </tr>
                      <tr>
                        <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#6366F1', padding: '2px 5px', fontWeight: '700' }}>x×Wq</td>
                        {X1[focusTok].map((v, i) => {
                          const prod = v * attn.Wq[i][0];
                          return (
                            <td key={i} style={{ textAlign: 'center', padding: '2px 2px' }}>
                              <Chip value={prod} size="sm" />
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center', padding: '2px 5px' }}>
                          <Chip value={attn.Q[focusTok][0]} size="lg" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: '10px', fontFamily: 'Space Mono, monospace', color: '#475569', marginTop: '8px', lineHeight: '1.8' }}>
                  {X1[focusTok].map((v, i) => `(${v.toFixed(2)}×${attn.Wq[i][0].toFixed(2)})`).join(' + ')}
                  {' = '}<span style={{ color: '#6366F1', fontWeight: '700' }}>{attn.Q[focusTok][0].toFixed(3)}</span>
                  {' ✓'}
                </div>
              </div>
            </div>
          </div>

          {/* Full Q, K, V matrices */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', marginBottom: '10px' }}>
              All {seqLen} words at once — the complete Q, K, V matrices:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '10px' }}>
              {[
                { role: 'Q', mat: attn.Q, color: '#6366F1', desc: '"What does each word search for?"' },
                { role: 'K', mat: attn.K, color: '#F59E0B', desc: '"What does each word advertise?"' },
                { role: 'V', mat: attn.V, color: '#10B981', desc: '"What info does each word share?"' },
              ].map(({ role, mat, color, desc }) => (
                <div key={role} style={{ background: '#0B1221', border: `1px solid ${color}33`, borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: '700', color, marginBottom: '2px' }}>{role} matrix</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>{desc}</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'separate', borderSpacing: '2px', width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ fontSize: '8px', color: '#475569', fontFamily: 'Space Mono, monospace', textAlign: 'left', padding: '2px 4px', fontWeight: '400' }}>token</th>
                          {embDims.map((l) => (
                            <th key={l} style={{ fontSize: '8px', color: '#475569', fontFamily: 'Space Mono, monospace', padding: '2px 3px', fontWeight: '400', textAlign: 'center' }}>{l}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mat.map((row, ri) => (
                          <tr key={ri}>
                            <td style={{
                              fontFamily: 'Space Mono, monospace', fontSize: '9px', fontWeight: '700',
                              color: ri === focusTok ? COLORS[ri % COLORS.length] : '#475569',
                              padding: '2px 5px', whiteSpace: 'nowrap',
                            }}>"{tokenNames[ri]}"</td>
                            {row.map((v, ci) => {
                              const abs = Math.min(Math.abs(v) / 1.5, 1);
                              const isFocus = ri === focusTok;
                              let bg;
                              if (isFocus) {
                                bg = v >= 0 ? `${color}88` : 'rgba(239,68,68,0.55)';
                              } else {
                                bg = v >= 0
                                  ? `rgba(6,182,212,${0.1 + abs * 0.4})`
                                  : `rgba(239,68,68,${0.1 + abs * 0.4})`;
                              }
                              return (
                                <td key={ci} style={{
                                  background: bg, borderRadius: '3px',
                                  fontFamily: 'Space Mono, monospace', fontSize: '8px', fontWeight: '700',
                                  color: '#fff', textAlign: 'center', padding: '4px 2px', minWidth: '36px',
                                  border: isFocus ? `1px solid ${color}66` : '1px solid transparent',
                                }}>{v.toFixed(2)}</td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ fontSize: '9px', color: '#334155', fontFamily: 'Space Mono, monospace', marginTop: '5px' }}>
                    shape: ({seqLen} × {EMBED}) — highlighted = "{tokenNames[focusTok]}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 3: SCORE & SOFTMAX ══════════════════════════════════════════════ */}
      {activeTab === 3 && (() => {
        // Compute ALL scores for focusRow so we can show the full softmax pipeline
        const allDots   = tokens.map((_, j) => attn.Q[focusRow].reduce((s, q, d) => s + q * attn.K[j][d], 0));
        const allScaled = allDots.map((d) => d / attn.scale);
        const maxScaled = Math.max(...allScaled);
        const exps      = allScaled.map((s) => Math.exp(s - maxScaled));   // numerically stable
        const expSum    = exps.reduce((a, b) => a + b, 0);
        const softmaxOut = exps.map((e) => e / expSum);                    // same as attn_weights[focusRow]
        return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Callout color="#10B981" icon="📊" title="Scoring: How Much Should Each Word Care About Every Other?">
            Pick the <strong style={{ color: '#6EE7B7' }}>asking word</strong> below. We'll show:
            step-by-step dot product for any pair you pick, then the full softmax pipeline for
            ALL words so you can see exactly how scores become percentages.
          </Callout>

          {/* ── Word pickers ── */}
          <div style={{ background: '#0B1221', border: '1px solid #1E2A45', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'Space Mono, monospace', color: '#6366F1', marginBottom: '8px', letterSpacing: '1px' }}>
                  🔍 ASKING WORD — has the Query:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {tokens.map((tok, i) => (
                    <TBtn key={i} word={tok.word} idx={i}
                      selected={focusRow === i} color="#6366F1"
                      onClick={() => setFocusRow(i)} />
                  ))}
                </div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '6px' }}>
                  This word's Query scores every other word.
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'Space Mono, monospace', color: '#F59E0B', marginBottom: '8px', letterSpacing: '1px' }}>
                  🔑 ZOOM PAIR — see this pair's arithmetic:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {tokens.map((tok, i) => (
                    <TBtn key={i} word={tok.word} idx={i}
                      selected={focusCol === i} color="#F59E0B"
                      onClick={() => setFocusCol(i)} />
                  ))}
                </div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '6px' }}>
                  See the detailed dot product for this pair below.
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 1: Q and K vectors ── */}
          <div style={{ background: '#0B1221', border: '1px solid #6366F133', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Circle n="1" color="#6366F1" />
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>
                Query of "{tokenNames[focusRow]}" vs Key of "{tokenNames[focusCol]}"
              </div>
            </div>
            <div style={{ paddingLeft: '36px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Vec vec={qR} label={`Q["${tokenNames[focusRow]}"]`} color="#6366F1" dimLabels={embDims} />
              <Vec vec={kC} label={`K["${tokenNames[focusCol]}"]`} color="#F59E0B" dimLabels={embDims} />
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                These {EMBED}-dimensional vectors are compared element-by-element in the next step.
              </div>
            </div>
          </div>

          {/* ── STEP 2: Dot product arithmetic ── */}
          <div style={{ background: '#0B1221', border: '1px solid #06B6D433', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Circle n="2" color="#06B6D4" />
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>
                Dot Product: Q[d] × K[d] for every dimension d, then sum
              </div>
            </div>
            <div style={{ paddingLeft: '36px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'separate', borderSpacing: '3px', minWidth: 'max-content' }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: '9px', color: '#475569', fontFamily: 'Space Mono, monospace', padding: '3px 8px', fontWeight: '400', textAlign: 'left' }}>row</th>
                      {embDims.map((l) => (
                        <th key={l} style={{ fontSize: '9px', color: '#475569', fontFamily: 'Space Mono, monospace', padding: '3px 5px', fontWeight: '400', textAlign: 'center' }}>{l}</th>
                      ))}
                      <th style={{ fontSize: '9px', color: '#475569', fontFamily: 'Space Mono, monospace', padding: '3px 8px', fontWeight: '400' }}>SUM →</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#6366F1', padding: '4px 8px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        Q["{tokenNames[focusRow]}"]
                      </td>
                      {qR.map((v, i) => (
                        <td key={i} style={{ textAlign: 'center', padding: '3px 3px' }}><Chip value={v} size="sm" /></td>
                      ))}
                      <td />
                    </tr>
                    <tr>
                      <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#F59E0B', padding: '4px 8px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        K["{tokenNames[focusCol]}"]
                      </td>
                      {kC.map((v, i) => (
                        <td key={i} style={{ textAlign: 'center', padding: '3px 3px' }}><Chip value={v} size="sm" /></td>
                      ))}
                      <td />
                    </tr>
                    <tr>
                      <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#06B6D4', padding: '4px 8px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        Q × K (each d)
                      </td>
                      {terms.map((v, i) => (
                        <td key={i} style={{ textAlign: 'center', padding: '3px 3px' }}><Chip value={v} size="sm" /></td>
                      ))}
                      <td style={{ textAlign: 'center', padding: '3px 6px' }}>
                        <Chip value={dot} size="lg" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'Space Mono, monospace', color: '#475569', marginTop: '8px', lineHeight: '1.9', wordBreak: 'break-all' }}>
                {qR.map((q, i) => `(${q.toFixed(2)}×${kC[i].toFixed(2)})`).join(' + ')}
                {' = '}
                <span style={{ color: '#06B6D4', fontWeight: '700' }}>{dot.toFixed(4)}</span>
                {'  ÷ '}
                <span style={{ color: '#F59E0B' }}>{attn.scale.toFixed(2)}</span>
                {' = '}
                <span style={{ color: '#10B981', fontWeight: '700' }}>{scaled.toFixed(4)}</span>
                <span style={{ color: '#475569' }}> (scaled score)</span>
              </div>
            </div>
          </div>

          {/* ── STEP 3: Full softmax pipeline for ALL words ── */}
          <div style={{ background: '#0B1221', border: '1px solid #F59E0B33', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Circle n="3" color="#F59E0B" />
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>
                "{tokenNames[focusRow]}" scores EVERY word — then Softmax converts to %
              </div>
            </div>
            <div style={{ paddingLeft: '36px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px', lineHeight: '1.7' }}>
                Softmax needs ALL scores at once.
                Formula: <span style={{ fontFamily: 'Space Mono, monospace', color: '#F59E0B' }}>weight[j] = exp(score[j]) / Σ exp(score[all])</span>
                <br />
                Scores are exponentiated so all values become positive, then divided by their total to make them sum to 1.0.
              </div>

              {/* Full pipeline table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'separate', borderSpacing: '3px', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: '9px', color: '#475569', fontFamily: 'Space Mono, monospace', padding: '3px 6px', fontWeight: '400', textAlign: 'left' }}>word</th>
                      <th style={{ fontSize: '9px', color: '#6366F1', fontFamily: 'Space Mono, monospace', padding: '3px 6px', fontWeight: '700', textAlign: 'center' }}>raw dot</th>
                      <th style={{ fontSize: '9px', color: '#F59E0B', fontFamily: 'Space Mono, monospace', padding: '3px 6px', fontWeight: '700', textAlign: 'center' }}>÷ {attn.scale.toFixed(2)} →</th>
                      <th style={{ fontSize: '9px', color: '#8B5CF6', fontFamily: 'Space Mono, monospace', padding: '3px 6px', fontWeight: '700', textAlign: 'center' }}>exp(score)</th>
                      <th style={{ fontSize: '9px', color: '#10B981', fontFamily: 'Space Mono, monospace', padding: '3px 6px', fontWeight: '700', textAlign: 'center' }}>÷ total → %</th>
                      <th style={{ fontSize: '9px', color: '#475569', fontFamily: 'Space Mono, monospace', padding: '3px 6px', fontWeight: '400' }}>bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((tok, j) => {
                      const isSelected = j === focusCol;
                      const pct = softmaxOut[j] * 100;
                      const rowColor = isSelected ? '#10B981' : COLORS[j % COLORS.length];
                      return (
                        <tr key={j} style={{ background: isSelected ? '#10B98110' : 'transparent' }}>
                          <td style={{
                            fontFamily: 'Space Mono, monospace', fontSize: '10px', fontWeight: '700',
                            color: rowColor, padding: '5px 6px', whiteSpace: 'nowrap',
                            border: isSelected ? `1px solid ${rowColor}44` : '1px solid transparent',
                            borderRadius: '4px',
                          }}>"{tok.word}"</td>
                          <td style={{ textAlign: 'center', padding: '4px 4px' }}>
                            <span style={{
                              fontFamily: 'Space Mono, monospace', fontSize: '9px',
                              color: allDots[j] >= 0 ? '#67E8F9' : '#FCA5A5', fontWeight: '700',
                            }}>{allDots[j].toFixed(3)}</span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '4px 4px' }}>
                            <span style={{
                              fontFamily: 'Space Mono, monospace', fontSize: '9px',
                              color: allScaled[j] >= 0 ? '#FCD34D' : '#FCA5A5', fontWeight: '700',
                            }}>{allScaled[j].toFixed(3)}</span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '4px 4px' }}>
                            <span style={{
                              fontFamily: 'Space Mono, monospace', fontSize: '9px',
                              color: '#C4B5FD', fontWeight: '700',
                            }}>{exps[j].toFixed(4)}</span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '4px 4px' }}>
                            <span style={{
                              fontFamily: 'Space Mono, monospace', fontSize: '10px', fontWeight: '700',
                              color: rowColor,
                            }}>{pct.toFixed(2)}%</span>
                          </td>
                          <td style={{ padding: '4px 6px', minWidth: '80px' }}>
                            <div style={{
                              height: '12px', background: '#060B14', borderRadius: '3px', overflow: 'hidden',
                              border: `1px solid ${isSelected ? rowColor : '#1E2A45'}`,
                            }}>
                              <div style={{
                                width: `${pct}%`, height: '100%',
                                background: isSelected
                                  ? `linear-gradient(90deg, ${rowColor}88, ${rowColor})`
                                  : `linear-gradient(90deg, ${rowColor}44, ${rowColor}66)`,
                                borderRadius: '3px', transition: 'width 0.4s ease',
                              }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {/* totals row */}
                    <tr>
                      <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#475569', padding: '5px 6px', fontWeight: '700' }}>TOTAL</td>
                      <td />
                      <td />
                      <td style={{ textAlign: 'center', padding: '4px 4px' }}>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#8B5CF6', fontWeight: '700' }}>
                          {exps.reduce((a, b) => a + b, 0).toFixed(4)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px 4px' }}>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#10B981', fontWeight: '700' }}>
                          {(softmaxOut.reduce((a, b) => a + b, 0) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{
                marginTop: '12px', padding: '10px 14px',
                background: '#10B98112', border: '1px solid #10B98144', borderRadius: '6px',
                fontSize: '11px', color: '#94A3B8', lineHeight: '1.7',
              }}>
                <strong style={{ color: '#6EE7B7' }}>"{tokenNames[focusRow]}"</strong> pays{' '}
                <strong style={{ color: '#10B981' }}>{(softmaxOut[focusCol] * 100).toFixed(2)}%</strong> attention to{' '}
                <strong style={{ color: '#F59E0B' }}>"{tokenNames[focusCol]}"</strong>.{' '}
                All {seqLen} percentages sum to exactly{' '}
                <span style={{ color: '#10B981', fontFamily: 'Space Mono, monospace' }}>100%</span>.
              </div>
            </div>
          </div>

          {/* ── STEP 4: Blend with V ── */}
          <div style={{ background: '#0B1221', border: '1px solid #EC489933', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Circle n="4" color="#EC4899" />
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>
                Blend Values: use the % weights to mix Value vectors → final output
              </div>
            </div>
            <div style={{ paddingLeft: '36px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '10px', lineHeight: '1.7' }}>
                "{tokenNames[focusRow]}" mixes Value vectors from all words.
                "{tokenNames[focusCol]}" contributes{' '}
                <strong style={{ color: '#EC4899' }}>{(softmaxOut[focusCol] * 100).toFixed(2)}%</strong> of its Value:
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'Space Mono, monospace', color: '#64748B', marginBottom: '4px' }}>
                {softmaxOut[focusCol].toFixed(4)} × V["{tokenNames[focusCol]}"] =
              </div>
              <Vec vec={vC.map((v) => v * softmaxOut[focusCol])} label="contribution" color="#EC4899" dimLabels={embDims} compact />
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '10px', lineHeight: '1.6' }}>
                The final output for "{tokenNames[focusRow]}" = sum of contributions from ALL {seqLen} words.
                Go to <strong style={{ color: '#EC4899' }}>🔬 Full Trace</strong> to see every word's contribution summed together.
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div style={{ background: '#0B1221', border: '1px solid #1E2A45', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0', marginBottom: '4px' }}>
              Full Attention Heatmap — all {seqLen}×{seqLen} pairs
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px' }}>
              Row = attending word. Column = attended word. Brighter = more attention.
            </div>
            <AttentionHeatmap weights={attn.attn_weights} rowTokens={tokenNames} colTokens={tokenNames} />
          </div>
        </div>
        );
      })()}

      {/* ══ TAB 4: FULL TRACE ════════════════════════════════════════════════════ */}
      {activeTab === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Callout color="#EC4899" icon="🔬" title="Complete End-to-End Trace for One Word">
            Pick any word and we'll trace EVERYTHING — from input embedding X₁ all the way to the final
            context-enriched output vector, showing every number at every step.
          </Callout>

          <div>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>Pick a word to trace:</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {tokens.map((tok, i) => (
                <TBtn key={i} word={tok.word} idx={i}
                  selected={focusRow === i} color={COLORS[i % COLORS.length]}
                  onClick={() => setFocusRow(i)} />
              ))}
            </div>
          </div>

          {/* A: Input */}
          <div style={{ background: '#0B1221', border: '1px solid #06B6D433', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <Badge n="A" color="#06B6D4" />
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0' }}>
                Input: x_"{tokenNames[focusRow]}" — the {EMBED}-dim vector from Step 3
              </div>
            </div>
            <div style={{ paddingLeft: '38px' }}>
              <Vec vec={X1[focusRow]} label={`x_"${tokenNames[focusRow]}"`} color="#06B6D4" dimLabels={embDims} />
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>
                This is the starting point. These {EMBED} numbers encode what "{tokenNames[focusRow]}" means and where it sits in the sentence.
              </div>
            </div>
          </div>

          {/* B: Q, K, V */}
          <div style={{ background: '#0B1221', border: '1px solid #F59E0B33', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <Badge n="B" color="#F59E0B" />
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0' }}>
                Create Q, K, V for "{tokenNames[focusRow]}" (x × Wq, x × Wk, x × Wv)
              </div>
            </div>
            <div style={{ paddingLeft: '38px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { role: 'Q', vec: attn.Q[focusRow], color: '#6366F1', e: '🔍', d: 'What am I looking for?' },
                { role: 'K', vec: attn.K[focusRow], color: '#F59E0B', e: '🔑', d: 'What do I have?' },
                { role: 'V', vec: attn.V[focusRow], color: '#10B981', e: '📦', d: 'What can I share?' },
              ].map(({ role, vec, color, e, d }) => (
                <div key={role}>
                  <div style={{ fontSize: '11px', fontFamily: 'Space Mono, monospace', color, marginBottom: '4px' }}>
                    {e} {role} = x × W{role.toLowerCase()}  ← "{d}"
                  </div>
                  <Vec vec={vec} label={`${role.toLowerCase()}_"${tokenNames[focusRow]}"`} color={color} dimLabels={embDims} compact />
                </div>
              ))}
            </div>
          </div>

          {/* C: Score every word */}
          <div style={{ background: '#0B1221', border: '1px solid #06B6D433', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <Badge n="C" color="#06B6D4" />
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0' }}>
                "{tokenNames[focusRow]}" scores every word: Q["{tokenNames[focusRow]}"] · K[each word]
              </div>
            </div>
            <div style={{ paddingLeft: '38px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '10px' }}>
                Dot product → divide by {attn.scale.toFixed(2)} → softmax → attention weights:
              </div>
              {tokens.map((tok, j) => {
                const kj = attn.K[j];
                const termsJ = attn.Q[focusRow].map((q, d) => q * kj[d]);
                const dotJ = termsJ.reduce((a, b) => a + b, 0);
                const scaledJ = dotJ / attn.scale;
                const wj = attn.attn_weights[focusRow][j];
                return (
                  <div key={j} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
                    borderRadius: '6px', marginBottom: '4px', background: '#060B14',
                    border: '1px solid #0F172A',
                  }}>
                    <div style={{
                      fontFamily: 'Space Mono, monospace', fontSize: '10px', fontWeight: '700',
                      color: COLORS[j % COLORS.length], minWidth: '75px',
                    }}>"{tok.word}"</div>
                    <div style={{ fontSize: '9px', color: '#475569', fontFamily: 'Space Mono, monospace', flex: 1 }}>
                      dot={dotJ.toFixed(3)}, ÷{attn.scale.toFixed(2)}={scaledJ.toFixed(3)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 2 }}>
                      <div style={{
                        flex: 1, height: '14px', background: '#0B1221', borderRadius: '3px', overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${wj * 100}%`, height: '100%',
                          background: `${COLORS[j % COLORS.length]}99`,
                          borderRadius: '3px', transition: 'width 0.3s',
                        }} />
                      </div>
                      <span style={{
                        fontFamily: 'Space Mono, monospace', fontSize: '9px',
                        color: COLORS[j % COLORS.length], fontWeight: '700', minWidth: '36px',
                      }}>
                        {(wj * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* D: Final output */}
          <div style={{ background: '#0B1221', border: '1px solid #EC489933', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <Badge n="D" color="#EC4899" />
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#E2E8F0' }}>
                Final output = Σ (attention% × V) from all {seqLen} words
              </div>
            </div>
            <div style={{ paddingLeft: '38px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px' }}>
                Each word contributes its Value vector scaled by how much "{tokenNames[focusRow]}" attended to it.
                Sum them all to get the final output:
              </div>

              {tokens.map((tok, j) => {
                const w = attn.attn_weights[focusRow][j];
                return (
                  <div key={j} style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'Space Mono, monospace', color: COLORS[j % COLORS.length], marginBottom: '3px' }}>
                      {(w * 100).toFixed(1)}% × V["{tok.word}"]
                    </div>
                    <Vec vec={attn.V[j].map((v) => v * w)} color={COLORS[j % COLORS.length]} dimLabels={embDims} compact />
                  </div>
                );
              })}

              <div style={{
                borderTop: '2px dashed #1E2A45', marginTop: '14px', paddingTop: '14px',
              }}>
                <div style={{ fontSize: '12px', fontFamily: 'Space Mono, monospace', color: '#EC4899', marginBottom: '8px' }}>
                  ↓ add all contributions above ↓  Final output for "{tokenNames[focusRow]}":
                </div>
                <Vec vec={attn.output[focusRow]} label="output" color="#EC4899" dimLabels={embDims} />
                <div style={{
                  marginTop: '12px', padding: '10px 14px',
                  background: '#EC489912', border: '1px solid #EC489944', borderRadius: '6px',
                  fontSize: '12px', color: '#94A3B8', lineHeight: '1.7',
                }}>
                  ✅ This vector now carries the meaning of "{tokenNames[focusRow]}"
                  <strong style={{ color: '#F9A8D4' }}> enriched by context</strong> from all {seqLen} words.
                  It knows about the sentence around it — not just its own isolated meaning.
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
