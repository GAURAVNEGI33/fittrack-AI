import { useState, useRef, useEffect, useCallback } from "react";

// ============================================================
// 1. PROVIDER CONFIGURATION — edit keys here only
// ============================================================
const AI_CONFIG = {
  providers: [
    {
      id: "claude",
      enabled: true,
      apiKey: "", // leave empty — handled by Anthropic sandbox
      endpoint: "https://api.anthropic.com/v1/messages",
    },
    {
      id: "gemini",
      enabled: true,
      apiKey: "YOUR_GEMINI_API_KEY", // paste your free Gemini key here
      endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    },
  ],
  retryDelay: 1200,   // ms before retrying
  maxRetries: 1,
};

// ============================================================
// 2. LOCAL NUTRITION DATABASE (no API needed)
// ============================================================
const FOOD_DB = {
  // grains
  "rice":         { calories:130, protein:2.7, carbs:28, fat:0.3, per:"100g" },
  "white rice":   { calories:130, protein:2.7, carbs:28, fat:0.3, per:"100g" },
  "brown rice":   { calories:112, protein:2.6, carbs:24, fat:0.9, per:"100g" },
  "roti":         { calories:120, protein:3.5, carbs:22, fat:2.5, per:"1 piece" },
  "chapati":      { calories:120, protein:3.5, carbs:22, fat:2.5, per:"1 piece" },
  "oats":         { calories:147, protein:5,   carbs:25, fat:2.5, per:"40g dry" },
  "bread":        { calories:79,  protein:2.7, carbs:15, fat:1,   per:"1 slice" },
  "brown bread":  { calories:69,  protein:3,   carbs:12, fat:1,   per:"1 slice" },
  "pasta":        { calories:158, protein:5.8, carbs:31, fat:0.9, per:"100g" },
  // protein
  "egg":          { calories:78,  protein:6,   carbs:0.6,fat:5,   per:"1 egg" },
  "eggs":         { calories:78,  protein:6,   carbs:0.6,fat:5,   per:"1 egg" },
  "egg white":    { calories:17,  protein:3.6, carbs:0.2,fat:0,   per:"1 egg white" },
  "egg whites":   { calories:17,  protein:3.6, carbs:0.2,fat:0,   per:"1 egg white" },
  "chicken breast":{ calories:165,protein:31,  carbs:0,  fat:3.6, per:"100g" },
  "chicken":      { calories:165, protein:31,  carbs:0,  fat:3.6, per:"100g" },
  "paneer":       { calories:265, protein:18,  carbs:3.4,fat:20,  per:"100g" },
  "tuna":         { calories:116, protein:25,  carbs:0,  fat:1,   per:"100g" },
  "fish":         { calories:136, protein:22,  carbs:0,  fat:5,   per:"100g" },
  "mutton":       { calories:294, protein:25,  carbs:0,  fat:21,  per:"100g" },
  "tofu":         { calories:76,  protein:8,   carbs:1.9,fat:4.2, per:"100g" },
  // dairy
  "milk":         { calories:61,  protein:3.2, carbs:4.8,fat:3.3, per:"100ml" },
  "curd":         { calories:60,  protein:3.5, carbs:4.7,fat:3.3, per:"100g" },
  "yogurt":       { calories:59,  protein:3.5, carbs:5,  fat:3.3, per:"100g" },
  "greek yogurt": { calories:97,  protein:9,   carbs:3.6,fat:5,   per:"100g" },
  "whey protein": { calories:120, protein:24,  carbs:3,  fat:2,   per:"1 scoop(30g)" },
  // legumes
  "dal":          { calories:116, protein:9,   carbs:20, fat:0.4, per:"100g cooked" },
  "lentils":      { calories:116, protein:9,   carbs:20, fat:0.4, per:"100g cooked" },
  "rajma":        { calories:127, protein:8.7, carbs:22, fat:0.5, per:"100g cooked" },
  "chana":        { calories:164, protein:8.9, carbs:27, fat:2.6, per:"100g cooked" },
  "peanut butter":{ calories:188, protein:8,   carbs:6,  fat:16,  per:"2 tbsp" },
  "peanuts":      { calories:166, protein:7,   carbs:6,  fat:14,  per:"30g" },
  // fruits & veggies
  "banana":       { calories:89,  protein:1.1, carbs:23, fat:0.3, per:"1 medium" },
  "apple":        { calories:52,  protein:0.3, carbs:14, fat:0.2, per:"1 medium" },
  "mango":        { calories:60,  protein:0.8, carbs:15, fat:0.4, per:"100g" },
  "orange":       { calories:47,  protein:0.9, carbs:12, fat:0.1, per:"1 medium" },
  "spinach":      { calories:23,  protein:2.9, carbs:3.6,fat:0.4, per:"100g" },
  "broccoli":     { calories:34,  protein:2.8, carbs:7,  fat:0.4, per:"100g" },
  "potato":       { calories:77,  protein:2,   carbs:17, fat:0.1, per:"100g" },
  // other
  "almonds":      { calories:164, protein:6,   carbs:6,  fat:14,  per:"28g" },
  "olive oil":    { calories:119, protein:0,   carbs:0,  fat:13.5,per:"1 tbsp" },
  "butter":       { calories:102, protein:0.1, carbs:0,  fat:11.5,per:"1 tbsp" },
  "sugar":        { calories:48,  protein:0,   carbs:12, fat:0,   per:"1 tbsp" },
  "honey":        { calories:64,  protein:0.1, carbs:17, fat:0,   per:"1 tbsp" },
};

// ============================================================
// 3. SIMPLE FOOD DETECTOR
// ============================================================
function detectSimpleFoods(input) {
  const lower = input.toLowerCase();
  const tokens = lower.split(/[\s,+&]+/).filter(Boolean);
  const matched = [];
  let numberBefore = 1;

  const words = lower.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const num = parseFloat(words[i]);
    if (!isNaN(num)) { numberBefore = num; continue; }
    const word = words[i].replace(/[^a-z\s]/g, "");
    // try two-word combos first
    const twoWord = `${words[i]} ${words[i+1] || ""}`.trim();
    if (FOOD_DB[twoWord]) {
      matched.push({ key: twoWord, qty: numberBefore, data: FOOD_DB[twoWord] });
      numberBefore = 1; i++; continue;
    }
    if (FOOD_DB[word]) {
      matched.push({ key: word, qty: numberBefore, data: FOOD_DB[word] });
      numberBefore = 1;
    }
  }

  // if we matched >= 60% of non-numeric tokens, treat as simple
  const nonNumericTokens = tokens.filter(t => isNaN(parseFloat(t))).length;
  const isSimple = matched.length > 0 && (matched.length / Math.max(nonNumericTokens, 1)) >= 0.5;
  return { isSimple, matched };
}

function buildLocalResult(input, matched) {
  const items = matched.map(m => ({
    name: `${m.qty > 1 ? m.qty + "x " : ""}${m.key}`,
    qty: `${m.qty} × ${m.data.per}`,
    calories: Math.round(m.data.calories * m.qty),
    protein: Math.round(m.data.protein * m.qty * 10) / 10,
    carbs: Math.round(m.data.carbs * m.qty * 10) / 10,
    fat: Math.round(m.data.fat * m.qty * 10) / 10,
  }));
  const total = items.reduce((acc, i) => ({
    calories: acc.calories + i.calories,
    protein: Math.round((acc.protein + i.protein) * 10) / 10,
    carbs: Math.round((acc.carbs + i.carbs) * 10) / 10,
    fat: Math.round((acc.fat + i.fat) * 10) / 10,
  }), { calories:0, protein:0, carbs:0, fat:0 });
  return { name: input, items, total, tip: "Estimated from local database — values are approximate.", source: "local" };
}

// ============================================================
// 4. CACHE SYSTEM
// ============================================================
const cache = new Map();
function getCached(key) { return cache.get(key.trim().toLowerCase()) || null; }
function setCache(key, val) { cache.set(key.trim().toLowerCase(), val); }

// ============================================================
// 5. PROVIDER CALL FUNCTIONS
// ============================================================
async function callClaude(prompt, systemPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      stream: false,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude HTTP ${res.status}`);
  const data = await res.json();
  return data.content.map(b => b.text || "").join("");
}

async function callGemini(prompt, systemPrompt) {
  const key = AI_CONFIG.providers.find(p => p.id === "gemini")?.apiKey;
  if (!key || key === "YOUR_GEMINI_API_KEY") throw new Error("Gemini key not set");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ============================================================
// 6. MAIN callAI — provider fallback chain
// ============================================================
async function callAI(prompt, systemPrompt, retries = 0) {
  const providers = AI_CONFIG.providers.filter(p => p.enabled);
  let lastError;

  for (const provider of providers) {
    try {
      let text = "";
      if (provider.id === "claude") text = await callClaude(prompt, systemPrompt);
      else if (provider.id === "gemini") text = await callGemini(prompt, systemPrompt);
      return text;
    } catch (err) {
      lastError = err;
      if (retries < AI_CONFIG.maxRetries) {
        await new Promise(r => setTimeout(r, AI_CONFIG.retryDelay));
        return callAI(prompt, systemPrompt, retries + 1);
      }
      // try next provider
    }
  }
  throw lastError || new Error("All providers failed");
}

// ============================================================
// 7. MEAL ANALYSIS — local first, AI fallback
// ============================================================
const MEAL_SYSTEM = `Return ONLY a raw JSON object — no markdown, no backticks, no explanation.
Format: {"name":"meal name","items":[{"name":"food","qty":"amount","calories":0,"protein":0,"carbs":0,"fat":0}],"total":{"calories":0,"protein":0,"carbs":0,"fat":0},"tip":"short practical tip"}`;

async function analyzeMeal(input) {
  const cacheKey = input;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, source: "cache" };

  const { isSimple, matched } = detectSimpleFoods(input);
  if (isSimple) {
    const result = buildLocalResult(input, matched);
    setCache(cacheKey, result);
    return result;
  }

  try {
    const raw = await callAI(`Analyze this meal: ${input}`, MEAL_SYSTEM);
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    parsed.source = "ai";
    setCache(cacheKey, parsed);
    return parsed;
  } catch {
    // graceful fallback — partial local match or estimate
    if (matched.length > 0) return buildLocalResult(input, matched);
    return {
      name: input,
      items: [{ name: input, qty: "1 serving", calories: 350, protein: 15, carbs: 40, fat: 12 }],
      total: { calories: 350, protein: 15, carbs: 40, fat: 12 },
      tip: "Could not connect to AI. Showing a rough estimate — log more specific items for accuracy.",
      source: "fallback",
    };
  }
}

// ============================================================
// 8. CHAT — AI with graceful fallback
// ============================================================
const CHAT_FALLBACKS = [
  "Focus on hitting your protein target first — everything else falls into place.",
  "Stay consistent. Results come from weeks of effort, not single perfect days.",
  "Hydration matters more than most people think — aim for 3L daily.",
  "Pre-workout: carbs for energy. Post-workout: protein for recovery.",
  "Sleep is when your muscles actually grow. Prioritize 7-8 hours.",
];

async function askCoach(userMessage, history, profile) {
  const system = `You are FitTrack AI, a concise fitness and nutrition coach. User: ${profile.age}y, ${profile.weight}kg, ${profile.height}cm, Activity: ${profile.activity}. Targets: ${profile.calories} kcal, ${profile.protein}g protein. Reply in 2-4 sentences max. Be practical and specific.`;
  const prompt = history.slice(-6).map(m => `${m.role === "ai" ? "Assistant" : "User"}: ${m.text}`).join("\n") + `\nUser: ${userMessage}`;
  try {
    return await callAI(prompt, system);
  } catch {
    return CHAT_FALLBACKS[Math.floor(Math.random() * CHAT_FALLBACKS.length)];
  }
}

// ============================================================
// CSS
// ============================================================
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
  @keyframes progressAnim { from{width:0}to{width:var(--w)} }
  @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.5;} }
  @keyframes popIn { 0%{transform:scale(0.9);opacity:0;}70%{transform:scale(1.02);}100%{transform:scale(1);opacity:1;} }
  html,body { background:#060606; height:100%; }
  .app { display:flex; flex-direction:column; height:100vh; max-width:430px; margin:0 auto; background:#060606; font-family:'Inter',sans-serif; color:#fff; overflow:hidden; }
  .nav { flex-shrink:0; background:#060606; border-top:1px solid #111; display:flex; padding:0.55rem 0.5rem; gap:0.2rem; }
  .nav-btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.2rem; background:none; border:none; cursor:pointer; padding:0.4rem 0.3rem; border-radius:12px; transition:background 0.2s; font-family:'Inter',sans-serif; }
  .nav-btn.active { background:#111; }
  .nav-btn .nav-icon { font-size:1.2rem; }
  .nav-btn .nav-label { font-size:0.58rem; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; }
  .nav-btn.active .nav-label { color:#a78bfa; }
  .nav-btn:not(.active) .nav-label { color:#333; }
  .page { flex:1; overflow-y:auto; display:flex; flex-direction:column; }
  .page::-webkit-scrollbar { width:3px; }
  .page::-webkit-scrollbar-thumb { background:#1a1a1a; border-radius:99px; }
  /* HOME */
  .home { padding:0 0 2rem; animation:fadeUp 0.5s ease both; }
  .home-hero { padding:2rem 1.2rem 1.5rem; background:linear-gradient(180deg,#0d0d1a 0%,#060606 100%); position:relative; overflow:hidden; }
  .home-hero::before { content:''; position:absolute; top:-60px; right:-60px; width:200px; height:200px; background:radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%); border-radius:50%; }
  .hero-badge { display:inline-flex; align-items:center; gap:0.4rem; background:#111; border:1px solid #1e1e1e; border-radius:50px; padding:0.3rem 0.8rem; font-size:0.7rem; color:#a78bfa; font-weight:600; margin-bottom:1rem; }
  .hero-title { font-size:2rem; font-weight:900; letter-spacing:-0.04em; line-height:1.15; margin-bottom:0.5rem; }
  .hero-title span { background:linear-gradient(135deg,#a78bfa,#60a5fa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .hero-sub { color:#444; font-size:0.88rem; line-height:1.6; }
  .section { padding:1.2rem 1.2rem 0; }
  .section-title { font-size:0.68rem; font-weight:700; color:#2d2d2d; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:0.75rem; }
  .goal-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; }
  .goal-card { background:#0f0f0f; border:1px solid #1a1a1a; border-radius:14px; padding:1rem; cursor:pointer; transition:all 0.2s; text-align:left; }
  .goal-card.selected { border-color:#7c3aed; background:#0f0f1a; box-shadow:0 0 16px rgba(124,58,237,0.15); }
  .goal-card .goal-icon { font-size:1.4rem; margin-bottom:0.4rem; }
  .goal-card .goal-name { font-size:0.82rem; font-weight:700; color:#e5e7eb; margin-bottom:0.15rem; }
  .goal-card .goal-desc { font-size:0.68rem; color:#374151; }
  .feature-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; }
  .feat-card { background:#0f0f0f; border:1px solid #1a1a1a; border-radius:16px; padding:1.1rem; cursor:pointer; transition:all 0.2s; position:relative; overflow:hidden; }
  .feat-card::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
  .feat-card.purple::after { background:linear-gradient(90deg,#7c3aed,#a78bfa); }
  .feat-card.blue::after { background:linear-gradient(90deg,#2563eb,#60a5fa); }
  .feat-card.green::after { background:linear-gradient(90deg,#059669,#10b981); }
  .feat-card.orange::after { background:linear-gradient(90deg,#d97706,#f59e0b); }
  .feat-card:hover { border-color:#222; transform:translateY(-2px); }
  .feat-icon { font-size:1.5rem; margin-bottom:0.5rem; }
  .feat-name { font-size:0.82rem; font-weight:700; color:#e5e7eb; margin-bottom:0.2rem; }
  .feat-desc { font-size:0.68rem; color:#374151; line-height:1.5; }
  .feat-arrow { position:absolute; bottom:0.8rem; right:0.9rem; color:#222; font-size:0.75rem; }
  /* TRACKER */
  .tracker { padding:0 0 2rem; animation:fadeUp 0.4s ease both; }
  .tracker-header { padding:1.5rem 1.2rem 1rem; border-bottom:1px solid #0f0f0f; }
  .tracker-header h2 { font-size:1.3rem; font-weight:800; }
  .tracker-header p { color:#333; font-size:0.8rem; margin-top:0.2rem; }
  .macro-ring { display:flex; justify-content:center; padding:1.5rem 1.2rem 1rem; }
  .ring-center { position:relative; width:140px; height:140px; }
  .ring-svg { transform:rotate(-90deg); }
  .ring-text { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .ring-cal { font-size:1.6rem; font-weight:900; }
  .ring-lbl { font-size:0.65rem; color:#333; text-transform:uppercase; letter-spacing:0.1em; }
  .macro-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0.6rem; padding:0 1.2rem; }
  .macro-card { background:#0f0f0f; border:1px solid #1a1a1a; border-radius:12px; padding:0.8rem; }
  .macro-val { font-size:1.1rem; font-weight:800; }
  .macro-lbl { font-size:0.62rem; color:#333; text-transform:uppercase; letter-spacing:0.08em; margin-top:0.15rem; }
  .macro-bar { height:3px; background:#111; border-radius:99px; overflow:hidden; margin-top:0.5rem; }
  .macro-fill { height:100%; border-radius:99px; transition:width 0.5s ease; }
  .log-input-area { margin:1rem 1.2rem 0; background:#0f0f0f; border:1px solid #1a1a1a; border-radius:16px; padding:1rem; }
  .log-textarea { width:100%; background:transparent; border:none; outline:none; color:#e5e7eb; font-size:0.88rem; font-family:'Inter',sans-serif; resize:none; line-height:1.7; }
  .log-textarea::placeholder { color:#222; }
  .log-input-footer { display:flex; justify-content:space-between; align-items:center; margin-top:0.7rem; padding-top:0.7rem; border-top:1px solid #141414; }
  .btn-primary { background:linear-gradient(135deg,#7c3aed,#2563eb); color:#fff; font-weight:700; font-size:0.82rem; border:none; border-radius:50px; padding:0.6rem 1.4rem; cursor:pointer; font-family:'Inter',sans-serif; transition:opacity 0.2s; box-shadow:0 4px 14px rgba(124,58,237,0.3); }
  .btn-primary:disabled { opacity:0.25; cursor:not-allowed; }
  .btn-sm { padding:0.45rem 1rem; font-size:0.75rem; }
  .meals-list { padding:1rem 1.2rem 0; display:flex; flex-direction:column; gap:0.6rem; }
  .meal-entry { background:#0f0f0f; border:1px solid #1a1a1a; border-radius:14px; padding:0.9rem 1rem; animation:popIn 0.4s ease both; }
  .meal-entry-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; }
  .meal-entry-name { font-size:0.85rem; font-weight:600; color:#e5e7eb; }
  .meal-entry-meta { display:flex; align-items:center; gap:0.5rem; }
  .meal-entry-time { font-size:0.65rem; color:#2d2d2d; }
  .source-badge { font-size:0.58rem; padding:0.1rem 0.4rem; border-radius:50px; font-weight:700; }
  .src-local { background:rgba(16,185,129,0.1); color:#10b981; }
  .src-cache { background:rgba(96,165,250,0.1); color:#60a5fa; }
  .src-ai { background:rgba(167,139,250,0.1); color:#a78bfa; }
  .src-fallback { background:rgba(245,158,11,0.1); color:#f59e0b; }
  .meal-entry-macros { display:flex; gap:0.5rem; flex-wrap:wrap; }
  .macro-tag { padding:0.18rem 0.55rem; border-radius:50px; font-size:0.68rem; font-weight:700; }
  /* DIET */
  .diet { padding:0 0 2rem; animation:fadeUp 0.4s ease both; }
  .diet-header { padding:1.5rem 1.2rem 1rem; }
  .diet-header h2 { font-size:1.3rem; font-weight:800; }
  .diet-header p { color:#333; font-size:0.8rem; margin-top:0.2rem; }
  .filter-row { display:flex; gap:0.5rem; padding:0 1.2rem 1rem; overflow-x:auto; }
  .filter-row::-webkit-scrollbar { display:none; }
  .filter-chip { white-space:nowrap; background:#0f0f0f; border:1px solid #1a1a1a; border-radius:50px; padding:0.35rem 0.85rem; font-size:0.72rem; color:#333; cursor:pointer; font-family:'Inter',sans-serif; transition:all 0.18s; }
  .filter-chip.active { border-color:#7c3aed; color:#a78bfa; background:#0f0f1a; }
  .diet-cards { display:flex; flex-direction:column; gap:0.7rem; padding:0 1.2rem; }
  .diet-card { background:#0f0f0f; border:1px solid #1a1a1a; border-radius:16px; overflow:hidden; }
  .diet-card-header { padding:1rem 1.1rem 0.8rem; display:flex; justify-content:space-between; align-items:flex-start; }
  .diet-card-title { font-size:0.92rem; font-weight:700; color:#e5e7eb; }
  .diet-card-subtitle { font-size:0.72rem; color:#374151; margin-top:0.2rem; }
  .goal-badge { padding:0.2rem 0.65rem; border-radius:50px; font-size:0.65rem; font-weight:700; }
  .diet-meals { padding:0 1.1rem 1rem; display:flex; flex-direction:column; gap:0.4rem; }
  .diet-meal-row { display:flex; justify-content:space-between; }
  .diet-meal-name { font-size:0.78rem; color:#6b7280; }
  .diet-meal-cal { font-size:0.72rem; color:#374151; font-weight:600; }
  .diet-footer { padding:0.7rem 1.1rem; border-top:1px solid #111; display:flex; justify-content:space-between; }
  .diet-macro-val { font-size:0.82rem; font-weight:700; text-align:center; }
  .diet-macro-lbl { font-size:0.6rem; color:#333; text-align:center; }
  /* CHAT */
  .chat-outer { display:flex; flex-direction:column; flex:1; overflow:hidden; }
  .chat-header { flex-shrink:0; padding:1rem 1.2rem; border-bottom:1px solid #0f0f0f; display:flex; align-items:center; gap:0.7rem; }
  .chat-avatar { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#7c3aed,#2563eb); display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; }
  .chat-header-text h3 { font-size:0.95rem; font-weight:700; }
  .chat-header-text p { font-size:0.72rem; color:#333; }
  .online-dot { width:7px; height:7px; background:#10b981; border-radius:50%; margin-left:auto; }
  .messages-wrap { flex:1; overflow-y:auto; padding:1rem; display:flex; flex-direction:column; gap:0.8rem; }
  .messages-wrap::-webkit-scrollbar { width:3px; }
  .messages-wrap::-webkit-scrollbar-thumb { background:#1a1a1a; border-radius:99px; }
  .bubble-wrap { display:flex; flex-direction:column; }
  .bubble-wrap.user { align-items:flex-end; }
  .bubble-wrap.ai { align-items:flex-start; }
  .bubble { max-width:85%; padding:0.75rem 0.95rem; border-radius:16px; font-size:0.85rem; line-height:1.65; white-space:pre-wrap; word-break:break-word; }
  .bubble.user { background:linear-gradient(135deg,#7c3aed,#2563eb); color:#fff; border-bottom-right-radius:4px; }
  .bubble.ai { background:#111; border:1px solid #1a1a1a; color:#d1d5db; border-bottom-left-radius:4px; }
  .bubble-time { font-size:0.6rem; color:#222; margin-top:0.25rem; padding:0 0.25rem; }
  .chat-input-bar { flex-shrink:0; padding:0.75rem 1rem; border-top:1px solid #0f0f0f; display:flex; gap:0.6rem; align-items:flex-end; background:#060606; }
  .chat-input-wrap { flex:1; background:#0f0f0f; border:1px solid #1e1e1e; border-radius:14px; padding:0.6rem 0.9rem; }
  .chat-input-wrap:focus-within { border-color:#7c3aed55; }
  .chat-textarea { width:100%; background:transparent; border:none; outline:none; color:#e5e7eb; font-size:0.85rem; font-family:'Inter',sans-serif; resize:none; line-height:1.6; display:block; }
  .chat-textarea::placeholder { color:#222; }
  .send-btn { width:38px; height:38px; border-radius:10px; border:none; background:linear-gradient(135deg,#7c3aed,#2563eb); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 4px 12px rgba(124,58,237,0.3); }
  .send-btn:disabled { opacity:0.25; cursor:not-allowed; }
  /* PROFILE */
  .profile-page { padding:0 0 2rem; animation:fadeUp 0.4s ease both; }
  .profile-page-header { padding:1.5rem 1.2rem 1rem; }
  .profile-page-header h2 { font-size:1.3rem; font-weight:800; }
  .profile-page-header p { color:#333; font-size:0.8rem; margin-top:0.2rem; }
  .profile-section { padding:0 1.2rem; margin-bottom:1.2rem; }
  .profile-row { display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; margin-bottom:0.6rem; }
  .profile-input-wrap { background:#0f0f0f; border:1px solid #1a1a1a; border-radius:12px; padding:0.75rem 0.9rem; }
  .profile-input-label { font-size:0.62rem; color:#333; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:0.35rem; display:block; }
  .profile-input { background:transparent; border:none; outline:none; color:#e5e7eb; font-size:0.95rem; font-weight:700; font-family:'Inter',sans-serif; width:100%; }
  .save-btn { width:100%; background:linear-gradient(135deg,#7c3aed,#2563eb); color:#fff; font-weight:700; font-size:0.9rem; border:none; border-radius:14px; padding:0.9rem; cursor:pointer; font-family:'Inter',sans-serif; box-shadow:0 4px 16px rgba(124,58,237,0.3); }
  /* provider status */
  .provider-row { display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.6rem; }
  .provider-pill { display:flex; align-items:center; gap:0.35rem; background:#0f0f0f; border:1px solid #1a1a1a; border-radius:50px; padding:0.3rem 0.75rem; font-size:0.7rem; color:#444; }
  .dot-on { width:6px; height:6px; border-radius:50%; background:#10b981; flex-shrink:0; }
  .dot-off { width:6px; height:6px; border-radius:50%; background:#333; flex-shrink:0; }
  /* misc */
  .loading-dots { display:flex; gap:4px; align-items:center; padding:0.4rem 0.2rem; }
  .dot { width:5px; height:5px; background:#333; border-radius:50%; animation:pulse 1.2s ease infinite; }
  .dot:nth-child(2){animation-delay:0.2s;} .dot:nth-child(3){animation-delay:0.4s;}
  .cache-stats { display:flex; gap:0.5rem; align-items:center; font-size:0.65rem; color:#2d2d2d; }
`;

const GOALS = [
  {id:"cut",icon:"🔥",name:"Fat Loss",desc:"Lose fat, preserve muscle"},
  {id:"maintain",icon:"⚖️",name:"Maintenance",desc:"Stay lean & healthy"},
  {id:"bulk",icon:"💪",name:"Lean Bulk",desc:"Build muscle, minimal fat"},
  {id:"recomp",icon:"🔄",name:"Recomp",desc:"Lose fat & gain muscle"},
];
const GOAL_TARGETS = {
  cut:{calories:1800,protein:145,carbs:160,fat:45},
  maintain:{calories:2200,protein:130,carbs:260,fat:60},
  bulk:{calories:2800,protein:160,carbs:340,fat:75},
  recomp:{calories:2000,protein:155,carbs:195,fat:55},
};
const DIET_PLANS = [
  {goal:"cut",goalLabel:"Fat Loss",color:"#ef4444",title:"High Protein Cut Plan",subtitle:"1800 kcal · High protein, low carb",
   meals:[{name:"Breakfast",food:"4 egg whites + oats + black coffee",cal:320},{name:"Lunch",food:"Grilled chicken + salad + 2 roti",cal:480},{name:"Snack",food:"Paneer cubes + cucumber",cal:180},{name:"Dinner",food:"Dal + sabzi + 1 roti",cal:420}],
   macros:{cal:1800,pro:145,carbs:160,fat:45}},
  {goal:"bulk",goalLabel:"Lean Bulk",color:"#a78bfa",title:"Lean Bulk Indian Plan",subtitle:"2800 kcal · Balanced macros",
   meals:[{name:"Breakfast",food:"6 eggs + 4 roti + banana + milk",cal:720},{name:"Lunch",food:"Chicken curry + rice + salad",cal:780},{name:"Pre-workout",food:"Banana + peanut butter toast",cal:320},{name:"Dinner",food:"Paneer + rice + dal",cal:680}],
   macros:{cal:2800,pro:160,carbs:340,fat:75}},
  {goal:"maintain",goalLabel:"Maintenance",color:"#10b981",title:"Balanced Maintenance Plan",subtitle:"2200 kcal · Well-rounded",
   meals:[{name:"Breakfast",food:"3 eggs + 2 roti + fruit",cal:500},{name:"Lunch",food:"Rice + dal + sabzi + curd",cal:620},{name:"Snack",food:"Handful nuts + green tea",cal:180},{name:"Dinner",food:"Grilled fish + salad + roti",cal:540}],
   macros:{cal:2200,pro:130,carbs:260,fat:60}},
  {goal:"recomp",goalLabel:"Recomp",color:"#f59e0b",title:"Body Recomp Plan",subtitle:"2000 kcal · Protein-first",
   meals:[{name:"Breakfast",food:"Egg white omelette + oats",cal:380},{name:"Lunch",food:"Chicken + quinoa + veggies",cal:560},{name:"Snack",food:"Greek yogurt + berries",cal:180},{name:"Dinner",food:"Grilled paneer + sautéed veggies",cal:440}],
   macros:{cal:2000,pro:155,carbs:195,fat:55}},
];

const nowStr = () => new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
const LoadingDots = () => <div className="loading-dots"><div className="dot"/><div className="dot"/><div className="dot"/></div>;
const ProgressBar = ({val,max,color}) => (
  <div style={{height:4,background:"#111",borderRadius:99,overflow:"hidden"}}>
    <div style={{height:"100%",borderRadius:99,background:color,width:`${Math.min((val/max)*100,100)}%`,transition:"width 0.5s ease"}}/>
  </div>
);

const srcLabel = s => ({ local:"Local DB", cache:"Cached", ai:"AI", fallback:"Est." }[s] || "");
const srcClass = s => ({ local:"src-local", cache:"src-cache", ai:"src-ai", fallback:"src-fallback" }[s] || "");

// ── TRACKER PAGE ──
const TrackerPage = ({ daily, targets, meals, logLoading, onLog }) => {
  const [input, setInput] = useState("");
  const handleLog = () => { if (!input.trim() || logLoading) return; onLog(input); setInput(""); };
  const circ = 2*Math.PI*54;
  const dash = circ - (Math.min(daily.calories/targets.calories,1))*circ;
  return (
    <div className="tracker">
      <div className="tracker-header"><h2>Calorie Tracker</h2><p>Log meals — simple foods use local DB, no API call</p></div>
      <div className="macro-ring">
        <div className="ring-center">
          <svg className="ring-svg" width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="54" fill="none" stroke="#111" strokeWidth="10"/>
            <circle cx="70" cy="70" r="54" fill="none" stroke="url(#g1)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={dash} style={{transition:"stroke-dashoffset 0.8s ease"}}/>
            <defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#2563eb"/>
            </linearGradient></defs>
          </svg>
          <div className="ring-text"><span className="ring-cal">{daily.calories}</span><span className="ring-lbl">/ {targets.calories} kcal</span></div>
        </div>
      </div>
      <div className="macro-grid">
        {[{l:"Protein",v:daily.protein,m:targets.protein,u:"g",c:"#10b981",b:"linear-gradient(90deg,#10b981,#3b82f6)"},
          {l:"Carbs",v:daily.carbs,m:targets.carbs,u:"g",c:"#a78bfa",b:"linear-gradient(90deg,#a78bfa,#60a5fa)"},
          {l:"Fat",v:daily.fat,m:targets.fat,u:"g",c:"#f59e0b",b:"linear-gradient(90deg,#f59e0b,#ef4444)"}].map(m=>(
          <div key={m.l} className="macro-card">
            <div className="macro-val" style={{color:m.c}}>{m.v}{m.u}</div>
            <div className="macro-lbl">{m.l}</div>
            <div className="macro-bar"><div className="macro-fill" style={{width:`${Math.min((m.v/m.m)*100,100)}%`,background:m.b}}/></div>
          </div>
        ))}
      </div>
      <div className="log-input-area">
        <textarea className="log-textarea" rows={3} value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleLog();}}}
          placeholder="e.g. 3 eggs + 2 roti + banana  (simple foods use local DB instantly)"/>
        <div className="log-input-footer">
          <div className="cache-stats">⚡ {cache.size} cached · {Object.keys(FOOD_DB).length} local foods</div>
          <button className="btn-primary btn-sm" onClick={handleLog} disabled={logLoading||!input.trim()}>
            {logLoading?"Analyzing...":"Log Meal ⚡"}
          </button>
        </div>
        {logLoading && <div style={{marginTop:"0.5rem"}}><LoadingDots/></div>}
      </div>
      <div className="meals-list">
        {meals.length===0 && <p style={{color:"#222",fontSize:"0.8rem",textAlign:"center",padding:"1rem 0"}}>No meals logged yet.</p>}
        {meals.map((meal,i)=>(
          <div key={i} className="meal-entry">
            <div className="meal-entry-top">
              <span className="meal-entry-name">{meal.name}</span>
              <div className="meal-entry-meta">
                <span className={`source-badge ${srcClass(meal.source)}`}>{srcLabel(meal.source)}</span>
                <span className="meal-entry-time">{meal.time}</span>
              </div>
            </div>
            <div className="meal-entry-macros">
              <span className="macro-tag" style={{background:"rgba(245,158,11,0.1)",color:"#f59e0b"}}>🔥 {meal.total.calories} kcal</span>
              <span className="macro-tag" style={{background:"rgba(16,185,129,0.1)",color:"#10b981"}}>💪 {meal.total.protein}g</span>
              <span className="macro-tag" style={{background:"rgba(167,139,250,0.1)",color:"#a78bfa"}}>🍞 {meal.total.carbs}g</span>
            </div>
            {meal.tip && <p style={{fontSize:"0.72rem",color:"#2d2d2d",marginTop:"0.5rem"}}>💡 {meal.tip}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── CHAT PAGE ──
const ChatPage = ({ chatMsgs, chatLoading, onSend }) => {
  const [input, setInput] = useState("");
  const endRef = useRef();
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[chatMsgs,chatLoading]);
  const handleSend = () => { if(!input.trim()||chatLoading) return; onSend(input); setInput(""); };
  return (
    <div className="chat-outer">
      <div className="chat-header">
        <div className="chat-avatar">🤖</div>
        <div className="chat-header-text"><h3>FitTrack AI</h3><p>Nutrition & fitness coach</p></div>
        <div className="online-dot"/>
      </div>
      <div className="messages-wrap">
        {chatMsgs.map((m,i)=>(
          <div key={i} className={`bubble-wrap ${m.role}`}>
            <div className={`bubble ${m.role}`}>{m.text}</div>
            <span className="bubble-time">{m.time}</span>
          </div>
        ))}
        {chatLoading && <div className="bubble-wrap ai"><div className="bubble ai"><LoadingDots/></div></div>}
        <div ref={endRef}/>
      </div>
      <div className="chat-input-bar">
        <div className="chat-input-wrap">
          <textarea className="chat-textarea" rows={1} value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}}
            placeholder="Ask about nutrition, workouts, diet..."/>
        </div>
        <button className="send-btn" onClick={handleSend} disabled={chatLoading||!input.trim()}>➤</button>
      </div>
    </div>
  );
};

// ── MAIN APP ──
export default function App() {
  const [tab, setTab] = useState("home");
  const [goal, setGoal] = useState("bulk");
  const [dietFilter, setDietFilter] = useState("all");
  const [profile, setProfile] = useState({age:22,weight:70,height:175,activity:"Moderate",calories:2400,protein:130,carbs:280,fat:65});
  const [logLoading, setLogLoading] = useState(false);
  const [meals, setMeals] = useState([]);
  const [daily, setDaily] = useState({calories:0,protein:0,carbs:0,fat:0});
  const [chatMsgs, setChatMsgs] = useState([{role:"ai",time:nowStr(),text:"Hey! 👋 I'm FitTrack AI.\n\nSimple foods (eggs, rice, roti) are calculated instantly from my local database — no API needed.\n\nFor complex meals or coaching questions, I'll use AI. Ask me anything!"}]);
  const [chatLoading, setChatLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const targets = GOAL_TARGETS[goal];

  const logMeal = useCallback(async (text) => {
    setLogLoading(true);
    const result = await analyzeMeal(text);
    setMeals(prev=>[...prev,{...result,time:nowStr()}]);
    setDaily(d=>({
      calories: d.calories+result.total.calories,
      protein: Math.round((d.protein+result.total.protein)*10)/10,
      carbs: Math.round((d.carbs+result.total.carbs)*10)/10,
      fat: Math.round((d.fat+result.total.fat)*10)/10,
    }));
    setLogLoading(false);
  }, []);

  const sendChat = useCallback(async (text) => {
    setChatLoading(true);
    setChatMsgs(prev=>[...prev,{role:"user",time:nowStr(),text}]);
    const reply = await askCoach(text, chatMsgs, profile);
    setChatMsgs(prev=>[...prev,{role:"ai",time:nowStr(),text:reply}]);
    setChatLoading(false);
  }, [chatMsgs, profile]);

  const filteredDiets = dietFilter==="all" ? DIET_PLANS : DIET_PLANS.filter(d=>d.goal===dietFilter);
  const geminiKey = AI_CONFIG.providers.find(p=>p.id==="gemini")?.apiKey;
  const geminiOn = geminiKey && geminiKey !== "YOUR_GEMINI_API_KEY";

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="page">
          {/* HOME */}
          {tab==="home" && (
            <div className="home">
              <div className="home-hero">
                <div className="hero-badge">🤖 AI-Powered · Local-First</div>
                <h1 className="hero-title">Your Smart<br/><span>Fitness Tracker</span></h1>
                <p className="hero-sub">Tracks calories locally for common foods. Uses AI only when needed. Auto-switches providers if one fails.</p>
              </div>
              <div className="section" style={{marginTop:"1rem"}}>
                <p className="section-title">Your Goal</p>
                <div className="goal-grid">
                  {GOALS.map(g=>(
                    <div key={g.id} className={`goal-card ${goal===g.id?"selected":""}`} onClick={()=>setGoal(g.id)}>
                      <div className="goal-icon">{g.icon}</div>
                      <div className="goal-name">{g.name}</div>
                      <div className="goal-desc">{g.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="section" style={{marginTop:"1.2rem"}}>
                <p className="section-title">AI Providers</p>
                <div className="provider-row">
                  <div className="provider-pill"><div className="dot-on"/>Claude (active)</div>
                  <div className="provider-pill"><div className={geminiOn?"dot-on":"dot-off"}/>{geminiOn?"Gemini (active)":"Gemini (add key)"}</div>
                  <div className="provider-pill"><div className="dot-on"/>Local DB</div>
                  <div className="provider-pill"><div className="dot-on"/>Cache ({cache.size})</div>
                </div>
              </div>
              <div className="section" style={{marginTop:"1.2rem"}}>
                <p className="section-title">Today's Progress</p>
                <div style={{background:"#0f0f0f",border:"1px solid #1a1a1a",borderRadius:16,padding:"1rem"}}>
                  {[{label:"Calories",val:daily.calories,max:targets.calories,color:"linear-gradient(90deg,#f59e0b,#ef4444)",unit:"kcal"},
                    {label:"Protein",val:daily.protein,max:targets.protein,color:"linear-gradient(90deg,#10b981,#3b82f6)",unit:"g"}].map(r=>(
                    <div key={r.label} style={{marginBottom:"0.8rem"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.35rem"}}>
                        <span style={{fontSize:"0.75rem",color:"#555"}}>{r.label}</span>
                        <span style={{fontSize:"0.72rem",color:"#333",fontWeight:600}}>{r.val}{r.unit} / {r.max}{r.unit}</span>
                      </div>
                      <ProgressBar val={r.val} max={r.max} color={r.color}/>
                    </div>
                  ))}
                </div>
              </div>
              <div className="section" style={{marginTop:"1.2rem"}}>
                <p className="section-title">Explore</p>
                <div className="feature-grid">
                  {[{icon:"🔥",name:"Calorie Tracker",desc:"Log meals & track macros",color:"purple",page:"tracker"},
                    {icon:"🥗",name:"Diet Ideas",desc:"Meal plans for your goal",color:"green",page:"diet"},
                    {icon:"🤖",name:"AI Coach",desc:"Ask nutrition questions",color:"blue",page:"chat"},
                    {icon:"👤",name:"My Profile",desc:"Set your targets",color:"orange",page:"profile"}].map(f=>(
                    <div key={f.name} className={`feat-card ${f.color}`} onClick={()=>setTab(f.page)}>
                      <div className="feat-icon">{f.icon}</div>
                      <div className="feat-name">{f.name}</div>
                      <div className="feat-desc">{f.desc}</div>
                      <div className="feat-arrow">→</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab==="tracker" && <TrackerPage daily={daily} targets={targets} meals={meals} logLoading={logLoading} onLog={logMeal}/>}

          {tab==="diet" && (
            <div className="diet">
              <div className="diet-header"><h2>Diet Ideas</h2><p>Meal plans tailored to your goal</p></div>
              <div className="filter-row">
                {[{id:"all",label:"All"},{id:"cut",label:"🔥 Fat Loss"},{id:"bulk",label:"💪 Lean Bulk"},{id:"maintain",label:"⚖️ Maintain"},{id:"recomp",label:"🔄 Recomp"}].map(f=>(
                  <button key={f.id} className={`filter-chip ${dietFilter===f.id?"active":""}`} onClick={()=>setDietFilter(f.id)}>{f.label}</button>
                ))}
              </div>
              <div className="diet-cards">
                {filteredDiets.map((plan,i)=>(
                  <div key={i} className="diet-card">
                    <div className="diet-card-header">
                      <div><div className="diet-card-title">{plan.title}</div><div className="diet-card-subtitle">{plan.subtitle}</div></div>
                      <span className="goal-badge" style={{background:`${plan.color}18`,color:plan.color}}>{plan.goalLabel}</span>
                    </div>
                    <div className="diet-meals">
                      {plan.meals.map((m,j)=>(
                        <div key={j} className="diet-meal-row">
                          <span className="diet-meal-name">• {m.name}: {m.food}</span>
                          <span className="diet-meal-cal">{m.cal}</span>
                        </div>
                      ))}
                    </div>
                    <div className="diet-footer">
                      {[{l:"Cal",v:plan.macros.cal,c:"#f59e0b"},{l:"Pro",v:`${plan.macros.pro}g`,c:"#10b981"},{l:"Carbs",v:`${plan.macros.carbs}g`,c:"#a78bfa"},{l:"Fat",v:`${plan.macros.fat}g`,c:"#f87171"}].map(m=>(
                        <div key={m.l}><div className="diet-macro-val" style={{color:m.c}}>{m.v}</div><div className="diet-macro-lbl">{m.l}</div></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="chat" && <ChatPage chatMsgs={chatMsgs} chatLoading={chatLoading} onSend={sendChat}/>}

          {tab==="profile" && (
            <div className="profile-page">
              <div className="profile-page-header"><h2>My Profile</h2><p>Set your info to personalize targets</p></div>
              <div className="profile-section">
                <p className="section-title" style={{marginBottom:"0.75rem"}}>Body Stats</p>
                <div className="profile-row">
                  {[{label:"Age (years)",key:"age"},{label:"Weight (kg)",key:"weight"}].map(f=>(
                    <div key={f.key} className="profile-input-wrap">
                      <label className="profile-input-label">{f.label}</label>
                      <input className="profile-input" type="number" value={profile[f.key]} onChange={e=>setProfile(p=>({...p,[f.key]:+e.target.value}))}/>
                    </div>
                  ))}
                </div>
                <div className="profile-input-wrap" style={{marginBottom:"0.6rem"}}>
                  <label className="profile-input-label">Height (cm)</label>
                  <input className="profile-input" type="number" value={profile.height} onChange={e=>setProfile(p=>({...p,height:+e.target.value}))}/>
                </div>
                <div className="profile-input-wrap" style={{marginBottom:"0.6rem"}}>
                  <label className="profile-input-label">Activity Level</label>
                  <select className="profile-input" value={profile.activity} onChange={e=>setProfile(p=>({...p,activity:e.target.value}))}
                    style={{background:"transparent",border:"none",color:"#e5e7eb",fontFamily:"Inter",fontSize:"0.95rem",fontWeight:700,cursor:"pointer",width:"100%"}}>
                    {["Sedentary","Light","Moderate","Active","Very Active"].map(o=><option key={o} value={o} style={{background:"#111"}}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="profile-section">
                <p className="section-title" style={{marginBottom:"0.75rem"}}>Daily Targets</p>
                <div className="profile-row">
                  {[{label:"Calories (kcal)",key:"calories"},{label:"Protein (g)",key:"protein"}].map(f=>(
                    <div key={f.key} className="profile-input-wrap">
                      <label className="profile-input-label">{f.label}</label>
                      <input className="profile-input" type="number" value={profile[f.key]} onChange={e=>setProfile(p=>({...p,[f.key]:+e.target.value}))}/>
                    </div>
                  ))}
                </div>
                <div className="profile-row">
                  {[{label:"Carbs (g)",key:"carbs"},{label:"Fat (g)",key:"fat"}].map(f=>(
                    <div key={f.key} className="profile-input-wrap">
                      <label className="profile-input-label">{f.label}</label>
                      <input className="profile-input" type="number" value={profile[f.key]} onChange={e=>setProfile(p=>({...p,[f.key]:+e.target.value}))}/>
                    </div>
                  ))}
                </div>
              </div>
              <div className="profile-section">
                <p className="section-title" style={{marginBottom:"0.75rem"}}>AI Provider Config</p>
                <div className="profile-input-wrap" style={{marginBottom:"0.6rem"}}>
                  <label className="profile-input-label">Gemini API Key</label>
                  <input className="profile-input" type="password" placeholder="Paste your free Gemini key here"
                    defaultValue={geminiOn ? geminiKey : ""}
                    onChange={e=>{ const p=AI_CONFIG.providers.find(x=>x.id==="gemini"); if(p) p.apiKey=e.target.value; }}/>
                </div>
                <button className="save-btn" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);}}>
                  {saved?"✓ Saved!":"Save Profile"}
                </button>
              </div>
            </div>
          )}
        </div>

        <nav className="nav">
          {[{id:"home",icon:"🏠",label:"Home"},{id:"tracker",icon:"🔥",label:"Tracker"},{id:"diet",icon:"🥗",label:"Diet"},{id:"chat",icon:"🤖",label:"AI"},{id:"profile",icon:"👤",label:"Profile"}].map(t=>(
            <button key={t.id} className={`nav-btn ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
