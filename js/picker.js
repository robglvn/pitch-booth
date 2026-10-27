// Pitch Booth — the "What do you do?" picker: a search box over data/professions.js, groups to browse when
// the box is empty, and "Write your own" at the bottom. Used by quick start, the questionnaire and "Edit".
'use strict';

const professionByName = name => PROFESSIONS.find(p => p.name === name);

// The grey hint in a company box: a fresh made-up name that fits the job ("Cedar Hill Barbershop"),
// or the group's example when the job has no word in data/company-names.js. Never saved.
function exampleCompany(professionName, group) {
  const n = window.PB_COMPANY_NAMES, word = n?.words[professionName];
  return word ? `e.g. ${pick(n.starts)} ${word}` : CATEGORIES[group]?.company || 'e.g. Your business name';
}

// Ranks jobs for a search like "video" or "I'm a barber": whole-name matches first, then words in the name,
// then extra search words, then the group's name.
function searchProfessions(query, limit = 8) {
  const words = query.toLowerCase().replace(/[^a-z0-9& ]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
  if (!words.length) return [];
  const q = words.join(' ');
  return PROFESSIONS.map(p => {
    const name = p.name.toLowerCase(), extra = `${p.words} ${p.offer}`.toLowerCase(), group = (CATEGORIES[p.group]?.label || '').toLowerCase();
    let score = name.startsWith(q) ? 100 : name.includes(q) ? 80 : 0;
    // "pianos" should find "piano": also try each word without a trailing s.
    const hit = (text, w) => text.split(/[^a-z0-9]+/).some(n => n.startsWith(w) || (w.length > 3 && w.endsWith('s') && n.startsWith(w.slice(0, -1))));
    let matched = 0;
    for (const w of words) {
      if (hit(name, w)) { score += 60; matched++; }
      else if (hit(extra, w)) { score += 30; matched++; }
      else if (group.includes(w)) score += 10;
    }
    // Jobs that match more of the words win ties ("divorce lawyer" → Family law attorney, not any lawyer).
    score += matched * 20;
    return { ...p, score };
  }).filter(p => p.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
}
// The search box's example jobs: three picked at random from the whole list each time it appears.
function randomSearchHint() {
  const jobs = [...PROFESSIONS].sort(() => Math.random() - 0.5).slice(0, 3).map(p => p.name.replace(/\s*\(.*\)$/, '')).map(n => (/^[A-Z]{2}/.test(n) ? n : n[0].toLowerCase() + n.slice(1)));
  return `Search, e.g. ${jobs.join(', ')}`;
}
const STOP_WORDS = new Set(['i', 'im', 'am', 'a', 'an', 'the', 'and', 'or', 'to', 'for', 'of', 'in', 'my', 'we', 'our', 'do', 'sell', 'selling', 'work', 'as', 'with', 'want', 'more', 'run', 'own']);

// opts: { onPick(profession), onWriteOwn(query), selected: name, placeholder }
function mountProfessionPicker(el, opts) {
  el.innerHTML = `
    <div class="search"><span class="search-ic">${icon('search')}</span>
      <input type="search" class="search-input" autocomplete="off" placeholder="${esc(opts.placeholder || randomSearchHint())}" aria-label="What do you do?"></div>
    <div class="prof-results" aria-live="polite"></div>`;
  const input = el.querySelector('input'), results = el.querySelector('.prof-results');
  const row = p => `<button type="button" class="prof-row ${opts.selected === p.name ? 'on' : ''}" data-prof="${esc(p.name)}"><span class="prof-emoji">${p.emoji}</span><span class="prof-text"><b>${esc(p.name)}</b><span>${esc(p.offer)}</span></span>${icon('arrow')}</button>`;
  const writeOwn = q => `<button type="button" class="prof-row write-own" data-write><span class="prof-emoji">✏️</span><span class="prof-text"><b>Write your own</b><span>${q ? `Not listed? Describe "${esc(q)}" and we'll set it up.` : "Not listed? Describe what you do and we'll set it up."}</span></span>${icon('arrow')}</button>`;
  const draw = () => {
    const q = input.value.trim();
    if (q) {
      const found = searchProfessions(q);
      results.innerHTML = (found.length ? found.map(row).join('') : `<p class="muted prof-none">No match for "${esc(q)}". You can write your own:</p>`) + writeOwn(q);
    } else {
      results.innerHTML = `<p class="small muted prof-browse">Or browse by group</p>` + Object.entries(CATEGORIES).filter(([k]) => k !== 'other').map(([k, c]) => {
        const jobs = PROFESSIONS.filter(p => p.group === k);
        return `<details class="prof-group" ${jobs.some(p => p.name === opts.selected) ? 'open' : ''}><summary><span class="prof-emoji">${c.emoji}</span><span class="prof-text"><b>${esc(c.label)}</b><span>${esc(c.examples)}</span></span></summary><div class="prof-group-list">${jobs.map(row).join('')}</div></details>`;
      }).join('') + writeOwn('');
    }
    results.querySelectorAll('[data-prof]').forEach(b => b.onclick = () => opts.onPick(professionByName(b.dataset.prof)));
    results.querySelector('[data-write]').onclick = () => opts.onWriteOwn(input.value.trim());
  };
  input.oninput = draw;
  draw();
  return input;
}
