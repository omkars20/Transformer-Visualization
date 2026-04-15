import React, { useState, useMemo, useCallback, useRef } from 'react';
import RagViz from './rag/RagViz.jsx';
import StepNav from './components/StepNav.jsx';
import { runForwardPass } from './utils/llmEngine.js';
import Step1_Tokenization  from './steps/Step1_Tokenization.jsx';
import Step2_Embedding     from './steps/Step2_Embedding.jsx';
import Step3_PosEncoding   from './steps/Step3_PosEncoding.jsx';
import Step4_SelfAttention from './steps/Step4_SelfAttention.jsx';
import Step5_MultiHead     from './steps/Step5_MultiHead.jsx';
import Step6_FFN           from './steps/Step6_FFN.jsx';
import Step7_LayerNorm     from './steps/Step7_LayerNorm.jsx';
import Step8_Output        from './steps/Step8_Output.jsx';

const TOTAL_STEPS = 8;

const STEP_META = [
  { id: 1, title: 'Tokenization',           input: 'raw text',          output: 'token IDs',        color: '#F59E0B' },
  { id: 2, title: 'Embedding Lookup',        input: 'token IDs',         output: 'X_emb (3×8)',      color: '#10B981' },
  { id: 3, title: 'Positional Encoding',     input: 'X_emb',             output: 'X₁ (pos-aware)',   color: '#06B6D4' },
  { id: 4, title: 'Self-Attention',          input: 'X₁',                output: 'context vectors',  color: '#6366F1' },
  { id: 5, title: 'Multi-Head Attention',    input: 'X₂ (after LN1)',    output: 'MHA output',       color: '#8B5CF6' },
  { id: 6, title: 'Feed-Forward Network',    input: 'X₂',                output: 'FFN output',       color: '#EC4899' },
  { id: 7, title: 'Residual + LayerNorm',    input: 'sublayer + skip',   output: 'X₃ (normalized)',  color: '#EF4444' },
  { id: 8, title: 'Output & Prediction',     input: 'X₃',                output: 'next token',       color: '#F97316' },
];

const VIZ_MODES = [
  { id: 'transformer', label: 'Transformer', icon: '⚡', color: '#6366F1' },
  { id: 'rag',         label: 'RAG',         icon: '🔍', color: '#10B981' },
];

export default function App() {
  const [vizMode, setVizMode]   = useState('transformer');
  const [step, setStep]         = useState(1);
  const [inputText, setInputText] = useState('I love AI');
  const [committed, setCommitted] = useState('I love AI');
  const inputRef = useRef(null);

  const result = useMemo(() => {
    try {
      return runForwardPass(committed);
    } catch (e) {
      console.error('Forward pass error:', e);
      return null;
    }
  }, [committed]);

  const handleRun = useCallback(() => {
    if (inputText.trim()) setCommitted(inputText.trim());
  }, [inputText]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') handleRun();
    },
    [handleRun]
  );

  const meta = STEP_META[step - 1];

  const StepComponent = [
    Step1_Tokenization,
    Step2_Embedding,
    Step3_PosEncoding,
    Step4_SelfAttention,
    Step5_MultiHead,
    Step6_FFN,
    Step7_LayerNorm,
    Step8_Output,
  ][step - 1];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0B0D17', overflow: 'hidden' }}>

      {/* ── Viz-mode rail (far left) ──────────────────────────── */}
      <div
        style={{
          width: '72px',
          flexShrink: 0,
          background: '#080A12',
          borderRight: '1px solid #1E2A45',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '16px',
          gap: '8px',
        }}
      >
        {VIZ_MODES.map((m) => {
          const active = vizMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setVizMode(m.id)}
              title={m.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                width: '56px',
                padding: '10px 4px',
                background: active ? `${m.color}22` : 'transparent',
                border: 'none',
                borderRadius: '10px',
                borderLeft: active ? `3px solid ${m.color}` : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '20px' }}>{m.icon}</span>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'Space Mono, monospace',
                  color: active ? m.color : '#64748B',
                  fontWeight: active ? '700' : '400',
                  lineHeight: '1.2',
                  textAlign: 'center',
                }}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Rest of the app ──────────────────────────────────── */}
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          padding: '0 24px',
          height: '60px',
          background: '#0E1220',
          borderBottom: '1px solid #1E2A45',
          flexShrink: 0,
        }}
      >
        {/* Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '700',
              color: '#fff',
              fontFamily: 'Space Mono, monospace',
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#E2E8F0', lineHeight: '1.1' }}>
              LLM Visualizer
            </div>
            <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>
              Inside the Transformer
            </div>
          </div>
        </div>

        {vizMode === 'transformer' && (
          <>
            <div style={{ width: '1px', height: '32px', background: '#1E2A45' }} />

            {/* Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '500px' }}>
              <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>
                Input:
              </div>
              <input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type words from vocab: I love AI learning model…"
                style={{
                  flex: 1, background: '#131728', border: '1px solid #1E2A45',
                  borderRadius: '8px', padding: '7px 12px',
                  fontFamily: 'Space Mono, monospace', fontSize: '12px',
                  color: '#E2E8F0', outline: 'none', transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#6366F1')}
                onBlur={(e) => (e.target.style.borderColor = '#1E2A45')}
              />
              <button
                onClick={handleRun}
                style={{
                  padding: '7px 16px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                  border: 'none', borderRadius: '8px', color: '#fff',
                  fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: '700',
                  cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => (e.target.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.target.style.opacity = '1')}
              >Run ↵</button>
            </div>

            <div style={{ flex: 1 }} />

            {/* Step flow indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {STEP_META.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  title={s.title}
                  style={{
                    width: '24px', height: '6px', borderRadius: '3px',
                    background: s.id === step ? s.color : s.id < step ? `${s.color}66` : '#1E2A45',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                />
              ))}
              <div style={{ marginLeft: '8px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748B' }}>
                {step}/{TOTAL_STEPS}
              </div>
            </div>
          </>
        )}

        {vizMode === 'rag' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
            <div style={{ width: '1px', height: '32px', background: '#1E2A45' }} />
            <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>
              Retrieval-Augmented Generation
            </div>
          </div>
        )}
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Transformer mode */}
        {vizMode === 'transformer' && <StepNav currentStep={step} onSelect={setStep} />}

        {/* RAG mode */}
        {vizMode === 'rag' && <RagViz />}

        {/* Transformer main content */}
        {vizMode === 'transformer' && <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
          }}
        >
          {/* Data flow breadcrumb */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                padding: '3px 10px',
                background: '#131728',
                border: '1px solid #1E2A45',
                borderRadius: '20px',
                fontFamily: 'Space Mono, monospace',
                fontSize: '10px',
                color: '#64748B',
              }}
            >
              ← {meta.input}
            </div>
            <div style={{ color: '#1E2A45', fontSize: '12px' }}>→</div>
            <div
              style={{
                padding: '3px 10px',
                background: `${meta.color}22`,
                border: `1px solid ${meta.color}`,
                borderRadius: '20px',
                fontFamily: 'Space Mono, monospace',
                fontSize: '10px',
                color: meta.color,
                fontWeight: '700',
              }}
            >
              {meta.title}
            </div>
            <div style={{ color: '#1E2A45', fontSize: '12px' }}>→</div>
            <div
              style={{
                padding: '3px 10px',
                background: '#131728',
                border: '1px solid #1E2A45',
                borderRadius: '20px',
                fontFamily: 'Space Mono, monospace',
                fontSize: '10px',
                color: '#64748B',
              }}
            >
              {meta.output} →
            </div>
          </div>

          {/* No result state */}
          {!result && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '400px',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '40px' }}>⚡</div>
              <div style={{ color: '#64748B', fontFamily: 'Space Mono, monospace', fontSize: '13px' }}>
                Enter text and press Run to start
              </div>
            </div>
          )}

          {/* Step content */}
          {result && <StepComponent result={result} />}

          {/* Navigation */}
          {result && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '32px',
                paddingTop: '20px',
                borderTop: '1px solid #1E2A45',
              }}
            >
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: step === 1 ? 'transparent' : '#131728',
                  border: `1px solid ${step === 1 ? '#1E2A45' : '#2E3A55'}`,
                  borderRadius: '8px',
                  color: step === 1 ? '#2E3A55' : '#94A3B8',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '12px',
                  cursor: step === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                ← Previous
              </button>

              <div
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '11px',
                  color: '#64748B',
                  textAlign: 'center',
                }}
              >
                Step {step} of {TOTAL_STEPS}
                <br />
                <span style={{ color: meta.color }}>{meta.title}</span>
              </div>

              <button
                onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
                disabled={step === TOTAL_STEPS}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: step === TOTAL_STEPS
                    ? 'transparent'
                    : `linear-gradient(135deg, ${meta.color}33, ${meta.color}22)`,
                  border: `1px solid ${step === TOTAL_STEPS ? '#1E2A45' : meta.color}`,
                  borderRadius: '8px',
                  color: step === TOTAL_STEPS ? '#2E3A55' : meta.color,
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '12px',
                  fontWeight: step === TOTAL_STEPS ? '400' : '700',
                  cursor: step === TOTAL_STEPS ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Next Step →
              </button>
            </div>
          )}
        </main>}
      </div>
    </div>
    </div>
  );
}
