/*
  PITCH BOOTH — call flow

  The phases of a sales call (the "Call flow" checklist and the tips during a call) and the moods on the
  Cold-to-Sold meter. The AI reports which phase the call is in and how the other person feels, using
  these ids, so the server loads this file too.
*/
window.PB_PHASES = [
  { id: 'opener', t: 'Opener', d: 'Permission-based, under 30 seconds', hint: 'Ask for permission: "Did I catch you at a bad time?" Keep it short.' },
  { id: 'intro', t: 'Who I am + why I\'m calling', d: 'One breath: you, and why them', hint: 'Say who you are and why you called *them* specifically.' },
  { id: 'discovery', t: 'Discovery', d: 'Ask before you pitch', hint: 'Ask about their situation: what\'s working, what isn\'t, what they want. Aim for 3+ questions.' },
  { id: 'pitch', t: 'Pitch', d: 'Tied to what they said', hint: 'Start with "You mentioned…" and connect to their words, not a script.' },
  { id: 'objection', t: 'Objection handling', d: 'Acknowledge → ask → answer', hint: 'Don\'t argue. Acknowledge it, ask a question about it, then answer.' },
  { id: 'close', t: 'Close', d: 'Trial close, then ask', hint: 'Trial close ("Does that sound useful?"), then ask directly for the next step.' },
];

// id: [meter color, label], from coldest to warmest.
window.PB_MOODS = { cold: ['#b9472f', 'Cold'], guarded: ['#c98a2b', 'Guarded'], neutral: ['#a39b91', 'Neutral'], warming: ['#8fa85e', 'Warming up'], interested: ['#3f7d5c', 'Interested'], sold: ['#2f6248', 'Sold'] };
