// Pitch Booth — the two "Change" links on the home screen: what you sell (industry and offer) and who you call
// (people at home, or owners of a kind of business).
'use strict';

/* ---------- what you do ---------- */
let picked = null; // { group, profession, emoji, audience }

function openIndustryPicker() {
  const s = seller(), prof = professionByName(s.profession);
  $('industry-modal').classList.remove('hidden');
  showPickStage(prof?.name);
}
function closeIndustryPicker() { $('industry-modal').classList.add('hidden'); }

function showPickStage(selected) {
  $('ind-pick-stage').classList.remove('hidden');
  $('ind-confirm-stage').classList.add('hidden');
  const input = mountProfessionPicker($('ind-pick'), {
    selected,
    onPick: p => showConfirmStage({ group: p.group, profession: p.name, emoji: p.emoji, audience: p.audience }, p.offer),
    onWriteOwn: q => showConfirmStage({ group: 'other', profession: '', emoji: '✏️' }, q),
  });
  input.focus();
}

// Step two: what they sell, filled in with the job's example (or what they had before for the same job).
function showConfirmStage(p, suggestion) {
  picked = p;
  const s = seller();
  $('ind-pick-stage').classList.add('hidden');
  $('ind-confirm-stage').classList.remove('hidden');
  $('ind-chosen-emoji').textContent = p.emoji;
  $('ind-chosen-name').textContent = p.profession || 'Write your own';
  const keep = (p.profession && p.profession === s.profession) || (p.group === 'other' && s.category === 'other');
  $('ind-offer').value = keep ? s.offer || '' : p.group === 'other' ? suggestion || '' : suggestion || '';
  $('ind-offer').placeholder = p.group === 'other' ? 'e.g. I train dogs and run puppy classes' : CATEGORIES[p.group].offer;
  $('ind-company').value = s.company || '';
  $('ind-err').textContent = '';
  $('ind-offer').focus();
  $('ind-offer').select();
}

// Switching jobs keeps the person's name, company (shown in the box, so they can clear it) and experience, and resets
// the job-specific answers (objections, call types, goal). They can fill those in again with the full questions.
async function saveIndustry() {
  const offer = $('ind-offer').value.trim();
  const company = $('ind-company').value.trim();
  if (!picked) return;
  if (!offer) { $('ind-err').textContent = picked.group === 'other' ? 'Describe what you do and sell in a sentence.' : 'Say what you sell in a sentence.'; $('ind-offer').focus(); return; }
  const prev = seller();
  // "Write your own": Claude drafts it, they confirm, then it's saved.
  if (picked.group === 'other' && !(prev.category === 'other' && prev.customPack && prev.offer === offer)) {
    closeIndustryPicker();
    openDraft({
      offer,
      onDone: pack => saveSeller(withCompany(customSeller(offer, pack, prev), company)).then(() => show('home')).catch(e => showError(e.message)),
      onBack: () => { show('home'); openIndustryPicker(); },
    });
    return;
  }
  const audience = picked.audience || CATEGORIES[picked.group].audience || prev.audience || '';
  const same = prev.category === picked.group && prev.profession === picked.profession;
  const next = withCompany(same ? { ...prev, offer } : {
    category: picked.group, ...(picked.profession ? { profession: picked.profession } : {}), offer, audience,
    // Who they call carries over only if the new job sells to the same kind of customer.
    ...(prev.target && prev.target.audience === audience ? { target: prev.target } : {}),
    ...(prev.experience ? { experience: prev.experience } : {}), quick: true,
  }, company);
  $('ind-save').disabled = true;
  try { await saveSeller(next); closeIndustryPicker(); renderHome(); }
  catch (e) { $('ind-err').textContent = e.message; }
  $('ind-save').disabled = false;
}

// Sets or clears the company name on a seller.
function withCompany(s, company) {
  const { company: _, ...rest } = s;
  return company ? { ...rest, company } : rest;
}

// Saves what-you-sell answers and the brief built from them, locally and to the profile.
async function saveSeller(next) {
  settings = { ...settings, seller: next, pitch: compileBrief(next) };
  LS.set('ph_settings', settings);
  if (usingProxy()) await saveProfile();
}

// A "Write your own" seller: their offer plus the confirmed draft. Keeps experience from before.
function customSeller(offer, pack, prev = {}) {
  return {
    category: 'other', offer: offer.slice(0, 200), audience: pack.audience, customer: pack.customer, customPack: pack,
    ...(prev.experience ? { experience: prev.experience } : {}), quick: true,
  };
}

$('home-industry').onclick = openIndustryPicker;
$('ind-save').onclick = saveIndustry;
$('ind-rechoose').onclick = () => showPickStage(picked?.profession);
$('ind-cancel-pick').onclick = closeIndustryPicker;
$('ind-cancel').onclick = closeIndustryPicker;
$('industry-modal').onclick = e => { if (e.target.id === 'industry-modal') closeIndustryPicker(); };

/* ---------- who you call ---------- */
let pickedTarget = null;

function openTargetPicker() {
  pickedTarget = { ...callTarget() };
  renderTargetPicker();
  $('target-modal').classList.remove('hidden');
}
function closeTargetPicker() { $('target-modal').classList.add('hidden'); }

function renderTargetPicker() {
  const t = pickedTarget;
  $('tg-audience').innerHTML = [['people', icon('people', 22), 'People & families', 'Homeowners, parents, retirees…'], ['businesses', icon('store', 22), 'Business owners', 'Owners and managers, at work']].map(([k, e, l, d]) =>
    `<button type="button" class="choice ${t.audience === k ? 'on' : ''}" data-tg="${k}"><span class="e">${e}</span><b>${l}</b><span>${d}</span></button>`).join('');
  $('tg-biz-wrap').classList.toggle('hidden', t.audience !== 'businesses');
  $('tg-grid').innerHTML = [['any', { label: 'Any kind of business', emoji: '🔀', examples: 'A different kind of business every call' }], ...Object.entries(BUSINESS_TYPES)].map(([k, b]) =>
    `<button type="button" class="choice ${t.business === k ? 'on' : ''}" data-tgb="${k}" role="radio" aria-checked="${t.business === k}"><b>${b.emoji} ${esc(b.label)}</b><span>${esc(b.examples)}</span></button>`).join('');
  document.querySelectorAll('[data-tg]').forEach(b => b.onclick = () => { pickedTarget.audience = b.dataset.tg; renderTargetPicker(); });
  document.querySelectorAll('[data-tgb]').forEach(b => b.onclick = () => { pickedTarget.business = b.dataset.tgb; renderTargetPicker(); });
}

async function saveTarget() {
  const t = pickedTarget;
  const next = { ...seller(), audience: t.audience, target: { audience: t.audience, business: t.audience === 'businesses' ? t.business || 'any' : 'any' } };
  $('tg-save').disabled = true;
  try { await saveSeller(next); closeTargetPicker(); renderHome(); }
  catch (e) { showError(e.message); }
  $('tg-save').disabled = false;
}

$('home-target').onclick = openTargetPicker;
$('tg-save').onclick = saveTarget;
$('tg-cancel').onclick = closeTargetPicker;
$('target-modal').onclick = e => { if (e.target.id === 'target-modal') closeTargetPicker(); };
