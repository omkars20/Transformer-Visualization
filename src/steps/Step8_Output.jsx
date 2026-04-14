import { useState, useMemo } from 'react';
import {
  MatrixViz, InsightBox, Formula, SectionLabel,
} from '../components/MatrixViz.jsx';
import { CFG, VOCAB, r, softmaxRow } from '../utils/llmEngine.js';

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

const BAR_COLORS = ['#6366F1','#06B6D4','#10B981','#F59E0B','#EC4899','#8B5CF6','#EF4444','#F97316','#14B8A6','#84CC16'];

export default function Step8_Output({ result }) {
  if (!result) return null;
  const { tokens, X3, out } = result;
  const seqLen    = tokens.length;
  const names     = tokens.map(t => t.word);
  const lastToken = names[names.length - 1];

  const [samplingMethod, setSamplingMethod] = useState('greedy');
  const [temperature, setTemperature]       = useState(1.0);
  const [showSoftmaxMath, setShowSoftmaxMath] = useState(false);

  // Recompute top-10 at current temperature
  const tempTop10 = useMemo(() => {
    const scaled = out.logits.map(x => x / temperature);
    const probs  = softmaxRow(scaled);
    return VOCAB.map((word, id) => ({ word, id, prob: probs[id], pct: r(probs[id] * 100, 2) }))
      .sort((a, b) => b.prob - a.prob)
      .slice(0, 10);
  }, [out.logits, temperature]);

  // Softmax math drill-down for top-5 at current temperature
  const softmaxMath = useMemo(() => {
    const top5 = tempTop10.slice(0, 5);
    const top5logits = top5.map(t => r(out.logits[t.id] / temperature, 4));
    const maxVal = Math.max(...top5logits);
    const exps   = top5logits.map(x => r(Math.exp(x - maxVal), 5));
    const sumAll = r(softmaxRow(out.logits.map(x => x / temperature)).reduce((a, b) => a + b, 0), 4);
    return { top5, top5logits, maxVal: r(maxVal, 4), exps, sumAll };
  }, [tempTop10, out.logits, temperature]);

  // Logit range for bar normalisation
  const maxLogit = Math.max(...out.logits);
  const minLogit = Math.min(...out.logits);
  const logitBarW = (logit) => Math.max(3, ((logit - minLogit) / (maxLogit - minLogit || 1)) * 100);

  const col8 = Array.from({ length: CFG.EMBED_DIM }, (_, i) => `f${i}`);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── HEADER ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{
            background: '#F9731622', border: '1px solid #F97316', borderRadius: '8px',
            padding: '4px 12px', fontFamily: 'Space Mono, monospace', fontSize: '11px',
            color: '#F97316', fontWeight: '700', letterSpacing: '1px',
          }}>STEP 8 OF 8</span>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#E2E8F0', margin: 0 }}>
            Output — The Model Makes Its Prediction
          </h2>
        </div>
        <p style={{ color: '#64748B', fontSize: '13px', margin: 0, lineHeight: '1.7' }}>
          After 7 steps of transformation, we convert the final token vector into a probability
          over every word in the vocabulary and pick the most likely next word.
          Every number below comes from your actual input sentence.
        </p>
      </div>

      {/* ── PREDICTION HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg, #6366F115 0%, #F9731615 100%)',
        border: '2px solid #6366F1', borderRadius: '14px', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '14px',
      }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#6366F1', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '700' }}>
          Prediction Complete
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            Your input
          </div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '17px', color: '#E2E8F0', fontWeight: '600' }}>
            "{names.join(' ')}"
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              Predicted next word
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '40px', fontWeight: '800', color: '#F97316', lineHeight: 1 }}>
              "{out.predicted.word}"
            </div>
            <div style={{ fontSize: '12px', color: '#F97316', opacity: 0.8, marginTop: '4px' }}>
              {out.predicted.pct}% confidence
            </div>
          </div>
          <div style={{ background: '#10B98115', border: '1px solid #10B98155', borderRadius: '10px', padding: '12px 16px', flex: 1, minWidth: '180px' }}>
            <div style={{ fontSize: '11px', color: '#10B981', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Complete sentence</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px', color: '#E2E8F0', fontWeight: '600', lineHeight: '1.5' }}>
              "{names.join(' ')} <span style={{ color: '#10B981' }}>{out.predicted.word}</span>"
            </div>
          </div>
        </div>
      </div>

      {/* ── PIPELINE: 3 STEPS ── */}
      <div className="viz-card">
        <SectionLabel>How We Get From Hidden State → Next Word — 3 Steps</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '8px' }}>

          {/* STEP 1: Pick the last token */}
          <StepRow n="1" color="#06B6D4" title={`Use ONLY the last token's vector — "${lastToken}"`}>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
              X3 is the full <Chip>({seqLen}×{CFG.EMBED_DIM})</Chip> final hidden state.
              We only use the <strong style={{ color: '#E2E8F0' }}>last row</strong> — the vector for "{lastToken}".
            </p>
            <Box color="#06B6D4" icon="❓" title="Why only the last token?">
              In autoregressive language models, the last token has <em>attended to every token before it</em>
              through all the attention layers. Its vector is a rich summary of the entire sentence context
              up to that point. Asking "what comes next?" is equivalent to asking the most recent word
              "what have you learned from everything before you?"
            </Box>
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
                Full final state X3 ({seqLen}×{CFG.EMBED_DIM}) — we only use the highlighted last row:
              </div>
              <MatrixViz matrix={X3} rowLabels={names} colLabels={col8} size="sm" showColorBar />
            </div>
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: '#06B6D4', fontFamily: 'Space Mono, monospace', marginBottom: '4px' }}>
                lastVec = X3["{lastToken}"]  — shape ({CFG.EMBED_DIM},):
              </div>
              <div style={{
                fontFamily: 'Space Mono, monospace', fontSize: '12px',
                background: '#0B0D17', border: '1px solid #06B6D433',
                borderRadius: '8px', padding: '12px',
                color: '#06B6D4', wordBreak: 'break-all',
              }}>
                [{out.lastVec.map(x => x.toFixed(3)).join(',  ')}]
              </div>
            </div>
          </StepRow>

          {/* STEP 2: Logits */}
          <StepRow n="2" color="#F59E0B" title={`Compute ${CFG.VOCAB_SIZE} logits — one score per vocabulary word`}>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
              We multiply lastVec by the output weight matrix <Chip color="#F59E0B">Wout</Chip>:
            </p>
            <div style={{
              fontFamily: 'Space Mono, monospace', fontSize: '12px',
              background: '#0B0D17', border: '1px solid #F59E0B33',
              borderRadius: '8px', padding: '12px', lineHeight: '2', marginBottom: '14px',
            }}>
              <div>
                <span style={{ color: '#64748B' }}>lastVec</span>
                <span style={{ color: '#475569' }}>  ({CFG.EMBED_DIM},) </span>
                <span style={{ color: '#475569' }}>@  Wout  </span>
                <span style={{ color: '#475569' }}>({CFG.EMBED_DIM}×{CFG.VOCAB_SIZE})</span>
                <span style={{ color: '#F59E0B' }}>  =  logits  ({CFG.VOCAB_SIZE},)</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
              Each of the {CFG.VOCAB_SIZE} output numbers is a{' '}
              <strong style={{ color: '#F59E0B' }}>dot product of lastVec with one column of Wout</strong>.
              That column is the "fingerprint" of that vocabulary word in the output weight space.
              A high dot product = the hidden state looks a lot like that word → high logit.
            </p>
            <Box color="#F59E0B" icon="🗳️" title="Intuition: logits are raw vote counts">
              Each vocabulary word gets one vote count. The count can be any number — positive,
              negative, very large, very small. They are NOT probabilities yet.
              Think of them as a raw election tally before counting percentages.
            </Box>

            {/* Logit bar chart */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                Top 10 raw logits (out of {CFG.VOCAB_SIZE} total):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {out.top10.map((item, i) => {
                  const isTop = i === 0;
                  const col = BAR_COLORS[i % BAR_COLORS.length];
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '22px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: isTop ? col : '#475569', fontWeight: isTop ? '700' : '400', textAlign: 'right', flexShrink: 0 }}>#{i + 1}</div>
                      <div style={{ width: '90px', fontFamily: 'Space Mono, monospace', fontSize: '12px', fontWeight: isTop ? '700' : '400', color: isTop ? col : '#94A3B8', flexShrink: 0 }}>
                        {isTop && '★ '}"{item.word}"
                      </div>
                      <div style={{ flex: 1, height: '16px', background: '#1E2A45', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${logitBarW(item.logit)}%`, height: '100%', background: col, opacity: isTop ? 1 : 0.5, borderRadius: '4px' }} />
                      </div>
                      <div style={{ width: '56px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: isTop ? col : '#475569', textAlign: 'right', flexShrink: 0, fontWeight: isTop ? '700' : '400' }}>
                        {item.logit.toFixed(3)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#475569', fontStyle: 'italic' }}>
                Logit range: {minLogit.toFixed(3)} to {maxLogit.toFixed(3)}.
                These are raw scores — not percentages yet.
              </div>
            </div>
          </StepRow>

          {/* STEP 3: Softmax */}
          <StepRow n="3" color="#6366F1" title="Softmax → convert raw scores to probabilities">
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
              <Chip color="#6366F1">softmax(x)ᵢ = exp(xᵢ) / Σⱼ exp(xⱼ)</Chip>
              <br /><br />
              Applied to all {CFG.VOCAB_SIZE} logits simultaneously. The result: every word gets a
              probability between 0 and 1, and all {CFG.VOCAB_SIZE} of them sum to exactly 1.0.
            </p>
            <Box color="#6366F1" icon="📊" title="Why softmax amplifies the winner">
              A logit of 2.1 vs 1.9 seems close. But exp(2.1) ≈ 8.2 and exp(1.9) ≈ 6.7 — the
              higher score gets <em>disproportionately</em> more probability. This "sharpening"
              makes the model commit to one answer instead of shrugging at everything equally.
            </Box>

            {/* Toggle: softmax math */}
            <button
              onClick={() => setShowSoftmaxMath(v => !v)}
              style={{
                padding: '8px 16px', borderRadius: '6px', margin: '12px 0',
                border: '1px solid #6366F1', background: showSoftmaxMath ? '#6366F122' : 'transparent',
                color: '#6366F1', fontFamily: 'Space Mono, monospace', fontSize: '11px',
                fontWeight: '700', cursor: 'pointer',
              }}
            >
              {showSoftmaxMath ? '▼' : '▶'} SHOW SOFTMAX MATH for top 5 candidates
            </button>

            {showSoftmaxMath && (
              <div style={{
                background: '#0B0D17', border: '1px solid #6366F133',
                borderRadius: '8px', padding: '16px', marginBottom: '14px',
                fontFamily: 'Space Mono, monospace', fontSize: '12px', lineHeight: '2',
              }}>
                <div style={{ color: '#64748B', marginBottom: '8px' }}>
                  Showing only top 5 words (the full sum uses all {CFG.VOCAB_SIZE} logits):
                </div>

                <div style={{ color: '#475569', fontSize: '11px', marginBottom: '6px' }}>
                  Step 1 — scale logits by temperature ({temperature.toFixed(1)}) and subtract max ({softmaxMath.maxVal}) for stability:
                </div>
                {softmaxMath.top5.map((t, i) => (
                  <div key={i} style={{ color: i === 0 ? '#E2E8F0' : '#94A3B8' }}>
                    "{t.word}":  logit={r(out.logits[t.id], 4).toFixed(4)}  ÷ {temperature.toFixed(1)}  = {softmaxMath.top5logits[i].toFixed(4)}  − {softmaxMath.maxVal}  → exp() = <span style={{ color: '#6366F1' }}>{softmaxMath.exps[i].toFixed(5)}</span>
                  </div>
                ))}

                <div style={{ color: '#475569', fontSize: '11px', marginTop: '10px', marginBottom: '4px' }}>
                  Step 2 — divide by sum of ALL {CFG.VOCAB_SIZE} exp() values (≈ 1.0 since probs sum to 1):
                </div>
                {softmaxMath.top5.map((t, i) => (
                  <div key={i} style={{ color: i === 0 ? '#E2E8F0' : '#94A3B8' }}>
                    "{t.word}":  {softmaxMath.exps[i].toFixed(5)} / sum  →  <span style={{ color: '#6366F1', fontWeight: '700' }}>{t.pct.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Prob bar chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '12px' }}>
              {tempTop10.map((item, i) => {
                const isTop = i === 0;
                const col = BAR_COLORS[i % BAR_COLORS.length];
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '22px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: isTop ? col : '#475569', fontWeight: isTop ? '700' : '400', textAlign: 'right', flexShrink: 0 }}>#{i + 1}</div>
                    <div style={{ width: '90px', fontFamily: 'Space Mono, monospace', fontSize: '12px', fontWeight: isTop ? '700' : '400', color: isTop ? col : '#94A3B8', flexShrink: 0 }}>
                      {isTop && '→ '}"{item.word}"
                    </div>
                    <div style={{ flex: 1, height: '18px', background: '#1E2A45', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(item.pct * 2.5, 100)}%`, height: '100%', background: col, opacity: isTop ? 1 : 0.55, borderRadius: '4px', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ width: '56px', fontFamily: 'Space Mono, monospace', fontSize: '12px', fontWeight: isTop ? '700' : '400', color: isTop ? col : '#475569', textAlign: 'right', flexShrink: 0 }}>
                      {item.pct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Temperature slider */}
            <div style={{ background: '#0B0D17', border: '1px solid #1E2A45', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#E2E8F0', marginBottom: '4px' }}>
                Temperature = {temperature.toFixed(1)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '10px', lineHeight: '1.6' }}>
                Temperature divides all logits before softmax.{' '}
                <Chip color="#F59E0B">T → 0</Chip> = model becomes more confident (spiky).{' '}
                <Chip color="#6366F1">T → ∞</Chip> = all words equally likely (flat). Drag and watch the bars above change.
              </div>
              <input
                type="range" min="0.1" max="2.5" step="0.1"
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#F59E0B' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', fontFamily: 'Space Mono, monospace', marginTop: '4px' }}>
                <span>0.1 (sharp/confident)</span>
                <span>1.0 (normal)</span>
                <span>2.5 (flat/random)</span>
              </div>
            </div>
          </StepRow>

          {/* STEP 4: Pick */}
          <StepRow n="4" color="#F97316" title="Pick a word — greedy, sampling, or nucleus" last>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7', margin: '0 0 12px' }}>
              We have probabilities. Now how do we choose the final word?
              There are multiple strategies, each with a different trade-off between
              <em> predictability</em> and <em> creativity</em>.
            </p>

            {/* Strategy selector */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {[
                { key: 'greedy',   label: 'Greedy',        color: '#10B981' },
                { key: 'sampling', label: 'Sampling',       color: '#6366F1' },
                { key: 'top-k',    label: 'Top-K',          color: '#06B6D4' },
                { key: 'top-p',    label: 'Top-P (Nucleus)',color: '#EC4899' },
              ].map(({ key, label, color }) => (
                <button key={key} onClick={() => setSamplingMethod(key)} style={{
                  padding: '7px 16px', borderRadius: '8px', border: `1.5px solid ${samplingMethod === key ? color : '#1E2A45'}`,
                  background: samplingMethod === key ? `${color}18` : 'transparent',
                  color: samplingMethod === key ? color : '#64748B',
                  fontFamily: 'Space Mono, monospace', fontSize: '11px',
                  cursor: 'pointer', fontWeight: samplingMethod === key ? '700' : '400', transition: 'all 0.15s',
                }}>{label}</button>
              ))}
            </div>

            {samplingMethod === 'greedy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Box color="#10B981" icon="🎯" title="Greedy — always take the #1 word">
                  Simply pick <strong style={{ color: '#6EE7B7' }}>argmax(probs)</strong> — the word
                  with the highest probability. No randomness. Same input always → same output.
                  <br /><br />
                  Result: <strong style={{ color: '#10B981', fontFamily: 'Space Mono, monospace' }}>"{out.predicted.word}"</strong> with {out.predicted.pct}% confidence.
                  <br /><br />
                  <span style={{ color: '#475569' }}>
                    Used when you need consistency: code completion, factual Q&amp;A.
                    Downside: can be repetitive and boring for creative text.
                  </span>
                </Box>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', background: '#0B0D17', padding: '10px 12px', borderRadius: '6px', color: '#94A3B8', lineHeight: '2' }}>
                  <div>probs = [{tempTop10.slice(0, 3).map(t => `${t.pct.toFixed(1)}%`).join(', ')}, ...]</div>
                  <div>argmax → index of {tempTop10[0].pct.toFixed(1)}% → <span style={{ color: '#10B981', fontWeight: '700' }}>"{tempTop10[0].word}"</span></div>
                </div>
              </div>
            )}

            {samplingMethod === 'sampling' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Box color="#6366F1" icon="🎲" title="Sampling — roll a weighted dice">
                  Treat the probabilities as a probability distribution and randomly draw from it.
                  A word with 40% prob gets picked 40% of the time on average.
                  <br /><br />
                  Likely candidates this run: {tempTop10.slice(0, 3).map((t, i) => (
                    <strong key={i} style={{ color: BAR_COLORS[i], fontFamily: 'Space Mono, monospace' }}>"{t.word}"({t.pct.toFixed(1)}%) </strong>
                  ))}
                  <br /><br />
                  <span style={{ color: '#475569' }}>
                    This is why ChatGPT gives different answers to the same question each time.
                    Creative and varied, but can occasionally pick weird words.
                  </span>
                </Box>
              </div>
            )}

            {samplingMethod === 'top-k' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Box color="#06B6D4" icon="🏆" title="Top-K — restrict the dice to K best options">
                  Keep only the top K candidates, set everyone else's probability to 0,
                  re-normalise to 100%, then sample.
                  <br /><br />
                  With K=5, only these words are in the pool:{' '}
                  <strong style={{ color: '#06B6D4', fontFamily: 'Space Mono, monospace' }}>
                    {tempTop10.slice(0, 5).map(t => `"${t.word}"`).join(', ')}
                  </strong>
                  <br /><br />
                  <span style={{ color: '#475569' }}>
                    K is a tuneable knob. K=1 = greedy. K=large = almost full sampling.
                    Prevents the model from accidentally picking very-low-probability bizarre words.
                  </span>
                </Box>
              </div>
            )}

            {samplingMethod === 'top-p' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Box color="#EC4899" icon="🌊" title="Top-P / Nucleus — adapt the pool size to confidence">
                  Add words in rank order until their cumulative probability reaches p (e.g. 90%).
                  Then sample from that set.
                  <br /><br />
                  {(() => {
                    let cum = 0;
                    const pool = [];
                    for (const t of tempTop10) {
                      cum += t.pct;
                      pool.push(t);
                      if (cum >= 90) break;
                    }
                    return (
                      <>
                        At p=90%, pool = <strong style={{ color: '#EC4899', fontFamily: 'Space Mono, monospace' }}>
                          {pool.map(t => `"${t.word}"`).join(', ')}
                        </strong> ({pool.length} words, covers {r(cum, 1)}%)
                      </>
                    );
                  })()}
                  <br /><br />
                  <span style={{ color: '#475569' }}>
                    When the model is very confident, the pool might be just 1-2 words (focused).
                    When uncertain, many words are included (creative). Used by GPT-4, Claude, Gemini.
                  </span>
                </Box>
              </div>
            )}
          </StepRow>

        </div>
      </div>

      {/* ── TOP 10 LEADERBOARD ── */}
      <div className="viz-card">
        <SectionLabel>Full Leaderboard — Top 10 Predictions (at temperature {temperature.toFixed(1)})</SectionLabel>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 14px', lineHeight: '1.7' }}>
          Every word in the vocabulary gets a score. Here are the 10 most likely next words.
          Change the temperature slider above and come back to see how the distribution shifts.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tempTop10.map((item, i) => {
            const isTop = i === 0;
            const col   = BAR_COLORS[i % BAR_COLORS.length];
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: isTop ? '10px 12px' : '6px 12px', borderRadius: '8px',
                background: isTop ? `${col}15` : 'transparent',
                border: isTop ? `1px solid ${col}44` : '1px solid transparent',
              }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: isTop ? col : '#1E2A45', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Mono, monospace', fontSize: '10px', fontWeight: '700', color: isTop ? '#fff' : '#64748B', flexShrink: 0 }}>{i + 1}</div>
                <div style={{ width: '96px', fontFamily: 'Space Mono, monospace', fontSize: isTop ? '14px' : '12px', fontWeight: isTop ? '700' : '400', color: isTop ? col : '#94A3B8', flexShrink: 0 }}>"{item.word}"</div>
                <div style={{ flex: 1, height: '14px', background: '#1E2A45', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(item.pct * 2.5, 100)}%`, height: '100%', background: col, opacity: isTop ? 1 : 0.5, borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
                <div style={{ width: '52px', textAlign: 'right', fontFamily: 'Space Mono, monospace', fontSize: isTop ? '13px' : '11px', fontWeight: isTop ? '700' : '400', color: isTop ? col : '#64748B', flexShrink: 0 }}>{item.pct.toFixed(1)}%</div>
                {isTop && <div style={{ background: col, color: '#fff', borderRadius: '6px', padding: '2px 8px', fontFamily: 'Space Mono, monospace', fontSize: '9px', fontWeight: '700', flexShrink: 0 }}>WINNER</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AUTOREGRESSION ── */}
      <div className="viz-card">
        <SectionLabel>What Happens Next — Autoregression</SectionLabel>
        <Box color="#6366F1" icon="🔁" title="One word at a time, forever">
          The model does NOT write the whole sentence at once. It predicts <strong style={{ color: '#A5B4FC' }}>one token</strong>,
          appends it to the input, then runs the <strong style={{ color: '#A5B4FC' }}>full 8-step pipeline again</strong>
          to get the next word. This loop repeats until an end-of-sentence token is predicted or
          a maximum length is hit.
        </Box>
        <div style={{
          marginTop: '16px', background: '#0B0D17', border: '1px solid #1E2A45',
          borderRadius: '10px', padding: '18px', fontFamily: 'Space Mono, monospace',
          fontSize: '12px', lineHeight: '2.4', color: '#94A3B8',
        }}>
          <div>
            <span style={{ color: '#6366F188', marginRight: '8px' }}>Step 1:</span>
            "{names.join(' ')}"
            <span style={{ color: '#64748B' }}> → </span>
            <span style={{ color: '#6366F1', fontWeight: '700' }}>"{out.predicted.word}"</span>
            <span style={{ color: '#10B981', fontSize: '10px', marginLeft: '8px' }}>← you just saw this</span>
          </div>
          <div>
            <span style={{ color: '#06B6D488', marginRight: '8px' }}>Step 2:</span>
            "{names.join(' ')} {out.predicted.word}"
            <span style={{ color: '#64748B' }}> → </span>
            <span style={{ color: '#06B6D4', fontWeight: '700' }}>[next token]</span>
          </div>
          <div>
            <span style={{ color: '#10B98188', marginRight: '8px' }}>Step 3:</span>
            "{names.join(' ')} {out.predicted.word} [next]"
            <span style={{ color: '#64748B' }}> → </span>
            <span style={{ color: '#10B981', fontWeight: '700' }}>[next token]</span>
          </div>
          <div style={{ color: '#1E2A45' }}>
            … continues until &lt;eos&gt; or max length
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#475569', lineHeight: '1.7' }}>
          In GPT-4, generating 100 tokens = 100 full forward passes through 96 layers.
          Engineers use <strong style={{ color: '#94A3B8' }}>KV-caching</strong> to avoid recomputing
          past token attention — but the one-token-at-a-time idea is exactly the same.
        </div>
      </div>

      {/* ── FORMULA ── */}
      <Formula>
        {`// Step 1: extract last token's hidden state
lastVec  = X3[-1]                           shape: (${CFG.EMBED_DIM},)

// Step 2: project to vocabulary size (dot product with each word's column)
logits   = lastVec @ Wout                   shape: (${CFG.VOCAB_SIZE},)  ← one score per vocab word

// Step 3: convert to probabilities
probs    = softmax(logits / temperature)    all values 0–1, sum = 1.0

// Step 4: pick a word
Greedy:   next = argmax(probs)              → "${out.predicted.word}"
Sampling: next ~ Categorical(probs)
Top-K:    next ~ Categorical( topK(probs, k) )
Top-P:    next ~ Categorical( nucleus(probs, p=0.9) )`}
      </Formula>

      {/* ── FINAL INSIGHT ── */}
      <InsightBox title="You Have Seen the Whole Transformer">
        Tokenize → Embed → Positional Encode → Attention → FFN → Residual+Norm → Predict.
        Every word ChatGPT, Claude, or Gemini writes goes through exactly this pipeline —
        just with{' '}
        <strong style={{ color: '#E2E8F0' }}>50,000+ vocabulary</strong>,{' '}
        <strong style={{ color: '#E2E8F0' }}>96 stacked transformer blocks</strong>, and{' '}
        <strong style={{ color: '#E2E8F0' }}>trillions of learned parameters</strong>.
        The math — and the magic — is exactly what you just traced through.
      </InsightBox>

    </div>
  );
}
