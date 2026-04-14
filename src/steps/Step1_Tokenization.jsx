import React, { useState } from 'react';
import { Formula, SectionLabel } from '../components/MatrixViz.jsx';
import { CFG, VOCAB } from '../utils/llmEngine.js';

// ── token color palette ────────────────────────────────────────
const TC = [
  { bg: '#F59E0B22', border: '#F59E0B', text: '#F59E0B' },
  { bg: '#10B98122', border: '#10B981', text: '#10B981' },
  { bg: '#06B6D422', border: '#06B6D4', text: '#06B6D4' },
  { bg: '#6366F122', border: '#6366F1', text: '#6366F1' },
  { bg: '#EC489922', border: '#EC4899', text: '#EC4899' },
  { bg: '#F9731622', border: '#F97316', text: '#F97316' },
  { bg: '#8B5CF622', border: '#8B5CF6', text: '#8B5CF6' },
  { bg: '#EF444422', border: '#EF4444', text: '#EF4444' },
];

// ── tiny helpers ──────────────────────────────────────────────
function Callout({ color = '#6366F1', icon, title, children }) {
  return (
    <div
      style={{
        background: `${color}0D`,
        border: `1px solid ${color}55`,
        borderLeft: `3px solid ${color}`,
        borderRadius: '8px',
        padding: '14px 16px',
      }}
    >
      {title && (
        <div
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color,
            fontFamily: 'Space Mono, monospace',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {icon && <span>{icon}</span>}
          {title}
        </div>
      )}
      <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.8' }}>{children}</div>
    </div>
  );
}

function TechDef({ term, children }) {
  return (
    <div
      style={{
        background: '#0B0D17',
        border: '1px solid #1E2A45',
        borderRadius: '8px',
        padding: '14px 16px',
        marginBottom: '10px',
      }}
    >
      <div
        style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '12px',
          fontWeight: '700',
          color: '#06B6D4',
          marginBottom: '6px',
        }}
      >
        {term}
      </div>
      <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7' }}>{children}</div>
    </div>
  );
}

function StepBadge({ n, color }) {
  return (
    <div
      style={{
        width: '26px',
        height: '26px',
        borderRadius: '50%',
        background: `${color}22`,
        border: `2px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Space Mono, monospace',
        fontSize: '11px',
        fontWeight: '700',
        color,
        flexShrink: 0,
      }}
    >
      {n}
    </div>
  );
}

const TOKTYPE_EXAMPLES = [
  {
    type: 'Character-level',
    desc: 'Each single character = one token',
    color: '#EF4444',
    pros: 'Handles any text, no unknown words',
    cons: 'Very long sequences, loses word meaning',
    input: 'love',
    tokens: ['l', 'o', 'v', 'e'],
    ids: [12, 15, 22, 5],
    vocabSize: '~100 chars',
    usedBy: 'Early models, some speech models',
    plainEnglish:
      'Imagine splitting the word "love" into four separate letters: L, O, V, E. Each letter is its own piece. This is very thorough but takes a lot of memory — a single paragraph becomes hundreds of tiny pieces.',
  },
  {
    type: 'Word-level',
    desc: 'Each whole word = one token',
    color: '#F59E0B',
    pros: 'Simple, preserves word meaning',
    cons: '"loving" and "love" are different tokens — huge vocab needed',
    input: 'love',
    tokens: ['love'],
    ids: [8],
    vocabSize: '50–500k words',
    usedBy: 'This demo, older NLP models',
    plainEnglish:
      'Each whole word gets one slot. Simple and easy to understand! The problem is that "love," "loves," and "loving" are treated as three completely separate things — so the dictionary gets enormous.',
  },
  {
    type: 'Subword BPE',
    desc: 'Common words = 1 token; rare words = split into pieces',
    color: '#10B981',
    pros: 'Best of both worlds — compact and handles any word',
    cons: 'Harder to interpret, tokenization depends on context',
    input: 'love',
    tokens: ['love'],
    ids: [38103],
    vocabSize: '~50k–100k subwords',
    usedBy: 'GPT-2/3/4, Claude, Llama, BERT',
    plainEnglish:
      'This is the smart middle ground used by ChatGPT, Claude, and most modern AI. Common words like "love" stay as one piece. Rare or made-up words get sliced into familiar chunks — "unbelievable" might become "un" + "believ" + "able."',
  },
];

// ══════════════════════════════════════════════════════════════
export default function Step1_Tokenization({ result }) {
  if (!result) return null;
  const { tokens } = result;
  const [tokTypeIdx, setTokTypeIdx] = useState(1);
  const [showAllVocab, setShowAllVocab] = useState(false);

  const selectedType = TOKTYPE_EXAMPLES[tokTypeIdx];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span
            style={{
              background: '#F59E0B22',
              border: '1px solid #F59E0B',
              borderRadius: '8px',
              padding: '4px 12px',
              fontFamily: 'Space Mono, monospace',
              fontSize: '11px',
              color: '#F59E0B',
              fontWeight: '700',
            }}
          >
            STEP 1 of 8
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#E2E8F0', margin: 0 }}>
            Tokenization
          </h2>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '15px', margin: 0, lineHeight: '1.7' }}>
          Before an AI can do anything with your sentence, it has to convert every word into a number.
          That's all tokenization is. Let's see exactly what happened to your sentence right now.
        </p>
      </div>

      {/* ── 1. BIG HERO — YOUR TOKENS ───────────────────────── */}
      <div
        className="viz-card"
        style={{
          border: '1px solid #F59E0B55',
          background: 'linear-gradient(135deg, #F59E0B08 0%, #0D1117 60%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '22px' }}>🎉</span>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#E2E8F0' }}>
            Here's what just happened to YOUR sentence!
          </div>
        </div>
        <p style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 20px 0', lineHeight: '1.6' }}>
          Your sentence got chopped into{' '}
          <strong style={{ color: '#F59E0B' }}>{tokens.length} piece{tokens.length !== 1 ? 's' : ''}</strong>.
          Each piece got a number. That's it — that's tokenization!
        </p>

        {/* Big token cards */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {tokens.map((tok, i) => {
            const c = TC[i % TC.length];
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: '72px',
                }}
              >
                {/* Big word card */}
                <div
                  style={{
                    padding: '14px 18px',
                    background: c.bg,
                    border: `2px solid ${c.border}`,
                    borderRadius: '12px',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '17px',
                    fontWeight: '700',
                    color: c.text,
                    textAlign: 'center',
                    minWidth: '64px',
                    boxShadow: `0 0 14px ${c.border}33`,
                  }}
                >
                  {tok.word}
                </div>
                {/* Arrow down */}
                <div style={{ fontSize: '16px', color: '#475569' }}>↓</div>
                {/* ID number badge */}
                <div
                  style={{
                    width: '52px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0B0D17',
                    border: `2px solid ${c.border}`,
                    borderRadius: '10px',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: c.text,
                  }}
                >
                  {tok.id}
                </div>
                {/* Label */}
                <div
                  style={{
                    fontSize: '10px',
                    color: '#64748B',
                    fontFamily: 'Space Mono, monospace',
                    textAlign: 'center',
                  }}
                >
                  piece #{i + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary line */}
        <div
          style={{
            background: '#F59E0B11',
            border: '1px solid #F59E0B44',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '14px', color: '#94A3B8' }}>Your sentence became the numbers:</span>
          <span
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '15px',
              fontWeight: '700',
              color: '#F59E0B',
              letterSpacing: '2px',
            }}
          >
            [{tokens.map((t) => t.id).join(', ')}]
          </span>
        </div>

        <p style={{ fontSize: '13px', color: '#64748B', margin: '12px 0 0 0', lineHeight: '1.6' }}>
          Notice how the words are gone — only numbers remain. The AI will work entirely with these numbers
          from this point forward. It never "sees" the actual letters again.
        </p>
      </div>

      {/* ── 2. WHY NUMBERS? ─────────────────────────────────── */}
      <div className="viz-card">
        <SectionLabel>Why Numbers? Computers Can't Read Words!</SectionLabel>

        <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '18px', lineHeight: '1.7' }}>
          Here's the fundamental problem: computers are, at their core, giant calculators. They can
          add, multiply, and compare numbers at incredible speed. But the letter "A"? They have no
          idea what that means. So we have to translate.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {/* What humans see */}
          <div
            style={{
              flex: 1,
              minWidth: '200px',
              background: '#0B0D17',
              border: '1px solid #1E2A45',
              borderRadius: '10px',
              padding: '18px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '10px', letterSpacing: '1px' }}>
              WHAT YOU TYPE
            </div>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🧠</div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#E2E8F0',
                fontFamily: 'Space Mono, monospace',
                marginBottom: '8px',
              }}
            >
              "I love AI"
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.6' }}>
              Words with meaning, tone, and context — completely natural for a human to read
            </div>
          </div>

          {/* Middle arrow */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '80px',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '10px', color: '#6366F1', fontFamily: 'Space Mono, monospace', textAlign: 'center' }}>
              tokenize
            </div>
            <div style={{ fontSize: '28px', color: '#6366F1' }}>→</div>
          </div>

          {/* What computers need */}
          <div
            style={{
              flex: 1,
              minWidth: '200px',
              background: '#0B0D17',
              border: '1px solid #6366F1',
              borderRadius: '10px',
              padding: '18px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#6366F1', fontFamily: 'Space Mono, monospace', marginBottom: '10px', letterSpacing: '1px' }}>
              WHAT THE AI NEEDS
            </div>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>💻</div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#6366F1',
                fontFamily: 'Space Mono, monospace',
                marginBottom: '8px',
              }}
            >
              [2, 8, 14]
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.6' }}>
              Plain numbers — the only thing a computer can actually calculate with
            </div>
          </div>
        </div>

        <Callout color="#F59E0B" icon="🏪" title="The Barcode Analogy">
          Think about a supermarket checkout. The cashier doesn't type "Coca-Cola 500ml" into the
          register — they just scan the barcode and get a product number like{' '}
          <strong style={{ color: '#E2E8F0', fontFamily: 'Space Mono, monospace' }}>5449000000996</strong>.
          The entire store's inventory runs on those numbers, not on product names.
          <br /><br />
          Tokenization gives every word its own barcode number. When the AI sees the word "love,"
          it doesn't process the letters L-O-V-E. It just looks up the barcode number (say,{' '}
          <strong style={{ color: '#F59E0B', fontFamily: 'Space Mono, monospace' }}>8</strong>) and
          works with that. Every calculation from here on uses only numbers like 8, never the word "love."
        </Callout>

        <div style={{ marginTop: '16px' }}>
          <Callout color="#10B981" icon="📖" title="Another Way to Think About It">
            Imagine a huge phone book where every word in the English language has a page number.
            "love" is on page 8, "the" is on page 1, "robot" is on page 42. When the AI needs to
            process your sentence, it doesn't read the words — it just looks up the page numbers
            and works with those. Much faster, much simpler for a machine!
          </Callout>
        </div>
      </div>

      {/* ── 3. WHAT IS A TOKEN? ─────────────────────────────── */}
      <div className="viz-card">
        <SectionLabel>What Exactly Is a "Token"?</SectionLabel>

        <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '16px', lineHeight: '1.7' }}>
          A <strong style={{ color: '#06B6D4' }}>token</strong> (from the Latin word for "mark" or
          "sign") is just a <em>chunk of text</em> that the AI treats as one single unit. Most of the
          time, one token = one word. But not always! Here's what can count as a token:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            {
              icon: '📝',
              title: 'A token can be…',
              items: [
                'A whole word: "love"',
                'A word-piece: "lov" + "ing"',
                'A single letter: "l"',
                'A punctuation mark: "."',
                'A number: "42"',
                'A special marker: "<END>"',
              ],
              color: '#06B6D4',
            },
            {
              icon: '🔢',
              title: 'Every token has…',
              items: [
                'A unique ID number',
                'A position in the sentence',
                'A "meaning vector" (next step!)',
                'Connections to other tokens (step 4)',
              ],
              color: '#6366F1',
            },
            {
              icon: '📏',
              title: 'Fun size facts…',
              items: [
                '~4 letters on average (English)',
                '1 word ≈ 1.3 tokens (in GPT)',
                '"tokenization" → 3 tokens in GPT',
                '"AI" → 1 token',
                '"supercalifragilistic" → 6+ tokens',
              ],
              color: '#10B981',
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                background: '#0B0D17',
                border: `1px solid ${card.color}44`,
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{card.icon}</div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: card.color,
                  fontFamily: 'Space Mono, monospace',
                  marginBottom: '8px',
                  letterSpacing: '0.5px',
                }}
              >
                {card.title}
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {card.items.map((item) => (
                  <li
                    key={item}
                    style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '5px', lineHeight: '1.5' }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <TechDef term="Token — Technical Definition (for the curious)">
          A <strong style={{ color: '#06B6D4' }}>token</strong> is the smallest unit of text the
          model processes as a single piece. It is assigned a unique integer ID from the model's
          vocabulary. Formally: given vocabulary V = &#123;t₀, t₁, …, t|V|-1&#125; and input
          text X, tokenization is the function{' '}
          <span style={{ color: '#10B981', fontFamily: 'Space Mono, monospace' }}>
            f: X → (i₁, i₂, …, iₙ)
          </span>{' '}
          where each iₖ ∈ [0, |V|-1].
        </TechDef>
      </div>

      {/* ── 4. THREE TOKENIZER TYPES ─────────────────────────── */}
      <div className="viz-card">
        <SectionLabel>3 Flavours of Tokenization — Pick One to Explore</SectionLabel>

        <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '18px', lineHeight: '1.7' }}>
          Not all AIs chop up text the same way. There are three main approaches — each with its
          own personality. Click the buttons below to see how each one handles the word "love."
        </p>

        {/* Tab selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {TOKTYPE_EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setTokTypeIdx(i)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: `1.5px solid ${tokTypeIdx === i ? ex.color : '#1E2A45'}`,
                background: tokTypeIdx === i ? `${ex.color}22` : 'transparent',
                color: tokTypeIdx === i ? ex.color : '#64748B',
                fontFamily: 'Space Mono, monospace',
                fontSize: '11px',
                fontWeight: tokTypeIdx === i ? '700' : '400',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {ex.type}
            </button>
          ))}
        </div>

        {/* Plain-English intro for selected type */}
        <div
          style={{
            background: `${selectedType.color}0D`,
            border: `1px solid ${selectedType.color}44`,
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#CBD5E1',
            lineHeight: '1.7',
          }}
        >
          <strong style={{ color: selectedType.color }}>In plain English: </strong>
          {selectedType.plainEnglish}
        </div>

        {/* Selected type detail */}
        <div
          style={{
            background: '#0B0D17',
            border: `1px solid ${selectedType.color}`,
            borderRadius: '10px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            {/* Left: description and pros/cons */}
            <div style={{ flex: 2, minWidth: '220px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: selectedType.color, marginBottom: '6px' }}>
                {selectedType.type}
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '14px', lineHeight: '1.6' }}>
                {selectedType.desc}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    padding: '10px 12px',
                    background: '#10B98111',
                    border: '1px solid #10B98144',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#10B981',
                  }}
                >
                  ✓ <strong>What's great about it:</strong> {selectedType.pros}
                </div>
                <div
                  style={{
                    padding: '10px 12px',
                    background: '#EF444411',
                    border: '1px solid #EF444444',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#EF4444',
                  }}
                >
                  ✗ <strong>The downside:</strong> {selectedType.cons}
                </div>
              </div>

              <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>
                Dictionary size:{' '}
                <span style={{ color: selectedType.color }}>{selectedType.vocabSize}</span>
                &nbsp;|&nbsp; Used by:{' '}
                <span style={{ color: '#94A3B8' }}>{selectedType.usedBy}</span>
              </div>
            </div>

            {/* Right: the live example */}
            <div style={{ flex: 1, minWidth: '160px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Space Mono, monospace', marginBottom: '10px' }}>
                EXAMPLE: "{selectedType.input}"
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedType.tokens.map((tok, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        padding: '8px 14px',
                        background: `${selectedType.color}22`,
                        border: `1.5px solid ${selectedType.color}`,
                        borderRadius: '8px',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '14px',
                        fontWeight: '700',
                        color: selectedType.color,
                        minWidth: '50px',
                        textAlign: 'center',
                      }}
                    >
                      {tok}
                    </div>
                    <div style={{ color: '#475569', fontSize: '14px' }}>→</div>
                    <div
                      style={{
                        width: '58px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#131728',
                        border: `1px solid ${selectedType.color}`,
                        borderRadius: '8px',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: selectedType.color,
                      }}
                    >
                      {selectedType.ids[i]}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: '12px',
                  padding: '8px 10px',
                  background: '#131728',
                  borderRadius: '8px',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '11px',
                  color: '#64748B',
                }}
              >
                {selectedType.tokens.length} piece(s) → {selectedType.tokens.length} number(s)
              </div>
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div style={{ marginTop: '18px', overflowX: 'auto' }}>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '10px' }}>
            Here's a quick side-by-side comparison of all three approaches:
          </p>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'Space Mono, monospace',
              fontSize: '11px',
            }}
          >
            <thead>
              <tr>
                {['Approach', 'Dictionary size', 'Handles new words?', 'Sequence length', 'Who uses it'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      color: '#64748B',
                      borderBottom: '1px solid #1E2A45',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Character', '~100', '✓ Always', 'Very long', 'Speech, some LMs'],
                ['Word', '50k–500k', '✗ → Unknown', 'Short', 'This demo, old NLP'],
                ['BPE (subword)', '32k–100k', '✓ Splits into pieces', 'Medium', 'GPT-2/3/4, Claude, Llama'],
                ['WordPiece', '30k', '✓ Splits with ##', 'Medium', 'BERT, RoBERTa'],
                ['SentencePiece', '32k', '✓ Any language', 'Medium', 'T5, Gemma, Llama 3'],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #131728' }}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        padding: '8px 12px',
                        color:
                          j === 0
                            ? '#E2E8F0'
                            : j === 2
                            ? cell.startsWith('✓')
                              ? '#10B981'
                              : '#EF4444'
                            : '#94A3B8',
                        fontWeight: j === 0 ? '700' : '400',
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. HOW IT WORKS — STEP BY STEP ─────────────────── */}
      <div className="viz-card">
        <SectionLabel>How It Actually Works — Step by Step</SectionLabel>
        <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '20px', lineHeight: '1.7' }}>
          Let's trace exactly what happened behind the scenes when you typed your sentence. There
          are four mini-steps that happen in the blink of an eye.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Sub-step A */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <StepBadge n="A" color="#F59E0B" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0', marginBottom: '6px' }}>
                Before you even arrive — building the dictionary
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7' }}>
                Long before you typed anything, the AI's creators scanned billions of web pages and books.
                They counted which words appeared most often, picked the top ones (say, 50,000), and gave
                each one a unique number. This "dictionary" (officially called a{' '}
                <strong style={{ color: '#E2E8F0' }}>vocabulary</strong>) is built once and never changes.
                Any word not in the dictionary becomes a stand-in called{' '}
                <strong style={{ color: '#EF4444', fontFamily: 'Space Mono, monospace' }}>&lt;UNK&gt;</strong>{' '}
                (short for "unknown").
              </div>
            </div>
          </div>

          <div
            style={{
              marginLeft: '40px',
              background: '#0B0D17',
              border: '1px solid #1E2A45',
              borderRadius: '8px',
              padding: '12px',
              fontFamily: 'Space Mono, monospace',
              fontSize: '11px',
              color: '#94A3B8',
            }}
          >
            <div style={{ color: '#64748B', marginBottom: '8px' }}>// Building the dictionary (simplified)</div>
            <div style={{ color: '#10B981' }}>word_counts = count_all_words(billions_of_pages)</div>
            <div style={{ color: '#94A3B8' }}>vocabulary = top_50000_words(word_counts)</div>
            <div style={{ color: '#64748B', marginTop: '4px' }}>// "love" → 8,  "AI" → 14,  "the" → 1</div>
          </div>

          {/* Sub-step B */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <StepBadge n="B" color="#10B981" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0', marginBottom: '6px' }}>
                Your sentence arrives — chop it into pieces
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7' }}>
                When you hit enter, the AI splits your sentence at every space and punctuation mark.
                Each chunk becomes a separate token. Notice how "I love AI" becomes three separate
                pieces — one per word.
              </div>
            </div>
          </div>

          {/* Word split visualization */}
          <div
            style={{
              marginLeft: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                padding: '10px 16px',
                background: '#1E2A4544',
                border: '1px dashed #1E2A45',
                borderRadius: '8px',
                fontFamily: 'Space Mono, monospace',
                fontSize: '14px',
                color: '#94A3B8',
              }}
            >
              "{tokens.map((t) => t.word).join(' ')}"
            </div>
            <div style={{ color: '#6366F1', fontSize: '18px', fontWeight: '700' }}>→ chop →</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {tokens.map((tok, i) => {
                const c = TC[i % TC.length];
                return (
                  <div
                    key={i}
                    style={{
                      padding: '8px 14px',
                      background: c.bg,
                      border: `1.5px solid ${c.border}`,
                      borderRadius: '8px',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: c.text,
                    }}
                  >
                    {tok.word}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sub-step C */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <StepBadge n="C" color="#06B6D4" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0', marginBottom: '6px' }}>
                Look up each piece in the dictionary
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7' }}>
                Like looking up a word in a physical dictionary, the AI finds the page number (ID) for
                each token. If a word isn't in the dictionary, it gets ID number 1, which is the
                "unknown word" slot.
              </div>
            </div>
          </div>

          {/* Token → ID visual */}
          <div style={{ marginLeft: '40px', display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
            {tokens.map((tok, i) => {
              const c = TC[i % TC.length];
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div
                    style={{
                      padding: '8px 16px',
                      background: c.bg,
                      border: `1.5px solid ${c.border}`,
                      borderRadius: '8px',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: c.text,
                    }}
                  >
                    {tok.word}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>
                    position {tok.position}
                  </div>
                  <div style={{ color: '#475569', fontSize: '18px', lineHeight: '1' }}>↓</div>
                  <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Space Mono, monospace' }}>
                    look up
                  </div>
                  <div style={{ color: '#475569', fontSize: '18px', lineHeight: '1' }}>↓</div>
                  <div
                    style={{
                      width: '52px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#0B0D17',
                      border: `2px solid ${c.border}`,
                      borderRadius: '8px',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: c.text,
                    }}
                  >
                    {tok.id}
                  </div>
                  <div
                    style={{
                      fontSize: '9px',
                      fontFamily: 'Space Mono, monospace',
                      color: tok.inVocab ? '#10B981' : '#EF4444',
                      marginTop: '2px',
                    }}
                  >
                    {tok.inVocab ? '✓ found!' : '⚠ unknown'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sub-step D */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <StepBadge n="D" color="#6366F1" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0', marginBottom: '6px' }}>
                Hand a list of numbers to the AI
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.7' }}>
                All the ID numbers get lined up in order into a single list. This list — and only
                this list — is what gets fed into the AI. No letters, no words. Just numbers.
                Everything else in the AI's brain works entirely from these numbers.
              </div>
            </div>
          </div>

          <div
            style={{
              marginLeft: '40px',
              background: '#6366F111',
              border: '1px solid #6366F1',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '11px',
                color: '#64748B',
                marginBottom: '8px',
                letterSpacing: '1px',
              }}
            >
              THE FINAL LIST — this enters the AI's brain
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px', color: '#64748B' }}>
                input_ids = [
              </span>
              {tokens.map((tok, i) => {
                const c = TC[i % TC.length];
                return (
                  <React.Fragment key={i}>
                    <span
                      style={{
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: c.text,
                      }}
                    >
                      {tok.id}
                    </span>
                    {i < tokens.length - 1 && (
                      <span style={{ color: '#1E2A45' }}>,</span>
                    )}
                  </React.Fragment>
                );
              })}
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px', color: '#64748B' }}>
                ]
              </span>
            </div>
            <div
              style={{
                marginTop: '10px',
                fontFamily: 'Space Mono, monospace',
                fontSize: '11px',
                color: '#64748B',
              }}
            >
              type = whole numbers &nbsp;|&nbsp; length = {tokens.length} &nbsp;|&nbsp; valid range = [0, {CFG.VOCAB_SIZE - 1}]
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. YOUR VOCABULARY ───────────────────────────────── */}
      <div className="viz-card">
        <SectionLabel>Your Vocabulary — Every Word's "Barcode"</SectionLabel>

        <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '6px', lineHeight: '1.7' }}>
          Here's the entire dictionary this demo uses — all {CFG.VOCAB_SIZE} words. Each word has its
          own number (its ID). The{' '}
          <strong style={{ color: '#F59E0B' }}>highlighted words</strong> are the ones found in your
          sentence! Real AI models like GPT-4 have about 100,000 entries in theirs.
        </p>

        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
          Notice how each entry is like a library index card — the word on one side, the number on
          the other. When the AI needs "love," it doesn't read the letters; it goes straight to card #8.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '5px',
            maxHeight: showAllVocab ? 'none' : '220px',
            overflowY: showAllVocab ? 'visible' : 'hidden',
          }}
        >
          {VOCAB.map((word, id) => {
            const isUsed = tokens.some((t) => t.id === id);
            const usedTok = tokens.find((t) => t.id === id);
            const col = usedTok ? TC[tokens.indexOf(usedTok) % TC.length] : null;
            return (
              <div
                key={id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  background: isUsed ? col.bg : '#0B0D17',
                  border: `1px solid ${isUsed ? col.border : '#1E2A45'}`,
                  borderRadius: '6px',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '11px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    color: isUsed ? col.text : '#94A3B8',
                    fontWeight: isUsed ? '700' : '400',
                  }}
                >
                  {word}
                </span>
                <span
                  style={{
                    color: isUsed ? col.text : '#64748B',
                    fontWeight: '700',
                    fontSize: '10px',
                  }}
                >
                  #{id}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setShowAllVocab((v) => !v)}
          style={{
            marginTop: '12px',
            padding: '8px 18px',
            background: 'transparent',
            border: '1px solid #1E2A45',
            borderRadius: '8px',
            color: '#64748B',
            fontFamily: 'Space Mono, monospace',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {showAllVocab ? '▲ Show less' : `▼ Show all ${CFG.VOCAB_SIZE} words`}
        </button>
      </div>

      {/* ── 7. SPECIAL TOKENS ────────────────────────────────── */}
      <div className="viz-card">
        <SectionLabel>Special Tokens — The "Control Words" of AI</SectionLabel>

        <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '16px', lineHeight: '1.7' }}>
          Every AI vocabulary reserves a few special slots for "control words" — tokens that
          aren't real words but tell the AI how to behave. Think of them like traffic signs:
          they don't carry meaning by themselves, but they tell everyone what to do.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {[
            {
              token: '<PAD>',
              id: 0,
              color: '#64748B',
              emoji: '⬜',
              plain: 'The "blank space" filler.',
              desc: 'When the AI processes multiple sentences at once, shorter ones get padded with this so all sentences are the same length — like adding empty seats to fill a row.',
            },
            {
              token: '<UNK>',
              id: 1,
              color: '#EF4444',
              emoji: '❓',
              plain: 'The "I don\'t know this word" token.',
              desc: 'If you type a word that\'s not in the dictionary — like a brand-new slang term — it gets replaced with this. The AI has no information about that word. It\'s like a blank in a crossword.',
            },
            {
              token: '<BOS>',
              id: '–',
              color: '#10B981',
              emoji: '🟢',
              plain: 'The "ready, set, go!" signal.',
              desc: 'Beginning of Sequence — this gets quietly added at the very start to tell the AI: a new sentence is starting. The AI uses this as its starting position when generating a response.',
            },
            {
              token: '<EOS>',
              id: '–',
              color: '#6366F1',
              emoji: '🏁',
              plain: 'The "okay, stop talking" signal.',
              desc: 'End of Sequence — when the AI generates this token, it knows to stop writing. Without it, the model would just keep generating text forever and never stop!',
            },
          ].map((st) => (
            <div
              key={st.token}
              style={{
                background: '#0B0D17',
                border: `1px solid ${st.color}44`,
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{st.emoji}</span>
                  <span
                    style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: st.color,
                    }}
                  >
                    {st.token}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '10px',
                    color: '#64748B',
                    background: '#131728',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  id = {st.id}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                {st.plain}
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.6' }}>
                {st.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 8. TECH DEFINITION ───────────────────────────────── */}
      <div className="viz-card">
        <SectionLabel>For the Technically Curious — The Formal Definition</SectionLabel>

        <TechDef term="Tokenizer (Formal Definition)">
          Let <span style={{ color: '#06B6D4', fontFamily: 'Space Mono, monospace' }}>V</span> be a
          finite vocabulary of size{' '}
          <span style={{ color: '#06B6D4', fontFamily: 'Space Mono, monospace' }}>|V|</span>. A
          tokenizer is a function:
          <div
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '13px',
              color: '#10B981',
              margin: '8px 0',
              padding: '8px 12px',
              background: '#0B0D17',
              borderRadius: '6px',
            }}
          >
            τ : Σ* → V^n
          </div>
          where Σ* is the set of all possible strings, and V^n is a sequence of n token IDs. Each
          token ID iₖ ∈ [0, |V|−1].
        </TechDef>

        <TechDef term="Sequence Length (n)">
          The number of tokens produced: n = |τ(text)|. Bounded by max_seq_len of the model.
          For our demo: max_seq = {CFG.MAX_SEQ}. Your input has{' '}
          <span style={{ color: '#F59E0B', fontFamily: 'Space Mono, monospace' }}>
            n = {tokens.length}
          </span>{' '}
          tokens.
        </TechDef>

        <TechDef term="BPE (Byte-Pair Encoding) — what GPT and Claude use">
          A compression algorithm applied to text. Start with character-level tokens. Iteratively
          merge the most frequent adjacent pair into a single new token. After k merges, the
          vocabulary has |Σ| + k entries. The merge rules are learned from training data — common
          words become 1 token; rare words get split.
        </TechDef>
      </div>

      {/* ── 9. FORMULA BLOCK ─────────────────────────────────── */}
      <Formula>
        {`# Word-level tokenization (this demo)
vocab = {"I": 2, "love": 8, "AI": 14, ...}
tokens = text.lower().split()            # ["i", "love", "ai"]
ids    = [vocab.get(w, 1) for w in tokens]  # [2, 8, 14]  (1 = <UNK>)

# Result for YOUR sentence
input_ids.shape = (${tokens.length},)        # number of tokens
input_ids.dtype = int64
input_ids       = [${tokens.map((t) => t.id).join(', ')}]

# What this looks like in real AI code (HuggingFace / PyTorch)
tokenizer = AutoTokenizer.from_pretrained("gpt2")
input_ids = tokenizer("I love AI", return_tensors="pt").input_ids
# → tensor([[40, 1842, 9552]])  (GPT-2 BPE IDs — different numbers, same idea)`}
      </Formula>

      {/* ── 10. KEY TAKEAWAY ─────────────────────────────────── */}
      <Callout color="#6366F1" icon="🎯" title="What to Remember from This Step">
        <ol style={{ margin: 0, paddingLeft: '18px', lineHeight: '1.9' }}>
          <li style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#E2E8F0' }}>Computers can only work with numbers, not words.</strong>{' '}
            Tokenization is the translator that converts your text into numbers.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#E2E8F0' }}>Every word in the vocabulary has a unique number — its ID.</strong>{' '}
            This demo has {CFG.VOCAB_SIZE} words. GPT-4 has about 100,000 sub-word entries.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#E2E8F0' }}>Order matters!</strong>{' '}
            "I love AI" → [2, 8, 14] is completely different from "AI love I" → [14, 8, 2].
            Same words, different order = different numbers = different meaning to the AI.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#E2E8F0' }}>Your sentence became:</strong>{' '}
            [{tokens.map((t) => t.id).join(', ')}]. That list of{' '}
            {tokens.length} number{tokens.length !== 1 ? 's' : ''} is ALL the AI receives. No
            letters, no words — just those numbers.
          </li>
          <li>
            <strong style={{ color: '#E2E8F0' }}>Coming up next (Step 2):</strong>{' '}
            those plain numbers get turned into rich "meaning clouds" called{' '}
            <em>embeddings</em> — the AI's way of understanding what each word actually means.
          </li>
        </ol>
      </Callout>

      {/* ── STATS CARDS ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Your tokens', value: tokens.length, sub: `max = ${CFG.MAX_SEQ}`, color: '#F59E0B' },
          { label: 'Vocab size', value: CFG.VOCAB_SIZE, sub: 'GPT-4: ~100k', color: '#10B981' },
          {
            label: 'Found in vocab',
            value: tokens.filter((t) => t.inVocab).length,
            sub: `${tokens.filter((t) => !t.inVocab).length} unknown`,
            color: '#06B6D4',
          },
          { label: 'Shape', value: `(${tokens.length},)`, sub: 'type: int64', color: '#6366F1' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: '#131728',
              border: `1px solid ${s.color}44`,
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                fontWeight: '700',
                fontFamily: 'Space Mono, monospace',
                color: s.color,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
