// Pitch Booth — The "what do you sell" questions and the practice brief they build.
'use strict';

/* ---------- what you sell: questionnaire ---------- */
// Each answer feeds the persona builder, the prospect and the coach. The compiled brief is what they read.
const EXPERIENCE = { new: 'New to sales', some: 'Under 2 years', pro: '2+ years' };

const seller = () => settings.seller || {};
// People who haven't answered the questions yet get the original video-pitch setup.
// A "Write your own" industry carries its own customer types and objections (customPack), drafted by Claude.
const withPack = (category, pack) => (category === 'other' && pack ? { ...CATEGORIES.other, ...pack } : CATEGORIES[category]);
const sellerCat = () => withPack(seller().category, seller().customPack) || (seller().offer ? CATEGORIES.other : CATEGORIES.marketing);
const sellerAudience = () => seller().audience || '';
const offerName = () => seller().offer || 'their product or service';
const goalText = () => seller().goal || 'a meeting or next step';
const objectionPool = () => (seller().objections?.length ? seller().objections : sellerCat().objections);
const userCallTypes = () => (seller().callTypes?.length ? seller().callTypes : sellerCat().calls).filter(k => CALL_TYPES[k]);

// Turns the answers into the plain-language brief every prompt reads. People can edit it on the last step.
function compileBrief(s) {
  const cat = CATEGORIES[s.category];
  const lines = [
    `I sell: ${s.offer}${s.company ? ` (company: ${s.company})` : ''}${cat && s.category !== 'other' ? `, in ${cat.label.toLowerCase()}` : s.customPack?.label ? `, in ${s.customPack.label.toLowerCase()}` : ''}.`,
    s.audience && `I sell to: ${s.audience === 'people' ? 'individuals and families' : 'businesses'}${s.customer ? ` — ${s.customer}` : ''}.`,
    !s.audience && s.customer && `My customers: ${s.customer}.`,
    s.callTypes?.length && `Calls I make: ${s.callTypes.map(k => CALL_TYPES[k].label.toLowerCase()).join(', ')}.`,
    s.edge && `Why people pick me: ${s.edge}.`,
    s.price && `Pricing: ${s.price}.`,
    s.promo && `Current special: ${s.promo}.`,
    s.goal && `The next step I ask for: ${s.goal}.`,
    s.objections?.length && `Objections I hear a lot: ${s.objections.map(o => `"${o}"`).join('; ')}.`,
    s.experience && `My experience: ${EXPERIENCE[s.experience].toLowerCase()}.`,
  ];
  return lines.filter(Boolean).join('\n').replace(/\.\./g, '.');
}

let q = null; // answers being edited
const qCat = () => withPack(q.category, q.customPack) || CATEGORIES.other;
const Q_STEPS = [
  {
    title: 'Nice to <em>meet you</em>', lead: 'A few quick questions so your practice calls feel like your real ones.',
    body: () => `
      <div class="code-note ${q.newCode ? '' : 'hidden'}">Your personal code is <b>${esc(q.newCode)}</b>. Save it: it's how you sign in on another device.</div>
      <label for="q-name" style="margin-top:0">What's your name?</label>
      <input id="q-name" data-k="name" placeholder="e.g. Maria" maxlength="80" value="${esc(q.name)}">
      <label for="q-city">Your city <span style="color:var(--dim)">(optional, makes the people you call local)</span></label>
      <input id="q-city" data-k="city" placeholder="e.g. San Antonio, TX" maxlength="120" value="${esc(q.city)}">
      <p style="margin:18px 0 0"><button type="button" class="linkish" id="q-skip">Short on time? Skip the questions and just describe what you sell</button></p>`,
    check: () => !q.name.trim() && "What's your name?",
  },
  {
    title: 'What do you <em>sell</em>?', lead: 'Pick the closest fit, then say it in your own words.',
    body: () => `
      <div class="choices cats" role="radiogroup" aria-label="Industry">${Object.entries(CATEGORIES).map(([k, c]) =>
        `<button type="button" class="choice ${q.category === k ? 'on' : ''}" data-pick="category" data-v="${k}" role="radio" aria-checked="${q.category === k}"><b>${c.emoji} ${esc(c.label)}</b><span>${esc(c.examples)}</span></button>`).join('')}</div>
      <label for="q-offer">In one sentence, what do you offer?</label>
      <input id="q-offer" data-k="offer" maxlength="200" placeholder="${esc(qCat().offer)}" value="${esc(q.offer)}">
      <label for="q-company">Company name <span style="color:var(--dim)">(optional)</span></label>
      <input id="q-company" data-k="company" maxlength="80" placeholder="e.g. Northstar Life" value="${esc(q.company)}">`,
    check: () => (!q.category && 'Pick the closest fit.') || (!q.offer.trim() && 'Say what you offer in a sentence.'),
  },
  {
    title: 'Who do you <em>sell to</em>?', lead: 'The people you call will be built from this.',
    body: () => `
      <div class="choices two-up">${[['people', icon('people', 22), 'People & families', 'Homeowners, parents, retirees…'], ['businesses', icon('store', 22), 'Businesses', 'Owners, managers, buyers…']].map(([k, e, t, d]) =>
        `<button type="button" class="choice ${q.audience === k ? 'on' : ''}" data-pick="audience" data-v="${k}"><span class="e">${e}</span><b>${t}</b><span>${d}</span></button>`).join('')}</div>
      <label for="q-customer">Describe your ideal customer</label>
      <input id="q-customer" data-k="customer" maxlength="200" placeholder="${esc(qCat().customer)}" value="${esc(q.customer)}">`,
    check: () => !q.audience && 'Pick people or businesses.',
  },
  {
    title: 'Which calls do you <em>make</em>?', lead: "Pick all that apply. These become your practice options.",
    enter: () => { if (!q.callTypes.length) q.callTypes = [...qCat().calls]; },
    check: () => !q.callTypes.length && 'Pick at least one kind of call.',
    body: () => `
      <div class="choices two-up">${Object.entries(CALL_TYPES).map(([k, a]) =>
        `<button type="button" class="choice ${q.callTypes.includes(k) ? 'on' : ''}" data-toggle="callTypes" data-v="${k}" aria-pressed="${q.callTypes.includes(k)}"><span class="e">${icon(a.icon, 22)}</span><b>${a.label}</b><span>${a.desc}</span></button>`).join('')}</div>
      <label for="q-goal">What do you ask for at the end of a call?</label>
      <input id="q-goal" data-k="goal" maxlength="160" placeholder="e.g. Book a 20-minute call" value="${esc(q.goal)}">
      <div class="chips small-chips">${qCat().goals.map(g => `<button type="button" class="chip" data-fill="goal" data-v="${esc(g)}">${esc(g)}</button>`).join('')}</div>`,
  },
  {
    title: 'What makes you <em>stand out</em>?', lead: 'The coach checks whether you get this across.',
    body: () => `
      <label for="q-edge" style="margin-top:0">Why should someone pick you?</label>
      <textarea id="q-edge" data-k="edge" rows="3" maxlength="400" placeholder="${esc(qCat().edge)}">${esc(q.edge)}</textarea>
      <label for="q-price">What does it usually cost? <span style="color:var(--dim)">(optional)</span></label>
      <input id="q-price" data-k="price" maxlength="120" placeholder="${esc(qCat().price)}" value="${esc(q.price)}">
      <label for="q-promo">Running a special or promotion right now? <span style="color:var(--dim)">(optional)</span></label>
      <input id="q-promo" data-k="promo" maxlength="200" placeholder="e.g. 20% off the first visit for new customers through November" value="${esc(q.promo)}">
      <div class="small muted" style="margin-top:4px">The people you call will react to it, and the coach checks how well you use it.</div>`,
  },
  {
    title: 'What do people <em>push back</em> with?', lead: 'Pick the ones you hear most. Your practice calls will throw them at you.',
    body: () => {
      const all = [...new Set([...qCat().objections, ...q.objections])];
      return `
      <div class="chips">${all.map(o => `<button type="button" class="chip ${q.objections.includes(o) ? 'on' : ''}" data-toggle="objections" data-v="${esc(o)}" aria-pressed="${q.objections.includes(o)}">${esc(o)}</button>`).join('')}</div>
      <div class="row" style="flex-wrap:nowrap;margin-top:10px">
        <input id="q-obj-new" maxlength="140" placeholder="Add your own, e.g. &quot;Call me back next month&quot;">
        <button type="button" class="btn" id="q-obj-add" style="flex:none">Add</button>
      </div>
      <label>How long have you been selling?</label>
      <div class="chips">${Object.entries(EXPERIENCE).map(([k, l]) => `<button type="button" class="chip ${q.experience === k ? 'on' : ''}" data-pick="experience" data-v="${k}">${l}</button>`).join('')}</div>`;
    },
  },
  {
    title: 'Your practice <em>brief</em>', lead: 'This is what the people you call and your coach will know. Change anything.',
    body: () => `<textarea id="q-brief" data-k="brief" rows="12" aria-label="Practice brief">${esc(q.brief)}</textarea>`,
    enter: () => { q.brief = compileBrief(q); },
    check: () => !q.brief.trim() && 'The brief is empty. Go back or write a few lines about what you sell.',
  },
];

function openQuestionnaire(newCode = '') {
  const s = seller();
  q = {
    step: 0, newCode,
    name: settings.myName || '', city: settings.city || '',
    category: s.category || '', offer: s.offer || '', company: s.company || '', audience: s.audience || '', customer: s.customer || '',
    callTypes: [...(s.callTypes || [])], goal: s.goal || '', edge: s.edge || '', price: s.price || '', promo: s.promo || '',
    objections: [...(s.objections || [])], experience: s.experience || '', brief: '',
    customPack: s.customPack || null, customPackFor: s.customPack ? s.offer : '',
  };
  // Someone who already wrote a free-text pitch keeps it as a starting point for the offer.
  if (!q.offer && settings.pitch && settings.pitch !== DEFAULT_SETTINGS.pitch) q.offer = settings.pitch.split('\n')[0].slice(0, 200);
  resumeQuestionnaire();
}

// Shows the questions again where they left off (after setting up a "Write your own" industry, for one).
function resumeQuestionnaire() {
  show('welcome');
  ['w-join', 'w-quick-panel', 'w-draft'].forEach(id => $(id).classList.add('hidden'));
  $('w-about').classList.remove('hidden');
  renderQ();
}

function renderQ() {
  const st = Q_STEPS[q.step];
  if (st.enter) st.enter();
  $('q-count').textContent = `Step ${q.step + 1} of ${Q_STEPS.length}`;
  $('q-bar').style.width = `${((q.step + 1) / Q_STEPS.length) * 100}%`;
  $('q-title').innerHTML = st.title;
  $('q-lead').textContent = st.lead;
  $('q-body').innerHTML = st.body();
  $('p-err').textContent = '';
  $('q-back').classList.toggle('hidden', q.step === 0);
  $('q-next').textContent = q.step === Q_STEPS.length - 1 ? 'Start practicing' : 'Next';
  $('q-body').querySelectorAll('[data-k]').forEach(el => { el.oninput = () => { q[el.dataset.k] = el.value; }; });
  $('q-body').querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
    q[b.dataset.pick] = b.dataset.v;
    if (b.dataset.pick === 'category' && !q.audience) q.audience = CATEGORIES[b.dataset.v].audience;
    if (b.dataset.pick === 'category' && b.dataset.v !== 'other') q.customPack = null;
    renderQ();
  });
  $('q-body').querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
    const list = q[b.dataset.toggle], v = b.dataset.v;
    q[b.dataset.toggle] = list.includes(v) ? list.filter(x => x !== v) : [...list, v];
    renderQ();
  });
  $('q-body').querySelectorAll('[data-fill]').forEach(b => b.onclick = () => { q[b.dataset.fill] = b.dataset.v; renderQ(); });
  if ($('q-skip')) $('q-skip').onclick = () => showWelcome('quick');
  const add = $('q-obj-add');
  if (add) {
    const addIt = () => { const v = $('q-obj-new').value.trim(); if (v && !q.objections.includes(v)) q.objections.push(v); renderQ(); $('q-obj-new').focus(); };
    add.onclick = addIt;
    $('q-obj-new').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); addIt(); } };
  }
  const first = $('q-body').querySelector('input[data-k], textarea[data-k]');
  if (first && !first.value) first.focus();
}

$('q-back').onclick = () => { if (q.step > 0) { q.step--; renderQ(); } };
$('q-next').onclick = async () => {
  const err = Q_STEPS[q.step].check?.();
  if (err) { $('p-err').textContent = err; return; }
  // "Write your own": have Claude draft the industry from their offer, and let them confirm it, before going on.
  if (q.step === 1 && q.category === 'other' && (!q.customPack || q.customPackFor !== q.offer.trim())) {
    const offer = q.offer.trim();
    openDraft({
      offer,
      onDone: pack => {
        q.customPack = pack; q.customPackFor = offer;
        q.audience = q.audience || pack.audience; q.customer = q.customer || pack.customer;
        q.callTypes = []; q.objections = [...pack.objections];
        q.step = 2; resumeQuestionnaire();
      },
      onBack: resumeQuestionnaire,
    });
    return;
  }
  if (q.step < Q_STEPS.length - 1) { q.step++; renderQ(); window.scrollTo(0, 0); return; }
  const { step, newCode, name, city, brief, ...answers } = q;
  answers.offer = answers.offer.trim();
  settings = { ...settings, myName: name.trim(), city: city.trim(), pitch: brief.trim(), seller: answers };
  LS.set('ph_settings', settings);
  $('q-next').disabled = true;
  try { if (usingProxy()) await saveProfile(); show('home'); }
  catch (e) { $('p-err').textContent = e.message; }
  $('q-next').disabled = false;
};
