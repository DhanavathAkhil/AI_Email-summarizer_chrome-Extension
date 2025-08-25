// utils.js
// Lightweight extractive summarizer and action item detector (offline).

function splitIntoSentences(text) {
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s*(?=[A-Z(])/g, "$1|")
    .replace(/\n+/g, ' ');
  return cleaned.split("|").map(s => s.trim()).filter(Boolean);
}

function wordFreqScore(sentences) {
  const stop = new Set("i me my myself we our ours ourselves you your yours yourself yourselves he him his himself she her hers herself it its itself they them their theirs themselves what which who whom this that these those am is are was were be been being have has had having do does did doing a an the and but if or because as until while of at by for with about against between into through during before after above below to from up down in out on off over under again further then once here there when where why how all any both each few more most other some such no nor not only own same so than too very s t can will just don should now".split(" "));
  const freq = {};
  let total = 0;
  sentences.forEach(s => {
    s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).forEach(w => {
      if (!w || stop.has(w)) return;
      freq[w] = (freq[w]||0) + 1;
      total += 1;
    });
  });
  const scores = sentences.map((s, i) => {
    let sc = 0;
    s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).forEach(w => {
      if (!w || stop.has(w)) return;
      sc += (freq[w]||0);
    });
    // bonus for early/late position
    const posBonus = (i === 0 ? 2 : 0) + (i === sentences.length-1 ? 1 : 0);
    return sc + posBonus;
  });
  return scores;
}

function keywordBoost(sentences) {
  const kw = ["summary","conclusion","in short","overall","to summarize","next steps","action","todo","deadline","due","please","kindly","request","important"];
  return sentences.map(s => {
    const m = kw.reduce((acc,k)=> acc + (s.toLowerCase().includes(k) ? 1 : 0), 0);
    return m * 2;
  });
}

function topNSentences(text, n=5) {
  const sents = splitIntoSentences(text);
  if (sents.length <= n) return sents;
  const wf = wordFreqScore(sents);
  const kb = keywordBoost(sents);
  const scored = sents.map((s,i)=>({i, s, score: wf[i] + kb[i]}));
  scored.sort((a,b)=> b.score - a.score);
  const top = scored.slice(0, n).sort((a,b)=> a.i - b.i).map(o=>o.s);
  return top;
}

function extractActionItems(text) {
  // Find imperative or request-like lines/sentences.
  const patterns = [
    /\bplease\b.*?\./gi,
    /\bkindly\b.*?\./gi,
    /\bcan you\b.*?\?/gi,
    /\bcould you\b.*?\?/gi,
    /\bneed to\b.*?\./gi,
    /\bwe should\b.*?\./gi,
    /\baction\b.*?\./gi,
    /\bETA\b.*?\b\d{1,2}\/\d{1,2}|\bby\b\s+\w+\s+\d{1,2}/gi,
    /\b(send|review|approve|schedule|call|meet|deploy|fix|update|share|confirm|reply|provide|create|summarize|plan|arrange)\b.*?(\.|$)/gi
  ];
  const sentences = splitIntoSentences(text);
  const matches = new Set();
  sentences.forEach(s => {
    for (const p of patterns) {
      const m = s.match(p);
      if (m) {
        matches.add(s.trim());
        break;
      }
    }
  });
  // Normalize and create structured tasks
  return Array.from(matches).map(t => {
    // rudimentary due date detection
    const dueMatch = t.match(/\bby\s+([A-Za-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2})/i);
    return { task: t, due: dueMatch ? dueMatch[1] : "" };
  });
}

function makeSummary(text, opts={sentences:5}) {
  const sents = topNSentences(text, opts.sentences || 5);
  return sents.join(" ");
}

function highlightInNode(node, items) {
  // Wrap task sentences with a span highlight inside the given node (email body).
  if (!node) return;
  const html = node.innerHTML;
  const unique = Array.from(new Set(items.map(i => i.task))).filter(Boolean);
  let replaced = html;
  unique.forEach(snippet => {
    const safe = snippet.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const re = new RegExp(safe, "g");
    replaced = replaced.replace(re, `<span class="ai-sum-highlight">${snippet}</span>`);
  });
  if (replaced !== html) node.innerHTML = replaced;
}

// Export to window
window.EmailSummarizerUtils = {
  makeSummary,
  extractActionItems,
  highlightInNode,
  splitIntoSentences
};
