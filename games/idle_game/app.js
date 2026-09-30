/* Browser UI. The deterministic economy is in engine.js. */
'use strict';
const E = Airline, C = E.config, $ = id => document.getElementById(id);
const money = n => '$' + (n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : Math.floor(n).toLocaleString('en-US'));
let state = E.fresh(), tab = 'airline', activity = [], toastTimer, last = Date.now(), lastSave = last;
const fleetNodes = new Map(), mapNodes = new Map();
let mapAirportCount = -1, lastDetails = -Infinity;
const setText = (el, value) => { const text = String(value); if (el.textContent !== text) el.textContent = text; };
const setProp = (el, key, value) => { if (el[key] !== value) el[key] = value; };
function updateBalance() {
  // Show cents so passive earnings remain visible between whole-dollar changes.
  setText($('cash'), state.cash < 1e6 ? '$' + state.cash.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : money(state.cash));
}
function toast(message) { setText($('toast'), message); $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3500); }
function save() {
  try { localStorage.setItem(C.saveKey, JSON.stringify({ state, savedAt: Date.now() })); setText($('save-status'), '● SAVED LOCALLY'); }
  catch { setText($('save-status'), '○ SAVE UNAVAILABLE'); }
}
try {
  const stored = localStorage.getItem(C.saveKey);
  if (stored) {
    const data = JSON.parse(stored);
    if (!E.valid(data.state) || !Number.isFinite(data.savedAt)) throw new Error('Invalid save');
    state = data.state;
    const away = Math.min(C.offlineLimitHours * 3600, Math.max(0, (Date.now() - data.savedAt) / 1000)), before = state.cash;
    const events = E.tick(state, away); activity = events.slice(-5).reverse();
    if (away > 15) setTimeout(() => toast(`Welcome back! Your airline earned ${money(state.cash - before)} while away.`), 500);
  }
} catch { toast('Your save could not be loaded. A fresh airline is ready.'); }
const descriptions = {
  ticket: { name: 'Ticket price', icon: '$', desc: s => `${money(s.ticket)} → ${money(s.ticket + C.ticket.step)} per passenger` },
  capacity: { name: 'Seat capacity', icon: '⊞', desc: s => `${s.capacity} → ${s.capacity + C.capacity.step} seats per plane` },
  plane: { name: 'Buy plane', icon: '✈', desc: () => 'Add a plane in Berlin. Includes all fleet upgrades.' },
  speed: { name: 'Flight speed', icon: '↗', desc: s => `${s.speed.toFixed(2)}× → ${(s.speed + C.speed.step).toFixed(2)}× speed` },
  manager: { name: 'Auto-dispatch', icon: '◷', desc: s => state.levels.manager === 10 ? '1s wait · random destination · max level' : `${s.delay ? s.delay + 's → ' : ''}${C.manager.delays[state.levels.manager]}s wait · random destination` },
  passive: { name: 'Passive income', icon: '☕', desc: s => `${money(s.passive)}/sec → ${money(s.passive + C.passive.incomePerLevel)}/sec · no flights needed` }
};
function renderUpgrades() {
  const st = E.stats(state);
  $('upgrades').setAttribute('aria-labelledby', `tab-${tab}`);
  if (tab === 'airline') $('upgrades').innerHTML = Object.entries(descriptions).map(([type, d]) => {
    const price = E.cost(state, type), level = type === 'plane' ? `${state.planes.length} OWNED` : `LVL ${state.levels[type]}${type === 'manager' ? ' / 10' : ''}`;
    return `<article class="upgrade-item"><div class="upgrade-top"><span class="upgrade-icon">${d.icon}</span><span class="upgrade-name">${d.name}</span><span class="level">${level}</span></div><p>${d.desc(st)}</p><button class="buy-button" data-buy="${type}" ${state.cash < price ? 'disabled' : ''}><span>${price === Infinity ? 'Fully upgraded' : type === 'plane' ? 'Buy aircraft' : 'Upgrade'} <span aria-hidden="true">↗</span></span><b>${price === Infinity ? 'MAX' : money(price)}</b></button></article>`;
  }).join('');
  else $('upgrades').innerHTML = C.cities.map((c, i) => {
    const owned = i < state.unlocked, next = i === state.unlocked, price = Math.ceil(C.destinations.cost * C.destinations.growth ** (i - 2));
    return `<article class="upgrade-item"><div class="upgrade-top"><span class="upgrade-icon">${owned ? '⚑' : '⌖'}</span><span class="upgrade-name">${c.name}</span><span class="level">${c.id}</span></div><p>${c.country} · ~${c.demand} passengers per departure<br>Demand varies ±${C.flights.demandVariation * 100}%.</p><button class="buy-button" data-buy="destinations" ${!next || state.cash < price ? 'disabled' : ''}><span>${owned ? 'Connected ✓' : next ? 'Open airport ↗' : `Unlock ${C.cities[i - 1].name} first`}</span><b>${owned ? '' : money(price)}</b></button></article>`;
  }).join('');
}
function renderFleet() {
  $('fleet').classList.toggle('fleet-compact', state.planes.length > C.ui.compactFleetAbove);
  const ids = new Set(state.planes.map(p => p.id));
  for (const [id, nodes] of fleetNodes) if (!ids.has(id)) { nodes.el.remove(); fleetNodes.delete(id); }
  for (const p of state.planes) {
    if (fleetNodes.has(p.id)) continue;
    $('fleet').insertAdjacentHTML('beforeend', `<article class="plane-card" id="plane-${p.id}"><div class="plane-top"><span class="plane-name">AC-${String(p.id).padStart(3,'0')}</span><span class="status-pill" data-status></span></div><div class="plane-visual"><button class="plane-launch" data-depart="${p.id}" aria-label="Depart aircraft ${p.id}">✈</button></div><div class="route-row"><span class="airport-origin" data-origin></span><span class="route-arrow">→</span><select class="route-select" aria-label="Destination for aircraft ${p.id}" data-route="${p.id}">${C.cities.slice(0,state.unlocked).filter(c => c.id !== p.location).map(c => `<option value="${c.id}" ${c.id === p.destination ? 'selected' : ''}>${c.name} · ${c.id}</option>`).join('')}</select></div><div class="flight-detail"><span data-load></span><span data-revenue></span></div><div class="progress"><div data-progress></div></div><button class="depart-button" data-depart="${p.id}"></button></article>`);
    const el = $(`plane-${p.id}`), query = selector => el.querySelector(selector);
    fleetNodes.set(p.id, { el, origin: query('[data-origin]'), status: query('[data-status]'),
      route: query('[data-route]'), load: query('[data-load]'), revenue: query('[data-revenue]'),
      progress: query('[data-progress]'), button: query('.depart-button'),
      launch: query('.plane-launch'), optionsKey: '' });
  }
  updateFleet();
}
function updateFleet() {
  const st = E.stats(state);
  for (const p of state.planes) {
    const n = fleetNodes.get(p.id), f = p.flight;
    const optionsKey = `${p.location}:${state.unlocked}`;
    if (n.optionsKey !== optionsKey) {
      n.route.innerHTML = C.cities.slice(0,state.unlocked).filter(c => c.id !== p.location)
        .map(c => `<option value="${c.id}">${c.name} · ${c.id}</option>`).join('');
      n.optionsKey = optionsKey;
    }
    setText(n.origin, p.location);
    setProp(n.origin, 'title', E.city(p.location).name);
    setText(n.status, f ? 'IN THE AIR' : 'AT THE GATE');
    setProp(n.status, 'className', f ? 'status-pill flying' : 'status-pill');
    setProp(n.route, 'disabled', !!f);
    setProp(n.route, 'value', p.destination);
    setProp(n.route, 'title', st.delay ? 'Manual destination. Auto-dispatch picks randomly.' : 'Choose destination');
    setText(n.load, f ? `${f.passengers} × ${money(f.fare)}` : `${st.capacity} seats`);
    setText(n.revenue, f ? `${money(f.passengers * f.fare)} on arrival` : `~${E.city(p.location).demand} demand`);
    setProp(n.button, 'disabled', !!f); setProp(n.launch, 'disabled', !!f);
    setText(n.button, f ? `Landing in ${Math.ceil(f.remaining)}s` : st.delay ? `Depart · auto in ${Math.max(0, Math.ceil(st.delay - p.wait))}s` : 'Click to depart ↗');
  }
}
function updateProgress() {
  const delay = E.stats(state).delay;
  for (const p of state.planes) {
    const f = p.flight, progress = f ? 1 - f.remaining / f.duration : delay ? Math.min(1,p.wait / delay) : 0;
    setProp(fleetNodes.get(p.id).progress.style, 'transform', `scaleX(${progress.toFixed(5)})`);
  }
}
const point = c => ({ x: (c.lon + 180) / 360 * 900, y: (85 - c.lat) / 170 * 440 });
function renderMap() {
  if (mapAirportCount !== state.unlocked) {
  mapAirportCount = state.unlocked;
  $('map-cities').innerHTML = C.cities.map((c, i) => { const p = point(c); return `<g><title>${c.name} · ${i < state.unlocked ? 'Connected' : 'Locked'}</title><circle class="map-city ${i < state.unlocked ? '' : 'locked'}" cx="${p.x}" cy="${p.y}" r="${i < state.unlocked ? 5 : 3}"/>${i < state.unlocked ? `<text class="city-label" x="${p.x + 8}" y="${p.y + (c.id === 'FCO' ? 12 : -7)}">${c.id}</text>` : ''}</g>`; }).join('');
  }
  updateMap();
}
function updateMap() {
  const active = new Set();
  for (const p of state.planes) {
    const f = p.flight;
    if (!f) continue;
    active.add(p.id);
    let n = mapNodes.get(p.id);
    if (!n) {
      const route = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      route.setAttribute('class', 'route'); $('map-routes').appendChild(route);
      const plane = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      plane.setAttribute('class', 'flying-icon'); plane.setAttribute('text-anchor', 'middle');
      plane.setAttribute('dominant-baseline', 'central'); plane.textContent = '✈';
      $('map-planes').appendChild(plane);
      n = { route, plane, key: '' }; mapNodes.set(p.id, n);
    }
    const key = `${f.from}:${f.to}`;
    if (n.key !== key) {
      n.key = key; n.a = point(E.city(f.from)); n.b = point(E.city(f.to));
      n.angle = Math.atan2(n.b.y-n.a.y,n.b.x-n.a.x)*180/Math.PI;
      n.route.setAttribute('d', `M${n.a.x},${n.a.y} L${n.b.x},${n.b.y}`);
    }
    const t = 1 - f.remaining / f.duration;
    n.plane.setAttribute('transform', `translate(${n.a.x+(n.b.x-n.a.x)*t},${n.a.y+(n.b.y-n.a.y)*t}) rotate(${n.angle})`);
  }
  for (const [id,n] of mapNodes) if (!active.has(id)) { n.route.remove(); n.plane.remove(); mapNodes.delete(id); }
}
function renderActivity() {
  if (activity.length) $('activity-list').innerHTML = activity.slice(0,5).map(a => `<div class="arrival"><span>↙</span><div>AC-${String(a.plane).padStart(3,'0')} arrived in ${a.city}<small>${a.passengers} passengers</small></div><strong>+${money(a.revenue)}</strong></div>`).join('');
  else $('activity-list').innerHTML = '<p class="empty">No arrivals yet.</p>';
}
function updateMetrics() {
  const st = E.stats(state);
  updateBalance(); setText($('income'), `+${money(st.passive)} / sec passive`);
  setProp($('fleet-count'), 'innerHTML', `${String(state.planes.length).padStart(2,'0')} <em>aircraft</em>`);
  setProp($('city-count'), 'innerHTML', `${String(state.unlocked).padStart(2,'0')} <em>airports</em>`);
  setText($('airborne'), `${state.planes.filter(p => p.flight).length} in flight`);
  setText($('passengers'), `${state.passengers.toLocaleString()} passengers flown`);
  setText($('fare'), money(st.ticket)); setText($('capacity'), `${st.capacity} seats per aircraft`);
  setText($('fleet-badge'), state.planes.length);
  setText($('manager-status'), st.delay ? `Auto: ${st.delay}s · random route` : 'Manual dispatch');
  setText($('total-flights'), `${state.flights.toLocaleString()} flights completed`);
  document.querySelectorAll('[data-buy]').forEach(b => { if(tab === 'airline') setProp(b, 'disabled', state.cash < E.cost(state,b.dataset.buy)); else if (b.textContent.includes('Open airport')) setProp(b, 'disabled', state.cash < E.cost(state,'destinations')); });
}
function renderAll() { updateMetrics(); renderFleet(); renderMap(); renderUpgrades(); renderActivity(); updateProgress(); }
function advance() {
  const now = Date.now(), seconds = Math.min(C.offlineLimitHours * 3600, Math.max(0,(now-last)/1000)); last = now;
  const events = E.tick(state,seconds);
  if(events.length) { activity = [...events.reverse(),...activity].slice(0,5); renderFleet(); renderActivity(); }
  updateBalance(); updateProgress(); updateMap();
  if (events.length || now - lastDetails >= 200) { updateMetrics(); updateFleet(); lastDetails = now; }
  if(now-lastSave>3000) { save(); lastSave=now; }
}
$('fleet').addEventListener('click', event => { const b = event.target.closest('[data-depart]'); if(!b) return; advance(); const p=state.planes.find(p=>p.id===+b.dataset.depart); if(E.depart(state,p)) { updateFleet(); updateMetrics(); updateMap(); save(); } });
$('fleet').addEventListener('change', event => { const b=event.target.closest('[data-route]'); if(!b) return; const p=state.planes.find(p=>p.id===+b.dataset.route); if(!p.flight && C.cities.slice(0,state.unlocked).some(c=>c.id===b.value) && p.location!==b.value) { p.destination=b.value; save(); } });
$('upgrades').addEventListener('click', event => { const b=event.target.closest('[data-buy]'); if(!b || b.disabled) return; advance(); if(E.buy(state,b.dataset.buy)) { renderAll(); save(); toast(b.dataset.buy==='destinations' ? `${C.cities[state.unlocked-1].name} unlocked.` : 'Upgrade purchased.'); } });
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click',()=>{ tab=b.dataset.tab; document.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-selected',String(x===b))); renderUpgrades(); }));
document.querySelector('.tabs').addEventListener('keydown', event => { if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return; event.preventDefault(); const buttons=[...document.querySelectorAll('[data-tab]')]; const next=event.key==='Home'?buttons[0]:event.key==='End'?buttons[1]:buttons.find(b=>b.dataset.tab!==tab); next.click(); next.focus(); });
$('help-button').onclick=()=>$('help').showModal(); document.querySelectorAll('.close,.close-help').forEach(b=>b.onclick=()=>$('help').close());
$('reset-button').onclick=()=>$('reset-dialog').showModal(); $('cancel-reset').onclick=()=>$('reset-dialog').close();
$('confirm-reset').onclick=()=>{state=E.fresh();activity=[];last=Date.now();tab='airline';document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));save();renderAll();$('reset-dialog').close();toast('Airline reset.');};
window.addEventListener('pagehide',()=>{advance();save();});
document.addEventListener('visibilitychange',()=>{advance();save();});
renderAll();
// Paint at 30 FPS, aligned to browser frames. Simulation uses actual elapsed time.
const frameInterval = 1000 / 30;
let lastFrame = null;
function animate(timestamp) {
  if (lastFrame === null || timestamp - lastFrame >= frameInterval - 0.1) {
    const elapsed = lastFrame === null ? frameInterval : timestamp - lastFrame;
    lastFrame = timestamp - (elapsed >= frameInterval ? elapsed % frameInterval : 0);
    advance();
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
