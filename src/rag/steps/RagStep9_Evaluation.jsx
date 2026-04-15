import React, { useMemo, useState } from 'react';

const QUERY = 'How does attention work in transformers?';

const RELEVANT_IDS = ['Doc3', 'Doc7'];

const RETRIEVED_RESULTS = [
  {
    id: 'Doc1',
    title: 'Transformer overview',
    text: 'Transformers replaced recurrence with attention-based layers.',
    relevant: false,
  },
  {
    id: 'Doc3',
    title: 'Self-attention basics',
    text: 'Self-attention lets each token score other tokens and mix information from the sequence.',
    relevant: true,
  },
  {
    id: 'Doc5',
    title: 'Inference optimization',
    text: 'KV cache reduces repeated computation during autoregressive decoding.',
    relevant: false,
  },
  {
    id: 'Doc7',
    title: 'Multi-head attention',
    text: 'Multi-head attention projects queries, keys, and values into multiple subspaces.',
    relevant: true,
  },
  {
    id: 'Doc9',
    title: 'RNN comparison',
    text: 'RNNs process tokens sequentially, which makes long-range dependencies harder.',
    relevant: false,
  },
];

const EXPECTED_ASPECTS = [
  'Attention compares a token with other tokens and gives importance scores.',
  'The answer should mention how information is mixed or how multi-head attention helps.',
];

const RETRIEVED_CONTEXT = [
  {
    id: 'ctx1',
    text: 'Self-attention lets each token score other tokens and mix sequence information.',
  },
  {
    id: 'ctx2',
    text: 'Multi-head attention projects queries, keys, and values into multiple subspaces.',
  },
];

const ANSWER_CASES = [
  {
    id: 'faithful',
    label: 'Faithful Answer',
    color: '#10B981',
    answer:
      'Transformers use self-attention so each token can compare itself with other tokens, assign importance scores, and combine the most relevant information. Multi-head attention repeats this idea in multiple subspaces.',
    claims: [
      {
        text: 'A token compares itself with other tokens and assigns importance scores.',
        supported: true,
        aspects: [0],
      },
      {
        text: 'The model combines the most relevant information from the sequence.',
        supported: true,
        aspects: [1],
      },
      {
        text: 'Multi-head attention repeats this in multiple subspaces.',
        supported: true,
        aspects: [1],
      },
    ],
    usedChunks: ['ctx1', 'ctx2'],
  },
  {
    id: 'hallucinated',
    label: 'Hallucinated Answer',
    color: '#EF4444',
    answer:
      'Transformers use recurrence plus attention, and this design was introduced mainly to reduce GPU memory usage in 2015.',
    claims: [
      {
        text: 'Transformers use recurrence plus attention.',
        supported: false,
        aspects: [],
      },
      {
        text: 'The design was introduced mainly to reduce GPU memory.',
        supported: false,
        aspects: [],
      },
      {
        text: 'It was introduced in 2015.',
        supported: false,
        aspects: [],
      },
    ],
    usedChunks: [],
  },
];

const SAMPLE_RR_ROWS = [
  { query: 'Q1', firstRelevantRank: 1, rr: 1 / 1 },
  { query: 'Q2', firstRelevantRank: 2, rr: 1 / 2 },
  { query: 'Q3', firstRelevantRank: 4, rr: 1 / 4 },
];

const TECHNIQUE_LEVELS = [
  {
    title: 'Basic Techniques',
    color: '#10B981',
    items: [
      'Create a small gold dataset: query + relevant chunks + expected answer.',
      'Label retrieved chunks manually as relevant or not relevant.',
      'Compute Recall@K and Precision@K in a spreadsheet or script.',
      'Read final answers manually and mark faithful vs hallucinated.',
    ],
  },
  {
    title: 'Intermediate Techniques',
    color: '#6366F1',
    items: [
      'Use Ragas or DeepEval for automatic faithfulness and relevance scoring.',
      'Use an LLM judge with a rubric to score answer quality consistently.',
      'Generate synthetic test queries from your documents to expand coverage.',
      'Evaluate retriever, reranker, and prompt separately to find the real bottleneck.',
    ],
  },
  {
    title: 'Advanced Techniques',
    color: '#F59E0B',
    items: [
      'Track AP, MAP, or nDCG for ranking quality when order matters a lot.',
      'Run regression suites in CI so retrieval or answer quality does not silently degrade.',
      'Add adversarial tests: ambiguous queries, multi-hop questions, and missing-answer cases.',
      'Monitor production metrics too: latency, cost, user feedback, click-through, and citation use.',
    ],
  },
];

const TOOL_CARDS = [
  {
    name: 'Ragas',
    color: '#10B981',
    use: 'Faithfulness, answer relevance, context precision/recall',
    note: 'Useful when you want ready-made RAG metrics.',
  },
  {
    name: 'DeepEval',
    color: '#6366F1',
    use: 'Hallucination checks, answer quality, LLM test cases',
    note: 'Good for building repeatable evaluation tests.',
  },
  {
    name: 'Custom Scripts',
    color: '#F59E0B',
    use: 'Recall@K, Precision@K, RR, AP, MAP, latency, cost',
    note: 'Best when you want full control over formulas and reporting.',
  },
];

function format(value) {
  return value.toFixed(2);
}

function computeRetrievalMetrics(results, topK, relevantIds) {
  const visible = results.slice(0, topK);
  const relevantSet = new Set(relevantIds);
  const relevantFlags = visible.map((item) => relevantSet.has(item.id));
  const relevantRetrieved = relevantFlags.filter(Boolean).length;
  const totalRelevant = relevantIds.length;
  const recall = totalRelevant === 0 ? 0 : relevantRetrieved / totalRelevant;
  const precision = topK === 0 ? 0 : relevantRetrieved / topK;
  const firstRelevantIndex = relevantFlags.findIndex(Boolean);
  const rr = firstRelevantIndex === -1 ? 0 : 1 / (firstRelevantIndex + 1);

  let runningHits = 0;
  let apSum = 0;
  const precisionAtRelevantRanks = [];

  relevantFlags.forEach((isRelevant, index) => {
    if (!isRelevant) return;
    runningHits += 1;
    const precisionAtRank = runningHits / (index + 1);
    apSum += precisionAtRank;
    precisionAtRelevantRanks.push({
      rank: index + 1,
      hits: runningHits,
      precision: precisionAtRank,
    });
  });

  const ap = totalRelevant === 0 ? 0 : apSum / totalRelevant;

  return {
    visible,
    relevantRetrieved,
    totalRelevant,
    recall,
    precision,
    firstRelevantIndex,
    rr,
    ap,
    precisionAtRelevantRanks,
  };
}

function computeGenerationMetrics(answerCase) {
  const totalClaims = answerCase.claims.length;
  const supportedClaims = answerCase.claims.filter((claim) => claim.supported).length;
  const coveredAspectSet = new Set(answerCase.claims.flatMap((claim) => claim.aspects));
  const usedChunks = answerCase.usedChunks.length;
  const totalChunks = RETRIEVED_CONTEXT.length;

  return {
    totalClaims,
    supportedClaims,
    faithfulness: totalClaims === 0 ? 0 : supportedClaims / totalClaims,
    coveredAspects: coveredAspectSet.size,
    relevance: EXPECTED_ASPECTS.length === 0 ? 0 : coveredAspectSet.size / EXPECTED_ASPECTS.length,
    usedChunks,
    totalChunks,
    utilization: totalChunks === 0 ? 0 : usedChunks / totalChunks,
  };
}

function MetricCard({ title, color, what, formula, calc, note }) {
  return (
    <div
      style={{
        background: '#131728',
        border: `1px solid ${color}33`,
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div style={{ color, fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>{title}</div>
      <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.6', marginBottom: '8px' }}>{what}</div>
      <div
        style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '11px',
          color: '#E2E8F0',
          background: '#0E1220',
          border: '1px solid #1E2A45',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '8px',
          lineHeight: '1.7',
        }}
      >
        Formula: {formula}
      </div>
      <div
        style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '11px',
          color,
          background: `${color}11`,
          border: `1px solid ${color}33`,
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '8px',
          lineHeight: '1.7',
        }}
      >
        Current calc: {calc}
      </div>
      <div style={{ color: '#64748B', fontSize: '11px', lineHeight: '1.6' }}>{note}</div>
    </div>
  );
}

export default function RagStep9_Evaluation() {
  const [topK, setTopK] = useState(3);
  const [answerIndex, setAnswerIndex] = useState(0);

  const retrieval = useMemo(
    () => computeRetrievalMetrics(RETRIEVED_RESULTS, topK, RELEVANT_IDS),
    [topK]
  );

  const activeAnswer = ANSWER_CASES[answerIndex];
  const generation = useMemo(
    () => computeGenerationMetrics(activeAnswer),
    [activeAnswer]
  );

  const sampleMrr =
    SAMPLE_RR_ROWS.reduce((sum, row) => sum + row.rr, 0) / SAMPLE_RR_ROWS.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Concept */}
      <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ color: '#22C55E', fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>
          📏 Evaluation — From Basic Understanding to Advanced Measurement
        </h3>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: '0 0 12px' }}>
          RAG evaluation has two big parts:
          <strong style={{ color: '#22C55E' }}> retrieval evaluation</strong> and
          <strong style={{ color: '#22C55E' }}> generation evaluation</strong>.
        </p>
        <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.8', margin: 0 }}>
          Retrieval asks: <em style={{ color: '#E2E8F0' }}>did we fetch the right chunks?</em>
          Generation asks: <em style={{ color: '#E2E8F0' }}>did the final answer stay correct and grounded in those chunks?</em>
        </p>
      </div>

      {/* Basic picture */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        <div style={{ background: '#0E1220', border: '1px solid #10B98133', borderRadius: '12px', padding: '18px' }}>
          <div style={{ color: '#10B981', fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>1. Retrieval side</div>
          <div style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.7' }}>
            Here we already know which chunks are actually relevant for a query. Then we check whether the retriever brought them into top-K and how high they appeared.
          </div>
        </div>
        <div style={{ background: '#0E1220', border: '1px solid #6366F133', borderRadius: '12px', padding: '18px' }}>
          <div style={{ color: '#6366F1', fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>2. Generation side</div>
          <div style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.7' }}>
            Here we compare the final answer against the retrieved context. We check whether claims are supported, whether the answer actually solves the query, and whether the model used the context well.
          </div>
        </div>
      </div>

      {/* Retrieval */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Retrieval evaluation — how we calculate it
        </div>
        <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px', padding: '20px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>QUERY</div>
            <div style={{ background: '#131728', border: '1px solid #1E2A45', borderRadius: '8px', padding: '12px 14px', color: '#E2E8F0', fontSize: '13px' }}>
              "{QUERY}"
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
              GOLD RELEVANT CHUNKS
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {RELEVANT_IDS.map((id) => (
                <span
                  key={id}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: '#10B98111',
                    border: '1px solid #10B98133',
                    color: '#10B981',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '11px',
                  }}
                >
                  {id}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
              TOP-K = {topK}
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10B981' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', fontFamily: 'Space Mono, monospace' }}>
              <span>1</span>
              <span>5</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {retrieval.visible.map((doc, index) => (
              <div
                key={doc.id}
                style={{
                  background: '#131728',
                  border: `1px solid ${doc.relevant ? '#10B98133' : '#1E2A45'}`,
                  borderLeft: `3px solid ${doc.relevant ? '#10B981' : '#2E3A55'}`,
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: doc.relevant ? '#10B98122' : '#1E2A45',
                    border: `1px solid ${doc.relevant ? '#10B98144' : '#2E3A55'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '11px',
                    color: doc.relevant ? '#10B981' : '#64748B',
                    flexShrink: 0,
                  }}
                >
                  #{index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#E2E8F0', fontSize: '12px', marginBottom: '4px' }}>{doc.title}</div>
                  <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.6' }}>{doc.text}</div>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    padding: '4px 8px',
                    borderRadius: '20px',
                    background: doc.relevant ? '#10B98111' : '#EF444411',
                    color: doc.relevant ? '#10B981' : '#EF4444',
                    fontSize: '10px',
                    fontFamily: 'Space Mono, monospace',
                  }}
                >
                  {doc.relevant ? 'Relevant' : 'Noise'}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <MetricCard
              title="Recall@K"
              color="#10B981"
              what="Out of all truly relevant chunks, how many did we manage to bring into top-K?"
              formula="relevant chunks found in top-K / total relevant chunks"
              calc={`${retrieval.relevantRetrieved} / ${retrieval.totalRelevant} = ${format(retrieval.recall)}`}
              note="High recall means you are not missing important evidence."
            />
            <MetricCard
              title="Precision@K"
              color="#6366F1"
              what="Out of the top-K results we returned, how many are actually useful?"
              formula="relevant chunks found in top-K / K"
              calc={`${retrieval.relevantRetrieved} / ${topK} = ${format(retrieval.precision)}`}
              note="High precision means less noise is going to the LLM."
            />
            <MetricCard
              title="Reciprocal Rank"
              color="#F59E0B"
              what="How early does the first correct chunk appear?"
              formula="1 / rank of first relevant chunk"
              calc={
                retrieval.firstRelevantIndex === -1
                  ? 'No relevant chunk in top-K -> 0'
                  : `1 / ${retrieval.firstRelevantIndex + 1} = ${format(retrieval.rr)}`
              }
              note="This cares a lot about getting one good chunk very early."
            />
            <MetricCard
              title="Average Precision (AP@K)"
              color="#EC4899"
              what="This rewards systems that place relevant chunks early and repeatedly in the ranking."
              formula="sum of Precision@rank for each relevant hit / total relevant chunks"
              calc={
                retrieval.precisionAtRelevantRanks.length === 0
                  ? `0 / ${retrieval.totalRelevant} = 0.00`
                  : `(${retrieval.precisionAtRelevantRanks
                      .map((item) => `${item.hits}/${item.rank}`)
                      .join(' + ')}) / ${retrieval.totalRelevant} = ${format(retrieval.ap)}`
              }
              note="AP is a stronger ranking metric than only precision or recall."
            />
          </div>

          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div style={{ background: '#131728', border: '1px solid #1E2A45', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ color: '#E2E8F0', fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>MRR and MAP on many queries</div>
              <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.7', marginBottom: '10px' }}>
                For one query, we compute RR and AP. For many queries, we average them:
              </div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#E2E8F0', lineHeight: '1.8' }}>
                MRR = mean of RR values across queries<br />
                MAP = mean of AP values across queries
              </div>
            </div>
            <div style={{ background: '#131728', border: '1px solid #F59E0B33', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ color: '#F59E0B', fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>Sample MRR</div>
              {SAMPLE_RR_ROWS.map((row) => (
                <div key={row.query} style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.6' }}>
                  {row.query}: first relevant at rank {row.firstRelevantRank} {'->'} RR = 1/{row.firstRelevantRank} = {format(row.rr)}
                </div>
              ))}
              <div style={{ color: '#F59E0B', fontFamily: 'Space Mono, monospace', fontSize: '11px', marginTop: '10px' }}>
                MRR = (1 + 1/2 + 1/4) / 3 = {format(sampleMrr)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generation */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Generation evaluation — how we calculate it
        </div>
        <div style={{ background: '#0E1220', border: '1px solid #1E2A45', borderRadius: '12px', padding: '20px' }}>
          <div style={{ marginBottom: '14px', color: '#94A3B8', fontSize: '13px', lineHeight: '1.8' }}>
            Retrieval metrics are mostly exact math. Generation metrics are a little different: many teams use a
            <strong style={{ color: '#E2E8F0' }}> rubric-based calculation</strong>, human labels, or an LLM judge.
            Below is one simple and practical way to calculate them.
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {ANSWER_CASES.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setAnswerIndex(index)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '11px',
                  border: `1px solid ${answerIndex === index ? item.color : '#1E2A45'}`,
                  background: answerIndex === index ? `${item.color}22` : 'transparent',
                  color: answerIndex === index ? item.color : '#64748B',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: '#131728', border: '1px solid #1E2A45', borderRadius: '10px', padding: '14px' }}>
              <div style={{ color: '#10B981', fontFamily: 'Space Mono, monospace', fontSize: '10px', marginBottom: '8px' }}>RETRIEVED CONTEXT</div>
              <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.7' }}>
                {RETRIEVED_CONTEXT.map((item, index) => (
                  <div key={item.id} style={{ marginBottom: index < RETRIEVED_CONTEXT.length - 1 ? '10px' : 0 }}>
                    [{index + 1}] {item.text}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#131728', border: `1px solid ${activeAnswer.color}33`, borderRadius: '10px', padding: '14px' }}>
              <div style={{ color: activeAnswer.color, fontFamily: 'Space Mono, monospace', fontSize: '10px', marginBottom: '8px' }}>MODEL ANSWER</div>
              <div style={{ color: '#E2E8F0', fontSize: '12px', lineHeight: '1.7' }}>{activeAnswer.answer}</div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: '#E2E8F0', fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>Break the answer into claims</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeAnswer.claims.map((claim, index) => (
                <div
                  key={claim.text}
                  style={{
                    background: '#131728',
                    border: `1px solid ${claim.supported ? '#10B98133' : '#EF444433'}`,
                    borderLeft: `3px solid ${claim.supported ? '#10B981' : '#EF4444'}`,
                    borderRadius: '8px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ color: '#E2E8F0', fontSize: '12px', marginBottom: '6px' }}>
                    Claim {index + 1}: {claim.text}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '20px',
                        background: claim.supported ? '#10B98111' : '#EF444411',
                        color: claim.supported ? '#10B981' : '#EF4444',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '10px',
                      }}
                    >
                      {claim.supported ? 'Supported by context' : 'Unsupported'}
                    </span>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '20px',
                        background: '#6366F111',
                        color: '#6366F1',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '10px',
                      }}
                    >
                      Covers {claim.aspects.length} expected aspect{claim.aspects.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ color: '#E2E8F0', fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>Expected answer aspects</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {EXPECTED_ASPECTS.map((aspect, index) => (
                <div
                  key={aspect}
                  style={{
                    background: '#131728',
                    border: '1px solid #1E2A45',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#94A3B8',
                    fontSize: '12px',
                    lineHeight: '1.6',
                  }}
                >
                  Aspect {index + 1}: {aspect}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <MetricCard
              title="Faithfulness"
              color="#10B981"
              what="How much of the answer is actually supported by the retrieved context?"
              formula="supported claims / total claims"
              calc={`${generation.supportedClaims} / ${generation.totalClaims} = ${format(generation.faithfulness)}`}
              note="Simple manual technique: split the answer into claims, then check each claim against the context."
            />
            <MetricCard
              title="Answer Relevance"
              color="#6366F1"
              what="Did the answer actually cover the important parts of the user's question?"
              formula="expected aspects covered / total expected aspects"
              calc={`${generation.coveredAspects} / ${EXPECTED_ASPECTS.length} = ${format(generation.relevance)}`}
              note="Simple rubric technique: define the key aspects a good answer must contain, then check how many were covered."
            />
            <MetricCard
              title="Context Utilization"
              color="#F59E0B"
              what="Did the model use the retrieved evidence, or mostly ignore it?"
              formula="retrieved context chunks used / retrieved context chunks available"
              calc={`${generation.usedChunks} / ${generation.totalChunks} = ${format(generation.utilization)}`}
              note="One practical proxy is to count how many retrieved chunks actually influenced the answer."
            />
          </div>

          <div style={{ marginTop: '16px', background: '#131728', border: '1px solid #1E2A45', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ color: '#E2E8F0', fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>Important note</div>
            <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.7' }}>
              For generation metrics there is no single universal formula that everyone uses. In real systems, people often use
              <strong style={{ color: '#E2E8F0' }}> human review</strong>,
              <strong style={{ color: '#E2E8F0' }}> LLM-as-judge</strong>, or
              <strong style={{ color: '#E2E8F0' }}> specialized tools</strong> to turn these rubrics into consistent scores.
            </div>
          </div>
        </div>
      </div>

      {/* Techniques */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Techniques — from basic to advanced
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {TECHNIQUE_LEVELS.map((group) => (
            <div
              key={group.title}
              style={{
                background: '#0E1220',
                border: `1px solid ${group.color}33`,
                borderRadius: '12px',
                padding: '18px',
              }}
            >
              <div style={{ color: group.color, fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>{group.title}</div>
              {group.items.map((item) => (
                <div key={item} style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.7', marginBottom: '8px' }}>
                  • {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '14px' }}>
          Common tools
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {TOOL_CARDS.map((tool) => (
            <div
              key={tool.name}
              style={{
                background: '#0E1220',
                border: `1px solid ${tool.color}33`,
                borderRadius: '12px',
                padding: '18px',
              }}
            >
              <div style={{ color: tool.color, fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>{tool.name}</div>
              <div style={{ color: '#E2E8F0', fontSize: '12px', marginBottom: '8px' }}>{tool.use}</div>
              <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.7' }}>{tool.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow */}
      <div style={{ background: 'linear-gradient(135deg, #0E1220, #131728)', border: '1px solid #1E2A45', borderRadius: '16px', padding: '24px' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '2px', color: '#64748B', textTransform: 'uppercase', marginBottom: '16px' }}>
          Simple workflow
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          {[
            'Prepare a gold set: query, relevant chunks, expected answer.',
            'Measure retrieval quality first. If recall is low, the rest of the system will struggle.',
            'Measure generation quality next using claim support and answer quality rubrics.',
            'Inspect failures and improve chunking, retrieval, reranking, prompting, or the dataset.',
          ].map((step, index) => (
            <div key={step} style={{ background: '#131728', border: '1px solid #1E2A45', borderRadius: '10px', padding: '14px 16px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#22C55E22',
                  border: '1px solid #22C55E44',
                  color: '#22C55E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '11px',
                  marginBottom: '10px',
                }}
              >
                {index + 1}
              </div>
              <div style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.7' }}>{step}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
