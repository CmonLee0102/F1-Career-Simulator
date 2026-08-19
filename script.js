/* =========================================================
   F1 LIFE — 快速車手生涯模擬器
   一鍵一場 / 一鍵整季，多賽季到退休
   ========================================================= */
"use strict";
const SAVE_KEY = "f1life_save_v1";
const $ = s => document.querySelector(s);
const rint = (a,b) => a + Math.floor(Math.random()*(b-a+1));   // 含端點
const rand = () => Math.random();
const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];

/* ---------- 積分 ---------- */
const POINTS = [25,18,15,12,10,8,6,4,2,1];

/* ---------- 級別（青訓為統一規格車，純看實力；F1 車隊性能有差） ---------- */
const TIERS = {
  KART:{name:"卡丁車", short:"KART", color:"#7a7a86", races:4, base:20, spread:24, noise:24, promote:2, salary:0},
  F4:  {name:"F4",     short:"F4",   color:"#0a9d5a", races:5, base:26, spread:26, noise:22, promote:2, salary:0},
  F3:  {name:"F3",     short:"F3",   color:"#2277cc", color2:"#2277cc", races:5, base:32, spread:28, noise:20, promote:2, salary:1},
  F2:  {name:"F2",     short:"F2",   color:"#8b5cf6", races:6, base:40, spread:30, noise:20, promote:2, salary:3},
  F1:  {name:"F1",     short:"F1",   color:"#e10600", races:9, base:0,  spread:0,  noise:16, promote:0, salary:0},
};
const TIER_ORDER = ["KART","F4","F3","F2","F1"];

/* ---------- F1 車隊 (2026)：perf 為賽車性能 ---------- */
const TEAMS = [
  {key:"Cadillac", name:"Cadillac",     perf:42, color:"#0b1f3a", salary:5},
  {key:"Haas",     name:"Haas",         perf:50, color:"#b6babd", salary:6},
  {key:"Alpine",   name:"Alpine",       perf:55, color:"#0093cc", salary:8},
  {key:"Audi",     name:"Audi",         perf:58, color:"#bb0a30", salary:9},
  {key:"RacingBulls",name:"Racing Bulls",perf:62,color:"#6692ff", salary:11},
  {key:"Williams", name:"Williams",     perf:66, color:"#00a3e0", salary:13},
  {key:"Aston",    name:"Aston Martin", perf:68, color:"#006f62", salary:16},
  {key:"Mercedes", name:"Mercedes",     perf:84, color:"#27f4d2", salary:26},
  {key:"Ferrari",  name:"Ferrari",      perf:86, color:"#e10600", salary:30},
  {key:"RedBull",  name:"Red Bull",     perf:88, color:"#3671c6", salary:34},
  {key:"McLaren",  name:"McLaren",      perf:90, color:"#ff8000", salary:38},
];
const teamByKey = k => TEAMS.find(t=>t.key===k);

/* ---------- 賽道 ---------- */
const TRACKS = ["巴林","吉達","墨爾本","上海","邁阿密","蒙地卡羅","蒙特婁","銀石","斯帕","蒙札","新加坡","阿布達比","拉斯維加斯","墨西哥","茵特拉格斯"];
// DNF 退賽原因（機械故障 / 意外）
const DNF_REASONS = ["引擎故障","變速箱故障","液壓系統失效","煞車失靈","懸吊斷裂","電力系統故障","動力單元報銷","賽車起火","爆胎","打滑撞牆","賽車散架","漏油"];
const COUNTRIES = [
  ["🇹🇼","臺灣"],["🇭🇰","香港"],["🇲🇴","澳門"],["🇨🇳","中國"],["🇯🇵","日本"],["🇰🇷","南韓"],
  ["🇲🇾","馬來西亞"],["🇸🇬","新加坡"],["🇹🇭","泰國"],["🇮🇩","印尼"],["🇵🇭","菲律賓"],["🇻🇳","越南"],
  ["🇮🇳","印度"],["🇬🇧","英國"],["🇳🇱","荷蘭"],["🇪🇸","西班牙"],["🇲🇨","摩納哥"],["🇮🇹","義大利"],
  ["🇫🇷","法國"],["🇩🇪","德國"],["🇧🇪","比利時"],["🇨🇭","瑞士"],["🇦🇹","奧地利"],["🇫🇮","芬蘭"],
  ["🇸🇪","瑞典"],["🇩🇰","丹麥"],["🇵🇱","波蘭"],["🇵🇹","葡萄牙"],["🇮🇪","愛爾蘭"],["🇧🇷","巴西"],
  ["🇦🇷","阿根廷"],["🇲🇽","墨西哥"],["🇺🇸","美國"],["🇨🇦","加拿大"],["🇦🇺","澳洲"],["🇳🇿","紐西蘭"],
  ["🇿🇦","南非"],["🇦🇪","阿聯"],["🇸🇦","沙烏地"],
];
// 青訓級別對手：真實賽車手姓氏（含現役 F2/F3 新秀與經典名將）
const AI_NAMES = ["Maini","Martins","Vesti","Hauger","Iwasa","Barnard","Crawford","Fornaroli","Aron","Villeneuve",
  "Mansell","Fittipaldi","Rosberg","Häkkinen","Montoya","Frijns","Pourchaire","Doohan","Drugovich","Daruvala",
  "Verschoor","Novalak","Stanek","Browning","Beganovic","Goethe","Edgar","Collet","Wharton","Bedrin","Maloney","Hadjar"];

// F1 各隊真實車手陣容（依 2026 車隊，近似陣容）：[姓氏, 實力值]
const F1_LINEUPS = {
  McLaren:    [["Norris",80],   ["Piastri",78]],
  RedBull:    [["Verstappen",90],["Tsunoda",60]],
  Ferrari:    [["Leclerc",83],  ["Hamilton",84]],
  Mercedes:   [["Russell",78],  ["Antonelli",64]],
  Aston:      [["Alonso",82],   ["Stroll",56]],
  Williams:   [["Sainz",76],    ["Albon",72]],
  RacingBulls:[["Lawson",60],   ["Hadjar",58]],
  Audi:       [["Hülkenberg",66],["Bortoleto",54]],
  Alpine:     [["Gasly",68],    ["Colapinto",54]],
  Haas:       [["Ocon",66],     ["Bearman",60]],
  Cadillac:   [["Pérez",70],    ["Bottas",66]],
};

/* ---------- 屬性定義 ---------- */
const ATTRS = [
  {key:"pace",  name:"速度"},
  {key:"craft", name:"車技"},
  {key:"cons",  name:"穩定"},
  {key:"wet",   name:"濕地"},
  {key:"fit",   name:"體能"},
];

/* ========================================================= */
let G = null;   // 遊戲狀態

/* ---------- 建立新生涯 ---------- */
function newGame(name, number, country, mode, talent){
  seasonClosing=false; busy=false;
  const startTier = mode === "f1" ? "F1" : "KART";
  const startAge  = mode === "f1" ? 18 : 15;
  const baseAttr  = mode === "f1" ? 46 : 34;
  G = {
    name, number, country, potential: talent,
    age: startAge, peakAge: rint(27,30), retireAge: rint(37,45),
    tier: startTier, teamKey: null, seasonsInTier: 0,
    attrs: {}, rep: mode==="f1" ? 22 : 10, money: 0,
    season: 1, round: 0,
    field: null, seasonStat: null,
    totals: {races:0, wins:0, podiums:0, poles:0, points:0, dnfs:0,
             titles:{KART:0,F4:0,F3:0,F2:0,F1:0}, wdc:0, bestWDC:99, seasons:0,
             firstWinAge:null, firstTitleAge:null, underdogWin:false},
    teamHistory:{}, startMode:mode, badStreak:0, missNext:0, missReason:"", sponsor:null,
    timeline: [], over:false, lastResult:null,
  };
  ATTRS.forEach(a=>{ G.attrs[a.key] = clamp(baseAttr + rint(-6,6), 10, 60); });
  if(startTier==="F1") G.teamKey = "Haas";       // 直接進 F1：從後段班起步
  startSeason(true);
  save(); render(); log_intro();
}

/* ---------- 車手綜合能力 ---------- */
function driverRating(wet){
  const a = G.attrs;
  if(wet) return a.pace*0.25 + a.wet*0.40 + a.craft*0.18 + a.cons*0.12 + a.fit*0.05;
  return a.pace*0.40 + a.craft*0.28 + a.cons*0.20 + a.fit*0.12;
}

/* ---------- 開新賽季：建立車手場、積分表 ---------- */
function startSeason(firstEver){
  const t = TIERS[G.tier];
  G.round = 0;
  G.seasonStat = {points:0, wins:0, podiums:0, poles:0, dnfs:0, best:99, tier:G.tier, teamKey:G.teamKey};
  // 本季隨機挑幾站當「決策賽」：比賽進行中會跳出關鍵抉擇
  const nDec = clamp(Math.round(t.races*0.4), 2, 4);
  G.decisionRounds = []; { const used={}; while(G.decisionRounds.length<nDec){ const r=rint(1,t.races); if(!used[r]){used[r]=1; G.decisionRounds.push(r);} } }
  // 建立本季對手場
  const field = [];
  if(G.tier === "F1"){
    TEAMS.forEach(tm=>{
      const isMyTeam = tm.key === G.teamKey;
      const lineup = F1_LINEUPS[tm.key] || [[pick(AI_NAMES),60],[pick(AI_NAMES),56]];
      if(isMyTeam){
        // 玩家取代二號車手，留下明星隊友一起出賽
        field.push(makeEntry(lineup[0][0], tm.perf, false, tm.key, false, lineup[0][1]));
        field.push(makeEntry(G.name,        tm.perf, true,  tm.key, true));
      } else {
        field.push(makeEntry(lineup[0][0], tm.perf, false, tm.key, false, lineup[0][1]));
        field.push(makeEntry(lineup[1][0], tm.perf, false, tm.key, false, lineup[1][1]));
      }
    });
    // 確保玩家只有一個 isMe
  } else {
    // 青訓：20 台統一規格車，純看天賦
    for(let i=0;i<19;i++){
      field.push(makeEntry(pick(AI_NAMES)+" "+pick(["Jr","","II","·R","·M"]).trim(), t.base, false, null, false, rint(t.base-6, t.base+t.spread)));
    }
    field.push(makeEntry(G.name, t.base, true, null, true));
  }
  // 修正：F1 情況下玩家 entry
  G.field = field.map(e=>({...e, pts:0, wins:0, dnf:0}));
  ensureOneMe();
}
function makeEntry(label, base, isMe, teamKey, myFlag, talent){
  return {label, base, isMe: !!isMe, teamKey, talent: talent!=null?talent:0};
}
function ensureOneMe(){
  // 保證正好一位玩家，且標籤為玩家名字
  let found=false;
  G.field.forEach(e=>{ if(e.isMe){ if(found){e.isMe=false;} else {found=true; e.label=G.name;} } });
  if(!found){ G.field[G.field.length-1].isMe=true; G.field[G.field.length-1].label=G.name; }
}

/* ---------- 建立一場比賽（逐圈模擬用的狀態） ---------- */
function buildRace(){
  const t = TIERS[G.tier];
  const track = pick(TRACKS);
  const wet = rand() < 0.25;
  const laps = G.tier==="F1" ? rint(11,16) : rint(9,13);
  const cars = G.field.map(e=>{
    const carBase = G.tier==="F1" ? e.base : 0;                 // 青訓為統一規格車，車不計分
    const rawSkill = e.isMe ? driverRating(wet) : e.talent + (wet ? rint(-8,8) : 0);
    // 車手實力權重高於賽車：頂尖數據能把中段車拉到前段（青訓 carBase=0 不受影響）
    return {e, skill: carBase*0.6 + rawSkill*1.5, cum:0, dnf:false, pos:0, prev:0};
  });
  const me = cars.find(c=>c.e.isMe);
  const thisRound = G.round + 1;
  const decisionLaps = [];
  if(G.decisionRounds && G.decisionRounds.includes(thisRound)){
    const n = rint(1,2), used={};
    for(let i=0;i<n;i++){ let L, tries=0; do{ L=rint(2,laps-1); tries++; }while(used[L]&&tries<8); used[L]=1; decisionLaps.push(L); }
  }
  const st = {t, track, wet, laps, cars, me, decisionLaps, unit:t.noise, lap:0, pole:false};
  st.pole = !me.dnf && rand() < (me.skill/(me.skill+45)) * 0.55;   // 賽前排位：強者較可能拿桿位
  rankCars(st);
  return st;
}
function rankCars(st){
  const order = [...st.cars].sort((a,b)=> (a.dnf?1:0)-(b.dnf?1:0) || b.cum - a.cum);
  order.forEach((c,i)=>{ c.prev = c.pos || (i+1); c.pos = i+1; });
}
function advanceLap(st){
  st.lap++;
  st.cars.forEach(c=>{
    if(c.dnf) return;
    c.cum += c.skill + (rand()*2-1)*st.unit;
    const p = c.e.isMe
      ? (0.03 + (100-G.attrs.cons)/100*0.06 + (st.wet?0.03:0)) / st.laps
      : (0.05 + (st.wet?0.03:0)) / st.laps;
    if(rand() < p){ c.dnf = true; c.cum = -1e9; if(c.e.isMe) c.dnfReason = pick(DNF_REASONS); }
  });
  rankCars(st);
}

/* ---------- 結算一場比賽：更新積分/聲望/成長，回傳結果 ---------- */
function resolveFinish(st, opts){
  const dns = !!(opts && opts.dns);                              // 缺賽（傷病）：玩家不計分，也不算 DNF 統計
  const me = st.me;
  const myPos = dns ? "DNS" : (me.dnf ? "DNF" : me.pos);
  const finishers = [...st.cars].filter(c=>!c.dnf).sort((a,b)=> b.cum - a.cum);
  finishers.forEach((c,i)=>{ if(i<10) c.e.pts += POINTS[i]; if(i===0) c.e.wins++; });
  st.cars.forEach(c=>{ if(c.dnf && !c.e.isMe) c.e.dnf++; });
  const ss = G.seasonStat, tot = G.totals;
  G.round++; tot.races++;
  let gained = 0;   // 本站獲得積分
  if(me.dnf){ if(!dns){ ss.dnfs++; tot.dnfs++; } }
  else {
    const p = me.pos;
    ss.best = Math.min(ss.best, p);
    if(p===1){ ss.wins++; tot.wins++; }
    if(p<=3){ ss.podiums++; tot.podiums++; }
    if(p<=10){ gained = POINTS[p-1]; ss.points += gained; tot.points += gained; }
    if(p===1 && G.tier==="F1"){                                  // 成就追蹤：F1 首勝年齡 / 逆境勝
      if(tot.firstWinAge==null) tot.firstWinAge = G.age;
      if((teamByKey(G.teamKey)?.perf || 60) < 58) tot.underdogWin = true;
    }
  }
  if(st.pole && !dns){ ss.poles++; tot.poles++; }
  repFromResult(dns ? 99 : (me.dnf ? 99 : me.pos));
  if(!dns) raceGrowth();
  G.lastResult = {pos:myPos, dnf:me.dnf, dns:dns, track:st.track, wet:st.wet, pole:st.pole && !dns, tierShort:st.t.short, pts:gained,
                  reason: dns ? (opts.reason||"傷病") : (me.dnf ? (me.dnfReason || pick(DNF_REASONS)) : null)};
  return G.lastResult;
}

function repFromResult(pos){
  let d=0;
  if(G.tier==="F1"){
    if(pos===1) d=7; else if(pos<=3) d=4; else if(pos<=6) d=2; else if(pos<=10) d=1; else if(pos>90) d=-1.5; else d=-0.4;
  } else {
    if(pos===1) d=4; else if(pos<=3) d=2; else if(pos<=6) d=0.8; else if(pos>90) d=-0.4;
  }
  G.rep = clamp(G.rep + d, 0, 100);
}

/* ---------- 成長 / 衰退 ---------- */
function raceGrowth(){
  const young = G.age < G.peakAge;
  ATTRS.forEach(a=>{
    if(young && rand() < 0.5){
      const cap = 55 + G.potential*0.45;          // 天賦決定上限
      if(G.attrs[a.key] < cap) G.attrs[a.key] = clamp(G.attrs[a.key] + rand()*1.2, 10, 99);
    }
  });
}
function seasonAging(){
  G.age++;
  const gap = G.age - G.peakAge;
  ATTRS.forEach(a=>{
    if(G.age < G.peakAge){
      const gain = (G.potential/100) * rint(2,5);
      G.attrs[a.key] = clamp(G.attrs[a.key] + gain, 10, 99);
    } else if(gap > 0){
      // 過巔峰：緩慢衰退，體能掉最快
      const dec = (a.key==="fit" ? 1.4 : 0.8) * gap * (0.5+rand()*0.7);
      G.attrs[a.key] = clamp(G.attrs[a.key] - dec, 10, 99);
    }
  });
}

/* ========================================================= */
/*  主流程                                                   */
/* ========================================================= */
let busy=false, raceSt=null;
function setButtonsDisabled(b){ $("#mainBtn").disabled=b; $("#ffBtn").disabled=b; const i=$("#investBtn"); if(i) i.disabled=b; }

function nextRace(){
  if(G.over || busy) return;
  const t = TIERS[G.tier];
  if(G.round >= t.races){ endSeason(); return; }
  newSeasonScreen();          // 新賽季第一場 → 先清空主畫面
  if(G.missNext > 0){ playMissedRace(); return; }   // 傷病缺賽
  startLiveRace();
}
function fastForwardSeason(){
  if(G.over || busy || seasonClosing) return;
  const t = TIERS[G.tier];
  if(G.round >= t.races){ endSeason(); return; }   // 已跑完就直接結算，不重複輸出
  busy=true; setButtonsDisabled(true);
  newSeasonScreen();          // 新賽季 → 先清空主畫面
  while(G.round < t.races){
    if(G.missNext > 0){ G.missNext--; simMissedInstant(); } else simRaceInstant();
  }
  addCard(`<div class="ct">⏩ 快速模擬</div><div class="cb">本季剩餘分站已快速跑完（決策賽自動穩健處理）。</div>`,"");
  updateHeader(); save(); endSeason();
}

/* ========================================================= */
/*  現場直播：一圈一圈跑，畫面跟著動                          */
/* ========================================================= */
function startLiveRace(){
  busy=true; setButtonsDisabled(true);
  raceSt = buildRace();
  showRaceStage();
  renderStage(raceSt, true);
  setTimeout(stepLap, 580);
}
function stepLap(){
  const st = raceSt;
  if(st.lap >= st.laps){ endLiveRace(); return; }
  advanceLap(st);
  renderStage(st, false);
  if(st.me.dnf && !st._dnfShown){ st._dnfShown=true; flashStage("💥 "+(st.me.dnfReason||"機械故障")+" — 退賽"); }
  if(st.decisionLaps.includes(st.lap) && !st.me.dnf){
    setTimeout(()=> raceMoment(st, ()=> setTimeout(stepLap, 320)), 280);
  } else {
    setTimeout(stepLap, st.lap > st.laps-3 ? 300 : 200);   // 收尾放慢營造張力
  }
}
function endLiveRace(){
  const st = raceSt;
  const r = resolveFinish(st);
  hideRaceStage();
  renderResultCard(r);
  updateHeader(); save();
  finishRacePost();
}
function finishRacePost(){
  setButtonsDisabled(false);
  busy=false;
  const t = TIERS[G.tier];
  if(G.round >= t.races){ hintSeasonEnd(); return; }
  const roll = rand();
  if(roll < 0.06){ misfortune(); }                       // 突發狀況 / 傷病
  else if(G.sponsor && roll < 0.14){ sponsorEvent(); }   // 代言期間動態事件（醜聞、活動、獎金…）
  else if(roll < 0.30){ maybeEvent(); }                  // 一般賽間事件
}
// 因傷病缺賽（現場版）：AI 照跑計分，玩家不計分並記為 DNS
function playMissedRace(){
  busy=true; setButtonsDisabled(true);
  const reason = G.missReason || "傷病";
  G.missNext = Math.max(0, (G.missNext||0) - 1);
  const st = buildRace(); st.me.dnf = true; st.me.cum = -1e9;
  while(st.lap < st.laps){ advanceLap(st); }
  const r = resolveFinish(st, {dns:true, reason});
  renderResultCard(r);
  addCard(`<div class="ct"><span class="newsflag">🏥</span> 缺賽</div><div class="cb">你因「${reason}」缺席 ${st.track} 大獎賽。</div>`,"");
  updateHeader(); save();
  finishRacePost();
}
function simMissedInstant(){
  const st = buildRace(); st.me.dnf = true; st.me.cum = -1e9;
  while(st.lap < st.laps){ advanceLap(st); }
  resolveFinish(st, {dns:true, reason:G.missReason||"傷病"});
}
function simRaceInstant(){
  const st = buildRace();
  while(st.lap < st.laps){
    advanceLap(st);
    if(st.decisionLaps.includes(st.lap) && !st.me.dnf) autoResolveMoment(st);
  }
  resolveFinish(st);
}

/* ---------- 比賽中的關鍵抉擇（決策賽才會出現） ---------- */
function hasDRS(){ return G.tier==="F1" || G.tier==="F2"; }   // DRS 僅 F1／F2 有；卡丁車、F4、F3 沒有
const RACE_MOMENTS = [
  {tag:"超車機會", desc:st=>`第 ${st.lap} 圈 — 前車近在眼前，${hasDRS()?"DRS 已開啟":"抓到他的尾流"}。要出手嗎？`,
   choices:[
     {t:"全力攻擊，切內線超車", s:"高風險 · 可能大幅前進或撞車", risky:true, apply:st=>{
        const r=rand();
        if(r<0.55){ st.me.cum+=3*st.unit; return "🏁 漂亮的超車，位置往前竄！"; }
        else if(r<0.90){ st.me.cum-=1.2*st.unit; return "😖 沒切進去，反被回敬掉了節奏。"; }
        else { st.me.dnf=true; st.me.cum=-1e9; st.me.dnfReason="進攻失誤撞牆"; return "💥 進彎太深，撞車退賽！"; } }},
     {t:"保持耐心，穩住輪胎", s:"安全 · 維持位置", apply:st=>{ st.me.cum+=0.5*st.unit; bump("cons",1); return "🧊 你冷靜跟車，保留實力。"; }},
   ]},
  {tag:"後方施壓", desc:st=>`第 ${st.lap} 圈 — 後車緊咬不放，${hasDRS()?"就在 DRS 範圍內":"靠著尾流貼上來"}。`,
   choices:[
     {t:"強硬關門防守", s:"高風險 · 守住或接觸", risky:true, apply:st=>{
        const r=rand();
        if(r<0.62){ st.me.cum+=1*st.unit; return "🛡️ 完美防守，對手無功而返！"; }
        else if(r<0.92){ st.me.cum-=1.6*st.unit; return "😣 防守跑寬，還是被超掉。"; }
        else { st.me.dnf=true; st.me.cum=-1e9; st.me.dnfReason="與對手輪胎接觸"; return "💥 輪胎接觸，雙雙受損退賽！"; } }},
     {t:"讓線避免風險", s:"安全 · 略失位置", apply:st=>{ st.me.cum-=0.7*st.unit; return "🤝 你聰明讓線，保住賽車完整。"; }},
   ]},
  {tag:"天氣判斷", desc:st=> st.wet ? `第 ${st.lap} 圈 — 雨勢漸歇，賽道快乾了。`:`第 ${st.lap} 圈 — 烏雲密布，隨時會下雨。`,
   choices:[
     {t:"賭一把，提前進站換胎", s:"高風險 · 賭對海放全場", risky:true, apply:st=>{
        if(rand() < (st.wet?0.6:0.5)){ st.me.cum+=3.5*st.unit; return "🌦️ 神級進站策略，你賭對了狂追！"; }
        else { st.me.cum-=2.6*st.unit; return "📉 進站賭錯，掉出了節奏。"; } }},
     {t:"待在場上不動", s:"安全 · 跟隨大隊", apply:st=>{ st.me.cum+=0.3*st.unit; return "⏳ 你按兵不動，穩穩守住。"; }},
   ]},
  {tag:"輪胎管理", desc:st=>`第 ${st.lap} 圈 — 輪胎開始衰退，工程師問你的節奏。`,
   choices:[
     {t:"現在猛推，搶時間", s:"高風險 · 爆發或磨光輪胎", risky:true, apply:st=>{
        if(rand()<0.55){ st.me.cum+=2*st.unit; return "🔥 你榨出賽車極限，圈速起飛！"; }
        else { st.me.cum-=1.8*st.unit; return "🫠 輪胎過熱打滑，速度掉了。"; } }},
     {t:"省胎，穩定推進", s:"安全 · 留到最後", apply:st=>{ st.me.cum+=0.6*st.unit; return "♻️ 你細心管胎，後段更有本錢。"; }},
   ]},
  {tag:"車隊無線電", desc:st=>`第 ${st.lap} 圈 — 工程師：「引擎模式由你決定。」`,
   choices:[
     {t:"開最強引擎模式", s:"高風險 · 更快但傷可靠度", risky:true, apply:st=>{
        if(rand()<0.88){ st.me.cum+=1.8*st.unit; st.me.skill+=st.unit*0.15; return "⚡ 火力全開，直線變怪物！"; }
        else { st.me.dnf=true; st.me.cum=-1e9; st.me.dnfReason="引擎過熱起火"; return "💨 引擎過熱冒煙，退賽！"; } }},
     {t:"保護引擎，穩紮穩打", s:"安全 · 顧全完賽", apply:st=>{ st.me.cum+=0.4*st.unit; bump("cons",1); return "🔧 你保護動力單元，穩定完賽。"; }},
   ]},
];
function raceMoment(st, done){
  const m = pick(RACE_MOMENTS);
  showModal(`第 ${st.lap} 圈 · ${m.tag}`, typeof m.desc==="function"?m.desc(st):m.desc,
    m.choices.map(c=>({ label:`${c.t} <small>${c.s}</small>`, risky:c.risky,
      fn:()=>{ const txt=c.apply(st); rankCars(st); renderStage(st,false); flashStage(txt);
               done(); } })),   // 決策效果只在賽道直播上顯示，不灌進主畫面
    "比賽進行中");
}
function autoResolveMoment(st){
  const m = pick(RACE_MOMENTS);
  const safe = m.choices.find(c=>!c.risky) || m.choices[0];
  safe.apply(st);
}

/* ---------- 直播畫面渲染 ---------- */
function showRaceStage(){ $("#raceStage").classList.add("show"); $("#rsFlash").classList.remove("show"); }
function hideRaceStage(){ $("#raceStage").classList.remove("show"); }
function flashStage(txt){ const f=$("#rsFlash"); f.textContent=txt; f.classList.add("show"); setTimeout(()=>f.classList.remove("show"),1600); }
function renderStage(st, initial){
  $("#rsTrack").textContent = st.track + " 大獎賽";
  $("#rsWx").textContent = st.wet ? "🌧️ 濕地" : "☀️ 乾地";
  $("#rsLap").textContent = "LAP " + Math.max(st.lap,1) + "/" + st.laps;
  const me = st.me, posEl = $("#rsPos"), d = $("#rsDelta");
  posEl.textContent = me.dnf ? "DNF" : "P"+me.pos;
  posEl.className = "rs-pos " + (me.dnf ? "pdnf" : me.pos===1 ? "p1" : me.pos<=3 ? "p3" : "");
  if(initial || me.dnf){ d.textContent = (initial && st.pole) ? "桿位起跑 🏁" : ""; d.className="rs-delta"; }
  else { const diff = me.prev - me.pos;
    d.textContent = diff>0 ? ("▲ "+diff) : diff<0 ? ("▼ "+(-diff)) : "—";
    d.className = "rs-delta " + (diff>0 ? "rs-up" : diff<0 ? "rs-dn" : ""); }
  const prog = st.laps ? clamp(st.lap/st.laps, 0, 1) : 0;
  const car = $("#rsCar"); car.style.left = (5 + prog*86) + "%"; car.textContent = me.dnf ? "💥" : "🏎️";
  renderTower(st);
}
function renderTower(st){
  const order = [...st.cars].sort((a,b)=> (a.dnf?1:0)-(b.dnf?1:0) || a.pos - b.pos);
  const meIdx = order.findIndex(c=>c.e.isMe);
  let lo = Math.max(0, meIdx-3), hi = Math.min(order.length, lo+7); lo = Math.max(0, hi-7);
  let html="";
  for(let i=lo;i<hi;i++){ const c=order[i]; const nm = c.e.isMe ? G.name : c.e.label;
    html += `<div class="tw-row ${c.e.isMe?'me':''} ${c.dnf?'out':''}">`+
            `<span class="tw-p">${c.dnf?'✗':c.pos}</span><span class="tw-n">${nm}</span>`+
            `<span class="tw-g">${c.dnf?'DNF':gapStr(st,c)}</span></div>`;
  }
  $("#rsTower").innerHTML = html;
}
function gapStr(st,c){
  let leader=null; st.cars.forEach(x=>{ if(!x.dnf && (!leader || x.cum>leader.cum)) leader=x; });
  if(!leader) return "";
  if(c===leader) return "LEADER";
  return "+" + ((leader.cum - c.cum)/(st.unit*3)).toFixed(1) + "s";
}

let seasonClosing=false;
function endSeason(){
  if(seasonClosing) return;                 // 防止「整季」連點時重複結算導致畫面錯亂
  seasonClosing=true; busy=true; setButtonsDisabled(true);
  const t = TIERS[G.tier], ss = G.seasonStat, tot = G.totals;
  // 積分榜排序
  const table = [...G.field].sort((a,b)=> b.pts - a.pts || b.wins - a.wins);
  const myPos = table.findIndex(e=>e.isMe)+1;
  const champ = myPos===1;
  tot.seasons++;
  if(G.tier==="F1"){
    tot.bestWDC = Math.min(tot.bestWDC, myPos); if(champ) tot.wdc++;
    if(!G.teamHistory) G.teamHistory={};
    G.teamHistory[G.teamKey] = (G.teamHistory[G.teamKey]||0)+1;   // 成就追蹤：效力各隊季數
    if(champ && tot.firstTitleAge==null) tot.firstTitleAge = G.age;
    G.badStreak = (myPos>=17) ? (G.badStreak||0)+1 : 0;           // 連續低迷（車手榜 17 名以後）追蹤
    G.lastWDCPos = myPos;                                         // 本季車手榜名次（供續約評估用）
  }
  if(champ) tot.titles[G.tier]++;
  // 薪水
  const salary = G.tier==="F1" ? (teamByKey(G.teamKey)?.salary||5) : TIERS[G.tier].salary;
  G.money += salary;

  // 賽季總結卡
  const teamName = G.tier==="F1" ? (teamByKey(G.teamKey)?.name||"") : t.name;
  renderSeasonCard(table, myPos, champ, teamName, salary);

  // 時間軸紀錄
  let tlMedal = champ ? "🏆" : (myPos<=3 ? "🥉" : "");
  G.timeline.push({
    yr:`S${G.season}·${t.short}`,
    text:`${teamName}｜WDC 第 ${myPos} · ${ss.wins}勝 ${ss.podiums}台 ${ss.points}分`,
    medal: tlMedal, champ
  });

  // 決定去向：升級 / 換隊 / 退休
  seasonAging();
  G.season++; G.seasonsInTier++;
  save(); updateHeader();

  // 退休判定
  if(shouldRetire(myPos)){ setTimeout(()=>retire(), 300); return; }

  // 青訓升級 / F1 換隊
  setTimeout(()=> decideNextSeat(myPos, champ), 260);
}

function shouldRetire(myPos){
  if(G.age >= 45) return true;                                  // 硬性上限：45 歲一定退役
  if(G.age >= G.retireAge) return true;
  if(G.age >= 33 && G.tier==="F1" && G.rep < 12) return true;   // 老將失去舞台
  return false;
}

function decideNextSeat(myPos, champ){
  const t = TIERS[G.tier];
  if(G.tier !== "F1"){
    // 青訓：前段班升級
    if(myPos <= t.promote){
      const ni = TIER_ORDER.indexOf(G.tier)+1;
      const nextTier = TIER_ORDER[ni];
      if(nextTier==="F1"){
        // 升上 F1：依聲望給起始車隊選擇
        offerF1Seats(true);
      } else {
        promoteTo(nextTier);
        addCard(`<div class="ct"><span class="newsflag">⬆️</span> 升級！</div><div class="ch">晉級 ${TIERS[nextTier].name}</div>`+
                `<div class="cb">你在 ${t.name} 打出成績，獲得升上 <b>${TIERS[nextTier].name}</b> 的機會！</div>`,"season");
        beginNextSeasonReady();
      }
    } else {
      // 未升級
      G.seasonsInTier++;
      if(G.seasonsInTier >= 3 && G.tier!=="KART"){
        // 卡關太久 → 生涯受阻（給一次留在原級的機會）
        addCard(`<div class="ct"><span class="newsflag">⚠️</span> 生涯瓶頸</div><div class="cb">連續多季未能晉級，贊助商信心動搖……再拚一季證明自己！</div>`,"");
      } else {
        addCard(`<div class="ct">留級一季</div><div class="cb">本季無緣升級，續留 ${t.name} 再戰一年。</div>`,"");
      }
      G.tier=G.tier; startSeason(); beginNextSeasonReady();
    }
  } else {
    // F1 季末：先處理代言（有合約就領款、到期才簽新），再處理釋出 / 合約
    seasonEndorsement(()=>{
      if((G.badStreak||0) >= 3 && rand() < 0.8){ dropFromF1(); return; }  // 連續三季低迷 → 大機率被釋出
      offerF1Seats(false);
    });
  }
}
// 季末代言結算：合約在期間內每季自動領款；到期（或沒合約）才提供新的代言選擇
function seasonEndorsement(next){
  const s = G.sponsor;
  if(s && s.seasonsLeft > 0){
    const bn = s.brand || s.name;
    G.money = (G.money||0) + s.pay;
    s.seasonsLeft--;
    const expired = s.seasonsLeft <= 0;
    addCard(`<div class="ct"><span class="newsflag">🤝</span> 代言收入 · ${bn}</div>`+
            `<div class="cb">合約入帳 +${s.pay}M。${expired ? "本合約已到期，明年可簽新約。" : `合約尚餘 ${s.seasonsLeft} 季。`}（資產 ${G.money}M）</div>`,"season");
    if(expired) G.sponsor = null;
    updateHeader(); save();
    next(); return;
  }
  offerNewSponsor(next);
}
// 虛構贊助品牌名（讓代言事件更有戲）
const SPONSOR_BRANDS = ["Velox 能量飲","Astra 銀行","NovaTech","Zephyr 航空","Kaion 手錶","Pulse 電信",
  "Orbit 保險","Titan 能源","Lumen 科技","Apex 運動","Zenith 汽車","Vantage 金融","Halcyon 航太","Meridian 醫療"];
// 簽新代言：含期限，合約期間每季領款（大品牌報酬高但有形象風險）
function offerNewSponsor(next){
  const rep = G.rep, base = Math.round(6 + rep*0.4);
  const deals = [
    {name:"地方贊助商", pay:Math.max(3,Math.round(base*0.55)), years:2, risky:false},
    {name:"品牌代言",   pay:base,                              years:3, risky:false},
    {name:"國際大品牌", pay:Math.round(base*1.5),              years:3, risky:true },
  ];
  const choices = deals.map(d=>({
    label:`${d.risky?"🌟":"🤝"} ${d.name} <small>約 ${d.pay}M/季 · 為期 ${d.years} 季${d.risky?" · 有形象風險":""}</small>`,
    risky:d.risky,
    fn:()=>{ let pay=d.pay, note="";
      if(d.risky){   // 大品牌純為收入風險，不影響車手的車隊行情（聲望）
        if(rand()<0.6){ note=" 話題行銷成功，收入亮眼！"; }
        else { pay=Math.round(pay*0.5); note=" 一簽約就捲入爭議，代言收入大幅縮水。"; }
      }
      const brand = pick(SPONSOR_BRANDS);
      G.sponsor = {name:d.name, brand:brand, pay:pay, seasonsLeft:d.years-1};   // 首期現在入帳，其餘各季自動領
      G.money = (G.money||0) + pay; updateHeader(); save();
      addCard(`<div class="ct"><span class="newsflag">🤝</span> 簽下代言 · ${brand}</div>`+
              `<div class="cb">與 <b>${brand}</b>（${d.name}）簽約，為期 ${d.years} 季、每季約 ${pay}M；首期入帳 +${pay}M。${note}（資產 ${G.money}M）</div>`,"season");
      next(); }
  }));
  choices.push({ label:"專注比賽，暫不接代言", fn:()=>{ next(); } });
  showModal(`🤝 季末代言 — 聲望 ${Math.round(rep)}`, "簽下代言合約，可在合約期間每季獲得資金：", choices, "代言");
}

/* ========================================================= */
/*  代言期間的動態事件（有合約才會觸發）                      */
/* ========================================================= */
const SPONSOR_EVENTS = [
  {tag:"醜聞", title:"贊助商爆醜聞",
   desc:n=>`你的贊助商「${n}」被爆出財務造假醜聞，媒體天天堵麥追問你的立場。`,
   choices:n=>[
     {t:"公開切割、終止合約", s:"失去代言金 · 保住形象", fn:()=>{ G.sponsor=null; G.rep=clamp(G.rep-2,0,100);
        return `你與「${n}」劃清界線並終止合約（往後不再有這筆代言金），聲望小幅受挫但守住了形象。`; }},
     {t:"力挺贊助商到底", s:"風險：聲望大跌", risky:true, fn:()=>{ if(rand()<0.4){ G.rep=clamp(G.rep+2,0,100);
        return `你選擇相信「${n}」，後來證實只是烏龍，你的義氣反而為你加了分。`; }
        G.rep=clamp(G.rep-rint(4,8),0,100); return `你替「${n}」背書，結果醜聞屬實，被輿論一起圍剿，聲望大跌。`; }},
   ]},
  {tag:"活動", title:"品牌活動邀約",
   desc:n=>`「${n}」邀你出席品牌大型活動，但會佔用你的訓練時間。`,
   choices:n=>[
     {t:"盛裝出席", s:"+聲望 +獎金 · 微耗體能", fn:()=>{ G.rep=clamp(G.rep+3,0,100); const b=rint(3,6); G.money+=b; bump("fit",-1);
        return `活動圓滿成功，曝光度大增（聲望 +3，進帳 ${b}M）。`; }},
     {t:"婉拒、專心備賽", s:"+穩定", fn:()=>{ bump("cons",rint(1,3)); return `你留在基地備賽，狀態更沉穩。`; }},
   ]},
  {tag:"獎金", title:"贊助商績效獎金",
   desc:n=>`「${n}」對你近期的表現很滿意，提出一筆績效獎金。`,
   choices:n=>[
     {t:"欣然收下", s:"+獎金", fn:()=>{ const b=rint(5,12); G.money+=b; return `你獲得 ${b}M 績效獎金。`; }},
   ]},
  {tag:"爆紅", title:"代言廣告爆紅",
   desc:n=>`你為「${n}」拍的廣告在網路一夕爆紅，粉絲暴增。`,
   choices:n=>[
     {t:"太讚了！", s:"+聲望", fn:()=>{ G.rep=clamp(G.rep+rint(3,6),0,100); return `廣告洗版社群，你的人氣水漲船高（聲望上升）。`; }},
   ]},
  {tag:"施壓", title:"贊助商施壓",
   desc:n=>`成績不如預期，「${n}」放話再沒起色就要重新評估合約。`,
   choices:n=>[
     {t:"承諾拿出成績", s:"風險：壓力上身", risky:true, fn:()=>{ if(rand()<0.55){ bump("cons",2); return `你把壓力化為動力，心態更堅定。`; }
        bump("cons",-rint(1,3)); return `壓力壓垮了節奏，你的穩定度下滑。`; }},
     {t:"不甩、專注自己", s:"+穩定 · 聲望微降", fn:()=>{ bump("cons",2); G.rep=clamp(G.rep-1,0,100); return `你無視雜音專注比賽，心更靜，但贊助商不太高興。`; }},
   ]},
  {tag:"財務危機", title:"贊助商財務危機",
   desc:n=>`「${n}」傳出資金週轉不靈，本季代言金恐怕拿不到。`,
   choices:n=>[
     {t:"協議提前解約", s:"止血", fn:()=>{ G.sponsor=null; return `你與「${n}」和平解約，避免更大的損失（合約終止）。`; }},
     {t:"再觀望一季", s:"風險：血本無歸", risky:true, fn:()=>{ if(rand()<0.5){ return `對方撐過了難關，合約續行。`; }
        G.sponsor=null; return `「${n}」最終倒閉，這季代言金泡湯、合約作廢。`; }},
   ]},
];
function sponsorEvent(){
  if(!G.sponsor) return;
  const n = G.sponsor.brand || G.sponsor.name;
  const ev = pick(SPONSOR_EVENTS);
  showModal(`🤝 ${ev.title}`, ev.desc(n), ev.choices(n).map(c=>({
    label:`${c.t} <small>${c.s}</small>`, risky:c.risky,
    fn:()=>{ const res = c.fn(); updateHeader(); save();
             addCard(`<div class="ct"><span class="newsflag">🤝</span> 代言 · ${ev.tag}</div><div class="cb">${res}</div>`,""); }
  })), "代言");
}
// 連續低迷被 F1 釋出：還年輕就降回 F2 重新證明，太老則直接被淘汰退役
function dropFromF1(){
  G.badStreak = 0;
  if(G.age < 34){
    addCard(`<div class="ct"><span class="newsflag">⬇️</span> 遭車隊釋出</div><div class="ch">被降回 F2</div>`+
            `<div class="cb">連續三季成績低迷（車手榜 17 名之後），車隊對你失去信心，你失去了 F1 席位，只能回到 F2 重新證明自己。</div>`,"season");
    G.tier="F2"; G.teamKey=null; G.seasonsInTier=0; startSeason(); beginNextSeasonReady();
  } else {
    addCard(`<div class="ct"><span class="newsflag">🚫</span> 黯然退場</div><div class="ch">${G.age} 歲 · 被車壇淘汰</div>`+
            `<div class="cb">連續三季低迷又上了年紀，再沒有車隊願意給你機會，職業生涯就此畫下句點。</div>`,"season");
    retire();
  }
}
function promoteTo(tier){ G.tier=tier; G.seasonsInTier=0; startSeason(); }
function beginNextSeasonReady(){ seasonClosing=false; busy=false; updateHeader(); save(); setMainBtn("下一場 ▶", nextRace); }

/* ---------- F1 座位 / 合約選擇 ---------- */
function offerF1Seats(firstTime){
  const rep = G.rep;
  const sorted = [...TEAMS].sort((a,b)=>a.perf-b.perf);
  // 市場價值 = 聲望與「當前車手實力」的加權：數據滿的好手就算聲望還沒跟上，也會被前段隊看中
  const skillPct = clamp(driverRating(false), 0, 100);
  const value = clamp(Math.max(rep, rep*0.4 + skillPct*0.6), 0, 100);
  const idx = clamp(Math.round((value/100)*(sorted.length-1)), 0, sorted.length-1);
  const opts = [];
  const pushTeam = (tm, stay) => { if(tm && !opts.find(o=>o.tm.key===tm.key)) opts.push({tm, stay:!!stay}); };
  const pushIdx  = i => pushTeam(sorted[clamp(i,0,sorted.length-1)], false);
  // 續約評估：本季表現是否對得起這台車。強隊（前段）對成績不佳者不續約
  let renewAllowed = true, curDropped = false;
  const cur = teamByKey(G.teamKey);
  if(!firstTime && cur){
    const teamRank = sorted.findIndex(t=>t.key===cur.key);     // 0=最弱 … 10=最強
    const expectedPos = (sorted.length - teamRank) * 2;        // 車越好，期望名次越前
    const myWDC = G.lastWDCPos || 20;
    const ss = G.seasonStat;
    const goodSeason = ss.wins>0 || ss.podiums>0 || myWDC <= expectedPos + 3;
    if(teamRank >= 5 && !goodSeason){ renewAllowed = false; curDropped = true; }  // 前段隊 + 表現差 → 不續約
  }
  if(firstTime){ pushIdx(0); pushIdx(1); }            // 新秀：只有後段班
  else {
    if(renewAllowed) pushTeam(cur, true);            // 表現達標才給「續約留任現隊」
    const reach = (G.seasonStat.wins>0 || G.seasonStat.podiums>=2) ? 2 : 1;  // 打出成績 → 挖得更高
    pushIdx(idx+reach); pushIdx(idx+1); pushIdx(idx); pushIdx(idx-1);
    if(G.seasonStat.wins>0) pushIdx(sorted.length-1);   // 有勝場，頂級隊必來敲門
    if(skillPct>=88) pushIdx(sorted.length-2);          // 實力頂尖，強隊也注意到你
  }
  const uniq = opts.slice(0, firstTime ? 2 : 4);
  const title = firstTime ? "🏁 登上 F1！" : "📝 季末合約";
  const desc  = firstTime
    ? "你一路過關斬將，終於拿到 F1 席位！選擇你的第一支車隊："
    : `市場價值 ${Math.round(value)}（聲望 ${Math.round(rep)} · 實力 ${Math.round(skillPct)}）。`
      + (curDropped ? `⚠️ ${cur.name} 對你本季表現不滿意，未提供續約，你得另尋車隊。` : "你可以續約留任，或接受其他車隊的邀約：");
  const choices = uniq.map(o=>{
    const tm = o.tm, badge = o.stay ? "🔁 續約留任 · " : "";
    return {
      label:`${badge}${tm.name} <small>賽車性能 ${tm.perf} · 年薪 ${tm.salary}M</small>`,
      risky: tm.perf>=80 && !o.stay,
      fn:()=>{ const staying = tm.key === G.teamKey;
        if(firstTime){ G.tier="F1"; G.seasonsInTier=0; }
        G.teamKey = tm.key; startSeason(); beginNextSeasonReady();
        if(staying) addCard(`<div class="ct"><span class="newsflag">🔁</span> 續約</div><div class="ch">留任 ${tm.name}</div>`+
                     `<div class="cb">你選擇與 <b>${tm.name}</b> 續約，再戰一季（性能 ${tm.perf}）。</div>`,"season");
        else addCard(`<div class="ct"><span class="newsflag">✍️</span> 簽約</div><div class="ch">加盟 ${tm.name}</div>`+
                     `<div class="cb">下一季你將為 <b>${tm.name}</b> 出賽（性能 ${tm.perf}）。</div>`,"season"); }
    };
  });
  // 35 歲後可主動退役掛盔
  if(!firstTime && G.age >= 35){
    choices.push({ label:`🏁 光榮退役 <small>結束車手生涯，查看生涯總結</small>`, risky:false,
      fn:()=>{ addCard(`<div class="ct"><span class="newsflag">🏁</span> 退役</div><div class="ch">${G.age} 歲 · 光榮掛盔</div>`+
                       `<div class="cb">你決定為職業生涯畫下句點。</div>`,"season");
               retire(); } });
  }
  showModal(title, desc, choices, "合約");
}

/* ---------- 退休 ---------- */
function retire(){
  G.over = true; save();
  const tot = G.totals;
  // 傳奇評價
  let title, sub;
  if(tot.wdc>=4){ title="史上最偉大 · G.O.A.T"; sub="你的名字將永遠定義這項運動。"; }
  else if(tot.wdc>=2){ title="多屆世界冠軍 · 傳奇"; sub="殿堂級的車手，時代的統治者。"; }
  else if(tot.wdc===1){ title="世界冠軍"; sub="你登上過世界之巔，此生無憾。"; }
  else if(tot.wins>=1){ title="分站冠軍車手"; sub="站上過最高頒獎台，令人敬佩的生涯。"; }
  else if(tot.points>0){ title="中場常客"; sub="穩健可靠，車隊倚重的老將。"; }
  else if(tot.titles.F2+tot.titles.F3+tot.titles.F4+tot.titles.KART>0){ title="青訓好手"; sub="曾是備受期待的新星。"; }
  else { title="逐夢者"; sub="沒能站上頂點，但你追過那道紅色的光。"; }

  $("#legacyCrown").textContent = tot.wdc>=4?"👑" : tot.wdc>=1?"🏆" : tot.wins>=1?"🥇" : tot.points>0?"🏅" : "🏁";
  $("#legacyTitle").textContent = title;
  $("#legacySub").textContent = sub;
  const cells = [
    ["生涯總勝",tot.wins],["登台",tot.podiums],["桿位",tot.poles],
    ["世界冠軍",tot.wdc],["出賽",tot.races],["賽季",tot.seasons],
    ["最佳 WDC", tot.bestWDC>90?"—":("P"+tot.bestWDC)],["總積分",tot.points],["身價", G.money+"M"],
  ];
  $("#sumGrid").innerHTML = cells.map(c=>`<div class="sumcell"><div class="sv">${c[1]}</div><div class="sl">${c[0]}</div></div>`).join("");

  // 成就徽章牆：已解鎖直接顯示，未解鎖收在「▾ 展開」箭頭後面
  const ach = evaluateAchievements();
  const got = ach.filter(a=>a.got), locked = ach.filter(a=>!a.got);
  const achCard = a => `<div class="ach ${a.got?'got':'lock'}"><div class="ach-ic">${a.got?a.icon:'🔒'}</div>`+
    `<div class="ach-tx"><div class="ach-n">${a.name}</div><div class="ach-d">${a.desc}</div></div></div>`;
  $("#achCount").textContent = got.length + " / " + ach.length;
  // 全部成就放進可捲動小框（已解鎖在前，其餘往下捲）
  $("#achGrid").innerHTML = got.concat(locked).map(achCard).join("");

  $("#timeline").innerHTML = G.timeline.map(r=>
    `<div class="tl-row"><span class="tl-yr">${r.yr}</span><span class="tl-tx ${r.champ?'tl-medal':''}">${r.medal?r.medal+" ":""}${r.text}</span></div>`
  ).join("");

  // 職業生涯總結（填滿下方空白的收尾文字）
  const cy = COUNTRIES.find(x=>x[1]===G.country) || ["",""];
  const teamsCount = Object.keys(G.teamHistory||{}).length;
  const fromTier = G.startMode==="karting" ? "卡丁車" : "F1";
  let cs = `<span class="cs-name">${cy[0]} ${G.name}</span>，來自${G.country}。從${fromTier}起步，生涯征戰 ${tot.seasons} 個賽季、共 ${tot.races} 場大獎賽`;
  if(teamsCount>0) cs += `，效力過 ${teamsCount} 支 F1 車隊`;
  cs += `。累積 ${tot.wins} 場分站冠軍、${tot.podiums} 次登上頒獎台、${tot.poles} 個桿位`;
  if(tot.wdc>0) cs += `，並奪下 ${tot.wdc} 座世界冠軍 🏆`;
  cs += `。最終於 ${G.age} 歲高掛頭盔 —— 被譽為「${title}」。${sub}`;
  $("#careerSummary").innerHTML = cs;

  $("#retireScreen").classList.add("show");
}

/* ---------- 生涯成就評鑑 ---------- */
function evaluateAchievements(){
  const t = G.totals, money = G.money||0, age = G.age;
  const teams = Object.keys(G.teamHistory||{});
  const maxStint = teams.reduce((m,k)=>Math.max(m, G.teamHistory[k]), 0);
  const juniorTitles = t.titles.F2 + t.titles.F3 + t.titles.F4 + t.titles.KART;
  return [
    {icon:"👑", name:"史上最偉大 G.O.A.T", desc:"生涯奪下 4 座以上世界冠軍",       got: t.wdc>=4},
    {icon:"🏰", name:"冠軍王朝",           desc:"生涯奪下 3 座以上世界冠軍",       got: t.wdc>=3},
    {icon:"🥇", name:"衛冕冠軍",           desc:"生涯奪下 2 座以上世界冠軍",       got: t.wdc>=2},
    {icon:"🌍", name:"世界冠軍",           desc:"至少奪下 1 座 F1 世界冠軍",        got: t.wdc>=1},
    {icon:"⭐", name:"天才之星",           desc:"23 歲前就登上世界冠軍寶座",       got: t.firstTitleAge!=null && t.firstTitleAge<=23},
    {icon:"🌱", name:"大器晚成",           desc:"32 歲後才拿下 F1 生涯首勝",        got: t.firstWinAge!=null && t.firstWinAge>=32},
    {icon:"💰", name:"大富翁",             desc:"生涯累積身價達 200M",             got: money>=200},
    {icon:"🤑", name:"億萬車神",           desc:"生涯累積身價達 400M",             got: money>=400},
    {icon:"🏎️", name:"常勝軍",             desc:"生涯累積 30 場以上分站冠軍",       got: t.wins>=30},
    {icon:"🏁", name:"首勝達成",           desc:"贏得生涯第一場大獎賽",            got: t.wins>=1},
    {icon:"🍾", name:"頒獎台常客",         desc:"生涯 50 次以上站上頒獎台",         got: t.podiums>=50},
    {icon:"⚡", name:"桿位大師",           desc:"生涯拿下 20 次以上桿位",          got: t.poles>=20},
    {icon:"🛠️", name:"鐵人車手",           desc:"生涯出賽超過 150 場",             got: t.races>=150},
    {icon:"🌲", name:"常青樹",             desc:"40 歲仍在賽道上奮戰到退休",       got: age>=40},
    {icon:"🚀", name:"白手起家",           desc:"從卡丁車一路加冕世界冠軍",         got: G.startMode==="karting" && t.wdc>=1},
    {icon:"❤️", name:"一隊之魂",           desc:"效力同一支車隊長達 8 季",         got: maxStint>=8},
    {icon:"🧳", name:"浪子車手",           desc:"生涯效力過 6 支以上不同車隊",     got: teams.length>=6},
    {icon:"🐐", name:"逆境英雄",           desc:"駕駛後段班賽車仍奪下分站冠軍",     got: !!t.underdogWin},
    {icon:"🎓", name:"青訓王者",           desc:"在青訓級別奪得過冠軍",            got: juniorTitles>=1},
    {icon:"💥", name:"撞車藝術家",         desc:"生涯累積 15 次以上退賽（DNF）",    got: t.dnfs>=15},
    {icon:"🎖️", name:"逐夢者",             desc:"完成了一段完整的賽車人生",        got: true},
  ];
}

/* ========================================================= */
/*  事件系統                                                 */
/* ========================================================= */
const EVENTS = [
  {tag:"訓練", title:"冬歇期的選擇", desc:"休賽期你要把時間投資在哪？",
   choices:[
     {t:"魔鬼體能訓練", s:"+體能 / -休息", fn:()=>{ bump("fit",rint(3,6)); return "你把自己逼到極限，體能大幅提升。"; }},
     {t:"泡在模擬器裡", s:"+速度 或 +車技", fn:()=>{ const k=pick(["pace","craft"]); bump(k,rint(3,6)); return `無數圈的模擬換來更強的${k==="pace"?"單圈速度":"車技"}。`; }},
     {t:"陪家人放鬆", s:"+聲望 心態穩", fn:()=>{ G.rep=clamp(G.rep+2,0,100); bump("cons",rint(1,3)); return "身心平衡，你回到賽場時更沉著。"; }},
   ]},
  {tag:"抉擇", title:"最後一圈的機會", desc:"領先者就在前方半秒，彎道濕滑。要賭這一把嗎？",
   choices:[
     {t:"全力進攻，賭一個超車", s:"高風險高回報", risky:true, fn:()=>{ if(rand()<0.5){ bump("craft",3); G.rep=clamp(G.rep+3,0,100); return "神級走位！你完成了本季最精彩的超車。"; } else { bump("cons",-2); return "輪胎鎖死衝出賽道，好在保住了車。"; } }},
     {t:"守住名次，落袋為安", s:"穩紮穩打", fn:()=>{ bump("cons",2); return "你冷靜守住位置，車隊讚賞你的成熟。"; }},
   ]},
  {tag:"合約", title:"贊助商飯局", desc:"大品牌想找你代言，但行程會擠壓訓練時間。",
   choices:[
     {t:"接下代言", s:"+身價 +聲望", fn:()=>{ G.money+=4; G.rep=clamp(G.rep+3,0,100); return "曝光度大增，你的商業價值水漲船高。"; }},
     {t:"婉拒，專注賽車", s:"+穩定/專注", fn:()=>{ bump("cons",rint(2,4)); return "你選擇純粹，把心思全留給賽道。"; }},
   ]},
  {tag:"隊令", title:"車隊指令", desc:"隊友在你身後苦追積分，工程師要你讓車。",
   choices:[
     {t:"服從隊令讓車", s:"+聲望（團隊）", fn:()=>{ G.rep=clamp(G.rep+2,0,100); return "你顧全大局，車隊高層記住了你的忠誠。"; }},
     {t:"無視指令自己跑", s:"風險：隊內關係", risky:true, fn:()=>{ if(rand()<0.55){ bump("pace",2); return "你證明了自己的速度，媒體大讚，但更衣室氣氛微妙。"; } else { G.rep=clamp(G.rep-3,0,100); return "違抗隊令惹惱高層，聲望受損。"; } }},
   ]},
  {tag:"傷病", title:"熱身賽小意外", desc:"練習賽一記重摔，手腕有點不對勁。",
   choices:[
     {t:"忍痛硬上", s:"風險：狀態下滑", risky:true, fn:()=>{ if(rand()<0.5){ return "你咬牙撐過，展現鋼鐵意志。"; } else { bump("fit",-3); return "傷勢影響發揮，接下來得慢慢養。"; } }},
     {t:"聽醫療團隊休養", s:"-一點鋒芒 +健康", fn:()=>{ bump("fit",2); return "你選擇健康第一，很快恢復狀態。"; }},
   ]},
  {tag:"媒體", title:"記者的尖銳提問", desc:"賽後訪問，記者拿你的失誤大做文章。",
   choices:[
     {t:"幽默化解", s:"+聲望", fn:()=>{ G.rep=clamp(G.rep+3,0,100); return "一句妙答圈粉無數，你的人氣上升。"; }},
     {t:"回懟對手", s:"製造話題（風險）", risky:true, fn:()=>{ if(rand()<0.5){ G.rep=clamp(G.rep+2,0,100); return "火爆金句登上頭條，話題性十足。"; } else { G.rep=clamp(G.rep-2,0,100); return "失言引來爭議，形象扣分。"; } }},
   ]},
  {tag:"研發", title:"賽車升級方向", desc:"工程師問你想要哪種升級套件。",
   choices:[
     {t:"下壓力（過彎）", s:"+車技手感", fn:()=>{ bump("craft",rint(2,4)); return "新空力套件讓你彎中信心十足。"; }},
     {t:"低阻力（直線）", s:"+速度", fn:()=>{ bump("pace",rint(2,4)); return "尾速提升，直線上你更具威脅。"; }},
     {t:"雨天設定", s:"+濕地", fn:()=>{ bump("wet",rint(3,5)); return "濕地調校到位，下雨你就是王。"; }},
   ]},
  {tag:"心態", title:"連續失利的低潮", desc:"幾站沒進分，你開始懷疑自己。",
   choices:[
     {t:"找運動心理師", s:"+穩定", fn:()=>{ bump("cons",rint(3,5)); return "重整心態後，你變得更難被擊倒。"; }},
     {t:"加練找回手感", s:"+速度", fn:()=>{ bump("pace",rint(2,4)); return "多跑的每一圈都化為速度。"; }},
   ]},
];
function bump(key, amt){ G.attrs[key] = clamp(G.attrs[key] + amt, 10, 99); updateAttrs(); }

function maybeEvent(){
  const ev = pick(EVENTS);
  showModal(ev.title, ev.desc, ev.choices.map(c=>({
    label:`${c.t} <small>${c.s}</small>`, risky:c.risky,
    fn:()=>{ const res = c.fn(); updateHeader(); save();
             addCard(`<div class="ct"><span class="newsflag">🗞️</span> ${ev.tag}</div><div class="cb">${res}</div>`,""); }
  })), ev.tag);
}

/* ========================================================= */
/*  投資訓練：花資產提升能力，但有失敗風險                    */
/* ========================================================= */
const INVESTMENTS = [
  {icon:"🏋️", name:"高強度訓練營", cost:14, chance:0.72, boost:"提升 體能",
     ok:()=>{ bump("fit",rint(4,8)); return "魔鬼課表見效，體能大幅提升！"; },
     bad:()=>{ bump("fit",-rint(1,3)); return "訓練過度拉傷，體能不升反降…"; }},
  {icon:"🖥️", name:"私人模擬器", cost:18, chance:0.75, boost:"提升 速度 或 車技",
     ok:()=>{ const k=pick(["pace","craft"]); bump(k,rint(4,7)); return (k==="pace"?"單圈速度":"車技")+"顯著進步！"; },
     bad:()=>{ return "設備水土不服，這筆錢幾乎打了水漂。"; }},
  {icon:"🧠", name:"運動心理師", cost:12, chance:0.78, boost:"提升 穩定",
     ok:()=>{ bump("cons",rint(4,7)); return "心態更沉穩，失誤明顯變少！"; },
     bad:()=>{ return "頻率對不上，沒什麼效果。"; }},
  {icon:"🌧️", name:"雨天特訓", cost:12, chance:0.70, boost:"提升 濕地",
     ok:()=>{ bump("wet",rint(5,9)); return "雨戰能力大增，下雨就是你的舞台！"; },
     bad:()=>{ bump("fit",-rint(1,2)); return "冒雨苦練反而感冒，狀態略降。"; }},
  {icon:"📣", name:"頂級公關團隊", cost:20, chance:0.70, boost:"提升 聲望",
     ok:()=>{ G.rep=clamp(G.rep+rint(5,10),0,100); return "形象行銷成功，聲望大漲！"; },
     bad:()=>{ G.rep=clamp(G.rep-rint(2,5),0,100); return "行銷翻車引發爭議，聲望受損！"; }},
];
function openInvest(){
  if(G.over || busy || seasonClosing) return;
  const money = G.money||0;
  const opts = INVESTMENTS.map(inv=>{
    const afford = money >= inv.cost;
    return {
      label:`${inv.icon} ${inv.name} <small>🔧 ${inv.boost}　·　花費 ${inv.cost}M · 成功率 ${Math.round(inv.chance*100)}%${afford?"":" · 💸資金不足"}</small>`,
      risky: afford && inv.chance <= 0.72,
      fn: ()=>{ if(!afford){ addCard(`<div class="ct"><span class="newsflag">💰</span> 投資</div><div class="cb">資產不足，無法進行「${inv.name}」（需 ${inv.cost}M）。</div>`,""); return; } doInvest(inv); }
    };
  });
  opts.push({ label:"暫不投資", fn:()=>{} });
  showModal(`💰 投資訓練 — 資產 ${money}M`, "花錢投資自己來提升能力，但每次嘗試都有失敗風險（可能浪費資金，甚至倒扣能力或聲望）。", opts, "投資");
}
function doInvest(inv){
  G.money = (G.money||0) - inv.cost;
  const success = rand() < inv.chance;
  const txt = success ? inv.ok() : inv.bad();
  updateHeader(); save();
  addCard(`<div class="ct"><span class="newsflag">💰</span> 投資 · ${inv.name}</div>`+
          `<div class="ch">${success?"✅ 成功":"❌ 失敗"}</div>`+
          `<div class="cb">${txt}（花費 ${inv.cost}M，剩餘資產 ${G.money}M）</div>`,"");
}

/* ========================================================= */
/*  突發狀況 / 傷病：降低評分或缺賽                            */
/* ========================================================= */
const MISFORTUNES = [
  {tag:"傷病", title:"重感冒來襲", desc:"賽前你發起高燒、全身無力。",
   choices:[
     {t:"退賽專心養病", s:"缺賽 1 場 · 保住身體", fn:()=>{ G.missNext=1; G.missReason="感冒發燒"; return "你決定退賽休養，下一站將缺席。"; }},
     {t:"打針硬撐上場", s:"風險：狀態大跌", risky:true, fn:()=>{ if(rand()<0.5){ bump("fit",-rint(3,6)); return "你撐完全程，但體能嚴重透支。"; } bump("fit",-2); return "靠意志力完賽，影響不算大。"; }},
   ]},
  {tag:"意外", title:"訓練摔車受傷", desc:"一次自由車訓練，你摔傷了手腕。",
   choices:[
     {t:"開刀徹底休養", s:"缺賽 2 場", fn:()=>{ G.missNext=2; G.missReason="手腕骨折"; return "你需要缺席兩站養傷。"; }},
     {t:"戴護具硬上", s:"風險：車技下降", risky:true, fn:()=>{ bump("craft",-rint(2,5)); return "傷勢影響了你的操控手感。"; }},
   ]},
  {tag:"突發", title:"食物中毒", desc:"賽前晚餐出了狀況，你上吐下瀉。",
   choices:[
     {t:"吊點滴休息", s:"-體能", fn:()=>{ bump("fit",-rint(2,4)); return "勉強恢復，但體能受到影響。"; }},
     {t:"缺賽一場", s:"缺賽 1 場", fn:()=>{ G.missNext=1; G.missReason="腸胃炎"; return "身體撐不住，你缺席了這一站。"; }},
   ]},
  {tag:"狀態", title:"莫名低潮", desc:"最近你怎麼跑都不對勁，信心低落。",
   choices:[
     {t:"找教練調整", s:"-穩定 -聲望", fn:()=>{ bump("cons",-rint(1,3)); G.rep=clamp(G.rep-2,0,100); return "低潮暫時影響了你的穩定與聲望。"; }},
   ]},
  {tag:"傷病", title:"頸部舊傷復發", desc:"高 G 力讓你的頸部舊傷再度發作。",
   choices:[
     {t:"物理治療", s:"-體能", fn:()=>{ bump("fit",-rint(2,4)); return "需要時間慢慢恢復。"; }},
     {t:"缺賽休養", s:"缺賽 1 場", fn:()=>{ G.missNext=1; G.missReason="頸部傷勢"; return "你選擇缺席一站徹底休養。"; }},
   ]},
];
function misfortune(){
  const m = pick(MISFORTUNES);
  showModal("⚠️ "+m.title, m.desc, m.choices.map(c=>({
    label:`${c.t} <small>${c.s}</small>`, risky:c.risky,
    fn:()=>{ const res = c.fn(); updateHeader(); save();
             addCard(`<div class="ct"><span class="newsflag">⚠️</span> ${m.tag}</div><div class="cb">${res}</div>`,""); }
  })), m.tag);
}

/* ========================================================= */
/*  UI 渲染                                                  */
/* ========================================================= */
function addCard(html, cls){
  const feed = $("#feed");
  const d = document.createElement("div");
  d.className = "card" + (cls?(" "+cls):"");
  d.innerHTML = html;
  feed.appendChild(d);
  while(feed.children.length > 60) feed.removeChild(feed.firstChild);   // 限制卡片數避免過長
  // 等版面完成後自動捲到底（每場比賽後不用再手動下滑）
  requestAnimationFrame(()=>{ feed.scrollTop = feed.scrollHeight; });
}
function clearFeed(){ $("#feed").innerHTML = ""; }
// 新賽季第一場開始時清空主畫面，並放上開場卡（生涯第一場除外，保留開場介紹）
function newSeasonScreen(){
  if(G.round !== 0 || !G.totals || G.totals.races === 0) return;
  clearFeed();
  const t = TIERS[G.tier];
  const teamName = G.tier==="F1" ? (teamByKey(G.teamKey)?.name||"") : t.name;
  addCard(`<div class="ct">🏁 賽季 ${G.season} 開始 · ${t.name}</div><div class="ch">${teamName}</div>`+
          `<div class="cb">${G.age} 歲，新的一季展開 — 全力爭取榮耀！</div>`,"season");
}
function log_intro(){
  const c = COUNTRIES.find(c=>c[1]===G.country) || ["🏁",""];
  addCard(`<div class="ct">生涯開始</div><div class="ch">${c[0]} ${G.name} #${G.number}</div>`+
          `<div class="cb">${G.age} 歲，於 <b>${TIERS[G.tier].name}</b> 展開賽車人生。天賦評級 ${ratingWord(G.potential)}。目標：世界冠軍 🏆</div>`,"season");
}
function ratingWord(p){ return p>=75?"★★★ 天才":p>=55?"★★ 可造之材":"★ 大器晚成"; }

function renderResultCard(r){
  let cls, label;
  if(r.dns){ cls="pdnf"; label="DNS"; }
  else if(r.dnf){ cls="pdnf"; label="DNF"; }
  else cls = r.pos===1?"p1":r.pos===2?"p2":r.pos===3?"p3":"pmid", label="P"+r.pos;
  // 主畫面只顯示：名次 + 分站名稱
  const sub = r.dns
    ? `<span style="color:var(--lgrey)">缺賽 · ${r.reason}</span>`
    : r.dnf
    ? `<span style="color:var(--red)">退賽原因 · ${r.reason}</span>`
    : `本站積分 <b style="color:var(--gold)">+${r.pts||0}</b>`;
  addCard(
    `<div class="res-pos ${cls}">${label}<small>${r.tierShort} · R${G.round}</small></div>`+
    `<div class="res-main"><div class="rt">${r.track} 大獎賽 ${r.wet?"🌧️":""}</div>`+
    `<div class="rs">${sub}</div></div>`,
    "result");
}

function renderSeasonCard(table, myPos, champ, teamName, salary){
  const top = table.slice(0,5).map((e,i)=>{
    return `<tr class="${e.isMe?'me':''}"><td class="mp">${i+1}</td><td>${e.label}</td><td class="mpt">${e.pts}</td></tr>`;
  }).join("");
  const meRow = myPos>5 ? `<tr class="me"><td class="mp">${myPos}</td><td>${G.name}</td><td class="mpt">${table[myPos-1].pts}</td></tr>` : "";
  const ss = G.seasonStat;
  addCard(
    `<div class="ct">🏁 賽季 ${G.season} 結束 · ${TIERS[G.tier].name}</div>`+
    `<div class="ch">${champ?"🏆 賽季冠軍！":"WDC 第 "+myPos+" 名"}</div>`+
    `<div class="cb">${teamName}｜${ss.wins} 勝 · ${ss.podiums} 登台 · ${ss.poles} 桿位 · ${ss.points} 分　<span style="color:var(--lgrey)">薪資 +${salary}M</span></div>`+
    `<table class="mini-tbl">${top}${meRow}</table>`,
    "season");
}

function updateHeader(){
  const c = COUNTRIES.find(c=>c[1]===G.country) || ["",""];
  $("#hName").textContent = G.name;
  $("#hNum").textContent = "#"+G.number;
  const t=TIERS[G.tier];
  const teamName = G.tier==="F1" ? (teamByKey(G.teamKey)?.name||"") : t.name;
  $("#hTeam").innerHTML = `<span class="tier-badge" style="background:${t.color}">${t.short}</span> ${teamName}`;
  $("#hAge").textContent = G.age;
  $("#hSeason").textContent = G.season;
  $("#hRound").textContent = G.round+"/"+t.races;
  $("#hRep").textContent = Math.round(G.rep);
  $("#hPts").textContent = G.seasonStat? G.seasonStat.points : 0;
  const mEl = $("#hMoney"); if(mEl) mEl.textContent = (G.money||0)+"M";
  updateAttrs();
}
function updateAttrs(){
  $("#attrStrip").innerHTML = ATTRS.map(a=>{
    const v=Math.round(G.attrs[a.key]);
    return `<div class="attr"><div class="an">${a.name}</div><div class="attr-num">${v}</div><div class="bar"><span style="width:${v}%"></span></div></div>`;
  }).join("");
}
function render(){ updateHeader(); }

/* ---------- 主按鈕狀態 ---------- */
function setMainBtn(text, fn){
  const b=$("#mainBtn"); b.textContent=text; b.onclick=fn; b.disabled=false;
  $("#ffBtn").disabled = (G.tier && G.round>=TIERS[G.tier].races);
  const inv=$("#investBtn"); if(inv) inv.disabled=false;   // 轉場後重新啟用投資鈕（修：升上 F1 後投資鈕卡住）
}
function hintSeasonEnd(){ setMainBtn("🏁 結算賽季", ()=>endSeason()); $("#ffBtn").disabled=true; }

/* ---------- Modal ---------- */
function showModal(title, desc, choices, tag){
  $("#mTag").textContent = tag||"事件";
  $("#mTitle").textContent = title;
  $("#mDesc").textContent = desc;
  const box=$("#mChoices"); box.innerHTML="";
  choices.forEach(c=>{
    const b=document.createElement("button");
    b.className="choice"+(c.risky?" risky":"");
    b.innerHTML=c.label;
    b.onclick=()=>{ $("#overlay").classList.remove("show"); c.fn && c.fn();
                    $("#feed").scrollTop=$("#feed").scrollHeight; };
    box.appendChild(b);
  });
  $("#overlay").classList.add("show");
}

/* ========================================================= */
/*  存檔                                                     */
/* ========================================================= */
function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(G)); }catch(e){} }
function load(){ try{ const s=localStorage.getItem(SAVE_KEY); return s?JSON.parse(s):null; }catch(e){ return null; } }
function resumeGame(g){
  G=g; seasonClosing=false; busy=false;
  $("#startScreen").classList.remove("show");
  $("#retireScreen").classList.remove("show");
  $("#feed").innerHTML="";
  addCard(`<div class="ct">讀取存檔</div><div class="cb">歡迎回來，${G.name}。繼續你的生涯。</div>`,"");
  updateHeader();
  if(G.over){ retire(); }
  else { setMainBtn(G.round>=TIERS[G.tier].races ? "🏁 結算賽季":"下一場 ▶",
                    G.round>=TIERS[G.tier].races ? ()=>endSeason() : nextRace); }
}

/* ========================================================= */
/*  開始畫面互動                                             */
/* ========================================================= */
let selMode="karting";
function initStart(){
  // 國家下拉
  $("#inCountry").innerHTML = COUNTRIES.map(c=>`<option value="${c[1]}">${c[0]} ${c[1]}</option>`).join("");
  // 模式選擇
  document.querySelectorAll(".mopt").forEach(o=>{
    o.onclick=()=>{ document.querySelectorAll(".mopt").forEach(x=>x.classList.remove("sel")); o.classList.add("sel"); selMode=o.dataset.mode; };
  });
  // 繼續
  const saved=load();
  if(saved && !saved.over){ $("#continueBtn").style.display="inline-block";
    $("#continueBtn").textContent=`繼續：${saved.name} · S${saved.season} · ${TIERS[saved.tier].name} ▶`;
    $("#continueBtn").onclick=()=>resumeGame(saved); }
  $("#startBtn").onclick=()=>{
    const name=($("#inName").value||"").trim();
    if(!name){ $("#startErr").textContent="請先輸入車手名字。"; return; }
    const num=clamp(parseInt($("#inNum").value)||7,1,99);
    const country=$("#inCountry").value;
    const talent=parseInt($("#inTalent").value);
    bumpPlayCount();                       // 全球遊玩次數 +1
    $("#startScreen").classList.remove("show");
    $("#feed").innerHTML="";
    newGame(name,num,country,selMode,talent);
    setMainBtn("下一場 ▶", nextRace);
  };
  $("#againBtn").onclick=()=>{ $("#retireScreen").classList.remove("show"); $("#startScreen").classList.add("show"); };
  fetchPlayCount();                        // 載入時顯示目前全球遊玩次數
}

/* ========================================================= */
/*  全球總遊玩次數（免費計數 API：Abacus，免註冊、支援 CORS）  */
/*  想避免與他人衝突可自行更換 COUNT_NS 命名空間               */
/* ========================================================= */
const COUNT_API = "https://abacus.jasoncameron.dev";
const COUNT_NS  = "f1careerlifesim";   // 命名空間（可自訂，改了要先呼叫 /create 建立）
const COUNT_KEY = "plays";
function showPlayCount(n){
  const el = $("#playCount");
  if(el && typeof n === "number") el.textContent = `🌍 全球已開始 ${n.toLocaleString()} 段生涯`;
}
// Abacus 的 key 必須先 create 才會被 get 看到；抓不到就自動建立
function fetchPlayCount(){
  fetch(`${COUNT_API}/get/${COUNT_NS}/${COUNT_KEY}`)
    .then(r=> r.ok ? r.json() : fetch(`${COUNT_API}/create/${COUNT_NS}/${COUNT_KEY}`).then(()=>({value:0})))
    .then(d=>{ if(d && typeof d.value==="number") showPlayCount(d.value); })
    .catch(()=>{});   // 離線或服務異常時靜默略過
}
function bumpPlayCount(){
  const hit = ()=> fetch(`${COUNT_API}/hit/${COUNT_NS}/${COUNT_KEY}`).then(r=>r.json());
  fetch(`${COUNT_API}/get/${COUNT_NS}/${COUNT_KEY}`)
    .then(r=> r.ok ? hit() : fetch(`${COUNT_API}/create/${COUNT_NS}/${COUNT_KEY}`).then(hit))  // 沒建立就先建立再計數
    .then(d=>{ if(d && typeof d.value==="number") showPlayCount(d.value); })
    .catch(()=>{});
}

/* ---------- 首頁跑馬燈新聞條 ---------- */
const NEWS_TEXT = "🏁 大改版更新！✨ 排版更新、💰 資產與投資系統、🤝 多年期代言合約（還會遇到贊助商爆醜聞、財務危機）、⚠️ 突發傷病、🌍 全球遊玩次數、✨ 退休畫面重整、🌐 更多國籍與更耐玩的職涯機制。快建立你的車手，展開屬於你的傳奇 🏆";
function initNews(){
  const el = $("#newsContent"); if(!el) return;
  const sep = "　　🏁　　";
  el.textContent = (NEWS_TEXT + sep).repeat(2);          // 內容重複兩份，配合 translateX(-50%) 無縫循環
  el.style.animationDuration = Math.max(20, NEWS_TEXT.length * 0.42).toFixed(0) + "s";  // 依字數調整速度
}
initNews();

/* ---------- 綁定 ---------- */
$("#mainBtn").onclick = ()=>nextRace();
$("#ffBtn").onclick   = ()=>fastForwardSeason();
$("#investBtn").onclick = ()=>openInvest();
initStart();
