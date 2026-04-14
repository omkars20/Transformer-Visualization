// ============================================================
// LLM Math Engine — complete forward pass for visualization
// Architecture: GPT-style Transformer (tiny but structurally correct)
// CONFIG: embed_dim=8, num_heads=2, head_dim=4, ffn_dim=16
// ============================================================

// --- Seeded PRNG (Mulberry32) for reproducible weights ------
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Numeric helpers ----------------------------------------
export function r(x, n = 3) {
  return Math.round(x * 10 ** n) / 10 ** n;
}
function rM(M, n = 3) {
  return M.map((row) => row.map((x) => r(x, n)));
}

// Matrix multiply: A(m,k) @ B(k,n) → C(m,n)
export function matMul(A, B) {
  const m = A.length,
    k = B.length,
    n = B[0].length;
  const C = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      for (let l = 0; l < k; l++) C[i][j] += A[i][l] * B[l][j];
  return C;
}

export function transpose(M) {
  if (!M.length) return [];
  return M[0].map((_, j) => M.map((row) => row[j]));
}

// Row-wise softmax (numerically stable)
export function softmaxRow(row) {
  const maxVal = Math.max(...row);
  const exps = row.map((x) => Math.exp(x - maxVal));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / sum);
}

export function softmaxMatrix(M) {
  return M.map((row) => softmaxRow(row));
}

// Layer Norm (per row, zero mean, unit variance)
function layerNormRow(vec, eps = 1e-5) {
  const n = vec.length;
  const mean = vec.reduce((a, b) => a + b, 0) / n;
  const variance = vec.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance + eps);
  return vec.map((x) => (x - mean) / std);
}

export function layerNormMatrix(M) {
  return M.map((row) => layerNormRow(row));
}

function relu(x) {
  return Math.max(0, x);
}

// Random weight matrix (seeded)
function randMatrix(rows, cols, seed, scale = 0.4) {
  const rng = mulberry32(seed);
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (rng() * 2 - 1) * scale)
  );
}

// ============================================================
// Architecture constants
// ============================================================
export const CFG = {
  EMBED_DIM: 8,   // d_model
  NUM_HEADS: 2,
  HEAD_DIM: 4,    // d_k = d_model / num_heads
  FFN_DIM: 16,    // Feed-forward inner dimension
  VOCAB_SIZE: 50,
  MAX_SEQ: 8,
};

// ============================================================
// Vocabulary (word-level, 50 tokens)
// ============================================================
export const VOCAB = [
  '<PAD>', '<UNK>',                                        // 0-1
  'I', 'you', 'we', 'they', 'he', 'she',                  // 2-7
  'love', 'like', 'hate', 'want', 'need', 'build',        // 8-13
  'AI', 'ML', 'GPT', 'transformer', 'attention', 'model', // 14-19
  'is', 'are', 'was', 'will', 'can',                      // 20-24
  'the', 'a', 'an', 'of', 'in', 'to', 'and', 'for',      // 25-32
  'neural', 'network', 'data', 'training', 'learning',    // 33-37
  'great', 'amazing', 'smart', 'fast', 'new', 'good',     // 38-43
  'token', 'embedding', 'layer', 'weight', 'vector',      // 44-48
  'future',                                               // 49
];

const W2I = {};
VOCAB.forEach((w, i) => {
  W2I[w.toLowerCase()] = i;
});

// ============================================================
// Pre-initialized weights (deterministic seeds)
// ============================================================
const E  = randMatrix(CFG.VOCAB_SIZE, CFG.EMBED_DIM, 42, 0.9);  // Embedding
const Wq = randMatrix(CFG.EMBED_DIM, CFG.EMBED_DIM, 101, 0.4);  // Query
const Wk = randMatrix(CFG.EMBED_DIM, CFG.EMBED_DIM, 202, 0.4);  // Key
const Wv = randMatrix(CFG.EMBED_DIM, CFG.EMBED_DIM, 303, 0.4);  // Value
const Wo = randMatrix(CFG.EMBED_DIM, CFG.EMBED_DIM, 404, 0.4);  // Output projection
const W1 = randMatrix(CFG.EMBED_DIM, CFG.FFN_DIM,   505, 0.4);  // FFN layer 1
const b1 = randMatrix(1, CFG.FFN_DIM, 506, 0.15)[0];
const W2 = randMatrix(CFG.FFN_DIM,   CFG.EMBED_DIM, 606, 0.4);  // FFN layer 2
const b2 = randMatrix(1, CFG.EMBED_DIM, 607, 0.15)[0];
const Wout = randMatrix(CFG.EMBED_DIM, CFG.VOCAB_SIZE, 707, 0.6); // LM head

// ============================================================
// STEP 1 — Tokenization
// ============================================================
export function step1_tokenize(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const limited = words.slice(0, CFG.MAX_SEQ);
  return limited.map((w, pos) => {
    const id = W2I[w.toLowerCase()];
    return {
      word: w,
      id: id !== undefined ? id : 1,   // fallback to <UNK>
      inVocab: id !== undefined,
      position: pos,
    };
  });
}

// ============================================================
// STEP 2 — Embedding lookup
// ============================================================
export function step2_embed(tokens) {
  const X = tokens.map((t) => E[t.id].map((x) => r(x)));
  return {
    X,
    // Show only the rows used (for visualization)
    usedRows: tokens.map((t) => ({ id: t.id, word: t.word, vector: E[t.id].map((x) => r(x)) })),
    embeddingMatrix: rM(E),   // full matrix (we'll only display partial)
    weights: rM(E),
  };
}

// ============================================================
// STEP 3 — Positional Encoding (sinusoidal, same as "Attention is All You Need")
// ============================================================
export function step3_posenc(seqLen) {
  const P = Array.from({ length: seqLen }, (_, pos) =>
    Array.from({ length: CFG.EMBED_DIM }, (_, i) => {
      const denom = Math.pow(10000, (2 * Math.floor(i / 2)) / CFG.EMBED_DIM);
      const val = i % 2 === 0 ? Math.sin(pos / denom) : Math.cos(pos / denom);
      return r(val);
    })
  );
  return P;
}

export function step3_addPosEnc(X, P) {
  return X.map((row, i) => row.map((x, j) => r(x + P[i][j])));
}

// ============================================================
// STEP 4 — Single-head Self-Attention (full detail)
// ============================================================
export function step4_selfAttention(X) {
  const Q = rM(matMul(X, Wq));
  const K = rM(matMul(X, Wk));
  const V = rM(matMul(X, Wv));

  const KT = rM(transpose(K));
  const scale = Math.sqrt(CFG.HEAD_DIM);   // √d_k = √4 = 2

  const scores_raw   = rM(matMul(Q, KT));
  const scores_scaled = scores_raw.map((row) => row.map((x) => r(x / scale)));
  const attn_weights  = rM(softmaxMatrix(scores_scaled));
  const output        = rM(matMul(attn_weights, V));

  return {
    Wq: rM(Wq), Wk: rM(Wk), Wv: rM(Wv),
    Q, K, V,
    KT,
    scale,
    scores_raw,
    scores_scaled,
    attn_weights,
    output,
  };
}

// ============================================================
// STEP 5 — Multi-Head Attention (2 heads)
// ============================================================
export function step5_multiHead(X) {
  const h = CFG.HEAD_DIM;
  const results = [];

  for (let head = 0; head < CFG.NUM_HEADS; head++) {
    const col_start = head * h;
    const col_end   = col_start + h;

    // Each head gets a column-slice of the weight matrices
    const Wq_h = Wq.map((row) => row.slice(col_start, col_end));
    const Wk_h = Wk.map((row) => row.slice(col_start, col_end));
    const Wv_h = Wv.map((row) => row.slice(col_start, col_end));

    const Q_h = rM(matMul(X, Wq_h));  // (seq, head_dim)
    const K_h = rM(matMul(X, Wk_h));
    const V_h = rM(matMul(X, Wv_h));

    const scores = rM(
      softmaxMatrix(
        matMul(Q_h, transpose(K_h)).map((row) =>
          row.map((x) => r(x / Math.sqrt(h)))
        )
      )
    );
    const out = rM(matMul(scores, V_h));  // (seq, head_dim)

    results.push({ head: head + 1, Q: Q_h, K: K_h, V: V_h, scores, output: out });
  }

  // Concatenate along last dim: (seq, head_dim * num_heads) = (seq, embed_dim)
  const concat = X.map((_, i) =>
    results.reduce((acc, r) => [...acc, ...r.output[i]], [])
  );

  // Final linear projection
  const output = rM(matMul(concat, Wo));

  return { heads: results, concat: rM(concat), output };
}

// ============================================================
// STEP 6 — Feed-Forward Network
// ============================================================
export function step6_ffn(X) {
  // Layer 1: expand  (seq, embed_dim) → (seq, ffn_dim)
  const h1_pre = X.map((row) => {
    const out = matMul([row], W1)[0];
    return out.map((x, i) => r(x + b1[i]));
  });

  // ReLU activation
  const h1_relu = h1_pre.map((row) => row.map((x) => r(relu(x))));

  // Layer 2: shrink  (seq, ffn_dim) → (seq, embed_dim)
  const output = h1_relu.map((row) => {
    const out = matMul([row], W2)[0];
    return out.map((x, i) => r(x + b2[i]));
  });

  return {
    W1: rM(W1), b1: b1.map((x) => r(x)),
    W2: rM(W2), b2: b2.map((x) => r(x)),
    h1_pre,
    h1_relu,
    output,
    inputShape:  [X.length, CFG.EMBED_DIM],
    hiddenShape: [X.length, CFG.FFN_DIM],
    outputShape: [X.length, CFG.EMBED_DIM],
  };
}

// ============================================================
// STEP 7 — Residual connection + Layer Normalization
// ============================================================
export function step7_residualNorm(X_before, residual, label) {
  const added = X_before.map((row, i) =>
    row.map((x, j) => r(x + residual[i][j]))
  );
  const normed = rM(layerNormMatrix(added));
  return { added, normed, label };
}

// ============================================================
// STEP 8 — Output logits & next-token prediction
// ============================================================
export function step8_output(X_final) {
  // We use the LAST token's representation (autoregressive prediction)
  const lastVec = X_final[X_final.length - 1];

  const logits = matMul([lastVec], Wout)[0].map((x) => r(x, 4));
  const probs   = softmaxRow(logits).map((x) => r(x, 6));

  const ranked = VOCAB.map((word, id) => ({
    word,
    id,
    logit: logits[id],
    prob: probs[id],
    pct: r(probs[id] * 100, 2),
  })).sort((a, b) => b.prob - a.prob);

  return {
    lastVec: lastVec.map((x) => r(x)),
    logits,
    probs,
    top10: ranked.slice(0, 10),
    predicted: ranked[0],
  };
}

// ============================================================
// Full forward pass (returns all intermediate states)
// ============================================================
export function runForwardPass(text) {
  if (!text.trim()) return null;

  const tokens = step1_tokenize(text);
  if (!tokens.length) return null;

  const { X: X_emb, usedRows } = step2_embed(tokens);
  const P  = step3_posenc(tokens.length);
  const X1 = step3_addPosEnc(X_emb, P);       // after pos enc

  const attn = step4_selfAttention(X1);
  const ln1  = step7_residualNorm(X1, attn.output, 'After Attention');
  const X2   = ln1.normed;                      // after attn + residual + norm

  const mha  = step5_multiHead(X2);
  const ffn  = step6_ffn(X2);
  const ln2  = step7_residualNorm(X2, ffn.output, 'After FFN');
  const X3   = ln2.normed;                      // final hidden state

  const out  = step8_output(X3);

  return {
    tokens,
    X_emb, usedRows,
    P, X1,
    attn, ln1, X2,
    mha, ffn, ln2, X3,
    out,
  };
}
