import React, { useState } from 'react';

const RETRIEVED_CHUNKS = [
  { id: 1, text: 'Self-attention computes weighted sums of value vectors using QKᵀ/√d_k as weights.', source: 'attention.pdf §2' },
  { id: 2, text: 'Multi-head attention runs H independent attention heads, then concatenates their outputs.', source: 'attention.pdf §3' },
];

const USER_QUERY = 'How does multi-head attention work?';

const PROMPT_PARTS = [
  {
    id: 'system',
    label: 'System Role',
    icon: '🤖',
    color: '#6366F1',
    defaultOn: true,
    content: 'You are a helpful assistant that answers questions based ONLY on the provided context.',
    desc: 'Tells the LLM who it is and its constraints. Critical for staying grounded.',
  },
  {
    id: 'context',
    label: 'Context Injection',
    icon: '📄',
    color: '#10B981',
    defaultOn: true,
    content: `Context:\n[1] ${RETRIEVED_CHUNKS[0].text} (${RETRIEVED_CHUNKS[0].source})\n[2] ${RETRIEVED_CHUNKS[1].text} (${RETRIEVED_CHUNKS[1].source})`,
    desc: 'The retrieved chunks passed to the LLM. This is the knowledge it must use.',
  },
  {
    id: 'guardrails',
    label: 'Guardrails',
    icon: '🛡️',
    color: '#F59E0B',
    defaultOn: false,
    content: 'If the answer is NOT found in the context above, respond with: "I don\'t have enough information to answer this question."',
    desc: 'Prevents hallucination. Forces the model to admit uncertainty rather than guess.',
  },
  {
    id: 'citations',
    label: 'Citation Prompt',
    icon: '🔗',
    color: '#EC4899',
    defaultOn: false,
    content: 'After your answer, list the context references you used in the format: [Sources: §X, §Y]',
    desc: 'Forces the model to cite its sources. Improves traceability and user trust.',
  },
  {
    id: 'structured',
    label: 'Structured Output',
    icon: '📋',
    color: '#06B6D4',
    defaultOn: false,
    content: 'Respond ONLY in this JSON format:\n{\n  "answer": "...",\n  "confidence": "high|medium|low",\n  "sources": ["§X", "§Y"]\n}',
    desc: 'Forces machine-readable output. Critical for RAG APIs consumed by downstream systems.',
  },
  {
    id: 'query',
    label: 'User Query',
    icon: '❓',
    color: '#94A3B8',
    defaultOn: true,
    content: `Question: ${USER_QUERY}`,
    desc: 'The actual user question. Always last in the prompt.',
  },
];

const HALLUCINATION_EXAMPLES = [
  {
    label: 'No Guardrails',
    color: '#EF4444',
    query: 'How does GPT-4 handle multi-head attention differently?',
    context: 'Context: [1] Self-attention uses QKᵀ/√d_k. [2] Multi-head attention concatenates H heads.',
    answer: 'GPT-4 uses a proprietary sparse attention variant called "Flash Attention 2" with 128 heads and a custom token routing mechanism...',
    verdict: 'HALLUCINATION — context says nothing about GPT-4 specifics. Model made this up.',
  },
  {
    label: 'With Guardrails',
    color: '#10B981',
    query: 'How does GPT-4 handle multi-head attention differently?',
    context: 'Context: [1] Self-attention uses QKᵀ/√d_k. [2] Multi-head attention concatenates H heads.',
    answer: 'I don\'t have enough information to answer this. The provided context covers multi-head attention in general but does not contain GPT-4 specific details.',
    verdict: 'CORRECT — model admitted it does not know. No hallucination.',
  },
];

export default function RagStep11_PromptEngineering() {
  const [enabled, setEnabled] = useState(() => {
    const init = {};
    PROMPT_PARTS.forEach(p => { init[p.id] = p.defaultOn; });
    return init;
  });
  const [hallucTab, setHallucTab] = useState(0);

  const toggle = id => setEnabled(prev => ({ ...prev, [id]: !prev[id] }));
  const activeParts = PROMPT_PARTS.filter(p => enabled[p.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Concept */}
      <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ color: '#FB923C', fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>
          📝 Prompt Engineering — The Most Ignored Part of RAG
        </h3>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: '0 0 10px' }}>
          You can have perfect retrieval and still get bad answers if your prompt is wrong.
          RAG prompt engineering is about telling the LLM <strong style={{ color: '#FB923C' }}>exactly what it is allowed to do</strong> with the context.
        </p>
        <div style={{ background: '#131728', border: '1px solid #FB923C33', borderRadius: '8px', padding: '12px 16px', fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#FB923C' }}>
          Interview trap: "How do you reduce hallucination in RAG?" → Guardrails in the prompt + grounding context.
        </div>
      </div>

      {/* Interactive prompt builder */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Interactive Prompt Builder — toggle parts on/off
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', alignItems: 'flex-start' }}>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PROMPT_PARTS.map(p => (
              <div key={p.id} style={{
                background: '#0E1220',
                border: `1px solid ${enabled[p.id] ? p.color + '66' : '#1E2A45'}`,
                borderRadius: '10px', padding: '12px 14px',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }} onClick={() => toggle(p.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <div style={{
                    width: '32px', height: '16px', borderRadius: '8px',
                    background: enabled[p.id] ? p.color : '#1E2A45',
                    position: 'relative', flexShrink: 0, transition: 'background 0.15s ease',
                  }}>
                    <div style={{
                      position: 'absolute', top: '2px',
                      left: enabled[p.id] ? '18px' : '2px',
                      width: '12px', height: '12px', borderRadius: '50%',
                      background: '#E2E8F0', transition: 'left 0.15s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '14px' }}>{p.icon}</span>
                  <span style={{ color: enabled[p.id] ? p.color : '#64748B', fontWeight: '600', fontSize: '12px' }}>{p.label}</span>
                </div>
                <div style={{ color: '#475569', fontSize: '11px', lineHeight: '1.5', paddingLeft: '42px' }}>{p.desc}</div>
              </div>
            ))}
          </div>

          {/* Prompt preview */}
          <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ background: '#131728', padding: '10px 16px', borderBottom: '1px solid #1E2A45', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span style={{ marginLeft: '8px' }}>prompt.txt</span>
            </div>
            <div style={{ padding: '16px', fontFamily: 'Space Mono, monospace', fontSize: '12px', lineHeight: '1.8', minHeight: '300px' }}>
              {activeParts.length === 0 ? (
                <div style={{ color: '#2E3A55', fontStyle: 'italic' }}>Enable at least one prompt part above...</div>
              ) : (
                activeParts.map((p, i) => (
                  <div key={p.id} style={{ marginBottom: i < activeParts.length - 1 ? '16px' : 0 }}>
                    <div style={{ color: p.color, fontSize: '10px', letterSpacing: '1px', marginBottom: '4px' }}>
                      # {p.label.toUpperCase()}
                    </div>
                    <div style={{ color: '#E2E8F0', whiteSpace: 'pre-wrap', background: `${p.color}0A`, border: `1px solid ${p.color}22`, borderRadius: '6px', padding: '8px 10px' }}>
                      {p.content}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ background: '#131728', borderTop: '1px solid #1E2A45', padding: '10px 16px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748B' }}>
              {activeParts.length} block{activeParts.length !== 1 ? 's' : ''} active · ~{activeParts.reduce((n, p) => n + p.content.split(' ').length, 0)} tokens
            </div>
          </div>
        </div>
      </div>

      {/* Hallucination demo */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Guardrails in action — same query, same context, different prompt
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {HALLUCINATION_EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => setHallucTab(i)} style={{
              padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
              fontFamily: 'Space Mono, monospace', fontSize: '11px',
              border: `1px solid ${hallucTab === i ? ex.color : '#1E2A45'}`,
              background: hallucTab === i ? `${ex.color}22` : 'transparent',
              color: hallucTab === i ? ex.color : '#64748B',
            }}>{ex.label}</button>
          ))}
        </div>
        {(() => {
          const ex = HALLUCINATION_EXAMPLES[hallucTab];
          return (
            <div style={{ background: '#0E1220', border: `1px solid ${ex.color}44`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'QUERY', content: ex.query, color: '#94A3B8' },
                { label: 'CONTEXT GIVEN TO LLM', content: ex.context, color: '#E2E8F0' },
                { label: 'MODEL ANSWER', content: ex.answer, color: ex.color },
              ].map(({ label, content, color }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748B', marginBottom: '6px' }}>{label}</div>
                  <div style={{ background: '#131728', border: '1px solid #1E2A45', borderRadius: '8px', padding: '12px 14px', color, fontSize: '13px', lineHeight: '1.7' }}>{content}</div>
                </div>
              ))}
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: `${ex.color}11`, border: `1px solid ${ex.color}44`,
                color: ex.color, fontSize: '12px', fontWeight: '700', fontFamily: 'Space Mono, monospace',
              }}>
                ⚡ VERDICT: {ex.verdict}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Best practices table */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          RAG Prompt Checklist
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: '✅ Always include', color: '#10B981', items: ['System role with explicit grounding instruction', 'Retrieved context labeled clearly (e.g., [1], [2])', 'The user query at the end', '"Say I don\'t know if not in context" guardrail'] },
            { label: '⚡ Advanced additions', color: '#6366F1', items: ['Citation prompt → Sources: [§X, §Y]', 'Structured output (JSON) for API consumption', 'Confidence level (high / medium / low)', 'Token budget hint: "Be concise, max 3 sentences"'] },
            { label: '❌ Common mistakes', color: '#EF4444', items: ['No system prompt → model hallucinates freely', 'Dumping too many chunks → model gets confused', 'No citation requirement → user can\'t trace the answer', 'Vague instruction → "be helpful" is not enough'] },
            { label: '🎯 Interview answers', color: '#F59E0B', items: ['"Reduce hallucination" → grounding prompt + guardrails', '"Improve answer quality" → citation + structured output', '"Handle missing info" → explicit "I don\'t know" instruction', '"Better context use" → numbered chunks + cite them'] },
          ].map(block => (
            <div key={block.label} style={{ background: '#0E1220', border: `1px solid ${block.color}33`, borderRadius: '10px', padding: '16px' }}>
              <div style={{ color: block.color, fontWeight: '700', fontSize: '12px', marginBottom: '10px' }}>{block.label}</div>
              {block.items.map(item => (
                <div key={item} style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.7', marginBottom: '4px' }}>• {item}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Key insight */}
      <div style={{ background: '#0A1628', border: '1px solid #FB923C44', borderRadius: '12px', padding: '18px 20px', display: 'flex', gap: '14px' }}>
        <span style={{ fontSize: '24px', flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ color: '#FB923C', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>One-line to remember</div>
          <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
            <strong style={{ color: '#E2E8F0' }}>The prompt is your last line of defense against hallucination.</strong>{' '}
            Retrieval gives the facts. The prompt tells the LLM to use only those facts and to admit when it cannot answer.
            Without guardrails, even perfect retrieval leads to hallucinated answers.
          </p>
        </div>
      </div>
    </div>
  );
}
