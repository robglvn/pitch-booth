// Pitch Booth — The home screen and call history.
'use strict';

/* ---------- home / history ---------- */
function trendSVG(entries) {
  const pts = entries.slice(0, 30).reverse();
  if (pts.length < 2) return `<p class="muted small" style="margin:10px 0 0">${pts.length ? 'One call down. Your trend shows up after the second.' : 'Finish a call to start tracking your scores.'}</p>`;
  const W = 640, H = 150, pad = 24;
  const x = i => pad + (i * (W - pad * 2)) / (pts.length - 1);
  const y = v => H - pad - (v / 10) * (H - pad * 2);
  const line = pts.map((e, i) => `${x(i).toFixed(1)},${y(e.overall).toFixed(1)}`).join(' ');
  const grid = [0, 5, 10].map(v => `<line x1="${pad}" x2="${W - pad}" y1="${y(v)}" y2="${y(v)}" stroke="#e6e0d6"/><text x="4" y="${y(v) + 4}" fill="#a39b91" font-size="11">${v}</text>`).join('');
  const dots = pts.map((e, i) => `<circle cx="${x(i)}" cy="${y(e.overall)}" r="4" fill="${e.grade.asked_for_sale ? '#3f7d5c' : '#fffdfa'}" stroke="#3f7d5c" stroke-width="2"><title>${esc(new Date(e.date).toLocaleDateString())} — ${e.overall}${e.grade.asked_for_sale ? ' (asked for the sale)' : ''}</title></circle>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="margin-top:8px;display:block">${grid}<polyline points="${line}" fill="none" stroke="#3f7d5c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${dots}</svg>
    <div class="small muted">Filled dot = you asked for the sale.</div>`;
}

function renderHome() {
  $('home-hello').classList.toggle('hidden', !profile?.name);
  $('home-hello').textContent = profile?.name ? `Hi ${profile.name.split(' ')[0]} — ready for a rep?` : '';
  $('home-tune').classList.toggle('hidden', !!seller().offer && !seller().quick);
  $('call-cards').innerHTML = userCallTypes().map(k => { const c = CALL_TYPES[k]; return `
    <button class="mode" data-call="${k}"><span class="mode-icon">${icon(c.icon, 24)}</span><h3>${esc(c.label)}</h3><p>${esc(c.home)}</p></button>`; }).join('');
  document.querySelectorAll('[data-call]').forEach(b => b.onclick = () => startCall(buildConfig('random', { callType: b.dataset.call })));
  const n = history.length;
  const last5 = history.slice(0, 5);
  const avg = last5.length ? (last5.reduce((a, e) => a + e.overall, 0) / last5.length).toFixed(1) : '—';
  const askRate = n ? Math.round(history.filter(e => e.grade.asked_for_sale).length / n * 100) + '%' : '—';
  const best = n ? Math.max(...history.map(e => e.overall)).toFixed(1) : '—';
  $('home-stats').innerHTML = [
    ['Calls completed', n], ['Avg (last 5)', avg], ['Asked for the sale', askRate], ['Best score', best],
  ].map(([k, v]) => `<div class="card stat"><div class="v">${v}</div><div class="k">${k}</div></div>`).join('');
  $('home-trend').innerHTML = trendSVG(history);
  $('unlock-note').innerHTML = `<span class="row" style="gap:6px">${brutalUnlocked() ? `${icon('unlock', 16)} Brutal unlocked` : `${icon('lock', 16)} Brutal unlocks after ${BRUTAL_UNLOCK} calls (${n}/${BRUTAL_UNLOCK})`}</span>`;
}

function renderHistory() {
  $('hist-trend').innerHTML = trendSVG(history);
  $('hist-list').innerHTML = history.length ? history.map((e, i) => `
    <div class="hist-row" data-i="${i}">
      <span class="small muted">${new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${new Date(e.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
      <span>${esc(e.persona.card_summary)}</span>
      <span class="hide-sm"><span class="pill">${esc(CALL_TYPES[e.callType]?.label || e.mode)} · ${esc(e.difficulty)}</span> ${e.grade.asked_for_sale ? '<span class="pill green">asked</span>' : '<span class="pill red">no ask</span>'}</span>
      <b style="text-align:right;color:${scoreColor(e.overall)}">${e.overall.toFixed(1)}</b>
    </div>`).join('') : '<p class="muted" style="padding:0 16px 16px">No calls yet.</p>';
  document.querySelectorAll('.hist-row').forEach(r => r.onclick = () => openEntry(history[+r.dataset.i]));
}
