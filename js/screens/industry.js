// Pitch Booth — "Change" on the home screen: pick a different industry and say what you offer in a sentence.
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
