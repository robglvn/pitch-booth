/*
  PITCH BOOTH — personalities

  Every practice call rolls one option from each trait below and hands them to the AI, which turns them
  into a specific person. The traits multiply: 9 traits with 4–9 options each is over a million mixes,
  before the industry's customer type, the call type, age and background are added.

  To add variety, edit this file only:
    - New option:  add { id, label, desc, weight, lean } to a trait's options.
        id      unique within the trait (used in rules and presets)
        label   short name, shown on the scorecard after the call
        desc    what the AI is told, written as "they are/do ..." without the name
        weight  how common it is in real life (1 = rare, 5 = very common)
        lean    friendliness: +1/+2 friendlier, 0 neutral, -1/-2 tougher. Easy calls favor +, Brutal favors -.
        skip    optional list of difficulties that never get this option, e.g. ['easy']
    - New trait:   add another entry to TRAITS with a label and options.
    - Rule:        add a pair to CONFLICTS so two options never appear together.
    - Preset:      add to PRESETS to offer it in "Pick your scenario" (it pins some traits; the rest stay random).
    - Backgrounds and outlooks used for every person are at the bottom.
*/
window.PB_PERSONALITY = (() => {
  const TRAITS = {
    mood: {
      label: 'Mood today',
      options: [
        { id: 'good', label: 'Good day', desc: 'in a good mood today and a little more patient than usual', weight: 3, lean: 1 },
        { id: 'normal', label: 'Ordinary day', desc: 'having an ordinary day', weight: 5, lean: 0 },
        { id: 'stressed', label: 'Stressed', desc: 'stressed and behind on everything today', weight: 3, lean: -1 },
        { id: 'distracted', label: 'Distracted', desc: 'distracted by something going on around them right now (kids, customers, driving, cooking)', weight: 3, lean: -1 },
        { id: 'bad_news', label: 'Bad news today', desc: 'just got some bad news and is in no mood for a sales call', weight: 1, lean: -2, skip: ['easy'] },
        { id: 'bored', label: 'Bored', desc: 'bored and half glad for the distraction', weight: 1, lean: 1 },
      ],
    },
    pace: {
      label: 'Pace',
      options: [
        { id: 'rushed', label: 'Rushed', desc: 'in a hurry and wants the point fast', weight: 3, lean: -1 },
        { id: 'normal', label: 'Normal pace', desc: 'moves at a normal pace', weight: 5, lean: 0 },
        { id: 'relaxed', label: 'Relaxed', desc: 'relaxed and in no hurry at all', weight: 2, lean: 1 },
      ],
    },
    talk: {
      label: 'Talkativeness',
      options: [
        { id: 'short', label: 'Short answers', desc: 'gives short answers and makes the caller work for information', weight: 3, lean: -1 },
        { id: 'normal', label: 'Normal talker', desc: 'answers questions normally', weight: 4, lean: 0 },
        { id: 'chatty', label: 'Chatty', desc: 'chatty and friendly, happy to talk, which is not the same as buying', weight: 2, lean: 1 },
        { id: 'tangents', label: 'Goes on tangents', desc: 'wanders off on tangents about their life and has to be steered back', weight: 1, lean: 0 },
      ],
    },
    trust: {
      label: 'Trust in salespeople',
      options: [
        { id: 'open', label: 'Open', desc: 'open to hearing people out', weight: 2, lean: 2 },
        { id: 'cautious', label: 'Cautious', desc: 'cautious with salespeople until they make sense', weight: 5, lean: 0 },
        { id: 'skeptical', label: 'Skeptical', desc: 'skeptical and assumes there is a catch', weight: 3, lean: -1 },
        { id: 'burned', label: 'Burned before', desc: 'was burned by a salesperson or company like this before and still brings it up', weight: 2, lean: -1 },
        { id: 'hostile', label: 'Hostile to sales calls', desc: 'hostile to sales calls and ready to end this one', weight: 1, lean: -2, skip: ['easy'] },
      ],
    },
    decides: {
      label: 'How they decide',
      options: [
        { id: 'gut', label: 'Gut call', desc: 'decides on gut feel, sometimes on the spot', weight: 2, lean: 1 },
        { id: 'time', label: 'Needs time', desc: 'likes to sleep on decisions', weight: 4, lean: 0 },
        { id: 'partner', label: 'Needs a partner', desc: "won't decide without a spouse, partner, or boss", weight: 3, lean: -1 },
        { id: 'avoids', label: 'Avoids deciding', desc: 'agrees things sound good and then stalls: "send me something", "maybe next month"', weight: 2, lean: -1 },
      ],
    },
    convinced: {
      label: 'What convinces them',
      options: [
        { id: 'proof', label: 'Wants proof', desc: 'wants numbers, proof, and specifics; vague promises annoy them', weight: 3, lean: 0 },
        { id: 'stories', label: 'Moved by stories', desc: 'is moved by stories and examples of people like them', weight: 3, lean: 0 },
        { id: 'understood', label: 'Needs to feel heard', desc: 'needs to feel listened to before anything else matters', weight: 3, lean: 0 },
        { id: 'price', label: 'Price-focused', desc: 'mostly cares what it costs and whether it is a good deal', weight: 2, lean: -1 },
        { id: 'trust_person', label: 'Buys from people they like', desc: 'buys from people they like and trust, not from pitches', weight: 2, lean: 0 },
      ],
    },
    money: {
      label: 'Money',
      options: [
        { id: 'tight', label: 'Money is tight', desc: 'money is tight right now', weight: 3, lean: -1 },
        { id: 'deal', label: 'Wants a deal', desc: 'always wants a deal or a discount', weight: 3, lean: 0 },
        { id: 'value', label: 'Pays for value', desc: 'will pay more for something clearly worth it', weight: 3, lean: 1 },
        { id: 'no_object', label: 'Price no object', desc: 'is comfortable financially; time and hassle matter more than price', weight: 1, lean: 1 },
      ],
    },
    early_pitch: {
      label: 'If you pitch too early',
      options: [
        { id: 'lets_slide', label: 'Lets it slide', desc: 'lets an early pitch slide but stays noncommittal until they feel understood', weight: 3, lean: 1 },
        { id: 'asks_price', label: 'Asks the price', desc: 'cuts straight to "okay, how much is it?"', weight: 3, lean: 0 },
        { id: 'cuts_in', label: 'Cuts in', desc: 'interrupts and asks what this is actually about for them', weight: 2, lean: -1 },
        { id: 'tunes_out', label: 'Tunes out', desc: 'goes quiet and gives one-word answers while they mentally check out', weight: 3, lean: -1 },
        { id: 'curious', label: 'Gets curious', desc: 'gets curious and asks questions about the offer, which can lead anywhere', weight: 2, lean: 1 },
        { id: 'send_info', label: '"Send me something"', desc: 'tries to end it politely with "just send me some info"', weight: 3, lean: -1 },
        { id: 'hangs_up', label: 'Hangs up', desc: 'ends the call if they are pitched before being asked anything about themselves', weight: 1, lean: -2, skip: ['easy'] },
      ],
    },
    quirk: {
      label: 'Quirk',
      options: [
        { id: 'none', label: 'No quirk', desc: 'talks plainly', weight: 4, lean: 0 },
        { id: 'interrupts', label: 'Interrupts', desc: 'tends to interrupt and finish other people’s sentences', weight: 2, lean: -1 },
        { id: 'dry_humor', label: 'Dry humor', desc: 'has a dry, teasing sense of humor', weight: 2, lean: 1 },
        { id: 'repeat', label: 'Asks you to repeat', desc: 'often asks the caller to repeat or clarify things', weight: 2, lean: 0 },
        { id: 'over_explains', label: 'Over-explains', desc: 'over-explains their situation once they get going', weight: 2, lean: 1 },
        { id: 'tired', label: 'Sounds tired', desc: 'sounds tired and a little flat', weight: 2, lean: -1 },
        { id: 'polite', label: 'Very polite', desc: 'is very polite, which makes it hard to tell what they really think', weight: 2, lean: 0 },
        { id: 'sarcastic', label: 'Sarcastic', desc: 'gets sarcastic when something sounds like a pitch', weight: 1, lean: -1 },
        { id: 'one_question', label: 'One sharp question', desc: 'has one pointed question they keep coming back to until it is answered', weight: 2, lean: 0 },
      ],
    },
  };

  // Pairs that never appear together ("trait:id").
  const CONFLICTS = [
    ['pace:rushed', 'talk:tangents'], ['pace:rushed', 'mood:bored'], ['pace:rushed', 'pace:relaxed'],
    ['talk:short', 'quirk:over_explains'], ['talk:chatty', 'early_pitch:tunes_out'],
    ['trust:open', 'early_pitch:hangs_up'], ['trust:open', 'quirk:sarcastic'], ['trust:hostile', 'early_pitch:lets_slide'],
    ['trust:hostile', 'early_pitch:curious'], ['trust:hostile', 'mood:good'], ['mood:bad_news', 'quirk:dry_humor'],
    ['money:no_object', 'convinced:price'], ['money:no_object', 'money:tight'], ['decides:gut', 'decides:avoids'],
  ];

  // Offered in "Pick your scenario". Each pins a few traits; everything else is still rolled.
  const PRESETS = {
    skeptical: { label: 'Skeptical, burned before', set: { trust: 'burned' } },
    rushed: { label: 'Rushed and busy', set: { pace: 'rushed', mood: 'stressed' } },
    chatty: { label: 'Warm and chatty', set: { talk: 'chatty', trust: 'cautious' } },
    price: { label: 'Price-shopper', set: { money: 'deal', convinced: 'price', early_pitch: 'asks_price' } },
    analytical: { label: 'Wants numbers and proof', set: { convinced: 'proof', talk: 'short' } },
    avoider: { label: 'Friendly but avoids decisions', set: { decides: 'avoids', early_pitch: 'send_info' } },
    hostile: { label: 'Hostile to sales calls', set: { trust: 'hostile' } },
    curious: { label: 'Curious early adopter', set: { trust: 'open', early_pitch: 'curious', decides: 'gut' } },
    partner: { label: 'Has to ask their partner', set: { decides: 'partner' } },
    distracted: { label: 'Distracted, half listening', set: { mood: 'distracted', early_pitch: 'tunes_out' } },
  };

  const BACKGROUNDS = ['Black American', 'white American', 'Mexican American', 'Puerto Rican', 'Korean American', 'Chinese American', 'Vietnamese American', 'Indian American', 'Filipino American', 'Lebanese American', 'Nigerian American (immigrated as an adult)', 'Italian American', 'Irish American', 'Ethiopian American', 'Guatemalan American', 'Pakistani American', 'Japanese American', 'Cuban American', 'Polish American', 'Native American (Navajo)', 'Salvadoran American', 'Haitian American', 'Jamaican American', 'Greek American'];
  const LEANS = ['left-leaning', 'right-leaning', 'apolitical'];

  // Easy shifts the odds toward friendlier options and Brutal toward tougher ones; Realistic uses real-life weights.
  function weightFor(o, difficulty) {
    if (o.skip?.includes(difficulty)) return 0;
    const lean = o.lean || 0;
    if (difficulty === 'easy') return o.weight * (lean > 0 ? 1 + lean * 0.8 : lean < 0 ? 1 / (1 - lean * 1.2) : 1);
    if (difficulty === 'brutal') return o.weight * (lean < 0 ? 1 - lean * 0.8 : lean > 0 ? 1 / (1 + lean * 1.2) : 1);
    return o.weight;
  }
  const clashes = (key, chosen) => CONFLICTS.some(([a, b]) => (a === key && chosen.has(b)) || (b === key && chosen.has(a)));

  function rollOnce(difficulty, pinned) {
    const out = {}, chosen = new Set();
    for (const [trait, id] of Object.entries(pinned)) { out[trait] = id; chosen.add(`${trait}:${id}`); }
    for (const [trait, t] of Object.entries(TRAITS)) {
      if (out[trait]) continue;
      const pool = t.options.filter(o => !clashes(`${trait}:${o.id}`, chosen)).map(o => [o, weightFor(o, difficulty)]).filter(([, w]) => w > 0);
      let r = Math.random() * pool.reduce((s, [, w]) => s + w, 0), pickd = pool[pool.length - 1][0];
      for (const [o, w] of pool) { if ((r -= w) <= 0) { pickd = o; break; } }
      out[trait] = pickd.id; chosen.add(`${trait}:${pickd.id}`);
    }
    return out;
  }

  // The traits that most change how a call feels; used to avoid meeting the same kind of person twice in a row.
  const signature = ids => ['trust', 'pace', 'talk', 'early_pitch'].map(k => ids[k]).join('/');

  function roll({ difficulty = 'realistic', preset = null, avoid = [] } = {}) {
    const pinned = PRESETS[preset]?.set || {};
    let ids = rollOnce(difficulty, pinned);
    for (let i = 0; i < 8 && avoid.includes(signature(ids)); i++) ids = rollOnce(difficulty, pinned);
    return { ids, sig: signature(ids) };
  }

  const option = (trait, id) => TRAITS[trait]?.options.find(o => o.id === id);
  // Lines for the AI: "Trust in salespeople: skeptical and assumes there is a catch".
  const describe = ids => Object.entries(ids).map(([k, id]) => option(k, id) && `${TRAITS[k].label}: ${option(k, id).desc}`).filter(Boolean);
  // Short labels for the scorecard: "Stressed · Skeptical · Short answers".
  const labels = ids => Object.entries(ids).filter(([k, id]) => id !== 'normal' && id !== 'none' && option(k, id)).map(([k, id]) => option(k, id).label);

  return { TRAITS, CONFLICTS, PRESETS, BACKGROUNDS, LEANS, roll, describe, labels, option };
})();
