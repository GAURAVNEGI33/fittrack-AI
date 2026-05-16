import { useState, useRef, useEffect, useCallback } from "react";

const AI_CONFIG = {
  providers: [
    { id: "claude", enabled: true, apiKey: "", endpoint: "https://api.anthropic.com/v1/messages" },
    { id: "gemini", enabled: true, apiKey: "YOUR_GEMINI_API_KEY", endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent" },
  ],
  retryDelay: 1200,
  maxRetries: 1,
};

const FOOD_DB = {
  "rice":           { calories:130, protein:2.7,  carbs:28.2, fat:0.3  },
  "white rice":     { calories:130, protein:2.7,  carbs:28.2, fat:0.3  },
  "brown rice":     { calories:123, protein:2.7,  carbs:25.6, fat:0.9  },
  "basmati rice":   { calories:121, protein:3.5,  carbs:25.2, fat:0.4  },
  "roti":           { calories:104, protein:3.1,  carbs:18.0, fat:2.5,  perPiece:true },
  "chapati":        { calories:104, protein:3.1,  carbs:18.0, fat:2.5,  perPiece:true },
  "paratha":        { calories:260, protein:5.0,  carbs:36.0, fat:10.0, perPiece:true },
  "oats":           { calories:389, protein:16.9, carbs:66.3, fat:6.9  },
  "bread":          { calories:79,  protein:2.7,  carbs:15.0, fat:1.0,  perPiece:true },
  "brown bread":    { calories:69,  protein:3.6,  carbs:11.5, fat:1.2,  perPiece:true },
  "pasta":          { calories:131, protein:5.0,  carbs:25.0, fat:1.1  },
  "quinoa":         { calories:120, protein:4.4,  carbs:21.3, fat:1.9  },
  "poha":           { calories:110, protein:2.5,  carbs:23.0, fat:0.5  },
  "egg":            { calories:155, protein:13.0, carbs:1.1,  fat:11.0, perPiece:true },
  "eggs":           { calories:155, protein:13.0, carbs:1.1,  fat:11.0, perPiece:true },
  "egg white":      { calories:52,  protein:10.9, carbs:0.7,  fat:0.2,  perPiece:true },
  "egg whites":     { calories:52,  protein:10.9, carbs:0.7,  fat:0.2,  perPiece:true },
  "chicken breast": { calories:165, protein:31.0, carbs:0.0,  fat:3.6  },
  "chicken":        { calories:165, protein:31.0, carbs:0.0,  fat:3.6  },
  "chicken thigh":  { calories:209, protein:26.0, carbs:0.0,  fat:10.9 },
  "grilled chicken":{ calories:165, protein:31.0, carbs:0.0,  fat:3.6  },
  "paneer":         { calories:265, protein:18.3, carbs:1.2,  fat:20.8 },
  "tuna":           { calories:116, protein:25.5, carbs:0.0,  fat:1.0  },
  "salmon":         { calories:208, protein:20.0, carbs:0.0,  fat:13.0 },
  "fish":           { calories:136, protein:22.0, carbs:0.0,  fat:5.0  },
  "mutton":         { calories:294, protein:25.6, carbs:0.0,  fat:21.0 },
  "tofu":           { calories:76,  protein:8.0,  carbs:1.9,  fat:4.2  },
  "whey protein":   { calories:120, protein:24.0, carbs:3.0,  fat:2.0,  perPiece:true },
  "milk":           { calories:61,  protein:3.2,  carbs:4.8,  fat:3.3  },
  "curd":           { calories:60,  protein:3.5,  carbs:4.7,  fat:3.3  },
  "yogurt":         { calories:61,  protein:3.5,  carbs:4.7,  fat:3.3  },
  "greek yogurt":   { calories:97,  protein:9.0,  carbs:3.6,  fat:5.0  },
  "dal":            { calories:116, protein:9.0,  carbs:20.0, fat:0.4  },
  "moong dal":      { calories:105, protein:7.0,  carbs:19.0, fat:0.4  },
  "toor dal":       { calories:118, protein:7.2,  carbs:20.7, fat:0.4  },
  "lentils":        { calories:116, protein:9.0,  carbs:20.0, fat:0.4  },
  "rajma":          { calories:127, protein:8.7,  carbs:22.8, fat:0.5  },
  "chana":          { calories:164, protein:8.9,  carbs:27.4, fat:2.6  },
  "peanut butter":  { calories:588, protein:25.0, carbs:20.0, fat:50.0 },
  "peanuts":        { calories:567, protein:25.8, carbs:16.1, fat:49.2 },
  "banana":         { calories:89,  protein:1.1,  carbs:22.8, fat:0.3,  perPiece:true },
  "apple":          { calories:52,  protein:0.3,  carbs:13.8, fat:0.2,  perPiece:true },
  "mango":          { calories:60,  protein:0.8,  carbs:15.0, fat:0.4  },
  "orange":         { calories:47,  protein:0.9,  carbs:11.8, fat:0.1,  perPiece:true },
  "spinach":        { calories:23,  protein:2.9,  carbs:3.6,  fat:0.4  },
  "broccoli":       { calories:34,  protein:2.8,  carbs:6.6,  fat:0.4  },
  "potato":         { calories:77,  protein:2.0,  carbs:17.0, fat:0.1  },
  "sweet potato":   { calories:86,  protein:1.6,  carbs:20.1, fat:0.1  },
  "almonds":        { calories:579, protein:21.2, carbs:21.6, fat:49.9 },
  "chicken curry":  { calories:150, protein:12.0, carbs:5.0,  fat:9.0  },
  "dal makhani":    { calories:140, protein:7.5,  carbs:16.0, fat:5.5  },
  "biryani":        { calories:170, protein:8.0,  carbs:25.0, fat:5.0  },
  "idli":           { calories:58,  protein:2.0,  carbs:12.0, fat:0.4,  perPiece:true },
  "dosa":           { calories:168, protein:3.9,  carbs:30.0, fat:3.7,  perPiece:true },
  "khichdi":        { calories:130, protein:5.5,  carbs:22.0, fat:2.5  },
};

function sanitizeMacros(item) {
  return {
    ...item,
    calories: Math.min(Math.max(Math.round(item.calories||0),0),1500),
    protein:  Math.min(Math.max(Math.round((item.protein||0)*10)/10,0),150),
    carbs:    Math.min(Math.max(Math.round((item.carbs||0)*10)/10,0),300),
    fat:      Math.min(Math.max(Math.round((item.fat||0)*10)/10,0),150),
  };
}

function sanitizeResult(result) {
  if (!result||!result.total) return result;
  const items = (result.items||[]).map(sanitizeMacros);
  const total = items.reduce((acc,i)=>({
    calories: acc.calories+i.calories,
    protein:  Math.round((acc.protein+i.protein)*10)/10,
    carbs:    Math.round((acc.carbs+i.carbs)*10)/10,
    fat:      Math.round((acc.fat+i.fat)*10)/10,
  }),{calories:0,protein:0,carbs:0,fat:0});
  if (total.calories>4000) {
    total.calories=Math.round(total.calories/10);
    total.protein=Math.round(total.protein/10*10)/10;
    total.carbs=Math.round(total.carbs/10*10)/10;
    total.fat=Math.round(total.fat/10*10)/10;
  }
  return {...result,items,total};
}

function detectSimpleFoods(input) {
  const lower = input.toLowerCase();
  const tokens = lower.split(/[\s,+&]+/).filter(Boolean);
  const matched = [];
  const segmentRegex = /(\d+(?:\.\d+)?)\s*(g|ml|kg|l|pieces?|cups?|tbsp|tsp)?\s+([a-z][a-z\s]*?)(?=\d|,|\+|&|$)/gi;
  let m;
  while ((m=segmentRegex.exec(lower))!==null) {
    const rawNum=parseFloat(m[1]);
    const unit=(m[2]||"").toLowerCase().replace(/s$/,"");
    const foodRaw=m[3].trim().replace(/\s+/g," ");
    const words=foodRaw.split(" ");
    for (let len=Math.min(words.length,3);len>=1;len--) {
      const key=words.slice(0,len).join(" ").trim();
      if (FOOD_DB[key]) {
        const db=FOOD_DB[key];
        let scale=1;
        if (unit==="g"||unit==="ml") scale=rawNum/100;
        else if (unit==="kg"||unit==="l") scale=(rawNum*1000)/100;
        else if (unit==="tbsp") scale=rawNum*0.15;
        else if (unit==="tsp") scale=rawNum*0.05;
        else if (unit==="cup") scale=rawNum*2.4;
        else scale=db.perPiece?rawNum:rawNum/100;
        matched.push({key,qty:`${rawNum}${unit||"x"}`,scale,data:db});
        break;
      }
    }
  }
  const nonNumericTokens=tokens.filter(t=>isNaN(parseFloat(t))).length;
  const isSimple=matched.length>0&&(matched.length/Math.max(nonNumericTokens,1))>=0.4;
  return {isSimple,matched};
}

function buildLocalResult(input,matched) {
  const items=matched.map(m=>sanitizeMacros({
    name:m.key,qty:m.qty,
    calories:m.data.calories*m.scale,
    protein:m.data.protein*m.scale,
    carbs:m.data.carbs*m.scale,
    fat:m.data.fat*m.scale,
  }));
  const total=items.reduce((acc,i)=>({
    calories:acc.calories+i.calories,
    protein:Math.round((acc.protein+i.protein)*10)/10,
    carbs:Math.round((acc.carbs+i.carbs)*10)/10,
    fat:Math.round((acc.fat+i.fat)*10)/10,
  }),{calories:0,protein:0,carbs:0,fat:0});
  return sanitizeResult({name:input,items,total,tip:"Estimated from local database — values are approximate.",source:"local"});
}

const cache=new Map();
function getCached(key){try{return cache.get(key.trim().toLowerCase())||null;}catch{return null;}}
function setCache(key,val){try{cache.set(key.trim().toLowerCase(),val);}catch{}}

async function callClaude(prompt,systemPrompt,imageBase64=null) {
  const content = imageBase64
    ? [
        {type:"image",source:{type:"base64",media_type:"image/jpeg",data:imageBase64}},
        {type:"text",text:prompt}
      ]
    : prompt;
  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,stream:false,system:systemPrompt,messages:[{role:"user",content}]}),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}`);
  const data=await res.json();
  return data.content.map(b=>b.text||"").join("");
}

async function callGemini(prompt,systemPrompt) {
  const key=AI_CONFIG.providers.find(p=>p.id==="gemini")?.apiKey;
  if (!key||key==="YOUR_GEMINI_API_KEY") throw new Error("No Gemini key");
  const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({system_instruction:{parts:[{text:systemPrompt}]},contents:[{parts:[{text:prompt}]}]}),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data=await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text||"";
}

async function callAI(prompt,systemPrompt,imageBase64=null,retries=0) {
  const providers=AI_CONFIG.providers.filter(p=>p.enabled);
  for (const provider of providers) {
    try {
      if (provider.id==="claude") return await callClaude(prompt,systemPrompt,imageBase64);
      if (provider.id==="gemini") return await callGemini(prompt,systemPrompt);
    } catch(err) {
      if (retries<AI_CONFIG.maxRetries) {
        await new Promise(r=>setTimeout(r,AI_CONFIG.retryDelay));
        return callAI(prompt,systemPrompt,imageBase64,retries+1);
      }
    }
  }
  throw new Error("All providers failed");
}

const MEAL_SYSTEM=`Return ONLY a raw JSON object — no markdown, no backticks, no explanation.
Format: {"name":"meal name","items":[{"name":"food","qty":"amount","calories":0,"protein":0,"carbs":0,"fat":0}],"total":{"calories":0,"protein":0,"carbs":0,"fat":0},"tip":"short practical tip"}`;

async function analyzeMeal(input,imageBase64=null) {
  const cacheKey=imageBase64?"img_"+input:input;
  const cached=getCached(cacheKey);
  if (cached) return {...cached,source:"cache"};
  if (!imageBase64) {
    const {isSimple,matched}=detectSimpleFoods(input);
    if (isSimple) {
      const result=buildLocalResult(input,matched);
      setCache(cacheKey,result);
      return result;
    }
  }
  try {
    const prompt=imageBase64
      ? "Analyze this food photo. Identify all food items, estimate portions, and calculate nutrition."
      : `Analyze this meal: ${input}`;
    const raw=await callAI(prompt,MEAL_SYSTEM,imageBase64);
    const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
    const safe=sanitizeResult({...parsed,source:imageBase64?"photo":"ai"});
    setCache(cacheKey,safe);
    return safe;
  } catch {
    return sanitizeResult({name:input||"Photo Meal",items:[{name:input||"Meal",qty:"1 serving",calories:350,protein:15,carbs:40,fat:12}],total:{calories:350,protein:15,carbs:40,fat:12},tip:"Could not analyze. Showing rough estimate.",source:"fallback"});
  }
}

const CHAT_FALLBACKS=[
  "Focus on hitting your protein target first — everything else falls into place.",
  "Stay consistent. Results come from weeks of effort, not single perfect days.",
  "Hydration matters more than most people think — aim for 3L daily.",
  "Pre-workout: carbs for energy. Post-workout: protein for recovery.",
  "Sleep is when your muscles actually grow. Prioritize 7-8 hours.",
];

async function askCoach(userMessage,history,profile) {
  const system=`You are FitTrack AI, a friendly and knowledgeable fitness and nutrition coach.
User: ${profile.age}y, ${profile.weight}kg, ${profile.height}cm, Goal: ${profile.goal}, Activity: ${profile.activity}.
Targets: ${profile.calories} kcal/day, ${profile.protein}g protein/day.

RULES:
- You are a CONVERSATIONAL coach. Always reply naturally like a real fitness trainer.
- For greetings (hi, hello, hey) — greet back warmly and ask how you can help with fitness/nutrition.
- For fitness questions — give specific, practical advice in 3-5 sentences.
- For diet/meal questions — give specific food recommendations with amounts.
- For workout questions — give clear exercise advice.
- NEVER return JSON or raw data.
- NEVER give random nutrition values unless asked.
- Always stay on topic: fitness, nutrition, health, workouts.
- Be motivating and supportive.
- Reply in the same language the user writes in.`;

  const prompt=history.slice(-8).map(m=>`${m.role==="ai"?"Coach":"User"}: ${m.text}`).join("\n")+`\nUser: ${userMessage}`;
  try { return await callAI(prompt,system); }
  catch { return CHAT_FALLBACKS[Math.floor(Math.random()*CHAT_FALLBACKS.length)]; }
}

// STREAKS
function getTodayKey() { return new Date().toISOString().split("T")[0]; }
function getStreak() {
  try {
    const data=JSON.parse(localStorage.getItem("fittrack_streak")||"{}");
    const today=getTodayKey();
    const yesterday=new Date(Date.now()-86400000).toISOString().split("T")[0];
    if (data.lastDay===today) return data.count||1;
    if (data.lastDay===yesterday) return (data.count||0)+1;
    return 1;
  } catch { return 1; }
}
function saveStreak(count) {
  try { localStorage.setItem("fittrack_streak",JSON.stringify({count,lastDay:getTodayKey()})); } catch {}
}

const BADGES=[
  {id:"first_meal",icon:"◈",label:"First Meal",desc:"Log your first meal",check:(meals)=>meals.length>=1},
  {id:"five_meals",icon:"▲",label:"5 Meals",desc:"Log 5 meals total",check:(meals)=>meals.length>=5},
  {id:"protein_goal",icon:"◉",label:"Protein Goal",desc:"Hit protein target",check:(_,daily,profile)=>daily.protein>=profile.protein},
  {id:"calorie_goal",icon:"◎",label:"Calorie Goal",desc:"Hit calorie target",check:(_,daily,profile)=>daily.calories>=profile.calories*0.9},
  {id:"streak_3",icon:"▶",label:"3 Day Streak",desc:"3 days in a row",check:(_,__,___,streak)=>streak>=3},
  {id:"streak_7",icon:"★",label:"7 Day Streak",desc:"7 days in a row",check:(_,__,___,streak)=>streak>=7},
];

const css=`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Bebas+Neue&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  @keyframes progressAnim{from{width:0}to{width:var(--w)}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
  @keyframes popIn{0%{transform:scale(0.9);opacity:0;}70%{transform:scale(1.02);}100%{transform:scale(1);opacity:1;}}
  @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes badgePop{0%{transform:scale(0);opacity:0;}70%{transform:scale(1.2);}100%{transform:scale(1);opacity:1;}}

  html,body{background:#000;height:100%;}
  .app{display:flex;flex-direction:column;height:100vh;max-width:430px;margin:0 auto;background:#000;font-family:'Inter',sans-serif;color:#fff;overflow:hidden;}

  /* NAV */
  .nav{flex-shrink:0;background:#000;border-top:1px solid #1a1a1a;display:flex;padding:0.55rem 0.5rem;gap:0.2rem;}
  .nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:0.2rem;background:none;border:none;cursor:pointer;padding:0.4rem 0.3rem;border-radius:8px;transition:background 0.2s;font-family:'Inter',sans-serif;}
  .nav-btn.active{background:#111;}
  .nav-btn .nav-icon{font-size:1.2rem;}
  .nav-btn .nav-label{font-size:0.58rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;}
  .nav-btn.active .nav-label{color:#fff;}
  .nav-btn.active .nav-icon{opacity:1;}
  .nav-btn:not(.active) .nav-label{color:rgba(255,255,255,0.3);}
  .nav-btn:not(.active) .nav-icon{opacity:0.3;}

  .page{flex:1;overflow-y:auto;display:flex;flex-direction:column;}
  .page::-webkit-scrollbar{width:2px;}
  .page::-webkit-scrollbar-thumb{background:#1a1a1a;}

  /* PAGE HEADER with back btn */
  .page-header{display:flex;align-items:center;padding:1rem 1.2rem;border-bottom:1px solid #111;gap:0.8rem;flex-shrink:0;}
  .back-btn{background:none;border:1px solid #222;color:#fff;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;flex-shrink:0;transition:border-color 0.2s;}
  .back-btn:hover{border-color:#fff;}
  .page-header-text h2{font-family:'Bebas Neue',sans-serif;font-size:1.8rem;font-weight:400;letter-spacing:0.05em;}
  .page-header-text p{color:#333;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;}

  /* HOME */
  .home{padding:0 0 2rem;animation:fadeUp 0.5s ease both;}
  .home-hero{padding:2.5rem 1.2rem 2rem;background:#000;position:relative;overflow:hidden;border-bottom:1px solid #1a1a1a;}
  .hero-badge{display:inline-flex;align-items:center;gap:0.4rem;background:transparent;border:1px solid #2a2a2a;border-radius:0;padding:0.25rem 0.8rem;font-size:0.62rem;color:#666;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:1.2rem;}
  .hero-title{font-family:'Bebas Neue',sans-serif;font-size:3.8rem;font-weight:400;letter-spacing:0.02em;line-height:0.95;margin-bottom:1rem;color:#fff;text-transform:uppercase;}
  .hero-title span{color:#fff;-webkit-text-fill-color:transparent;-webkit-text-stroke:1px #fff;}
  .hero-sub{color:#444;font-size:0.78rem;line-height:1.7;letter-spacing:0.04em;text-transform:uppercase;font-weight:500;}
  .hero-cta{display:inline-flex;align-items:center;gap:0.5rem;margin-top:1.5rem;background:#fff;color:#000;border:none;padding:0.75rem 1.5rem;font-size:0.75rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;font-family:'Inter',sans-serif;transition:opacity 0.2s;}
  .hero-cta:hover{opacity:0.85;}

  /* STREAK BANNER */
  .streak-banner{margin:1.2rem 1.2rem 0;background:#0a0a0a;border:1px solid #1a1a1a;padding:0.9rem 1rem;display:flex;align-items:center;justify-content:space-between;}
  .streak-left{display:flex;align-items:center;gap:0.6rem;}
  .streak-num{font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#fff;line-height:1;}
  .streak-info{display:flex;flex-direction:column;}
  .streak-label{font-size:0.7rem;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:0.08em;}
  .streak-sub{font-size:0.6rem;color:#333;text-transform:uppercase;letter-spacing:0.06em;}
  .streak-days{display:flex;gap:0.3rem;}
  .streak-day{width:24px;height:24px;border:1px solid #1a1a1a;display:flex;align-items:center;justify-content:center;font-size:0.55rem;font-weight:700;color:#333;text-transform:uppercase;}
  .streak-day.done{background:#fff;color:#000;border-color:#fff;}

  /* MARQUEE */
  .marquee-wrap{overflow:hidden;border-top:1px solid #111;border-bottom:1px solid #111;padding:0.5rem 0;background:#000;}
  .marquee-track{display:flex;gap:2rem;animation:marquee 12s linear infinite;width:max-content;}
  .marquee-item{font-size:0.65rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#222;white-space:nowrap;}

  .section{padding:1.2rem 1.2rem 0;}
  .section-title{font-size:0.62rem;font-weight:700;color:#333;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:0.75rem;border-left:2px solid #fff;padding-left:0.5rem;}

  /* GOALS */
  .goal-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;}
  .goal-card{background:#000;border:1px solid #1a1a1a;border-radius:0;padding:1rem;cursor:pointer;transition:all 0.2s;text-align:left;}
  .goal-card.selected{border-color:#fff;background:#0a0a0a;}
  .goal-card .goal-icon{font-size:1.3rem;margin-bottom:0.4rem;color:#fff;font-weight:900;}
  .goal-card .goal-name{font-size:0.82rem;font-weight:800;color:#fff;margin-bottom:0.15rem;letter-spacing:0.02em;text-transform:uppercase;}
  .goal-card .goal-desc{font-size:0.65rem;color:#555;letter-spacing:0.03em;}

  /* BADGES */
  .badges-row{display:flex;gap:0.5rem;overflow-x:auto;padding:0 1.2rem;}
  .badges-row::-webkit-scrollbar{display:none;}
  .badge-item{display:flex;flex-direction:column;align-items:center;gap:0.3rem;flex-shrink:0;}
  .badge-icon{width:44px;height:44px;border:1px solid #1a1a1a;display:flex;align-items:center;justify-content:center;font-size:1.1rem;transition:all 0.3s;}
  .badge-icon.earned{border-color:#fff;background:#fff;color:#000;animation:badgePop 0.5s ease;}
  .badge-icon.locked{opacity:0.2;}
  .badge-label{font-size:0.55rem;color:#333;text-transform:uppercase;letter-spacing:0.06em;text-align:center;font-weight:700;}
  .badge-label.earned{color:#fff;}

  /* FEATURES */
  .feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;}
  .feat-card{background:#0d0d0d;border:1px solid #222;border-radius:0;padding:1.1rem;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden;}
  .feat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:#fff;opacity:0.15;transition:opacity 0.2s;}
  .feat-card:hover{border-color:#fff;background:#111;}
  .feat-card:hover::before{opacity:0.4;}
  .feat-card::after{display:none;}
  .feat-icon{font-size:1.2rem;margin-bottom:0.6rem;color:#fff;font-weight:900;}
  .feat-name{font-size:0.78rem;font-weight:800;color:#fff;margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:0.04em;}
  .feat-desc{font-size:0.65rem;color:#555;line-height:1.5;}
  .feat-arrow{position:absolute;bottom:0.8rem;right:0.9rem;color:#222;font-size:0.75rem;}

  /* TRACKER */
  .tracker{padding:0 0 2rem;animation:fadeUp 0.4s ease both;}
  .macro-ring{display:flex;justify-content:center;padding:1.5rem 1.2rem 1rem;}
  .ring-center{position:relative;width:140px;height:140px;}
  .ring-svg{transform:rotate(-90deg);}
  .ring-text{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .ring-cal{font-family:'Bebas Neue',sans-serif;font-size:2rem;font-weight:400;letter-spacing:0.05em;}
  .ring-lbl{font-size:0.6rem;color:#333;text-transform:uppercase;letter-spacing:0.12em;}
  .macro-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;padding:0 1.2rem;}
  .macro-card{background:#000;border:1px solid #111;border-radius:0;padding:0.8rem;}
  .macro-val{font-size:1.1rem;font-weight:800;}
  .macro-lbl{font-size:0.6rem;color:#333;text-transform:uppercase;letter-spacing:0.1em;margin-top:0.15rem;}
  .macro-bar{height:2px;background:#111;overflow:hidden;margin-top:0.5rem;}
  .macro-fill{height:100%;transition:width 0.5s ease;}
  .log-input-area{margin:1rem 1.2rem 0;background:#000;border:1px solid #1a1a1a;border-radius:0;padding:1rem;}
  .log-textarea{width:100%;background:transparent;border:none;outline:none;color:#e5e7eb;font-size:0.88rem;font-family:'Inter',sans-serif;resize:none;line-height:1.7;}
  .log-textarea::placeholder{color:#1f1f1f;}
  .log-input-footer{display:flex;justify-content:space-between;align-items:center;margin-top:0.7rem;padding-top:0.7rem;border-top:1px solid #111;}
  .photo-btn{background:transparent;border:1px solid #222;color:#555;padding:0.45rem 0.8rem;font-size:0.7rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s;}
  .photo-btn:hover{border-color:#fff;color:#fff;}
  .img-preview{width:100%;max-height:160px;object-fit:cover;border:1px solid #1a1a1a;margin-bottom:0.7rem;}

  .btn-primary{background:#fff;color:#000;font-weight:800;font-size:0.72rem;border:none;border-radius:0;padding:0.6rem 1.4rem;cursor:pointer;font-family:'Inter',sans-serif;transition:opacity 0.2s;letter-spacing:0.1em;text-transform:uppercase;}
  .btn-primary:disabled{opacity:0.2;cursor:not-allowed;}
  .btn-sm{padding:0.45rem 1rem;font-size:0.68rem;}
  .meals-list{padding:1rem 1.2rem 0;display:flex;flex-direction:column;gap:0.5rem;}
  .meal-entry{background:#000;border:1px solid #111;border-radius:0;padding:0.9rem 1rem;animation:popIn 0.4s ease both;}
  .meal-entry-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;}
  .meal-entry-name{font-size:0.82rem;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.03em;}
  .meal-entry-meta{display:flex;align-items:center;gap:0.5rem;}
  .meal-entry-time{font-size:0.62rem;color:#222;}
  .source-badge{font-size:0.55rem;padding:0.1rem 0.4rem;font-weight:700;letter-spacing:0.06em;border-radius:0;}
  .src-local{background:#fff;color:#000;}
  .src-cache{background:#1a1a1a;color:#fff;}
  .src-ai{background:#fff;color:#000;}
  .src-photo{background:#fff;color:#000;}
  .src-fallback{background:#1a1a1a;color:#666;}
  .meal-entry-macros{display:flex;gap:0.4rem;flex-wrap:wrap;}
  .macro-tag{padding:0.18rem 0.55rem;border-radius:0;font-size:0.65rem;font-weight:700;letter-spacing:0.04em;border:1px solid #1a1a1a;color:#666;background:transparent;}

  /* DIET */
  .diet{padding:0 0 2rem;animation:fadeUp 0.4s ease both;}
  .filter-row{display:flex;gap:0.4rem;padding:1rem 1.2rem;overflow-x:auto;}
  .filter-row::-webkit-scrollbar{display:none;}
  .filter-chip{white-space:nowrap;background:transparent;border:1px solid #1a1a1a;border-radius:0;padding:0.3rem 0.8rem;font-size:0.65rem;color:#333;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;}
  .filter-chip.active{border-color:#fff;color:#fff;background:#0a0a0a;}
  .diet-cards{display:flex;flex-direction:column;gap:0.5rem;padding:0 1.2rem;}
  .diet-card{background:#000;border:1px solid #111;border-radius:0;overflow:hidden;}
  .diet-card-header{padding:1rem 1.1rem 0.8rem;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #0a0a0a;}
  .diet-card-title{font-size:0.88rem;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:0.03em;}
  .diet-card-subtitle{font-size:0.65rem;color:#333;margin-top:0.2rem;letter-spacing:0.05em;}
  .goal-badge{padding:0.18rem 0.6rem;border-radius:0;font-size:0.62rem;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;border:1px solid;}
  .diet-meals{padding:0.8rem 1.1rem;display:flex;flex-direction:column;gap:0.4rem;}
  .diet-meal-row{display:flex;justify-content:space-between;}
  .diet-meal-name{font-size:0.75rem;color:#444;}
  .diet-meal-cal{font-size:0.7rem;color:#333;font-weight:700;}
  .diet-footer{padding:0.7rem 1.1rem;border-top:1px solid #111;display:flex;justify-content:space-between;}
  .diet-macro-val{font-size:0.82rem;font-weight:800;text-align:center;color:#fff;}
  .diet-macro-lbl{font-size:0.58rem;color:#333;text-align:center;text-transform:uppercase;letter-spacing:0.06em;}

  /* CHAT */
  .chat-outer{display:flex;flex-direction:column;flex:1;overflow:hidden;}
  .chat-header{flex-shrink:0;padding:1rem 1.2rem;border-bottom:1px solid #111;display:flex;align-items:center;gap:0.7rem;}
  .chat-avatar{width:34px;height:34px;border-radius:0;background:#fff;display:flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0;}
  .chat-header-text h3{font-size:0.88rem;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;}
  .chat-header-text p{font-size:0.65rem;color:#333;text-transform:uppercase;letter-spacing:0.06em;}
  .online-dot{width:6px;height:6px;background:#fff;border-radius:50%;margin-left:auto;}
  .messages-wrap{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.8rem;}
  .messages-wrap::-webkit-scrollbar{width:2px;}
  .messages-wrap::-webkit-scrollbar-thumb{background:#111;}
  .bubble-wrap{display:flex;flex-direction:column;}
  .bubble-wrap.user{align-items:flex-end;}
  .bubble-wrap.ai{align-items:flex-start;}
  .bubble{max-width:85%;padding:0.75rem 0.95rem;font-size:0.85rem;line-height:1.65;white-space:pre-wrap;word-break:break-word;border-radius:0;}
  .bubble.user{background:#fff;color:#000;font-weight:500;}
  .bubble.ai{background:#0a0a0a;border:1px solid #1a1a1a;color:#aaa;}
  .bubble-time{font-size:0.58rem;color:#222;margin-top:0.25rem;padding:0 0.25rem;letter-spacing:0.06em;}
  .chat-input-bar{flex-shrink:0;padding:0.75rem 1rem;border-top:1px solid #111;display:flex;gap:0.6rem;align-items:flex-end;background:#000;}
  .chat-input-wrap{flex:1;background:#000;border:1px solid #1a1a1a;border-radius:0;padding:0.6rem 0.9rem;}
  .chat-input-wrap:focus-within{border-color:#333;}
  .chat-textarea{width:100%;background:transparent;border:none;outline:none;color:#e5e7eb;font-size:0.85rem;font-family:'Inter',sans-serif;resize:none;line-height:1.6;display:block;}
  .chat-textarea::placeholder{color:#1f1f1f;}
  .send-btn{width:38px;height:38px;border-radius:0;border:none;background:#fff;color:#000;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1rem;font-weight:800;}
  .send-btn:disabled{opacity:0.2;cursor:not-allowed;}

  /* PROFILE */
  .profile-page{padding:0 0 2rem;animation:fadeUp 0.4s ease both;}
  .profile-section{padding:0 1.2rem;margin-bottom:1.2rem;}
  .profile-row{display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.5rem;}
  .profile-input-wrap{background:#000;border:1px solid #111;border-radius:0;padding:0.75rem 0.9rem;}
  .profile-input-label{font-size:0.58rem;color:#333;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:0.35rem;display:block;font-weight:700;}
  .profile-input{background:transparent;border:none;outline:none;color:#fff;font-size:0.95rem;font-weight:700;font-family:'Inter',sans-serif;width:100%;}
  .save-btn{width:100%;background:#fff;color:#000;font-weight:800;font-size:0.82rem;border:none;border-radius:0;padding:0.9rem;cursor:pointer;font-family:'Inter',sans-serif;letter-spacing:0.12em;text-transform:uppercase;transition:opacity 0.2s;}
  .save-btn:hover{opacity:0.85;}

  .loading-dots{display:flex;gap:4px;align-items:center;padding:0.4rem 0.2rem;}
  .dot{width:4px;height:4px;background:#333;border-radius:50%;animation:pulse 1.2s ease infinite;}
  .dot:nth-child(2){animation-delay:0.2s;} .dot:nth-child(3){animation-delay:0.4s;}
  .cache-stats{font-size:0.62rem;color:#222;text-transform:uppercase;letter-spacing:0.06em;}
`;

const GOALS=[
  {id:"cut",icon:"↓",name:"Fat Loss",desc:"Lose fat, preserve muscle"},
  {id:"maintain",icon:"—",name:"Maintenance",desc:"Stay lean & healthy"},
  {id:"bulk",icon:"↑",name:"Lean Bulk",desc:"Build muscle, minimal fat"},
  {id:"recomp",icon:"⟳",name:"Recomp",desc:"Lose fat & gain muscle"},
];
const GOAL_TARGETS={
  cut:{calories:1800,protein:145,carbs:160,fat:45},
  maintain:{calories:2200,protein:130,carbs:260,fat:60},
  bulk:{calories:2800,protein:160,carbs:340,fat:75},
  recomp:{calories:2000,protein:155,carbs:195,fat:55},
};
const DIET_PLANS=[
  {goal:"cut",goalLabel:"Fat Loss",color:"#ef4444",title:"High Protein Cut Plan",subtitle:"1800 kcal · High protein, low carb",
   meals:[{name:"Breakfast",food:"4 egg whites + oats + black coffee",cal:320},{name:"Lunch",food:"Grilled chicken + salad + 2 roti",cal:480},{name:"Snack",food:"Paneer cubes + cucumber",cal:180},{name:"Dinner",food:"Dal + sabzi + 1 roti",cal:420}],
   macros:{cal:1800,pro:145,carbs:160,fat:45}},
  {goal:"bulk",goalLabel:"Lean Bulk",color:"#fff",title:"Lean Bulk Indian Plan",subtitle:"2800 kcal · Balanced macros",
   meals:[{name:"Breakfast",food:"6 eggs + 4 roti + banana + milk",cal:720},{name:"Lunch",food:"Chicken curry + rice + salad",cal:780},{name:"Pre-workout",food:"Banana + peanut butter toast",cal:320},{name:"Dinner",food:"Paneer + rice + dal",cal:680}],
   macros:{cal:2800,pro:160,carbs:340,fat:75}},
  {goal:"maintain",goalLabel:"Maintenance",color:"#aaa",title:"Balanced Maintenance Plan",subtitle:"2200 kcal · Well-rounded",
   meals:[{name:"Breakfast",food:"3 eggs + 2 roti + fruit",cal:500},{name:"Lunch",food:"Rice + dal + sabzi + curd",cal:620},{name:"Snack",food:"Handful nuts + green tea",cal:180},{name:"Dinner",food:"Grilled fish + salad + roti",cal:540}],
   macros:{cal:2200,pro:130,carbs:260,fat:60}},
  {goal:"recomp",goalLabel:"Recomp",color:"#888",title:"Body Recomp Plan",subtitle:"2000 kcal · Protein-first",
   meals:[{name:"Breakfast",food:"Egg white omelette + oats",cal:380},{name:"Lunch",food:"Chicken + quinoa + veggies",cal:560},{name:"Snack",food:"Greek yogurt + berries",cal:180},{name:"Dinner",food:"Grilled paneer + sautéed veggies",cal:440}],
   macros:{cal:2000,pro:155,carbs:195,fat:55}},
];

const nowStr=()=>new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
const LoadingDots=()=><div className="loading-dots"><div className="dot"/><div className="dot"/><div className="dot"/></div>;
const ProgressBar=({val,max,color})=>(
  <div style={{height:4,background:"#111",overflow:"hidden"}}>
    <div style={{height:"100%",background:color,width:`${Math.min((val/max)*100,100)}%`,transition:"width 0.5s ease"}}/>
  </div>
);
const srcLabel=s=>({local:"Local DB",cache:"Cached",ai:"AI",photo:"Photo",fallback:"Est."}[s]||"");
const srcClass=s=>({local:"src-local",cache:"src-cache",ai:"src-ai",photo:"src-photo",fallback:"src-fallback"}[s]||"");

// TRACKER PAGE
const TrackerPage=({daily,targets,meals,logLoading,onLog,onBack})=>{
  const [input,setInput]=useState("");
  const [imgData,setImgData]=useState(null);
  const [imgPreview,setImgPreview]=useState(null);
  const fileRef=useRef();

  const handleImg=(e)=>{
    const file=e.target.files[0];
    if (!file) return;
    const reader=new FileReader();
    reader.onload=()=>{ setImgPreview(reader.result); setImgData(reader.result.split(",")[1]); };
    reader.readAsDataURL(file);
  };

  const handleLog=()=>{
    if ((!input.trim()&&!imgData)||logLoading) return;
    onLog(input,imgData);
    setInput(""); setImgData(null); setImgPreview(null);
  };

  const circ=2*Math.PI*54;
  const dash=circ-(Math.min(daily.calories/targets.calories,1))*circ;

  return (
    <div className="tracker">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <div className="page-header-text"><h2>Tracker</h2><p>Log meals & track macros</p></div>
      </div>
      <div className="macro-ring">
        <div className="ring-center">
          <svg className="ring-svg" width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="54" fill="none" stroke="#111" strokeWidth="10"/>
            <circle cx="70" cy="70" r="54" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="square" strokeDasharray={circ} strokeDashoffset={dash} style={{transition:"stroke-dashoffset 0.8s ease"}}/>
          </svg>
          <div className="ring-text"><span className="ring-cal">{daily.calories}</span><span className="ring-lbl">/ {targets.calories} kcal</span></div>
        </div>
      </div>
      <div className="macro-grid">
        {[{l:"Protein",v:daily.protein,m:targets.protein,u:"g",c:"#fff"},{l:"Carbs",v:daily.carbs,m:targets.carbs,u:"g",c:"#888"},{l:"Fat",v:daily.fat,m:targets.fat,u:"g",c:"#555"}].map(m=>(
          <div key={m.l} className="macro-card">
            <div className="macro-val" style={{color:m.c}}>{m.v}{m.u}</div>
            <div className="macro-lbl">{m.l}</div>
            <div className="macro-bar"><div className="macro-fill" style={{width:`${Math.min((m.v/m.m)*100,100)}%`,background:m.c}}/></div>
          </div>
        ))}
      </div>
      <div className="log-input-area">
        {imgPreview && <img src={imgPreview} className="img-preview" alt="food"/>}
        <textarea className="log-textarea" rows={3} value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleLog();}}}
          placeholder={imgData?"Add note (optional)...":"e.g. 200g chicken + 150g rice + 2 roti"}/>
        <div className="log-input-footer">
          <div style={{display:"flex",gap:"0.5rem",alignItems:"center"}}>
            <input type="file" accept="image/*" ref={fileRef} style={{display:"none"}} onChange={handleImg}/>
            <button className="photo-btn" onClick={()=>fileRef.current.click()}>▣ Photo</button>
            {imgData && <button className="photo-btn" onClick={()=>{setImgData(null);setImgPreview(null);}}>✕</button>}
          </div>
          <button className="btn-primary btn-sm" onClick={handleLog} disabled={logLoading||(!input.trim()&&!imgData)}>
            {logLoading?"Analyzing...":"Log ⚡"}
          </button>
        </div>
        {logLoading&&<div style={{marginTop:"0.5rem"}}><LoadingDots/></div>}
      </div>
      <div className="meals-list">
        {meals.length===0&&<p style={{color:"#222",fontSize:"0.8rem",textAlign:"center",padding:"1rem 0",textTransform:"uppercase",letterSpacing:"0.08em"}}>No meals logged yet</p>}
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
              <span className="macro-tag">{meal.total.calories} kcal</span>
              <span className="macro-tag">{meal.total.protein}g pro</span>
              <span className="macro-tag">{meal.total.carbs}g carbs</span>
            </div>
            {meal.tip&&<p style={{fontSize:"0.72rem",color:"#2d2d2d",marginTop:"0.5rem"}}>— {meal.tip}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

// CHAT PAGE
const ChatPage=({chatMsgs,chatLoading,onSend,onBack})=>{
  const [input,setInput]=useState("");
  const endRef=useRef();
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[chatMsgs,chatLoading]);
  const handleSend=()=>{if(!input.trim()||chatLoading)return;onSend(input);setInput("");};
  return (
    <div className="chat-outer">
      <div className="chat-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <div className="chat-avatar">◈</div>
        <div className="chat-header-text"><h3>AI Coach</h3><p>Fitness & nutrition coach</p></div>
        <div className="online-dot"/>
      </div>
      <div className="messages-wrap">
        {chatMsgs.map((m,i)=>(
          <div key={i} className={`bubble-wrap ${m.role}`}>
            <div className={`bubble ${m.role}`}>{m.text}</div>
            <span className="bubble-time">{m.time}</span>
          </div>
        ))}
        {chatLoading&&<div className="bubble-wrap ai"><div className="bubble ai"><LoadingDots/></div></div>}
        <div ref={endRef}/>
      </div>
      <div className="chat-input-bar">
        <div className="chat-input-wrap">
          <textarea className="chat-textarea" rows={1} value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}}
            placeholder="Ask about nutrition, workouts..."/>
        </div>
        <button className="send-btn" onClick={handleSend} disabled={chatLoading||!input.trim()}>➤</button>
      </div>
    </div>
  );
};

export default function App() {
  const [tab,setTab]=useState("home");
  const [prevTab,setPrevTab]=useState("home");
  const [goal,setGoal]=useState("bulk");
  const [dietFilter,setDietFilter]=useState("all");
  const [profile,setProfile]=useState({age:22,weight:70,height:175,activity:"Moderate",goal:"Lean Bulk",calories:2400,protein:130,carbs:280,fat:65});
  const [logLoading,setLogLoading]=useState(false);
  const [meals,setMeals]=useState([]);
  const [daily,setDaily]=useState({calories:0,protein:0,carbs:0,fat:0});
  const [chatMsgs,setChatMsgs]=useState([{role:"ai",time:nowStr(),text:"Hey! I'm your FitTrack AI coach. Ask me anything about nutrition, workouts, or your diet goals!"}]);
  const [chatLoading,setChatLoading]=useState(false);
  const [saved,setSaved]=useState(false);
  const [streak]=useState(()=>{ const s=getStreak(); saveStreak(s); return s; });

  const targets=GOAL_TARGETS[goal];

  const navigate=(page)=>{ setPrevTab(tab); setTab(page); };
  const goBack=()=>setTab(prevTab==="home"?"home":prevTab);

  const earnedBadges=BADGES.filter(b=>b.check(meals,daily,profile,streak)).map(b=>b.id);

  const logMeal=useCallback(async(text,imageBase64=null)=>{
    setLogLoading(true);
    const result=await analyzeMeal(text,imageBase64);
    setMeals(prev=>[...prev,{...result,time:nowStr()}]);
    setDaily(d=>({
      calories:d.calories+result.total.calories,
      protein:Math.round((d.protein+result.total.protein)*10)/10,
      carbs:Math.round((d.carbs+result.total.carbs)*10)/10,
      fat:Math.round((d.fat+result.total.fat)*10)/10,
    }));
    setLogLoading(false);
  },[]);

  const sendChat=useCallback(async(text)=>{
    setChatLoading(true);
    setChatMsgs(prev=>[...prev,{role:"user",time:nowStr(),text}]);
    const reply=await askCoach(text,chatMsgs,profile);
    setChatMsgs(prev=>[...prev,{role:"ai",time:nowStr(),text:reply}]);
    setChatLoading(false);
  },[chatMsgs,profile]);

  const filteredDiets=dietFilter==="all"?DIET_PLANS:DIET_PLANS.filter(d=>d.goal===dietFilter);

  const WEEK_DAYS=["M","T","W","T","F","S","S"];
  const todayIdx=new Date().getDay()===0?6:new Date().getDay()-1;
  const doneDays=Array.from({length:7},(_,i)=>i<=todayIdx&&i>=(todayIdx-(streak-1)));

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="page">

          {/* HOME */}
          {tab==="home"&&(
            <div className="home" style={{padding:0}}>

              {/* HERO SECTION — full width cinematic */}
              <div style={{
                position:"relative",
                height:"100vw",
                maxHeight:"480px",
                overflow:"hidden",
                background:"#000",
              }}>
                {/* BG IMAGE */}
                <img
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800"
                  alt="gym"
                  style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center",opacity:0.45,display:"block"}}
                />
                {/* DARK OVERLAY */}
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 60%, #000 100%)"}}/>

                {/* CONTENT OVER IMAGE */}
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"1.5rem 1.2rem 2rem"}}>
                  {/* streak top right */}
                  <div style={{position:"absolute",top:"1.2rem",right:"1.2rem",textAlign:"center",background:"rgba(0,0,0,0.6)",border:"1px solid rgba(255,255,255,0.15)",padding:"0.5rem 0.8rem",backdropFilter:"blur(8px)"}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.6rem",lineHeight:1,color:"#fff"}}>{streak}</div>
                    <div style={{fontSize:"0.5rem",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Streak</div>
                    <div style={{display:"flex",gap:"2px",marginTop:"0.3rem"}}>
                      {WEEK_DAYS.map((d,i)=>(
                        <div key={i} style={{width:"13px",height:"13px",background:doneDays[i]?"#fff":"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.38rem",color:doneDays[i]?"#000":"rgba(255,255,255,0.3)",fontWeight:700}}>{d}</div>
                      ))}
                    </div>
                  </div>

                  {/* GREETING */}
                  <p style={{fontSize:"0.62rem",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:700,marginBottom:"0.4rem"}}>
                    {new Date().getHours()<12?"Good Morning":new Date().getHours()<17?"Good Afternoon":"Good Evening"}
                  </p>

                  {/* BOLD QUOTE */}
                  <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"3.2rem",lineHeight:0.92,letterSpacing:"0.02em",marginBottom:"0.8rem",color:"#fff"}}>
                    FUEL<br/>YOUR<br/><span style={{WebkitTextFillColor:"transparent",WebkitTextStroke:"1.5px #fff"}}>GRIND.</span>
                  </h1>
                  <p style={{fontSize:"0.68rem",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:600,marginBottom:"1.2rem"}}>
                    Track every rep. Eat every gram.
                  </p>
                </div>
              </div>

              {/* BUTTONS SECTION */}
              <div style={{padding:"1.2rem",display:"flex",flexDirection:"column",gap:"0.5rem",background:"#000"}}>

                {/* LOG MEAL — primary */}
                <button className="hero-cta" style={{width:"100%",justifyContent:"center",fontSize:"0.82rem"}} onClick={()=>navigate("tracker")}>
                  LOG MEAL →
                </button>

                {/* 2 GRID BUTTONS */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
                  <button style={{background:"transparent",border:"1px solid #222",color:"#fff",padding:"0.8rem",fontFamily:"'Inter',sans-serif",fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",cursor:"pointer",transition:"all 0.2s"}}
                    onClick={()=>navigate("diet")} onMouseOver={e=>e.target.style.borderColor="#fff"} onMouseOut={e=>e.target.style.borderColor="#222"}>
                    ▤ Diet Plans
                  </button>
                  <button style={{background:"transparent",border:"1px solid #222",color:"#fff",padding:"0.8rem",fontFamily:"'Inter',sans-serif",fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",cursor:"pointer",transition:"all 0.2s"}}
                    onClick={()=>navigate("chat")} onMouseOver={e=>e.target.style.borderColor="#fff"} onMouseOut={e=>e.target.style.borderColor="#222"}>
                    ◈ AI Coach
                  </button>
                </div>

                <button style={{background:"transparent",border:"1px solid #222",color:"#fff",padding:"0.8rem",fontFamily:"'Inter',sans-serif",fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",cursor:"pointer",transition:"all 0.2s",width:"100%"}}
                  onClick={()=>navigate("profile")} onMouseOver={e=>e.target.style.borderColor="#fff"} onMouseOut={e=>e.target.style.borderColor="#222"}>
                  ◉ My Profile
                </button>
              </div>

              {/* TODAY'S PROGRESS */}
              <div style={{padding:"0 1.2rem"}}>
                <p className="section-title">Today's Progress</p>
                <div style={{background:"#0a0a0a",border:"1px solid #111",padding:"1rem",marginBottom:"0.5rem"}}>
                  {/* Calorie ring small */}
                  <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"0.8rem"}}>
                    <div style={{position:"relative",width:"60px",height:"60px",flexShrink:0}}>
                      <svg style={{transform:"rotate(-90deg)"}} width="60" height="60" viewBox="0 0 60 60">
                        <circle cx="30" cy="30" r="22" fill="none" stroke="#111" strokeWidth="5"/>
                        <circle cx="30" cy="30" r="22" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="square"
                          strokeDasharray={2*Math.PI*22}
                          strokeDashoffset={2*Math.PI*22-(Math.min(daily.calories/targets.calories,1))*(2*Math.PI*22)}
                          style={{transition:"stroke-dashoffset 0.8s ease"}}/>
                      </svg>
                      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:"0.55rem",fontWeight:800,color:"#fff"}}>{Math.round((daily.calories/targets.calories)*100)}%</span>
                      </div>
                    </div>
                    <div>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.8rem",lineHeight:1,letterSpacing:"0.05em"}}>{daily.calories}<span style={{fontSize:"0.7rem",color:"#333",fontWeight:400,letterSpacing:"0.08em"}}> kcal</span></div>
                      <div style={{fontSize:"0.62rem",color:"#333",textTransform:"uppercase",letterSpacing:"0.08em"}}>{targets.calories-daily.calories>0?`${targets.calories-daily.calories} remaining`:"Goal reached!"}</div>
                    </div>
                  </div>
                  {/* macros */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.5rem"}}>
                    {[{l:"Protein",v:daily.protein,m:targets.protein,u:"g",c:"#fff"},
                      {l:"Carbs",v:daily.carbs,m:targets.carbs,u:"g",c:"#888"},
                      {l:"Fat",v:daily.fat,m:targets.fat,u:"g",c:"#555"}].map(m=>(
                      <div key={m.l}>
                        <div style={{fontSize:"0.9rem",fontWeight:800,color:m.c}}>{m.v}{m.u}</div>
                        <div style={{fontSize:"0.55rem",color:"#333",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:"0.1rem"}}>{m.l}</div>
                        <div style={{height:"2px",background:"#111",marginTop:"0.4rem"}}>
                          <div style={{height:"100%",background:m.c,width:`${Math.min((m.v/m.m)*100,100)}%`,transition:"width 0.5s ease"}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* BADGES */}
              <div style={{padding:"1rem 1.2rem 0.5rem"}}>
                <p className="section-title">Badges</p>
              </div>
              <div className="badges-row" style={{paddingBottom:"2rem"}}>
                {BADGES.map(b=>(
                  <div key={b.id} className="badge-item">
                    <div className={`badge-icon ${earnedBadges.includes(b.id)?"earned":"locked"}`}>{b.icon}</div>
                    <span className={`badge-label ${earnedBadges.includes(b.id)?"earned":""}`}>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRACKER */}
          {tab==="tracker"&&<TrackerPage daily={daily} targets={targets} meals={meals} logLoading={logLoading} onLog={logMeal} onBack={goBack}/>}

          {/* DIET */}
          {tab==="diet"&&(
            <div className="diet">
              <div className="page-header">
                <button className="back-btn" onClick={goBack}>←</button>
                <div className="page-header-text"><h2>Diet Ideas</h2><p>Plans for your goal</p></div>
              </div>
              <div className="filter-row">
                {[{id:"all",label:"All"},{id:"cut",label:"Fat Loss"},{id:"bulk",label:"Lean Bulk"},{id:"maintain",label:"Maintain"},{id:"recomp",label:"Recomp"}].map(f=>(
                  <button key={f.id} className={`filter-chip ${dietFilter===f.id?"active":""}`} onClick={()=>setDietFilter(f.id)}>{f.label}</button>
                ))}
              </div>
              <div className="diet-cards">
                {filteredDiets.map((plan,i)=>(
                  <div key={i} className="diet-card">
                    <div className="diet-card-header">
                      <div><div className="diet-card-title">{plan.title}</div><div className="diet-card-subtitle">{plan.subtitle}</div></div>
                      <span className="goal-badge" style={{borderColor:plan.color,color:plan.color}}>{plan.goalLabel}</span>
                    </div>
                    <div className="diet-meals">
                      {plan.meals.map((m,j)=>(
                        <div key={j} className="diet-meal-row">
                          <span className="diet-meal-name">— {m.name}: {m.food}</span>
                          <span className="diet-meal-cal">{m.cal}</span>
                        </div>
                      ))}
                    </div>
                    <div className="diet-footer">
                      {[{l:"Cal",v:plan.macros.cal},{l:"Pro",v:`${plan.macros.pro}g`},{l:"Carbs",v:`${plan.macros.carbs}g`},{l:"Fat",v:`${plan.macros.fat}g`}].map(m=>(
                        <div key={m.l}><div className="diet-macro-val">{m.v}</div><div className="diet-macro-lbl">{m.l}</div></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHAT */}
          {tab==="chat"&&<ChatPage chatMsgs={chatMsgs} chatLoading={chatLoading} onSend={sendChat} onBack={goBack}/>}

          {/* PROFILE */}
          {tab==="profile"&&(
            <div className="profile-page">
              <div className="page-header">
                <button className="back-btn" onClick={goBack}>←</button>
                <div className="page-header-text"><h2>Profile</h2><p>Set your targets</p></div>
              </div>
              <div className="profile-section" style={{marginTop:"1rem"}}>
                <p className="section-title" style={{marginBottom:"0.75rem"}}>Body Stats</p>
                <div className="profile-row">
                  {[{label:"Age (years)",key:"age"},{label:"Weight (kg)",key:"weight"}].map(f=>(
                    <div key={f.key} className="profile-input-wrap">
                      <label className="profile-input-label">{f.label}</label>
                      <input className="profile-input" type="number" value={profile[f.key]} onChange={e=>setProfile(p=>({...p,[f.key]:+e.target.value}))}/>
                    </div>
                  ))}
                </div>
                <div className="profile-input-wrap" style={{marginBottom:"0.5rem"}}>
                  <label className="profile-input-label">Height (cm)</label>
                  <input className="profile-input" type="number" value={profile.height} onChange={e=>setProfile(p=>({...p,height:+e.target.value}))}/>
                </div>
                <div className="profile-input-wrap" style={{marginBottom:"0.5rem"}}>
                  <label className="profile-input-label">Activity Level</label>
                  <select className="profile-input" value={profile.activity} onChange={e=>setProfile(p=>({...p,activity:e.target.value}))}
                    style={{background:"transparent",border:"none",color:"#fff",fontFamily:"Inter",fontSize:"0.95rem",fontWeight:700,cursor:"pointer",width:"100%"}}>
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
                <button className="save-btn" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);}}>
                  {saved?"✓ Saved!":"Save Profile"}
                </button>
              </div>
            </div>
          )}
        </div>

        <nav className="nav">
          {[{id:"home",icon:"⌂",label:"Home"},{id:"tracker",icon:"◎",label:"Tracker"},{id:"diet",icon:"▤",label:"Diet"},{id:"chat",icon:"◈",label:"AI"},{id:"profile",icon:"◉",label:"Profile"}].map(t=>(
            <button key={t.id} className={`nav-btn ${tab===t.id?"active":""}`} onClick={()=>navigate(t.id)}>
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
