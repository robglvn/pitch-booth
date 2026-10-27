// Pitch Booth — "Write your own" industry: Claude drafts the customer types and objections from the person's
// description, and they confirm or fix it before it's used. Used by the industry picker, the questionnaire,
// and quick start when a sentence doesn't match a built-in industry.
'use strict';

/* ---------- write your own industry ---------- */
let draft = null; // { offer, pack, note, onDone, quick, busy }

// opts: { offer, quick, onDone(pack), onBack() }
function openDraft(opts) {
  draft = { ...opts, pack: null, note: '' };
  show('welcome');
  ['w-join', 'w-about', 'w-quick-panel'].forEach(id => $(id).classList.add('hidden'));
  $('w-draft').classList.remove('hidden');
  runDraft();
}

async function runDraft() {
  const d = draft;
  $('d-title').innerHTML = 'Setting up <em>your practice</em>';
  $('d-lead').textContent = `Working out who you'll be calling for: "${d.offer}"`;
  $('d-body').innerHTML = '<div class="loading" style="padding:var(--s-8) 0"><div class="spinner"></div><div class="muted">This takes a few seconds…</div></div>';
  $('d-err').textContent = '';
  $('d-nav').classList.add('hidden');
  const { system, user } = usingProxy() ? {} : PROMPTS.industryDraftPrompt(d.offer, d.note, d.pack);
  try {
    const { json } = await callClaude({ model: roleModel('persona'), system, messages: [{ role: 'user', content: user }], maxTokens: 3000, effort: 'medium', schema: PROMPTS.INDUSTRY_SCHEMA, track: {}, role: 'draft',
      params: { description: d.offer, note: d.note, previous: d.pack ? { label: d.pack.label, customer: d.pack.customer, types: d.pack.types.map(t => ({ label: t.label })) } : null } });
    if (draft !== d) return;
    d.pack = {
      label: String(json.label || 'Your business').slice(0, 60),
      audience: json.audience === 'businesses' ? 'businesses' : 'people',
      customer: String(json.customer || '').slice(0, 200),
      types: (json.types || []).slice(0, 8).map(t => ({ label: String(t.label).slice(0, 60), desc: String(t.desc).slice(0, 240) })),
      objections: (json.objections || []).slice(0, 8).map(o => String(o).slice(0, 140)),
      goals: (json.goals || []).slice(0, 3).map(g => String(g).slice(0, 120)),
      calls: [...new Set((json.calls || []).filter(k => CALL_TYPES[k]))],
    };
    if (!d.pack.calls.length) d.pack.calls = ['interested', 'followup', 'past'];
    d.question = json.clear ? '' : String(json.question || 'Can you say a bit more about what you sell and who buys it?');
    d.note = '';
    renderDraft();
  } catch (e) {
    if (draft !== d) return;
    $('d-body').innerHTML = `<p style="margin:0">We couldn't set this up just now.</p>`;
    $('d-err').textContent = e.message;
    $('d-nav').classList.remove('hidden');
    $('d-ok').classList.add('hidden');
  }
}

function renderDraft() {
  const d = draft, p = d.pack;
  $('d-nav').classList.remove('hidden');
  $('d-ok').classList.remove('hidden');
  // Too vague to set up: ask their one question first.
  if (d.question) {
    $('d-title').innerHTML = 'One quick <em>question</em>';
    $('d-lead').textContent = 'So the people you call fit what you actually do.';
    $('d-body').innerHTML = `
      <label for="d-answer" style="margin-top:0">${esc(d.question)}</label>
      <textarea id="d-answer" rows="3" maxlength="400"></textarea>`;
    $('d-ok').textContent = 'Continue';
    $('d-retry').classList.add('hidden');
    $('d-answer').focus();
    return;
  }
  $('d-title').innerHTML = 'Does this <em>match</em>?';
  $('d-lead').textContent = 'Here is who you\'ll practice with. Remove anything that doesn\'t fit, or add your own.';
  $('d-ok').textContent = d.quick ? 'Yes, start a call' : 'Yes, this is right';
  $('d-retry').classList.remove('hidden');
  $('d-body').innerHTML = `
    <div class="draft-sum">
      <div><span class="muted">You sell</span><b>${esc(d.offer)}</b></div>
      <div><span class="muted">Industry</span><input id="d-label" maxlength="60" value="${esc(p.label)}"></div>
      <div><span class="muted">Usually to</span><input id="d-customer" maxlength="200" value="${esc(p.customer)}"></div>
    </div>
    <h3 class="draft-h">People you'll practice with</h3>
    <ul class="draft-list">${p.types.map((t, i) => `<li><div><b>${esc(t.label)}</b><span>${esc(t.desc)}</span></div><button type="button" class="draft-x" data-del-type="${i}" aria-label="Remove ${esc(t.label)}">Remove</button></li>`).join('')}</ul>
    <div class="row draft-add"><input id="d-new-type" maxlength="120" placeholder="Add a kind of customer, e.g. &quot;The guy who only wants a lineup&quot;"><button type="button" class="btn sm" id="d-add-type">Add</button></div>
    <h3 class="draft-h">Pushback you'll hear</h3>
    <div class="chips">${p.objections.map((o, i) => `<button type="button" class="chip on" data-del-obj="${i}" title="Tap to remove">${esc(o)} ✕</button>`).join('')}</div>
    <div class="row draft-add"><input id="d-new-obj" maxlength="140" placeholder="Add something customers say"><button type="button" class="btn sm" id="d-add-obj">Add</button></div>
    <label for="d-note">Not quite right? Tell us what we got wrong <span style="color:var(--dim)">(then tap Try again)</span></label>
    <textarea id="d-note" rows="2" maxlength="300" placeholder="e.g. I mostly work with businesses, not families">${esc(d.note)}</textarea>`;
  const keep = () => { p.label = $('d-label').value.trim() || p.label; p.customer = $('d-customer').value.trim(); d.note = $('d-note').value; };
  document.querySelectorAll('[data-del-type]').forEach(b => b.onclick = () => { keep(); p.types.splice(+b.dataset.delType, 1); renderDraft(); });
  document.querySelectorAll('[data-del-obj]').forEach(b => b.onclick = () => { keep(); p.objections.splice(+b.dataset.delObj, 1); renderDraft(); });
  const addType = () => {
    const v = $('d-new-type').value.trim(); if (!v) return;
    keep(); p.types.push({ label: v.slice(0, 60), desc: v }); renderDraft(); $('d-new-type').focus();
  };
  const addObj = () => {
    const v = $('d-new-obj').value.trim(); if (!v) return;
    keep(); if (!p.objections.includes(v)) p.objections.push(v); renderDraft(); $('d-new-obj').focus();
  };
  $('d-add-type').onclick = addType; $('d-new-type').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); addType(); } };
  $('d-add-obj').onclick = addObj; $('d-new-obj').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); addObj(); } };
  $('d-label').oninput = $('d-customer').oninput = $('d-note').oninput = keep;
}

$('d-ok').onclick = () => {
  const d = draft;
  if (!d?.pack) return;
  if (d.question) {
    const a = $('d-answer').value.trim();
    if (!a) { $('d-err').textContent = 'Type a short answer so we can set things up.'; return; }
    d.offer = `${d.offer}. ${a}`.slice(0, 400);
    runDraft();
    return;
  }
  if (d.pack.types.length < 2) { $('d-err').textContent = 'Keep at least two kinds of customer so calls can vary.'; return; }
  const pack = d.pack;
  draft = null;
  d.onDone(pack);
};
$('d-retry').onclick = () => {
  if (!draft) return;
  if ($('d-note')) draft.note = $('d-note').value.trim();
  runDraft();
};
$('d-back').onclick = () => { const d = draft; draft = null; (d?.onBack || (() => show('home')))(); };
