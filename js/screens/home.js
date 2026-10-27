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
  const grid = [0, 5, 10].map(v => `<line x1="${pad}" x2="${W - pad}" y1="${y(v)}" y2="${y(v)}" stroke="#e6e0d6"/><text x="4" y="${y(v) + 4}" fill="#6f685f" font-size="13">${v}</text>`).join('');
  const dots = pts.map((e, i) => `<circle cx="${x(i)}" cy="${y(e.overall)}" r="4" fill="${e.grade.asked_for_sale ? '#3f7d5c' : '#fffdfa'}" stroke="#3f7d5c" stroke-width="2"><title>${esc(new Date(e.date).toLocaleDateString())} — ${e.overall}${e.grade.asked_for_sale ? ' (asked for the next step)' : ''}</title></circle>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="margin-top:8px;display:block">${grid}<polyline points="${line}" fill="none" stroke="#3f7d5c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${dots}</svg>
    <div class="small muted">A filled dot means you asked for the next step on that call.</div>`;
}

function renderHome() {
  const first = (profile?.name || settings.myName || '').split(' ')[0];
  $('home-hello').textContent = first ? `Hi ${first}` : 'Ready to practice?';
  const s = seller(), cat = sellerCat();
  const job = professionByName(s.profession);
  $('biz-emoji').textContent = job?.emoji || cat.emoji;
  $('biz-name').textContent = s.profession || cat.label;
  $('biz-company').textContent = s.company || '';
  $('biz-offer').textContent = s.offer || 'Tap Edit to say what you sell.';
  $('biz-target').textContent = targetText(callTarget());
  $('home-tune').classList.toggle('hidden', !!s.offer && !s.quick);
  $('call-cards').innerHTML = userCallTypes().map(k => { const c = CALL_TYPES[k]; return `
    <button class="call-row" data-call="${k}"><span class="mode-icon">${icon(c.icon, 22)}</span><span class="call-row-text"><b>${esc(c.plain || c.label)}</b><span>${esc((c.plain || '').toLowerCase().includes(c.label.toLowerCase()) ? c.desc : c.label)}</span></span>${icon('arrow')}</button>`; }).join('');
  document.querySelectorAll('[data-call]').forEach(b => b.onclick = () => startCall(buildConfig('random', { callType: b.dataset.call })));
  const n = history.length;
  const avg = n ? (history.slice(0, 5).reduce((a, e) => a + e.overall, 0) / Math.min(n, 5)).toFixed(1) : null;
  const best = n ? Math.max(...history.map(e => e.overall)).toFixed(1) : null;
  const asked = history.filter(e => e.grade.asked_for_sale).length;
  $('home-stats').innerHTML = n
    ? `<b>${n} practice call${n === 1 ? '' : 's'}</b><span>Recent average ${avg} out of 10 · Best ${best} · You asked for the next step in ${asked} of ${n}</span>`
    : '<b>No calls yet</b><span>Your scores show up here after your first practice call.</span>';
  $('home-trend').innerHTML = n ? trendSVG(history) : '';
  $('unlock-note').innerHTML = `<span class="row" style="gap:6px">${brutalUnlocked() ? `${icon('unlock', 16)} Brutal unlocked` : `${icon('lock', 16)} Brutal unlocks after ${BRUTAL_UNLOCK} calls`}</span>`;
}

function renderHistory() {
  $('hist-trend').innerHTML = trendSVG(history);
  $('hist-list').innerHTML = history.length ? history.map((e, i) => `
    <div class="hist-row" data-i="${i}">
      <span class="small muted">${new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${new Date(e.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
      <span>${esc(e.persona.card_summary)}</span>
      <span class="hide-sm"><span class="pill">${esc(CALL_TYPES[e.callType]?.label || e.mode)} · ${esc(DIFFICULTY_LABELS[e.difficulty] || e.difficulty)}</span> ${e.grade.asked_for_sale ? '<span class="pill green">asked</span>' : '<span class="pill red">didn\'t ask</span>'}</span>
      <b style="text-align:right;color:${scoreColor(e.overall)}">${e.overall.toFixed(1)}</b>
    </div>`).join('') : '<p class="muted" style="padding:0 16px 16px">No calls yet.</p>';
  document.querySelectorAll('.hist-row').forEach(r => r.onclick = () => openEntry(history[+r.dataset.i]));
}
