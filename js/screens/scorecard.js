// Pitch Booth — The scorecard shown after a call.
'use strict';

/* ---------- scorecard ---------- */
const scoreColor = v => v >= 7 ? 'var(--green)' : v >= 5 ? 'var(--amber)' : 'var(--red)';


function renderScorecard(e, justUnlocked = false) {
  const g = e.grade, p = e.persona;
  const ratio = e.metrics.statements ? (e.metrics.questions / e.metrics.statements).toFixed(1) : '—';
  const outcomeLabel = { hung_up: 'Owner hung up', no_interest: 'Not interested', maybe_later: 'Maybe later', follow_up_agreed: 'Agreed to a follow-up', meeting_booked: 'Meeting booked', sale: 'Sale!' }[g.outcome] || g.outcome;
  $('view-score').innerHTML = `
    ${justUnlocked ? `<div class="banner warn">${icon('unlock')}<span>Hard calls unlocked. People will interrupt, go cold, and stack objections.</span></div>` : ''}
    <div class="card">
      <div class="score-head">
        <div><div class="small muted" style="font-weight:600;margin-bottom:4px">Pitch Check</div><div class="big" style="color:${scoreColor(e.overall)}">${e.overall.toFixed(1)}</div><div class="small muted">overall / 10</div></div>
        <div style="flex:1;min-width:220px">
          <div style="font-family:var(--serif);font-size:28px;line-height:1.15">${esc(p.card_summary)}</div>
          <div class="small muted">${esc(modeLabel(e))}${e.objection ? ` · “${esc(e.objection)}”` : ''} · ${fmt(e.durationSecs)} · ${new Date(e.date).toLocaleString()}</div>
          <div style="margin-top:6px"><span class="pill ${/meeting|sale|follow/.test(g.outcome) ? 'green' : ''}">${esc(outcomeLabel)}</span>${e.customerType ? ` <span class="pill">You talked to: ${esc(e.customerType)}</span>` : ''}</div>
        </div>
      </div>
      <p style="margin:14px 0 0">${esc(g.summary)}</p>
      ${g.asked_for_sale
        ? `<div class="flag good">${icon('check')}<div><b>You asked for the next step.</b>${g.asked_for_sale_quote ? `<div class="quote">“${esc(g.asked_for_sale_quote)}”</div>` : ''}</div></div>`
        : `<div class="flag bad">${icon('flag')}<div><b>You never asked for the next step.</b> Most beginners don't. Next call, ask directly for something concrete${seller().goal ? `, like: ${esc(seller().goal)}` : ', like a time to meet this week'}.</div></div>`}
    </div>
    <div class="two">
      <div class="card">
        <h2>Scores</h2>
        <div class="bars">${SCORE_KEYS.map(([k, label]) => {
          const v = g.scores[k];
          return `<div class="bar"><span>${label}</span><div class="track"><div class="fill" style="width:${v * 10}%;background:${scoreColor(v)}"></div></div><b style="text-align:right">${v > 0 ? v : '—'}</b></div>`;
        }).join('')}</div>
        <div style="margin-top:14px">
          <div class="kv"><span>Discovery questions</span><span>${e.metrics.discovery}</span></div>
          <div class="kv"><span>Question : statement ratio</span><span>${ratio}</span></div>
          ${e.metrics.openerSecs != null ? `<div class="kv"><span>Opener length</span><span>${e.metrics.openerSecs}s</span></div>` : ''}
        </div>
      </div>
      <div class="card">
        <h2>What you did well</h2>
        <ul class="clean">${(g.did_well || []).slice(0, 2).map(d => `<li>${esc(d.point)}${d.quote ? `<div class="quote">“${esc(d.quote)}”</div>` : ''}</li>`).join('')}</ul>
        <h2 style="margin-top:18px">Fix this next rep</h2>
        <p style="margin:0"><b>${esc(g.fix_next.issue)}</b></p>
        <p class="small muted" style="margin:4px 0">${esc(g.fix_next.why)}</p>
        <p class="small" style="margin:6px 0 0">Try: <i>“${esc(g.fix_next.try_saying)}”</i></p>
        <p class="small" style="margin:12px 0 0"><b>Drill:</b> ${esc(g.drill)}</p>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <h2>What ${esc(p.name.split(' ')[0])} was really thinking</h2>
      <p style="margin:0">${esc(g.hidden_agenda_reveal)}</p>
      <p class="small muted" style="margin:8px 0 0">Objections: ${p.objections.map(o => `“${esc(o)}”`).join(', ')} · Would have won them over: ${esc(p.win_condition)}</p>
      ${e.traits?.length ? `<p class="small muted" style="margin:6px 0 0">Personality: ${e.traits.map(esc).join(' · ')}</p>` : ''}
    </div>
    <div class="card" style="margin-top:16px">
      <details><summary>Full transcript</summary>
        <div class="transcript" style="height:auto;max-height:none;padding:14px 0 0">${(e.turns || []).map(t => t.who === 'sys'
          ? `<div class="msg sys">${esc(t.text)}</div>`
          : `<div class="msg ${t.who}"><div class="who">${esc(t.who === 'me' ? (settings.myName || 'You') : p.name.split(' ')[0])} · ${fmt(t.t)}</div>${esc(t.text)}</div>`).join('')}</div>
      </details>
    </div>
    <div class="row" style="margin-top:16px">
      <button class="btn primary" id="sc-again">Call again (same setup)</button>
      <button class="btn" id="sc-home">Home</button>
    </div>`;
  $('sc-again').onclick = () => startCall(buildConfig(e.setup?.mode || e.mode, e.setup?.opts || {}));
  $('sc-home').onclick = () => show('home');
}
