/* ============================================================
   CONFIG: edit here. Add real video links in `src` fields.
   ============================================================ */
const CONFIG = {
  bookingUrl: "https://calendly.com/rahul-uppal-flipick/30min", // e.g. your Microsoft Bookings or Calendly link
  turnaround: "[X hours]",             // e.g. "3 hours"
  cost: "[a fraction of a manual re-edit]",
  heroSrc: { "16:9": null, "9:16": null } // master video URLs
};
const SIZES = ["16:9","9:16","1:1","5:4"];
const LANGS = { en:{ full:"English", short:"EN" }, fr:{ full:"French", short:"FR" } };
const ROUTES = {
  LHR:{ label:"London to Mumbai", short:"LON to MUM" },
  CDG:{ label:"New York to Mumbai", short:"NYC to MUM" }
};
/* Real video links per adaptation, keyed "size|lang|route" — Vimeo player URLs.
   Add a key only once you have the real link; any key left out shows a plain
   placeholder tile (same shape, no broken embed).
   Keys needed: 16:9|en|LHR, 9:16|en|LHR, 1:1|en|LHR, 5:4|en|LHR,
                16:9|fr|LHR, 9:16|fr|LHR, 1:1|fr|LHR, 5:4|fr|LHR,
                16:9|en|CDG, 9:16|en|CDG, 1:1|en|CDG, 5:4|en|CDG,
                16:9|fr|CDG, 9:16|fr|CDG, 1:1|fr|CDG, 5:4|fr|CDG */
const VIDEO_SRC = {
  "16:9|en|LHR": "https://player.vimeo.com/video/1230928548?badge=0&autopause=0&player_id=0&app_id=58479",
  "9:16|en|LHR": "https://player.vimeo.com/video/1230982106?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
  "1:1|en|LHR": "https://player.vimeo.com/video/1230984554?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
  "5:4|en|LHR": "https://player.vimeo.com/video/1230987991?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
  "16:9|fr|LHR": "https://player.vimeo.com/video/1231014916?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
  "9:16|fr|LHR": "https://player.vimeo.com/video/1231015677?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
  "1:1|fr|LHR": "https://player.vimeo.com/video/1231016486?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
  "5:4|fr|LHR": "https://player.vimeo.com/video/1231017313?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
  "16:9|en|CDG": "https://player.vimeo.com/video/1231171115?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
  "9:16|en|CDG": "https://player.vimeo.com/video/1231171752?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
  "1:1|en|CDG": "https://player.vimeo.com/video/1231172489?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
  "5:4|en|CDG": "https://player.vimeo.com/video/1231172930?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
  "16:9|fr|CDG": "https://player.vimeo.com/video/1231174662?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
  "9:16|fr|CDG": "https://player.vimeo.com/video/1231175140?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
  "1:1|fr|CDG": "https://player.vimeo.com/video/1231175453?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
  "5:4|fr|CDG": "https://player.vimeo.com/video/1231175874?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
}

/* Poster images, keyed by Vimeo video ID. Any video left out uses its Vimeo
   thumbnail (fetched via oEmbed), so add an entry only to override that. */
const POSTERS = {
  // "1230928548": "/individual/aurelle/images/poster-master.webp",
};

/* ---------- Data ---------- */
const ITEMS = [];
for (const route of Object.keys(ROUTES)) for (const lang of Object.keys(LANGS)) for (const size of SIZES)
  ITEMS.push({ size, lang, route, src: VIDEO_SRC[`${size}|${lang}|${route}`] || null });

const ratio = s => { const [w,h] = s.split(":").map(Number); return w/h; };

function esc(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

/* ---------- Poster overlay (covers the iframe until playback starts) ---------- */
const posterCache = {};
function posterUrl(src){
  const id = (String(src).match(/video\/(\d+)/) || [])[1];
  if (!id) return Promise.resolve(null);
  if (POSTERS[id]) return Promise.resolve(POSTERS[id]);
  return posterCache[id] ||= fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent("https://vimeo.com/" + id)}&width=1280`)
    .then(r => r.ok ? r.json() : null)
    .then(d => d?.thumbnail_url || null)
    .catch(() => null);
}
function addPoster(host, src, { onPlay } = {}){
  const p = document.createElement(onPlay ? "button" : "div");
  p.className = "vid-poster" + (onPlay ? " is-btn" : "");
  if (onPlay) { p.type = "button"; p.setAttribute("aria-label", "Play video"); p.onclick = onPlay; }
  host.appendChild(p);
  posterUrl(src).then(u => { if (u) p.style.backgroundImage = `url("${u}")`; });
  return { hide(){ p.classList.add("off"); }, show(){ p.classList.remove("off"); } };
}

function makeFrame(src, interactive){
  const url = new URL(src);
  url.searchParams.set("autopause", "0");
  url.searchParams.set("dnt", "1");
  if (interactive) {
    url.searchParams.set("controls", "1");
  } else {
    // Background mode: muted, looping, no player chrome. The other flags are a
    // fallback in case the Vimeo plan ignores `background`.
    url.searchParams.set("background", "1");
    url.searchParams.set("controls", "0");
    url.searchParams.set("muted", "1");
    url.searchParams.set("loop", "1");
    url.searchParams.set("title", "0");
    url.searchParams.set("byline", "0");
    url.searchParams.set("portrait", "0");
  }
  const f = document.createElement("iframe");
  f.src = url.toString();
  f.className = "vid-fill";
  f.setAttribute("frameborder", "0");
  f.allow = "autoplay; fullscreen; picture-in-picture; clipboard-write";
  if (interactive) f.allowFullscreen = true;
  else f.style.pointerEvents = "none";
  return f;
}

/* ---------- Video tile (Vimeo embed, fills its host at the host's own aspect ratio) ----------
   Tiles show only a poster; the Vimeo iframe is created on first play (hover or
   Play both), so the page doesn't load one player per tile up front. */
function buildSim(host, item, { interactive=false } = {}) {
  host.innerHTML = "";
  if (!item.src) {
    const ph = document.createElement("div");
    ph.className = "vid-fill";
    host.appendChild(ph);
    return { play(){}, pause(){}, reset(){}, el: ph };
  }
  if (interactive) {
    const f = makeFrame(item.src, true);
    host.appendChild(f);
    const player = new Vimeo.Player(f);
    const poster = addPoster(host, item.src, { onPlay: () => player.play().catch(()=>{}) });
    player.on("playing", poster.hide);
    return {
      play(){ player.play().catch(()=>{}); },
      pause(){ player.pause().catch(()=>{}); },
      reset(){ player.setCurrentTime(0).catch(()=>{}); },
      el: f
    };
  }
  const poster = addPoster(host, item.src);
  let player = null, wanted = false;
  function ensure(){
    if (player) return player;
    const f = makeFrame(item.src, false);
    host.insertBefore(f, host.firstChild);
    player = new Vimeo.Player(f);
    // Background mode autoplays; stop it if the pointer already left.
    player.on("playing", () => { if (wanted) poster.hide(); else player.pause().catch(()=>{}); });
    return player;
  }
  return {
    play(){ wanted = true; ensure().play().catch(()=>{}); },
    pause(){ wanted = false; player?.pause().catch(()=>{}); },
    reset(){ player?.setCurrentTime(0).catch(()=>{}); if (!wanted) poster.show(); },
    get el(){ return player ? host.querySelector("iframe") : null; }
  };
}

/* ---------- Hero ---------- */
const heroHost = document.getElementById("heroPlayer");
const mobileQ = matchMedia("(max-width: 640px)");
let heroApi;
function mountHero(){
  const staticFrame = heroHost.querySelector("iframe");
  if (staticFrame) {
    if (!heroHost.querySelector(".vid-poster")) {
      const heroPlayer = new Vimeo.Player(staticFrame);
      const poster = addPoster(heroHost, staticFrame.src, { onPlay: () => heroPlayer.play().catch(()=>{}) });
      heroPlayer.on("playing", poster.hide);
    }
    setCrop("none"); return;
  }
  const size = mobileQ.matches ? "9:16" : "16:9";
  heroApi?.pause();
  heroApi = buildSim(heroHost, { size, lang:"en", route:"LHR", src: CONFIG.heroSrc[size] }, { interactive:true });
  setCrop("none");
}
mobileQ.addEventListener("change", mountHero);

const guide = document.getElementById("guide"), guideWin = document.getElementById("guideWin"), guideTag = document.getElementById("guideTag");
function setCrop(c){
  document.querySelectorAll("[data-crop]").forEach(b => b.setAttribute("aria-pressed", b.dataset.crop === c));
  if (c === "none") { guide.classList.remove("on"); return; }
  guide.classList.add("on");
  const w = ratio(c) / (16/9) * 100;
  guideWin.style.width = w + "%";
  guideTag.textContent = `${c} crop from the 16:9 master`;
}
document.querySelectorAll("[data-crop]").forEach(b => b.addEventListener("click", () => setCrop(b.dataset.crop)));

/* ---------- Facts ---------- */
const total = ITEMS.length;
document.getElementById("hTotal").textContent = total;
document.querySelectorAll("[data-total]").forEach(n => n.textContent = total);
document.getElementById("facts").innerHTML = [
  [total, "adaptations"], [SIZES.length, "sizes"], [Object.keys(LANGS).length, "languages"],
  [Object.keys(ROUTES).length, "routes"], [0, "reshoots"]
].map(([n,l]) => `<div class="fact"><strong>${n}</strong><span>${l}</span></div>`).join("");
document.querySelectorAll("[data-cfg]").forEach(n => {
  const v = CONFIG[n.dataset.cfg]; n.textContent = v;
  if (!/^\[/.test(v)) n.classList.remove("fill");
});

/* ---------- Filters ---------- */
const state = { size:"all", lang:"all", route:"all" };
const GROUPS = [
  ["size","Size", SIZES.map(s => [s, s])],
  ["lang","Language", Object.entries(LANGS).map(([k,v]) => [k, v.full])],
  ["route","Route", Object.entries(ROUTES).map(([k,v]) => [k, v.short])]
];
const filtersEl = document.getElementById("filters");
filtersEl.innerHTML = GROUPS.map(([key,label,opts]) => `
  <div class="fgroup"><span id="fl-${key}">${label}</span>
    <div class="chips" role="group" aria-labelledby="fl-${key}">
      <button type="button" class="chip" data-f="${key}" data-v="all" aria-pressed="true">All</button>
      ${opts.map(([v,t]) => `<button type="button" class="chip" data-f="${key}" data-v="${v}" aria-pressed="false">${esc(t)}</button>`).join("")}
    </div></div>`).join("") +
  `<div class="tools"><span class="count" id="count"></span><button type="button" class="ghost" id="cmpBtn">Compare side by side</button></div>`;
filtersEl.addEventListener("click", e => {
  const b = e.target.closest("[data-f]"); if (!b) return;
  state[b.dataset.f] = b.dataset.v;
  filtersEl.querySelectorAll(`[data-f="${b.dataset.f}"]`).forEach(x => x.setAttribute("aria-pressed", x === b));
  renderGrid();
});

/* ---------- Grid ---------- */
const grid = document.getElementById("grid");
let visible = [];
const tileApis = [];
function renderGrid(){
  tileApis.forEach(a => a.pause()); tileApis.length = 0;
  visible = ITEMS.filter(i => (state.size==="all"||i.size===state.size) && (state.lang==="all"||i.lang===state.lang) && (state.route==="all"||i.route===state.route));
  document.getElementById("count").innerHTML = `Showing <b>${visible.length}</b> of ${total}`;
  if (!visible.length) {
    grid.innerHTML = `<div class="empty">No versions match these filters.<br><button type="button" class="ghost" id="clr">Clear filters</button></div>`;
    document.getElementById("clr").onclick = () => { Object.keys(state).forEach(k => state[k]="all"); filtersEl.querySelectorAll("[data-f]").forEach(x => x.setAttribute("aria-pressed", x.dataset.v==="all")); renderGrid(); };
    return;
  }
  grid.innerHTML = "";
  visible.forEach((item, idx) => {
    const t = document.createElement("button");
    t.type = "button"; t.className = "tile ar-" + item.size.replace(":","-");
    t.setAttribute("aria-label", `Play ${item.size}, ${LANGS[item.lang].full}, ${ROUTES[item.route].label}`);
    t.innerHTML = `<div class="frame"></div><span class="cap">${item.size}  ${LANGS[item.lang].short}  ${ROUTES[item.route].short}</span>`;
    grid.appendChild(t);
    const api = buildSim(t.querySelector(".frame"), item);
    tileApis.push(api);
    t.addEventListener("mouseenter", () => api.play());
    t.addEventListener("mouseleave", () => { api.pause(); api.reset(); });
    t.addEventListener("click", () => openPlayer(idx));
  });
}

/* ---------- Modal: single player ---------- */
const dlg = document.getElementById("dlg"), modal = document.getElementById("modal");
let modalApis = [];
function closeModal(){ modalApis.forEach(a => a.pause()); modalApis = []; dlg.close(); }
dlg.addEventListener("cancel", e => { e.preventDefault(); closeModal(); });
dlg.addEventListener("click", e => { if (e.target === modal) closeModal(); });

function fitBox(size, maxW, maxH){
  const r = ratio(size); let w = maxW, h = w / r;
  if (h > maxH) { h = maxH; w = h * r; }
  return { w: Math.floor(w), h: Math.floor(h) };
}
let current = 0;
function openPlayer(idx){
  current = idx;
  const item = visible[idx];
  modalApis.forEach(a => a.pause());
  const box = fitBox(item.size, Math.min(1100, innerWidth - 40), innerHeight - 190);
  modal.innerHTML = `
    <div class="mhead" style="width:${Math.max(box.w, 320)}px">
      <span class="tag">${item.size}</span><span class="tag">${LANGS[item.lang].full}</span><span class="tag">${esc(ROUTES[item.route].label)}</span>
      <button class="x" type="button" aria-label="Close">×</button>
    </div>
    <div class="mbody"><div class="mplayer" style="width:${box.w}px;height:${box.h}px"></div></div>
    <div class="mfoot">
      <button type="button" data-nav="-1">Previous</button>
      <span>${idx+1} of ${visible.length}</span>
      <button type="button" data-nav="1">Next</button>
    </div>`;
  modal.querySelector(".x").onclick = closeModal;
  modal.querySelectorAll("[data-nav]").forEach(b => b.onclick = () => openPlayer((current + Number(b.dataset.nav) + visible.length) % visible.length));
  const api = buildSim(modal.querySelector(".mplayer"), item, { interactive:true });
  modalApis = [api];
  if (!dlg.open) dlg.showModal();
  modal.querySelector(".x").focus();
  api.play?.();
}
document.addEventListener("keydown", e => {
  if (!dlg.open || !modal.querySelector("[data-nav]")) return;
  if (e.key === "ArrowRight") openPlayer((current+1) % visible.length);
  if (e.key === "ArrowLeft") openPlayer((current-1+visible.length) % visible.length);
});

/* ---------- Modal: compare ---------- */
const cmp = { size:"16:9", by:"lang" };
function openCompare(){
  modalApis.forEach(a => a.pause());
  const base = { lang:"en", route:"LHR" };
  const pair = cmp.by === "lang"
    ? [{...base, lang:"en"}, {...base, lang:"fr"}]
    : [{...base, route:"LHR"}, {...base, route:"CDG"}];
  const items = pair.map(p => ITEMS.find(i => i.size===cmp.size && i.lang===p.lang && i.route===p.route));
  const colW = (Math.min(1100, innerWidth - 40) - 18) / 2;
  const box = innerWidth < 640
    ? fitBox(cmp.size, innerWidth - 40, (innerHeight - 260) / 2)
    : fitBox(cmp.size, colW, innerHeight - 250);
  modal.innerHTML = `
    <div class="mhead"><span class="mtitle">Same film, one data change</span><button class="x" type="button" aria-label="Close">×</button></div>
    <div class="cmp-controls">
      <span>Size</span><div class="seg" role="group" aria-label="Size">${SIZES.map(s=>`<button type="button" data-cs="${s}" aria-pressed="${s===cmp.size}">${s}</button>`).join("")}</div>
      <span>Compare</span><div class="seg" role="group" aria-label="Compare by"><button type="button" data-cb="lang" aria-pressed="${cmp.by==="lang"}">Language</button><button type="button" data-cb="route" aria-pressed="${cmp.by==="route"}">Route</button></div>
    </div>
    <div class="mbody${innerWidth<640?" stack":""}">
      ${items.map((it,i)=>`<div class="cmpcol"><span>${cmp.by==="lang"?LANGS[it.lang].full:esc(ROUTES[it.route].label)}</span><div class="mplayer" data-c="${i}" style="width:${box.w}px;height:${box.h}px"></div></div>`).join("")}
    </div>
    <div class="mfoot"><button type="button" id="cmpPlay">Play both</button><button type="button" id="cmpRestart">Restart</button></div>`;
  modal.querySelector(".x").onclick = closeModal;
  modal.querySelectorAll("[data-cs]").forEach(b => b.onclick = () => { cmp.size = b.dataset.cs; openCompare(); });
  modal.querySelectorAll("[data-cb]").forEach(b => b.onclick = () => { cmp.by = b.dataset.cb; openCompare(); });
  modalApis = items.map((it,i) => {
    const a = buildSim(modal.querySelector(`[data-c="${i}"]`), it);
    return a;
  });
  let on = false;
  const pb = modal.querySelector("#cmpPlay");
  pb.onclick = () => { on = !on; modalApis.forEach(a => on ? a.play() : a.pause()); pb.textContent = on ? "Pause both" : "Play both"; };
  modal.querySelector("#cmpRestart").onclick = () => { modalApis.forEach(a => { a.reset(); }); if (!on) pb.click(); };
  if (!dlg.open) dlg.showModal();
  pb.focus();
}
document.getElementById("cmpBtn").addEventListener("click", openCompare);

/* ---------- Booking + personalisation ---------- */
document.querySelectorAll("[data-book]").forEach(a => {
  a.href = CONFIG.bookingUrl;
  if (CONFIG.bookingUrl !== "#") { a.target = "_blank"; a.rel = "noopener"; }
});
try {
  const AIRLINE_NAMES = {
    qatar:"Qatar Airways", singapore:"Singapore Airlines", airindia:"Air India",
    united:"United Airlines", american:"American Airlines", delta:"Delta Air Lines",
    southwest:"Southwest Airlines", frontier:"Frontier Airlines", alaska:"Alaska Airlines",
    jal:"Japan Airlines", qantas:"Qantas", suncountry:"Sun Country Airlines",
    avelo:"Avelo Airlines", indigo:"IndiGo", akasa:"Akasa Air", starair:"Star Air",
    spicejet:"SpiceJet", cathay:"Cathay Pacific", koreanair:"Korean Air", virgin:"Virgin Atlantic"
  };
  const key = (new URLSearchParams(location.search).get("for") || "").toLowerCase();
  if (key) {
    const name = AIRLINE_NAMES[key] || key.replace(/[-_]+/g," ").replace(/\b\w/g, c => c.toUpperCase()).slice(0,40);
    document.getElementById("forName").textContent = name;
    document.getElementById("forLine").hidden = false;
  }
} catch(e) {}

mountHero();
renderGrid();
