import React, { useMemo } from 'react';

// Returns a CSS rgb() color based on value relative to max absolute
function cellColor(val, absMax) {
  if (absMax === 0) return { bg: '#1E2A45', fg: '#94A3B8' };
  const t = Math.max(-1, Math.min(1, val / absMax)); // clamp to [-1, 1]

  if (t >= 0) {
    // positive → dark → cyan/blue
    const intensity = t;
    const r = Math.round(14  + (0   - 14)  * intensity);
    const g = Math.round(23  + (182 - 23)  * intensity);
    const b = Math.round(40  + (212 - 40)  * intensity);
    const fg = intensity > 0.5 ? '#000' : '#E2E8F0';
    return { bg: `rgb(${r},${g},${b})`, fg };
  } else {
    // negative → dark → red/pink
    const intensity = -t;
    const r = Math.round(14  + (239 - 14)  * intensity);
    const g = Math.round(23  + (68  - 23)  * intensity);
    const b = Math.round(40  + (68  - 40)  * intensity);
    const fg = intensity > 0.5 ? '#fff' : '#E2E8F0';
    return { bg: `rgb(${r},${g},${b})`, fg };
  }
}

// Attention heatmap colors (0-1 range, warm palette)
function attnColor(val) {
  const t = Math.max(0, Math.min(1, val));
  // low → deep navy, high → vivid yellow-orange
  const r = Math.round(12  + (245 - 12)  * t);
  const g = Math.round(23  + (180 - 23)  * (t * t));
  const b = Math.round(42  + (0   - 42)  * t);
  const fg = t > 0.55 ? '#000' : '#E2E8F0';
  return { bg: `rgb(${r},${g},${b})`, fg };
}

// ============================================================
// MatrixViz — general purpose heatmap matrix
// ============================================================
export function MatrixViz({
  matrix,
  rowLabels,
  colLabels,
  title,
  subtitle,
  maxAbs,
  size = 'md',    // 'sm' | 'md' | 'lg'
  showColorBar = false,
  maxCols,        // truncate columns for large matrices
}) {
  const flat = useMemo(() => matrix.flat(), [matrix]);
  const computedMax = useMemo(
    () => maxAbs || Math.max(...flat.map(Math.abs), 0.01),
    [flat, maxAbs]
  );

  const cellClass = {
    sm: 'matrix-cell matrix-cell-sm',
    md: 'matrix-cell',
    lg: 'matrix-cell matrix-cell-lg',
  }[size];

  const displayMatrix = maxCols
    ? matrix.map((row) => row.slice(0, maxCols))
    : matrix;
  const displayCols = maxCols || (matrix[0]?.length || 0);
  const truncated = maxCols && matrix[0]?.length > maxCols;

  return (
    <div className="overflow-x-auto">
      {(title || subtitle) && (
        <div className="mb-2">
          {title && <div className="text-xs font-bold text-gray-300 font-mono">{title}</div>}
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
      )}

      <table style={{ borderCollapse: 'separate', borderSpacing: '2px' }}>
        {/* Column header */}
        {colLabels && (
          <thead>
            <tr>
              {rowLabels && <td />}
              {colLabels.slice(0, displayCols).map((lbl, j) => (
                <td
                  key={j}
                  style={{
                    textAlign: 'center',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '9px',
                    color: '#64748B',
                    paddingBottom: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lbl}
                </td>
              ))}
              {truncated && <td style={{ color: '#64748B', fontSize: '9px' }}>…</td>}
            </tr>
          </thead>
        )}

        <tbody>
          {displayMatrix.map((row, i) => {
            const { bg, fg } = cellColor(0, computedMax); // unused
            return (
              <tr key={i}>
                {/* Row label */}
                {rowLabels && (
                  <td
                    style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '9px',
                      color: '#64748B',
                      paddingRight: '6px',
                      whiteSpace: 'nowrap',
                      textAlign: 'right',
                    }}
                  >
                    {rowLabels[i]}
                  </td>
                )}
                {/* Value cells */}
                {row.map((val, j) => {
                  const { bg, fg } = cellColor(val, computedMax);
                  return (
                    <td key={j}>
                      <div
                        className={cellClass}
                        style={{ backgroundColor: bg, color: fg }}
                        title={`[${i},${j}] = ${val}`}
                      >
                        {val.toFixed(2)}
                      </div>
                    </td>
                  );
                })}
                {truncated && (
                  <td style={{ color: '#64748B', fontSize: '10px', paddingLeft: '4px' }}>…</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Color bar legend */}
      {showColorBar && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-500 font-mono">
            -{computedMax.toFixed(2)}
          </span>
          <div
            style={{
              width: '100px',
              height: '6px',
              borderRadius: '3px',
              background: 'linear-gradient(to right, rgb(239,68,68), rgb(14,23,40), rgb(0,182,212))',
            }}
          />
          <span className="text-xs text-gray-500 font-mono">
            +{computedMax.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// AttentionHeatmap — specialized for attention weights
// ============================================================
export function AttentionHeatmap({ weights, rowTokens, colTokens, title }) {
  return (
    <div className="overflow-x-auto">
      {title && (
        <div className="text-xs font-bold text-gray-300 font-mono mb-2">{title}</div>
      )}
      <table style={{ borderCollapse: 'separate', borderSpacing: '3px' }}>
        <thead>
          <tr>
            <td style={{ width: '60px' }} />
            {colTokens.map((tok, j) => (
              <td
                key={j}
                style={{
                  textAlign: 'center',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '10px',
                  color: '#06B6D4',
                  fontWeight: '700',
                  paddingBottom: '4px',
                }}
              >
                {tok}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {weights.map((row, i) => (
            <tr key={i}>
              <td
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '10px',
                  color: '#6366F1',
                  fontWeight: '700',
                  paddingRight: '6px',
                  textAlign: 'right',
                }}
              >
                {rowTokens[i]}
              </td>
              {row.map((val, j) => {
                const { bg, fg } = attnColor(val);
                return (
                  <td key={j}>
                    <div
                      className="attn-cell"
                      style={{ backgroundColor: bg, color: fg }}
                      title={`${rowTokens[i]} → ${colTokens[j]}: ${val.toFixed(3)}`}
                    >
                      {val.toFixed(2)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-gray-500">low attention</span>
        <div
          style={{
            width: '80px', height: '5px', borderRadius: '3px',
            background: 'linear-gradient(to right, rgb(12,23,42), rgb(245,180,0))',
          }}
        />
        <span className="text-xs text-gray-500">high attention</span>
      </div>
    </div>
  );
}

// ============================================================
// ShapeTag — displays tensor shape
// ============================================================
export function ShapeTag({ shape, label }) {
  return (
    <span className="shape-badge">
      {label && <span style={{ color: '#64748B' }}>{label}:</span>}
      ({shape.join(', ')})
    </span>
  );
}

// ============================================================
// Formula — styled code block for math expressions
// ============================================================
export function Formula({ children }) {
  return <div className="formula-box">{children}</div>;
}

// ============================================================
// InsightBox — "why this matters" callout
// ============================================================
export function InsightBox({ title = 'Why This Matters', children }) {
  return (
    <div className="insight-box">
      <div
        style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '10px',
          fontWeight: '700',
          color: '#6366F1',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6' }}>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// SectionLabel
// ============================================================
export function SectionLabel({ children }) {
  return <div className="section-label">{children}</div>;
}

// ============================================================
// FlowArrow — step-to-step connector
// ============================================================
export function FlowArrow({ label }) {
  return (
    <div className="flex flex-col items-center my-3">
      <div
        style={{
          width: '2px', height: '24px',
          background: 'linear-gradient(to bottom, #1E2A45, #6366F1)',
        }}
      />
      <div
        style={{
          width: 0, height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '7px solid #6366F1',
        }}
      />
      {label && (
        <div
          style={{
            fontSize: '9px', color: '#6366F1',
            fontFamily: 'Space Mono, monospace',
            marginTop: '4px', letterSpacing: '0.5px',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
