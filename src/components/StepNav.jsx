import React from 'react';

const STEPS = [
  { id: 1, label: 'Tokenization',        icon: '⬡', color: '#F59E0B' },
  { id: 2, label: 'Embeddings',          icon: '⬡', color: '#10B981' },
  { id: 3, label: 'Positional Encoding', icon: '⬡', color: '#06B6D4' },
  { id: 4, label: 'Self-Attention',      icon: '⬡', color: '#6366F1' },
  { id: 5, label: 'Multi-Head Attn',     icon: '⬡', color: '#8B5CF6' },
  { id: 6, label: 'Feed Forward',        icon: '⬡', color: '#EC4899' },
  { id: 7, label: 'Residual + Norm',     icon: '⬡', color: '#EF4444' },
  { id: 8, label: 'Output & Prediction', icon: '⬡', color: '#F97316' },
];

export default function StepNav({ currentStep, onSelect }) {
  return (
    <nav
      style={{
        width: '200px',
        flexShrink: 0,
        background: '#0E1220',
        borderRight: '1px solid #1E2A45',
        padding: '24px 0',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <div
        style={{
          padding: '0 16px 20px',
          fontFamily: 'Space Mono, monospace',
          fontSize: '9px',
          letterSpacing: '2px',
          color: '#64748B',
          textTransform: 'uppercase',
          borderBottom: '1px solid #1E2A45',
          marginBottom: '12px',
        }}
      >
        Pipeline Steps
      </div>

      {STEPS.map((step, idx) => {
        const isActive   = currentStep === step.id;
        const isComplete = currentStep > step.id;

        return (
          <div key={step.id}>
            <button
              onClick={() => onSelect(step.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 16px',
                background: isActive ? `${step.color}18` : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                borderLeft: isActive ? `3px solid ${step.color}` : '3px solid transparent',
                textAlign: 'left',
              }}
            >
              {/* Step number circle */}
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontFamily: 'Space Mono, monospace',
                  fontWeight: '700',
                  flexShrink: 0,
                  background: isComplete
                    ? step.color
                    : isActive
                    ? `${step.color}33`
                    : '#1E2A45',
                  color: isComplete
                    ? '#000'
                    : isActive
                    ? step.color
                    : '#64748B',
                  border: `1.5px solid ${
                    isActive || isComplete ? step.color : '#1E2A45'
                  }`,
                }}
              >
                {isComplete ? '✓' : step.id}
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? '#E2E8F0' : isComplete ? '#94A3B8' : '#64748B',
                  lineHeight: '1.2',
                }}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line between steps */}
            {idx < STEPS.length - 1 && (
              <div
                style={{
                  marginLeft: '26px',
                  width: '2px',
                  height: '8px',
                  background: isComplete ? '#1E2A45' : '#131728',
                }}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
