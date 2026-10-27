/*
  PITCH BOOTH — call types

  The four kinds of practice call. Each person picks which ones they make in the questionnaire, and each
  industry in data/industries.js ticks some by default.

    emoji, label, tag, desc   how it appears on the home screen and in the questionnaire
    home                      the one-line description on the home card
    tip                       shown on the Get ready screen
    goal                      what the caller is trying to do (the coach grades against this)
    prospect                  what the person on the other end knows (for the AI that builds them)
    opening                   how the person thinks of the call when they pick up
*/
window.PB_CALL_TYPES = {
  cold: {
    emoji: '☎️', label: 'Cold call', tag: 'Never heard of you', desc: "They've never heard of you",
    home: "Someone who's never heard of you picks up. Earn their attention.",
    tip: 'Ask permission first ("Did I catch you at a bad time?"), say why you called them, then ask a question before you pitch.',
    goal: 'earn their attention in the first seconds, spark real interest, and book a next step',
    prospect: 'They have never heard of the caller; this is a cold call out of nowhere.',
    opening: "someone you don't know is calling you",
  },
  interested: {
    emoji: '📝', label: 'Interested lead', tag: 'They reached out', desc: 'They asked for info or a quote',
    home: 'They reached out first. Find out what they need and win them.',
    tip: 'They reached out for a reason. Ask what made them reach out before you explain anything.',
    goal: 'find out what they really need, recommend the right fit, and book or close',
    prospect: 'A few days ago they reached out or asked for information or a quote, so they expect the call, but they have questions, hesitations, and maybe other options.',
    opening: 'someone is calling back about what you asked about',
  },
  followup: {
    emoji: '🔁', label: 'Follow-up', tag: 'Went quiet', desc: 'You talked before; they went quiet',
    home: '"Let me think about it" went quiet. Re-engage and get a decision.',
    tip: "Remind them where you left off, then ask what's changed or what's really holding them back.",
    goal: 're-engage them, uncover what is really holding them back, and get a clear decision',
    prospect: "They already talked with the caller once, said they'd think about it (or stopped replying), and haven't decided.",
    opening: 'someone you talked with before is following up with you',
  },
  past: {
    emoji: '⭐', label: 'Past customer', tag: 'Bought before', desc: 'They bought from you before',
    home: 'They bought before. Reconnect, rebook, upgrade, or ask for a referral.',
    tip: 'Reconnect first: ask how things have been since last time before you ask for anything.',
    goal: 'reconnect, then rebook, renew, upgrade, or ask for a referral',
    prospect: "They bought from the caller before. It's been a while, and they may have drifted, had a so-so experience, or simply forgotten to come back.",
    opening: "someone whose business you've used before is calling you",
  },
};
