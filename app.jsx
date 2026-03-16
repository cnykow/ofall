import { useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  OFALL — Orchestrated Free AI Layer
//  All API calls go through your Cloudflare Worker proxy.
//  Set PROXY_URL below to your deployed worker URL after setup.
// ─────────────────────────────────────────────────────────────────────────────

const PROXY_URL = "https://ofall-proxy.cnykow.workers.dev";
// ↑ Replace this with your actual Cloudflare Worker URL after deploying

// ─── OpenRouter model slugs ───────────────────────────────────────────────────
const OR_SLUGS = {
  "gemini-flash":     "google/gemini-2.0-flash-001",
  "gpt-4o-free":      "openai/gpt-4o",
  "claude-haiku":     "anthropic/claude-haiku-4-5",
  "groq-llama":       "meta-llama/llama-3.3-70b-instruct",
  "deepseek-free":    "deepseek/deepseek-chat-v3-0324",
  "mistral-free":     "mistralai/mistral-large-2411",
  "together-ai":      "meta-llama/llama-3.3-70b-instruct-turbo",
  "perplexity-free":  "perplexity/llama-3.1-sonar-large-128k-online",
  "openrouter":       "openai/gpt-4o",
  "huggingface-free": "mistralai/mistral-7b-instruct",
};

// ─── FREE MODELS ──────────────────────────────────────────────────────────────
const FREE_MODELS = {
  "gemini-flash":     { name:"Gemini 2.0 Flash",   provider:"Google",      color:"#FBBF24", proxyProvider:"gemini",     best_for:"Fast multimodal responses, long context, real-time tasks" },
  "gpt-4o-free":      { name:"GPT-4o",             provider:"OpenAI",      color:"#10B981", proxyProvider:"openrouter", best_for:"General tasks, broad knowledge, vision, code" },
  "claude-haiku":     { name:"Claude Haiku",        provider:"Anthropic",   color:"#A855F7", proxyProvider:"anthropic",  best_for:"Fast precise responses, coding, summarization, Q&A" },
  "groq-llama":       { name:"Llama 3.3 (Groq)",   provider:"Groq",        color:"#6366F1", proxyProvider:"groq",       best_for:"Ultra-fast inference, open-source tasks" },
  "deepseek-free":    { name:"DeepSeek V3",         provider:"DeepSeek",    color:"#0EA5E9", proxyProvider:"openrouter", best_for:"Math, STEM, code generation" },
  "mistral-free":     { name:"Mistral Large 2",     provider:"Mistral",     color:"#F97316", proxyProvider:"openrouter", best_for:"Multilingual tasks, EU compliance" },
  "openrouter":       { name:"OpenRouter",          provider:"OpenRouter",  color:"#8B5CF6", proxyProvider:"openrouter", best_for:"Unified access to many models, flexible routing" },
  "together-ai":      { name:"Together AI",         provider:"Together",    color:"#EC4899", proxyProvider:"openrouter", best_for:"Open-source models, fine-tuned inference" },
  "perplexity-free":  { name:"Perplexity",          provider:"Perplexity",  color:"#34D399", proxyProvider:"openrouter", best_for:"Real-time web search with citations" },
  "huggingface-free": { name:"Hugging Face",        provider:"HuggingFace", color:"#FACC15", proxyProvider:"openrouter", best_for:"Open model inference, NLP tasks" },
  "stability-free":   { name:"Stable Diffusion 3",  provider:"Stability AI",color:"#BE185D", proxyProvider:"stability",  best_for:"Image generation, artistic styles" },
  "elevenlabs-free":  { name:"ElevenLabs",          provider:"ElevenLabs",  color:"#FB923C", proxyProvider:"elevenlabs", best_for:"Text-to-speech, voice cloning, audio" },
  "wolfram-free":     { name:"Wolfram Alpha",        provider:"Wolfram",     color:"#DD6B20", proxyProvider:"wolfram",    best_for:"Precise math computation, scientific queries" },
};

// ─── PREMIUM MODELS ───────────────────────────────────────────────────────────
const PREMIUM_MODELS = {
  "claude-opus-4":    { name:"Claude Opus 4",      provider:"Anthropic",  color:"#7C3AED", best_for:"Multi-step reasoning, philosophical depth, complex long-form" },
  "claude-sonnet-4":  { name:"Claude Sonnet 4",    provider:"Anthropic",  color:"#A855F7", best_for:"Coding, professional writing, balanced everyday intelligence" },
  "gpt-4o":           { name:"GPT-4o",             provider:"OpenAI",     color:"#10B981", best_for:"Multimodal tasks, image understanding, tool use, broad knowledge" },
  "o3":               { name:"o3",                 provider:"OpenAI",     color:"#06B6D4", best_for:"Hardest math, formal logic, competitive programming" },
  "gemini-2-pro":     { name:"Gemini 2.0 Pro",     provider:"Google",     color:"#F59E0B", best_for:"Very long documents, real-time search, large context" },
  "gemini-2-flash":   { name:"Gemini 2.0 Flash",   provider:"Google",     color:"#FBBF24", best_for:"Fast turnaround, real-time, high-volume tasks" },
  "grok-3":           { name:"Grok 3",             provider:"xAI",        color:"#EF4444", best_for:"Current events, live information, social media" },
  "midjourney-v7":    { name:"Midjourney v7",      provider:"Midjourney", color:"#EC4899", best_for:"High-quality image generation, artistic scenes" },
  "dalle-3":          { name:"DALL-E 3",           provider:"OpenAI",     color:"#F472B6", best_for:"Image generation with precise prompt adherence" },
  "stable-diffusion": { name:"Stable Diffusion 3", provider:"Stability",  color:"#BE185D", best_for:"Open-source image generation, fine-tuned styles" },
  "sora":             { name:"Sora",               provider:"OpenAI",     color:"#8B5CF6", best_for:"AI video generation, motion sequences" },
  "deepseek-r2":      { name:"DeepSeek R2",        provider:"DeepSeek",   color:"#0EA5E9", best_for:"STEM research, mathematical derivations" },
  "perplexity-pro":   { name:"Perplexity Pro",     provider:"Perplexity", color:"#34D399", best_for:"Research with citations, real-time sourced answers" },
  "llama-3.3":        { name:"Llama 3.3 70B",      provider:"Meta",       color:"#6366F1", best_for:"On-premise, privacy-sensitive, fine-tuned workflows" },
  "mistral-large":    { name:"Mistral Large 2",    provider:"Mistral",    color:"#F97316", best_for:"EU regulatory compliance, multilingual tasks" },
  "elevenlabs":       { name:"ElevenLabs",         provider:"ElevenLabs", color:"#FB923C", best_for:"Text-to-speech, voice cloning, audio" },
  "runway-gen3":      { name:"Runway Gen-3",       provider:"Runway",     color:"#C084FC", best_for:"Short video generation, VFX, motion graphics" },
  "wolfram-alpha":    { name:"Wolfram Alpha",      provider:"Wolfram",    color:"#DD6B20", best_for:"Precise mathematical computation, scientific data" }
};

// ─── PROXY CALL — all traffic goes through your worker ───────────────────────
async function proxyCall(provider, payload) {
  const url = PROXY_URL.replace(/\/$/, "");
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, payload }),
  });
  const d = await r.json();
  if (!r.ok || d.error) throw new Error(d.error || `Proxy returned ${r.status}`);
  return d;
}

// ─── ORCHESTRATION (Claude via proxy) ────────────────────────────────────────
async function callOrchestrator(msg, system, maxTokens = 2500) {
  const d = await proxyCall("anthropic", {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: msg }],
  });
  if (d.error) throw new Error(d.error);
  return d.content?.map(b => b.text || "").join("") || "";
}

// ─── EXECUTE ONE COMPONENT via proxy ─────────────────────────────────────────
async function executeOne(modelId, prompt) {
  const m = FREE_MODELS[modelId];
  if (!m) throw new Error(`Unknown model: "${modelId}"`);
  const provider = m.proxyProvider;

  if (provider === "gemini") {
    const d = await proxyCall("gemini", {
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return d.candidates?.[0]?.content?.parts?.[0]?.text || "(empty response)";
  }

  if (provider === "anthropic") {
    const d = await proxyCall("anthropic", {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    return d.content?.map(b => b.text || "").join("") || "(empty response)";
  }

  if (provider === "groq") {
    const d = await proxyCall("groq", {
      model: "llama-3.3-70b-versatile",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    return d.choices?.[0]?.message?.content || "(empty response)";
  }

  if (provider === "openrouter") {
    const slug = OR_SLUGS[modelId] || "openai/gpt-4o";
    const d = await proxyCall("openrouter", {
      model: slug,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    return d.choices?.[0]?.message?.content || "(empty response)";
  }

  if (provider === "stability") {
    const d = await proxyCall("stability", { prompt: prompt.slice(0, 500) });
    if (!d.image) throw new Error("No image returned from Stability AI");
    return { type: "image", data: `data:image/jpeg;base64,${d.image}` };
  }

  if (provider === "elevenlabs") {
    const d = await proxyCall("elevenlabs", { text: prompt.slice(0, 400) });
    if (!d.audio_base64) throw new Error("No audio returned from ElevenLabs");
    const binary = atob(d.audio_base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: d.content_type || "audio/mpeg" });
    return { type: "audio", url: URL.createObjectURL(blob) };
  }

  if (provider === "wolfram") {
    const d = await proxyCall("wolfram", { query: prompt.slice(0, 200) });
    return `Result: ${d.result}`;
  }

  throw new Error(`No proxy handler for provider: ${provider}`);
}

// ─── ANALYSIS FUNCTIONS ───────────────────────────────────────────────────────
function xJSON(text) {
  const c = text.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
  try { return JSON.parse(c); } catch (_) {}
  const s = c.indexOf("{"), e = c.lastIndexOf("}");
  if (s !== -1 && e > s) { try { return JSON.parse(c.slice(s, e + 1)); } catch (_) {} }
  throw new Error("Could not parse JSON from AI response");
}

async function analyzePremium(q) {
  const ml = Object.entries(PREMIUM_MODELS)
    .map(([id, m]) => `"${id}": ${m.name} (${m.provider}) — ${m.best_for}`)
    .join("\n");
  return xJSON(await callOrchestrator(q,
    `You are OFALL. Decompose into components, assign best premium model, write expert prompts.
MODELS:\n${ml}
OUTPUT ONLY RAW JSON: {"overview":"strategy","components":[{"label":"Title","description":"need","type":"intent","assigned_model":"exact-id","model_reason":"why","ideal_prompt":"complete expert prompt"}]}
TYPE: intent|domain|constraint|output_format|context|creative|technical|research. 3-7 components.`
  ));
}

async function analyzeFree(q, ids) {
  const avail = ids.filter(id => FREE_MODELS[id]);
  if (!avail.length) throw new Error("No free models selected");
  const ml = avail.map(id => `"${id}": ${FREE_MODELS[id].name} — ${FREE_MODELS[id].best_for}`).join("\n");
  return xJSON(await callOrchestrator(q,
    `You are OFALL. Decompose into components, assign best available model, write expert prompts.
AVAILABLE IDs (ONLY these):\n${ml}
OUTPUT ONLY RAW JSON: {"overview":"strategy","components":[{"label":"Title","description":"need","type":"intent","assigned_model":"exact-id","model_reason":"why","ideal_prompt":"complete expert prompt"}]}
TYPE: intent|domain|constraint|output_format|context|creative|technical|research. 3-6 components.`
  ));
}

async function synthesize(origQ, comps, resps) {
  const parts = comps.map((c, i) => {
    const r = resps[i]; if (!r) return null;
    const n = FREE_MODELS[c.assigned_model]?.name || c.assigned_model;
    if (r?.type === "image") return `[${n} — ${c.label}]: Generated image successfully.`;
    if (r?.type === "audio") return `[${n} — ${c.label}]: Generated audio narration.`;
    if (typeof r === "string" && (r.startsWith("SKIP") || r.startsWith("Error:"))) return null;
    return `[${n} — ${c.label}]:\n${r}`;
  }).filter(Boolean).join("\n\n---\n\n");
  if (!parts) return "";
  return callOrchestrator(
    `Original Request: ${origQ}\n\nSpecialist AI Responses:\n\n${parts}`,
    `You are OFALL Synthesizer. Combine these specialist responses into one comprehensive, well-structured answer. Be thorough. Do not mention internal models or routing.`,
    2500
  );
}

const getM = (id, mode) =>
  (mode === "free" ? FREE_MODELS : PREMIUM_MODELS)[id] || { name: id, provider: "", color: "#8B5CF6" };

const T_CLS = { intent:"ti", domain:"td", constraint:"tc", output_format:"to", context:"tx2", creative:"tr", technical:"tt2", research:"ts" };

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#050508;--sf:#0D0D16;--sf2:#13131F;--sf3:#1A1A28;--br:rgba(255,255,255,0.07);--brh:rgba(255,255,255,0.13);--tx:#EEEAF8;--mt:#5C5875;--ac:#8B5CF6;--ac2:#EC4899;--gw:rgba(139,92,246,0.28);--fr:#10B981;--fr2:#059669}
html,body,#root{height:100%;background:var(--bg)}
.app{font-family:'Syne',sans-serif;color:var(--tx);min-height:100vh;display:flex;flex-direction:column;position:relative;overflow-x:hidden}
.app::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(139,92,246,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.02) 1px,transparent 1px);background-size:44px 44px;pointer-events:none;z-index:0}
.app::after{content:'';position:fixed;top:-15%;left:50%;transform:translateX(-50%);width:900px;height:500px;background:radial-gradient(ellipse,rgba(139,92,246,0.055) 0%,transparent 70%);pointer-events:none;z-index:0}
.wrap{position:relative;z-index:1;display:flex;flex-direction:column;min-height:100vh;max-width:960px;margin:0 auto;width:100%;padding:0 20px}
.hdr{padding:36px 0 18px;text-align:center}
.logo{display:inline-flex;align-items:center;gap:14px;margin-bottom:8px}
.lm{width:48px;height:48px;border:1.5px solid var(--ac);border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:800;color:var(--ac);box-shadow:0 0 22px var(--gw),inset 0 0 14px rgba(139,92,246,0.07);letter-spacing:-1px}
.wm{font-size:32px;font-weight:800;letter-spacing:8px;background:linear-gradient(135deg,var(--ac),var(--ac2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tg{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:3.5px;color:var(--mt);text-transform:uppercase}
.proxy-badge{display:inline-flex;align-items:center;gap:6px;margin-top:6px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:100px;padding:3px 12px;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--fr)}
.proxy-badge-dot{width:5px;height:5px;border-radius:50%;background:var(--fr);box-shadow:0 0 5px var(--fr)}
.proxy-warn{background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:10px;padding:11px 16px;margin-bottom:14px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#FCD34D;line-height:1.7;display:flex;gap:10px;align-items:flex-start}
.mrow{display:flex;align-items:center;justify-content:center;gap:10px;margin:13px 0 15px}
.mlbl{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--mt)}
.ttrack{display:flex;gap:2px;background:var(--sf2);border:1px solid var(--br);border-radius:100px;padding:3px}
.topt{padding:6px 20px;border-radius:100px;border:none;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .25s;color:var(--mt);background:transparent}
.topt.af{background:var(--fr);color:#000;box-shadow:0 0 14px rgba(16,185,129,0.4)}
.topt.ap{background:var(--ac);color:#fff;box-shadow:0 0 14px rgba(139,92,246,0.45)}
.mswrap{margin-bottom:14px}
.mshd{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:var(--mt);margin-bottom:8px;display:flex;align-items:center;gap:8px}
.mshd::after{content:'';flex:1;height:1px;background:var(--br)}
.chips{display:flex;flex-wrap:wrap;gap:5px}
.chip{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:100px;border:1px solid;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;letter-spacing:.7px;text-transform:uppercase;cursor:pointer;transition:all .2s;background:var(--sf);opacity:.45}
.chip.on{opacity:1}
.cdot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.plbl{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--mt);text-align:center;margin-bottom:10px}
.plbl em{color:var(--ac);font-style:normal}
.pwrap{position:relative;margin-bottom:18px}
.pbox{width:100%;background:var(--sf);border:1.5px solid var(--brh);border-radius:13px;padding:17px 145px 17px 19px;font-family:'JetBrains Mono',monospace;font-size:13.5px;color:var(--tx);resize:none;outline:none;min-height:100px;line-height:1.75;transition:border-color .25s,box-shadow .25s}
.pbox::placeholder{color:var(--mt);font-style:italic}
.pbox:focus{border-color:var(--ac);box-shadow:0 0 0 3px rgba(139,92,246,0.09)}
.pbox:disabled{opacity:.5}
.gobtn{position:absolute;right:12px;bottom:12px;border:none;border-radius:9px;padding:9px 19px;color:white;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:opacity .2s,transform .2s}
.gobtn.gf{background:linear-gradient(135deg,var(--fr),var(--fr2));box-shadow:0 4px 16px rgba(16,185,129,0.38)}
.gobtn.gp{background:linear-gradient(135deg,var(--ac),var(--ac2));box-shadow:0 4px 16px rgba(139,92,246,0.38)}
.gobtn:hover:not(:disabled){opacity:.86;transform:translateY(-1px)}
.gobtn:disabled{opacity:.35;cursor:not-allowed}
.lbar{height:2px;width:100%;background:var(--sf2);border-radius:2px;overflow:hidden;margin-bottom:18px}
.lfill{height:100%;animation:loadBar 1.8s ease-in-out infinite}
.lf{background:linear-gradient(90deg,var(--fr),var(--fr2))}
.lp{background:linear-gradient(90deg,var(--ac),var(--ac2))}
@keyframes loadBar{0%{width:0%;margin-left:0}50%{width:60%;margin-left:20%}100%{width:0%;margin-left:100%}}
.lmsg{text-align:center;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:2.5px;color:var(--mt);text-transform:uppercase;margin-bottom:20px;animation:blk 1.4s ease-in-out infinite}
@keyframes blk{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes fup{to{opacity:1;transform:translateY(0)}}
.ovw{background:rgba(139,92,246,0.07);border:1px solid rgba(139,92,246,0.18);border-radius:10px;padding:11px 15px;margin-bottom:14px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.75;color:rgba(200,190,240,0.9);animation:fup .4s ease forwards;opacity:0;display:flex;gap:10px;align-items:flex-start}
.ovw-i{color:var(--ac);flex-shrink:0}
.sect{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--mt);margin-bottom:9px;display:flex;align-items:center;gap:8px}
.sect::after{content:'';flex:1;height:1px;background:var(--br)}
.mr{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:11px}
.mrl{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--mt)}
.mpill{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;letter-spacing:.6px;padding:2px 9px;border-radius:100px;border:1px solid;text-transform:uppercase}
.clist{display:flex;flex-direction:column;gap:11px;margin-bottom:6px}
.ccard{background:var(--sf);border:1.5px solid var(--br);border-radius:13px;overflow:hidden;animation:fup .4s ease forwards;opacity:0;transform:translateY(10px)}
.ccard:hover{border-color:var(--brh)}
.chd{display:flex;align-items:center;gap:8px;padding:10px 15px;background:var(--sf2);flex-wrap:wrap}
.cnum{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;color:var(--mt);min-width:20px}
.cttl{font-size:14px;font-weight:700;flex:1;min-width:80px}
.tbadge{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:2px 8px;border-radius:100px}
.rstatus{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;padding:3px 9px;border-radius:100px;margin-left:auto}
.rsp{background:rgba(92,88,117,0.2);color:var(--mt)}
.rsr{background:rgba(245,158,11,0.15);color:#FCD34D;animation:blk 1s infinite}
.rsd{background:rgba(16,185,129,0.15);color:#34D399}
.rse{background:rgba(239,68,68,0.15);color:#FCA5A5}
.ti{background:rgba(139,92,246,0.13);color:#A78BFA}.td{background:rgba(16,185,129,0.13);color:#34D399}
.tc{background:rgba(239,68,68,0.13);color:#FCA5A5}.to{background:rgba(245,158,11,0.13);color:#FCD34D}
.tx2{background:rgba(14,165,233,0.13);color:#7DD3FC}.tr{background:rgba(236,72,153,0.13);color:#F9A8D4}
.tt2{background:rgba(6,182,212,0.13);color:#67E8F9}.ts{background:rgba(52,211,153,0.13);color:#6EE7B7}
.cbody{display:grid;grid-template-columns:1fr 1fr}
@media(max-width:620px){.cbody{grid-template-columns:1fr}}
.cleft{padding:13px 14px;border-right:1px solid var(--br)}
.cright{padding:13px 14px}
@media(max-width:620px){.cleft{border-right:none;border-bottom:1px solid var(--br)}}
.sublbl{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:var(--mt);margin-bottom:5px}
.mchip{display:inline-flex;align-items:center;gap:7px;padding:5px 10px;border-radius:8px;border:1.5px solid;background:rgba(0,0,0,0.3);margin-bottom:5px}
.mdot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.mname{font-size:12px;font-weight:700}
.mprov{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;opacity:.6}
.dtxt{font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.7;color:#9B94B8;margin-bottom:7px}
.rtxt{font-family:'JetBrains Mono',monospace;font-size:10.5px;line-height:1.7;color:#7A7295;font-style:italic}
.pout{background:var(--sf3);border:1px solid var(--br);border-radius:8px;overflow:hidden;margin-top:3px}
.pout-t{display:flex;align-items:center;justify-content:space-between;padding:5px 10px;border-bottom:1px solid var(--br);background:rgba(0,0,0,0.2)}
.pout-l{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--mt)}
.cpbtn{background:rgba(255,255,255,0.05);border:1px solid var(--br);border-radius:5px;padding:3px 9px;color:var(--mt);font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;transition:all .2s}
.cpbtn:hover{border-color:var(--brh);color:var(--tx)}
.cpbtn.cpd{color:#10B981;border-color:rgba(16,185,129,.35);background:rgba(16,185,129,.08)}
.pout-tx{padding:11px;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.8;color:#C8C0E0;white-space:pre-wrap;word-break:break-word;max-height:200px;overflow-y:auto}
.respwrap{margin-top:10px;border-radius:9px;overflow:hidden;border:1.5px solid rgba(16,185,129,0.35);animation:fup .35s ease forwards;opacity:0}
.resphd{display:flex;align-items:center;justify-content:space-between;padding:7px 11px;background:rgba(16,185,129,0.09);border-bottom:1px solid rgba(16,185,129,0.18)}
.resplbl{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--fr)}
.resplbl-e{color:#FCA5A5!important}
.resptx{padding:12px;font-family:'Syne',sans-serif;font-size:13px;line-height:1.8;color:var(--tx);white-space:pre-wrap;word-break:break-word;max-height:340px;overflow-y:auto}
.respimg{display:block;max-width:100%;border-radius:5px;margin:10px}
.respaud{width:calc(100% - 20px);margin:10px;border-radius:6px}
.resperr{padding:10px 12px;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.6;color:#FCA5A5;word-break:break-word}
.synwrap{margin-top:10px;animation:fup .5s ease forwards;opacity:0}
.syncard{background:var(--sf);border:2px solid var(--fr);border-radius:13px;overflow:hidden;box-shadow:0 0 0 1px rgba(16,185,129,0.09),0 8px 30px rgba(16,185,129,0.06)}
.synhd{display:flex;align-items:center;justify-content:space-between;padding:11px 15px;border-bottom:1px solid rgba(16,185,129,0.2);background:rgba(16,185,129,0.055)}
.synlbl{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:var(--fr);display:flex;align-items:center;gap:8px}
.synlbl::before{content:'⊗';font-size:12px}
.synbody{padding:20px;font-family:'Syne',sans-serif;font-size:14px;line-height:1.85;color:var(--tx);white-space:pre-wrap;word-break:break-word}
.errbox{background:rgba(239,68,68,0.07);border:1.5px solid rgba(239,68,68,0.2);border-radius:10px;padding:13px 15px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#FCA5A5;line-height:1.65;margin-bottom:13px}
.empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:24px 0 48px}
.eic{font-size:34px;opacity:.1}
.epills{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:660px}
.ep{font-family:'JetBrains Mono',monospace;font-size:8.5px;font-weight:600;letter-spacing:.8px;padding:3px 10px;border-radius:100px;border:1px solid;background:var(--sf);text-transform:uppercase}
.edesc{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--mt);text-align:center;line-height:1.9;max-width:460px}
.clrbtn{background:none;border:1px solid var(--br);border-radius:7px;padding:5px 14px;color:var(--mt);font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;display:block;margin:4px auto 24px}
.clrbtn:hover{border-color:var(--brh);color:var(--tx)}
.ftr{text-align:center;padding:10px 0 20px;font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:2.5px;color:var(--mt);text-transform:uppercase;opacity:.3}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.2);border-radius:2px}
`;

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode]       = useState("free");
  const [prompt, setPrompt]   = useState("");
  const [lastQ, setLastQ]     = useState("");
  const [loading, setLoading] = useState(false);
  const [ldMsg, setLdMsg]     = useState("");
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(null);
  const [enabled, setEnabled] = useState(Object.keys(FREE_MODELS));
  const [synthesis, setSynthesis] = useState("");

  const statusR   = useRef({});
  const responseR = useRef({});
  const [tick, setTick] = useState(0);
  const bump = () => setTick(t => t + 1);
  const resultsRef = useRef(null);

  const proxyConfigured = !PROXY_URL.includes("YOUR-SUBDOMAIN");

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  useEffect(() => {
    if (result && resultsRef.current)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
  }, [result]);

  const cp = (txt, id) => {
    if (typeof txt !== "string") return;
    navigator.clipboard.writeText(txt);
    setCopied(id); setTimeout(() => setCopied(null), 2200);
  };

  const runExec = async (comps, origQ) => {
    statusR.current = {}; responseR.current = {}; bump();
    comps.forEach((_, i) => { statusR.current[i] = "pending"; });
    bump();

    const arr = new Array(comps.length).fill(null);

    await Promise.all(comps.map(async (comp, i) => {
      statusR.current[i] = "running"; bump();
      try {
        const r = await executeOne(comp.assigned_model, comp.ideal_prompt);
        arr[i] = r;
        responseR.current[i] = r;
        statusR.current[i] = "done";
        bump();
      } catch (e) {
        arr[i] = `Error: ${e.message}`;
        responseR.current[i] = `Error: ${e.message}`;
        statusR.current[i] = "error";
        bump();
      }
    }));

    const hasText = arr.some(r => r && typeof r === "string" && !r.startsWith("Error:"));
    if (hasText) {
      setLdMsg("Synthesizing all responses...");
      try {
        setSynthesis(await synthesize(origQ, comps, arr));
      } catch (e) {
        setSynthesis(`Synthesis error: ${e.message}`);
      }
    }
  };

  const MSGS_P = ["Analyzing request...","Selecting models...","Engineering prompts...","Finalizing..."];
  const MSGS_F = ["Parsing request...","Routing via proxy...","Executing requests...","Collecting results..."];

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;
    const q = prompt.trim();
    setLastQ(q);
    setLoading(true); setResult(null); setError(""); setSynthesis("");
    statusR.current = {}; responseR.current = {}; bump();
    let mi = 0; const msgs = mode === "premium" ? MSGS_P : MSGS_F;
    setLdMsg(msgs[0]);
    const t = setInterval(() => { mi = (mi + 1) % msgs.length; setLdMsg(msgs[mi]); }, 1500);
    try {
      if (mode === "premium") {
        setResult(await analyzePremium(q));
      } else {
        const act = enabled.length > 0 ? enabled : Object.keys(FREE_MODELS);
        const res = await analyzeFree(q, act);
        setResult(res);
        await runExec(res.components || [], q);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      clearInterval(t);
      setLoading(false);
    }
  };

  const statuses  = statusR.current;
  const responses = responseR.current;
  const comps     = result?.components || [];
  const modelsUsed = result
    ? [...new Set(comps.map(c => c.assigned_model))].map(id => getM(id, mode))
    : [];

  const renderResp = (resp, i) => {
    if (resp === undefined || resp === null) return null;
    if (resp?.type === "image") return (
      <div className="respwrap">
        <div className="resphd"><span className="resplbl">↩ generated image</span></div>
        <img className="respimg" src={resp.data} alt="AI Generated" />
      </div>
    );
    if (resp?.type === "audio") return (
      <div className="respwrap">
        <div className="resphd"><span className="resplbl">↩ generated audio</span></div>
        <audio className="respaud" controls src={resp.url} />
      </div>
    );
    const isErr = typeof resp === "string" && resp.startsWith("Error:");
    return (
      <div className="respwrap" style={isErr ? { borderColor:"rgba(239,68,68,0.35)" } : {}}>
        <div className="resphd" style={isErr ? { background:"rgba(239,68,68,0.08)",borderBottomColor:"rgba(239,68,68,0.18)" } : {}}>
          <span className={`resplbl ${isErr ? "resplbl-e" : ""}`}>{isErr ? "✕ error" : "↩ response"}</span>
          {!isErr && <button className={`cpbtn ${copied===`r${i}`?"cpd":""}`} onClick={() => cp(resp, `r${i}`)}>{copied===`r${i}`?"✓ Copied":"Copy"}</button>}
        </div>
        {isErr
          ? <div className="resperr">{resp.replace(/^Error:\s*/, "")}</div>
          : <div className="resptx">{resp}</div>}
      </div>
    );
  };

  return (
    <div className="app">
      <div className="wrap">

        <header className="hdr">
          <div className="logo">
            <div className="lm">OF</div>
            <div className="wm">OFALL</div>
          </div>
          <div className="tg">Orchestrated Free AI Layer</div>
          <div>
            <span className="proxy-badge">
              <span className="proxy-badge-dot" style={proxyConfigured ? {} : { background:"#FCD34D", boxShadow:"0 0 5px #FCD34D" }} />
              {proxyConfigured ? "Proxy connected" : "Proxy URL not set — see setup guide"}
            </span>
          </div>
        </header>

        {!proxyConfigured && (
          <div className="proxy-warn">
            <span>⚠</span>
            <span>PROXY_URL is not configured. Open <strong>ofall.jsx</strong>, find line 14, and replace <strong>YOUR-SUBDOMAIN</strong> with your Cloudflare Worker URL. See the setup guide for step-by-step instructions.</span>
          </div>
        )}

        <div className="mrow">
          <span className="mlbl">Mode:</span>
          <div className="ttrack">
            <button className={`topt ${mode==="free"?"af":""}`} onClick={() => { setMode("free"); setResult(null); setError(""); setSynthesis(""); statusR.current={}; responseR.current={}; bump(); }}>Free</button>
            <button className={`topt ${mode==="premium"?"ap":""}`} onClick={() => { setMode("premium"); setResult(null); setError(""); setSynthesis(""); }}>Premium</button>
          </div>
        </div>

        {mode === "free" && (
          <div className="mswrap">
            <div className="mshd">Active Models</div>
            <div className="chips">
              {Object.entries(FREE_MODELS).map(([id, m]) => {
                const on = enabled.includes(id);
                return (
                  <button key={id} className={`chip ${on?"on":""}`}
                    style={{ borderColor:on?`${m.color}66`:"var(--br)", color:on?m.color:"var(--mt)" }}
                    onClick={() => setEnabled(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id])}>
                    <span className="cdot" style={{ backgroundColor:on?m.color:"var(--mt)" }} />
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="plbl">Get More, <em>Just Ask</em></div>
        <div className="pwrap">
          <textarea className="pbox"
            placeholder={mode === "premium"
              ? "Describe your task — OFALL assigns the best premium model to each component and delivers expert prompts..."
              : "Describe your task — OFALL routes each component through your secure proxy to the best free AI and synthesizes all results..."}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && (e.ctrlKey||e.metaKey)) handleSubmit(); }}
            disabled={loading}
            rows={4}
          />
          <button className={`gobtn ${mode==="free"?"gf":"gp"}`} onClick={handleSubmit} disabled={!prompt.trim()||loading}>
            {loading ? "···" : "Analyze →"}
          </button>
        </div>

        {loading && <>
          <div className="lbar"><div className={`lfill ${mode==="free"?"lf":"lp"}`} /></div>
          <div className="lmsg">{ldMsg}</div>
        </>}

        {error && <div className="errbox">⚠ {error}</div>}

        {result && (
          <div ref={resultsRef}>
            {result.overview && (
              <div className="ovw"><span className="ovw-i">◎</span><span>{result.overview}</span></div>
            )}
            {modelsUsed.length > 0 && (
              <div className="mr">
                <span className="mrl">Models:</span>
                {modelsUsed.map((m, i) => (
                  <span key={i} className="mpill" style={{ borderColor:`${m.color}55`, color:m.color, background:`${m.color}11` }}>{m.name}</span>
                ))}
              </div>
            )}
            <div className="sect">Component Breakdown</div>
            <div className="clist">
              {comps.map((comp, i) => {
                const model = getM(comp.assigned_model, mode);
                const tc = T_CLS[(comp.type||"intent").replace(/\s/g,"_").toLowerCase()] || "ti";
                const st = statuses[i];
                const resp = responses[i];
                return (
                  <div key={i} className="ccard" style={{ borderColor:`${model.color}33`, animationDelay:`${i*0.07}s` }}>
                    <div className="chd" style={{ borderBottom:`1px solid ${model.color}22` }}>
                      <span className="cnum">0{i+1}</span>
                      <span className="cttl">{comp.label}</span>
                      <span className={`tbadge ${tc}`}>{comp.type||"intent"}</span>
                      {mode==="free" && <span className={`rstatus ${st==="running"?"rsr":st==="done"?"rsd":st==="error"?"rse":"rsp"}`}>
                        {st==="running"?"⟳ running":st==="done"?"✓ done":st==="error"?"✕ error":"· pending"}
                      </span>}
                    </div>
                    <div className="cbody">
                      <div className="cleft">
                        <div className="sublbl">Component</div>
                        <div className="dtxt">{comp.description}</div>
                        <div className="sublbl" style={{ marginTop:8 }}>Assigned Model</div>
                        <div className="mchip" style={{ borderColor:`${model.color}55` }}>
                          <div className="mdot" style={{ backgroundColor:model.color, boxShadow:`0 0 6px ${model.color}` }} />
                          <div>
                            <div className="mname" style={{ color:model.color }}>{model.name}</div>
                            <div className="mprov">{model.provider}</div>
                          </div>
                        </div>
                        <div className="rtxt">{comp.model_reason}</div>
                      </div>
                      <div className="cright">
                        <div className="sublbl">Ideal Prompt</div>
                        <div className="pout">
                          <div className="pout-t">
                            <span className="pout-l">✦ for {model.name}</span>
                            <button className={`cpbtn ${copied===i?"cpd":""}`} onClick={() => cp(comp.ideal_prompt, i)}>
                              {copied===i ? "✓ Copied" : "Copy"}
                            </button>
                          </div>
                          <div className="pout-tx">{comp.ideal_prompt}</div>
                        </div>
                        {mode==="free" && renderResp(resp, i)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {synthesis && (
              <div className="synwrap">
                <div className="sect" style={{ marginTop:16 }}>Synthesized Answer</div>
                <div className="syncard">
                  <div className="synhd">
                    <span className="synlbl">Unified Response — All Models Combined</span>
                    <button className={`cpbtn ${copied==="s"?"cpd":""}`} onClick={() => cp(synthesis, "s")}>
                      {copied==="s" ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="synbody">{synthesis}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {!result && !loading && !error && (
          <div className="empty">
            <div className="eic">◈</div>
            <div className="epills">
              {Object.values(mode==="free" ? FREE_MODELS : PREMIUM_MODELS).map(m => (
                <span key={m.name} className="ep" style={{ borderColor:`${m.color}44`, color:m.color }}>{m.name}</span>
              ))}
            </div>
            <div className="edesc">
              {mode==="premium"
                ? "Premium: OFALL decomposes your request, assigns the best model per component, and delivers expert prompts to copy and paste."
                : "Free: OFALL routes each component through your secure Cloudflare proxy to the best available free AI, then synthesizes all results into one answer."}
              <br /><br />
              <span style={{ color:"rgba(139,92,246,0.5)" }}>Ctrl+Enter to submit</span>
            </div>
          </div>
        )}

        {result && !loading && (
          <button className="clrbtn" onClick={() => { setResult(null); setError(""); setPrompt(""); setSynthesis(""); statusR.current={}; responseR.current={}; bump(); }}>
            ✕ New Analysis
          </button>
        )}

        <footer className="ftr">OFALL · Orchestrated Free AI Layer · All Platforms</footer>
      </div>
    </div>
  );
}
