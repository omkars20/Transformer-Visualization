import React, { useState, useEffect, useRef } from 'react';

const QUERY = 'What is the vacation rollover policy?';

const RETRIEVED_CHUNKS = [
  { rank: 1, text: 'Employees may roll over up to 5 unused vacation days to the following year.', source: 'HR_Manual.pdf §4.2', score: 0.96 },
  { rank: 2, text: 'Rollover days must be used within Q1 of the next calendar year or they are forfeited.', source: 'HR_Manual.pdf §4.2', score: 0.91 },
  { rank: 3, text: 'Vacation days accrue monthly at 1.25 days per month for full-time employees.', source: 'HR_Manual.pdf §4.1', score: 0.88 },
];

const FULL_ANSWER = `Based on your HR manual, the vacation rollover policy works as follows:

1. **Rollover limit**: Employees may roll over up to **5 unused vacation days** to the following year.

2. **Deadline**: These rollover days must be used within **Q1 (January–March) of the next year**. Any unused rollover days after Q1 are forfeited.

3. **Accrual**: Vacation days accrue at **1.25 days per month** for full-time employees (15 days/year total).

**Summary**: You can carry over up to 5 days, but only if you use them before the end of March of the following year.

*Sources: HR_Manual.pdf §4.1, §4.2*`;

const PROMPT_TEMPLATE = `You are a helpful HR assistant. Answer the user's question using ONLY the provided context.
If the answer is not in the context, say "I don't know based on the provided documents."
Always cite the source at the end.

Context:
{CONTEXT}

Question: {QUESTION}

Answer:`;

const RAG_PROBLEMS_AND_FIXES = [
  {
    problem: 'Hallucination',
    cause: 'LLM adds info not in the retrieved context',
    fix: 'Add "Answer ONLY from context, say I don\'t know otherwise" to system prompt',
    color: '#EF4444',
  },
  {
    problem: 'Wrong chunks retrieved',
    cause: 'Retrieval missed the relevant chunk',
    fix: 'Improve chunking, increase K, use hybrid search, add reranker',
    color: '#F59E0B',
  },
  {
    problem: 'Answer too vague',
    cause: 'LLM generalized over all retrieved chunks',
    fix: 'Use smaller chunks, more targeted retrieval, instruct to be specific',
    color: '#8B5CF6',
  },
  {
    problem: 'Slow responses',
    cause: 'Too many chunks, large context window, slow reranker',
    fix: 'Reduce K, use faster reranker, cache common queries, stream responses',
    color: '#06B6D4',
  },
  {
    problem: 'Outdated answers',
    cause: 'Index has stale documents',
    fix: 'Set up automatic re-indexing when documents update (webhooks, cron jobs)',
    color: '#10B981',
  },
];

const PIPELINE_RECAP = [
  { icon: '📄', label: 'Load Docs',    color: '#10B981', phase: 'offline' },
  { icon: '✂️', label: 'Chunk',        color: '#06B6D4', phase: 'offline' },
  { icon: '🔢', label: 'Embed',        color: '#6366F1', phase: 'offline' },
  { icon: '🗄️', label: 'Store',        color: '#8B5CF6', phase: 'offline' },
  { icon: '❓', label: 'Query',        color: '#F59E0B', phase: 'online' },
  { icon: '🔍', label: 'Retrieve',     color: '#EC4899', phase: 'online' },
  { icon: '⬆️', label: 'Rerank',       color: '#EF4444', phase: 'online' },
  { icon: '✨', label: 'Generate',     color: '#F97316', phase: 'online' },
  { icon: '📏', label: 'Evaluate',     color: '#22C55E', phase: 'quality' },
];

export default function RagStep8_Generation() {
  const [step, setStep]          = useState(0); // 0=prompt, 1=generating, 2=done
  const [displayedText, setDisplayedText] = useState('');
  const [showPrompt, setShowPrompt]       = useState(false);
  const timerRef = useRef(null);

  function buildContext() {
    return RETRIEVED_CHUNKS.map((c, i) => `[${i + 1}] (Source: ${c.source})\n${c.text}`).join('\n\n');
  }

  function runGeneration() {
    setStep(1);
    setDisplayedText('');
    let i = 0;
    timerRef.current = setInterval(() => {
      if (i < FULL_ANSWER.length) {
        setDisplayedText(FULL_ANSWER.slice(0, i + 1));
        i += 3;
      } else {
        clearInterval(timerRef.current);
        setStep(2);
      }
    }, 20);
  }

  function reset() {
    clearInterval(timerRef.current);
    setStep(0);
    setDisplayedText('');
  }

  useEffect(() => () => clearInterval(timerRef.current), []);

  const promptFilled = PROMPT_TEMPLATE
    .replace('{CONTEXT}', buildContext())
    .replace('{QUESTION}', QUERY);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Concept */}
      <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ color: '#F97316', fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>
          ✨ Generation — Turning Context Into an Answer
        </h3>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: '0 0 12px' }}>
          After retrieval and reranking, you have 3–5 highly relevant text chunks.
          These are injected into a <strong style={{ color: '#F97316' }}>prompt template</strong> alongside the user's question,
          and sent to the LLM for generation.
        </p>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: 0 }}>
          The LLM's job is simple: <strong style={{ color: '#E2E8F0' }}>read the context, answer the question.</strong>
          A good system prompt instructs it to stay within the provided context and cite sources.
        </p>
      </div>

      {/* Prompt Template */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase' }}>
            Prompt Template
          </div>
          <button onClick={() => setShowPrompt(!showPrompt)} style={{
            padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px',
            fontFamily: 'Space Mono, monospace', border: '1px solid #1E2A45',
            background: showPrompt ? '#F9731622' : 'transparent', color: showPrompt ? '#F97316' : '#64748B',
          }}>{showPrompt ? 'Hide full prompt' : 'Show full prompt'}</button>
        </div>
        <div style={{ background: '#0E1220', border: '1px solid #F9731633', borderRadius: '12px', padding: '18px' }}>
          <pre style={{ margin: 0, fontFamily: 'Space Mono, monospace', fontSize: '11px', lineHeight: '1.8', whiteSpace: 'pre-wrap', color: '#94A3B8' }}>
            {showPrompt ? promptFilled.split('\n').map((line, i) => {
              if (line.startsWith('You are') || line.startsWith('If the') || line.startsWith('Always')) {
                return <span key={i} style={{ color: '#6366F1' }}>{line}{'\n'}</span>;
              }
              if (line.startsWith('[') || line.includes('§')) {
                return <span key={i} style={{ color: '#10B981' }}>{line}{'\n'}</span>;
              }
              if (line.startsWith('Question:')) {
                return <span key={i} style={{ color: '#F97316' }}>{line}{'\n'}</span>;
              }
              return <span key={i}>{line}{'\n'}</span>;
            }) : (
              <>
                <span style={{ color: '#6366F1' }}>System: You are a helpful HR assistant. Answer using ONLY the context. Cite sources.</span>{'\n\n'}
                <span style={{ color: '#10B981' }}>Context: [retrieved chunks injected here]</span>{'\n\n'}
                <span style={{ color: '#F97316' }}>User: {QUERY}</span>
              </>
            )}
          </pre>
        </div>
      </div>

      {/* Live Generation Demo */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Live Generation Demo
        </div>
        <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px', padding: '20px' }}>
          {/* Retrieved context */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', color: '#10B981', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>RETRIEVED CONTEXT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {RETRIEVED_CHUNKS.map(c => (
                <div key={c.rank} style={{ background: '#131728', border: '1px solid #10B98122', borderRadius: '6px', padding: '8px 12px', display: 'flex', gap: '10px' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#10B981', flexShrink: 0 }}>#{c.rank}</span>
                  <div style={{ flex: 1, color: '#94A3B8', fontSize: '12px', lineHeight: '1.5' }}>{c.text}
                    <span style={{ color: '#475569', marginLeft: '8px', fontFamily: 'Space Mono, monospace', fontSize: '10px' }}>({c.source})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={runGeneration}
              disabled={step === 1}
              style={{
                padding: '10px 20px', borderRadius: '8px', cursor: step === 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'Space Mono, monospace', fontSize: '12px', fontWeight: '700',
                border: 'none', background: step === 1 ? '#131728' : 'linear-gradient(135deg, #F97316, #EF4444)',
                color: step === 1 ? '#475569' : '#fff',
              }}
            >{step === 1 ? '⏳ Generating…' : '✨ Generate Answer'}</button>
            {step > 0 && (
              <button onClick={reset} style={{
                padding: '10px 16px', borderRadius: '8px', cursor: 'pointer',
                fontFamily: 'Space Mono, monospace', fontSize: '12px',
                border: '1px solid #1E2A45', background: 'transparent', color: '#64748B',
              }}>Reset</button>
            )}
          </div>

          {/* Answer output */}
          {step > 0 && (
            <div style={{ background: '#131728', border: `1px solid ${step === 2 ? '#F9731644' : '#1E2A45'}`, borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '10px', color: '#F97316', fontFamily: 'Space Mono, monospace', marginBottom: '10px' }}>
                🤖 LLM RESPONSE {step === 1 ? '(streaming…)' : '(complete)'}
              </div>
              <div style={{ color: '#E2E8F0', fontSize: '13px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                {displayedText.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={i} style={{ color: '#F97316' }}>{part.slice(2, -2)}</strong>
                    : part
                )}
                {step === 1 && <span style={{ animation: 'blink 1s infinite', color: '#F97316' }}>▋</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Common RAG Problems */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Common RAG problems & fixes
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {RAG_PROBLEMS_AND_FIXES.map(p => (
            <div key={p.problem} style={{
              background: '#0E1220', border: `1px solid ${p.color}33`,
              borderRadius: '10px', padding: '14px 16px',
              display: 'grid', gridTemplateColumns: '1.5fr 2fr 2fr',
              gap: '16px', alignItems: 'center',
            }}>
              <div style={{ color: p.color, fontWeight: '700', fontSize: '13px' }}>⚠ {p.problem}</div>
              <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.5' }}><strong style={{ color: '#64748B', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>CAUSE: </strong>{p.cause}</div>
              <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.5' }}><strong style={{ color: p.color, fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>FIX: </strong>{p.fix}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Pipeline Recap */}
      <div style={{ background: 'linear-gradient(135deg, #0E1220, #131728)', border: '1px solid #1E2A45', borderRadius: '16px', padding: '24px' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '16px' }}>
          RAG lifecycle recap
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', overflowX: 'auto', marginBottom: '14px' }}>
          {PIPELINE_RECAP.map((item, i) => (
            <React.Fragment key={item.label}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                padding: '14px 12px', background: `${item.color}11`,
                border: `1px solid ${item.color}44`, borderRadius: '10px',
                flexShrink: 0, minWidth: '72px',
              }}>
                <span style={{ fontSize: '22px' }}>{item.icon}</span>
                <span style={{ fontSize: '10px', color: item.color, fontFamily: 'Space Mono, monospace', fontWeight: '600', textAlign: 'center' }}>{item.label}</span>
                <span style={{
                  fontSize: '9px', padding: '1px 6px', borderRadius: '4px',
                  background:
                    item.phase === 'offline' ? '#1E2A45'
                      : item.phase === 'quality' ? '#22C55E11'
                        : '#F9731611',
                  color:
                    item.phase === 'offline' ? '#475569'
                      : item.phase === 'quality' ? '#22C55E'
                        : '#F97316',
                  fontFamily: 'Space Mono, monospace',
                }}>{item.phase}</span>
              </div>
              {i < PIPELINE_RECAP.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', color: '#2E3A55', fontSize: '16px', flexShrink: 0 }}>→</div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#131728', border: '1px solid #1E2A45', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ color: '#64748B', fontFamily: 'Space Mono, monospace', fontSize: '10px', marginBottom: '6px' }}>OFFLINE (Build once)</div>
            <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.6' }}>Load → Chunk → Embed → Store. Run when documents change. Can take minutes to hours for large corpora.</div>
          </div>
          <div style={{ background: '#131728', border: '1px solid #F9731622', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ color: '#F97316', fontFamily: 'Space Mono, monospace', fontSize: '10px', marginBottom: '6px' }}>ONLINE (Per query, &lt;2s)</div>
            <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.6' }}>Embed query → Retrieve → Rerank → Generate. Happens for every user question in real-time.</div>
          </div>
          <div style={{ background: '#131728', border: '1px solid #22C55E22', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ color: '#22C55E', fontFamily: 'Space Mono, monospace', fontSize: '10px', marginBottom: '6px' }}>QUALITY LOOP (Batch / CI)</div>
            <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.6' }}>Evaluate retrieval and generation on a gold dataset so you know what to improve next.</div>
          </div>
        </div>
      </div>

      <style>{`@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </div>
  );
}
