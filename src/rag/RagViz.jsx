import React, { useState } from 'react';
import RagStep1_Problem    from './steps/RagStep1_Problem.jsx';
import RagStep2_Loading    from './steps/RagStep2_Loading.jsx';
import RagStep3_Chunking   from './steps/RagStep3_Chunking.jsx';
import RagStep4_Embedding  from './steps/RagStep4_Embedding.jsx';
import RagStep5_VectorStore from './steps/RagStep5_VectorStore.jsx';
import RagStep6_Retrieval  from './steps/RagStep6_Retrieval.jsx';
import RagStep7_Reranking  from './steps/RagStep7_Reranking.jsx';
import RagStep8_Generation from './steps/RagStep8_Generation.jsx';
import RagStep9_Evaluation          from './steps/RagStep9_Evaluation.jsx';
import RagStep10_QueryTransformation from './steps/RagStep10_QueryTransformation.jsx';
import RagStep11_PromptEngineering   from './steps/RagStep11_PromptEngineering.jsx';
import RagStep12_ProductionRAG       from './steps/RagStep12_ProductionRAG.jsx';

const RAG_STEPS = [
  { id: 1,  label: 'The Problem',         desc: 'Why RAG exists',          icon: '❓', color: '#F59E0B' },
  { id: 2,  label: 'Doc Ingestion',       desc: 'Loading documents',        icon: '📄', color: '#10B981' },
  { id: 3,  label: 'Chunking',            desc: 'Splitting text',           icon: '✂️', color: '#06B6D4' },
  { id: 4,  label: 'Embeddings',          desc: 'Text → vectors',           icon: '🔢', color: '#6366F1' },
  { id: 5,  label: 'Vector Store',        desc: 'Storing vectors',          icon: '🗄️', color: '#8B5CF6' },
  { id: 6,  label: 'Retrieval',           desc: 'Finding chunks',           icon: '🔍', color: '#EC4899' },
  { id: 7,  label: 'Reranking',           desc: 'Improving results',        icon: '⬆️', color: '#EF4444' },
  { id: 8,  label: 'Generation',          desc: 'Answer creation',          icon: '✨', color: '#F97316' },
  { id: 9,  label: 'Evaluation',          desc: 'Measuring quality',        icon: '📏', color: '#22C55E' },
  { id: 10, label: 'Query Transform',     desc: 'Better search queries',    icon: '🔄', color: '#A78BFA' },
  { id: 11, label: 'Prompt Engineering',  desc: 'RAG-specific prompts',     icon: '📝', color: '#FB923C' },
  { id: 12, label: 'Production RAG',      desc: 'System design & advanced', icon: '🏗️', color: '#38BDF8' },
];

const STEP_COMPONENTS = [
  RagStep1_Problem,
  RagStep2_Loading,
  RagStep3_Chunking,
  RagStep4_Embedding,
  RagStep5_VectorStore,
  RagStep6_Retrieval,
  RagStep7_Reranking,
  RagStep8_Generation,
  RagStep9_Evaluation,
  RagStep10_QueryTransformation,
  RagStep11_PromptEngineering,
  RagStep12_ProductionRAG,
];

export default function RagViz() {
  const [step, setStep] = useState(1);
  const meta = RAG_STEPS[step - 1];
  const StepComponent = STEP_COMPONENTS[step - 1];

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <nav style={{
        width: '200px', flexShrink: 0, background: '#0E1220',
        borderRight: '1px solid #1E2A45', padding: '20px 0',
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '0 16px 16px', fontFamily: 'Space Mono, monospace',
          fontSize: '9px', letterSpacing: '2px', color: '#64748B',
          textTransform: 'uppercase', borderBottom: '1px solid #1E2A45',
          marginBottom: '12px',
        }}>RAG Pipeline</div>

        {RAG_STEPS.map((s, idx) => {
          const isActive = step === s.id;
          const isDone   = step > s.id;
          return (
            <div key={s.id}>
              <button
                onClick={() => setStep(s.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  width: '100%', padding: '10px 16px',
                  background: isActive ? `${s.color}18` : 'transparent',
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                  borderLeft: isActive ? `3px solid ${s.color}` : '3px solid transparent',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontFamily: 'Space Mono, monospace', fontWeight: '700',
                  background: isDone ? s.color : isActive ? `${s.color}33` : '#1E2A45',
                  color: isDone ? '#000' : isActive ? s.color : '#64748B',
                  border: `1.5px solid ${isActive || isDone ? s.color : '#1E2A45'}`,
                  marginTop: '1px',
                }}>
                  {isDone ? '✓' : s.id}
                </div>
                <div>
                  <div style={{
                    fontSize: '12px', fontWeight: isActive ? '600' : '400',
                    color: isActive ? '#E2E8F0' : isDone ? '#94A3B8' : '#64748B',
                    lineHeight: '1.3',
                  }}>{s.label}</div>
                  <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'Space Mono, monospace', lineHeight: '1.3' }}>
                    {s.desc}
                  </div>
                </div>
              </button>
              {idx < RAG_STEPS.length - 1 && (
                <div style={{
                  marginLeft: '28px', width: '2px', height: '8px',
                  background: isDone ? '#1E2A45' : '#131728',
                }} />
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column' }}>

        {/* Breadcrumb */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginBottom: '24px', flexWrap: 'wrap',
        }}>
          <div style={{
            padding: '3px 10px', background: '#131728', border: '1px solid #1E2A45',
            borderRadius: '20px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748B',
          }}>RAG Pipeline</div>
          <div style={{ color: '#1E2A45', fontSize: '12px' }}>→</div>
          <div style={{
            padding: '3px 10px', background: `${meta.color}22`, border: `1px solid ${meta.color}`,
            borderRadius: '20px', fontFamily: 'Space Mono, monospace', fontSize: '10px',
            color: meta.color, fontWeight: '700',
          }}>{meta.icon} {meta.label}</div>
          <div style={{ color: '#1E2A45', fontSize: '12px' }}>→</div>
          <div style={{
            padding: '3px 10px', background: '#131728', border: '1px solid #1E2A45',
            borderRadius: '20px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748B',
          }}>{meta.desc} →</div>
        </div>

        {/* Step content */}
        <StepComponent />

        {/* Navigation */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #1E2A45',
        }}>
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px',
              background: step === 1 ? 'transparent' : '#131728',
              border: `1px solid ${step === 1 ? '#1E2A45' : '#2E3A55'}`,
              borderRadius: '8px', color: step === 1 ? '#2E3A55' : '#94A3B8',
              fontFamily: 'Space Mono, monospace', fontSize: '12px',
              cursor: step === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease',
            }}
          >← Previous</button>

          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
            Step {step} of {RAG_STEPS.length}<br />
            <span style={{ color: meta.color }}>{meta.label}</span>
          </div>

          <button
            onClick={() => setStep(s => Math.min(RAG_STEPS.length, s + 1))}
            disabled={step === RAG_STEPS.length}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px',
              background: step === RAG_STEPS.length
                ? 'transparent'
                : `linear-gradient(135deg, ${meta.color}33, ${meta.color}22)`,
              border: `1px solid ${step === RAG_STEPS.length ? '#1E2A45' : meta.color}`,
              borderRadius: '8px',
              color: step === RAG_STEPS.length ? '#2E3A55' : meta.color,
              fontFamily: 'Space Mono, monospace', fontSize: '12px',
              fontWeight: step === RAG_STEPS.length ? '400' : '700',
              cursor: step === RAG_STEPS.length ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >Next Step →</button>
        </div>
      </main>
    </div>
  );
}
