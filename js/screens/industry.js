// Pitch Booth — the two "Change" links on the home screen: what you sell (industry and offer) and who you call
// (people at home, or owners of a kind of business).
'use strict';

/* ---------- industry picker ---------- */
let pickedIndustry = '';

function openIndustryPicker() {
  pickedIndustry = seller().category || '';
  $('ind-offer').value = seller().offer || '';
  $('ind-err').textContent = '';
  renderIndustryGrid();
  $('industry-modal').classList.remove('hidden');
}
function closeIndustryPicker() { $('industry-modal').classList.add('hidden'); }

function renderIndustryGrid() {
  $('ind-grid').innerHTML = Object.entries(CATEGORIES).map(([k, c]) =>
    `<button type="button" class="choice ${pickedIndustry === k ? 'on' : ''}" data-ind="${k}" role="radio" aria-checked="${pickedIndustry === k}"><b>${c.emoji} ${esc(c.label)}</b><span>${esc(c.examples)}</span></button>`).join('');
  document.querySelectorAll('[data-ind]').forEach(b => b.onclick = () => {
    const changed = pickedIndustry !== b.dataset.ind;
    pickedIndustry = b.dataset.ind;
    // A new industry usually means a new offer: clear it and show that industry's example.
    if (changed && pickedIndustry !== seller().category) $('ind-offer').value = '';
    $('ind-offer').placeholder = CATEGORIES[pickedIndustry].offer;
    renderIndustryGrid();
    $('ind-offer').focus();
  });
}

// Switching industries keeps the person's name and experience, and resets the industry-specific answers
// (company, objections, call types, goal). They can fill those in again with the full questions.
async function saveIndustry() {
  const offer = $('ind-offer').value.trim();
  if (!pickedIndustry) { $('ind-err').textContent = 'Pick the closest fit.'; return; }
  if (!offer) { $('ind-err').textContent = 'Say what you offer in a sentence.'; $('ind-offer').focus(); return; }
  const prev = seller();
  // "Write your own": Claude drafts it, they confirm, then it's saved.
  if (pickedIndustry === 'other' && !(prev.category === 'other' && prev.customPack && prev.offer === offer)) {
    closeIndustryPicker();
    openDraft({
      offer,
      onDone: pack => saveSeller(customSeller(offer, pack, prev)).then(() => show('home')).catch(e => showError(e.message)),
      onBack: () => { show('home'); openIndustryPicker(); },
    });
    return;
  }
  const same = prev.category === pickedIndustry;
  const next = same ? { ...prev, offer } : {
    category: pickedIndustry, offer, audience: CATEGORIES[pickedIndustry].audience || prev.audience || '',
    ...(prev.experience ? { experience: prev.experience } : {}), quick: true,
  };
  $('ind-save').disabled = true;
  try { await saveSeller(next); closeIndustryPicker(); renderHome(); }
  catch (e) { $('ind-err').textContent = e.message; }
  $('ind-save').disabled = false;
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
