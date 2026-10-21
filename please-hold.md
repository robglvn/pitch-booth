# Prompt: AI Sales-Call Practice App (paste into Claude)

Build me a single-file HTML app: an AI sales-call simulator so I can practice real sales calls out loud, by voice.

## My situation
I'm a videographer/photographer. I pitch photo + short-form video (reels) services to local small business owners. I have real sales calls coming up and I don't yet know how to run them — the opener, the intro, discovery questions, the pitch, handling objections, the close. This app is my practice reps.

## Tech constraints
- ONE self-contained HTML file. No build step, no backend, no npm, no framework. I open it in Chrome and it works.
- Voice in/out via browser Web Speech APIs: SpeechRecognition (with webkit prefix fallback) for my microphone, speechSynthesis for the owner's voice.
- Push-to-talk: I hold a button (or hold Space) to talk — more reliable than continuous listening. Show a live transcript of both sides as we go.
- AI brain: call the Anthropic API directly from the browser. Settings panel where I paste my own API key, stored in localStorage (it never leaves my machine except to api.anthropic.com). Use the `anthropic-dangerous-direct-browser-access: true` header so browser CORS works. Make the model ID a setting, defaulting to a current Claude Sonnet. Handle API errors with plain-English messages (bad key, no mic, etc.).
- All call history and scores persist in localStorage.
- Include an HTML comment at the top explaining how to run it: needs Chrome/Edge, mic permission, an Anthropic API key, and a secure context (https or localhost) for mic access.

## Persona engine (the heart of the app)
Every call generates a complete, believable business owner:
- **Identity:** name, age, gender, race/ethnicity — genuinely diverse across calls, realistic, never a caricature.
- **Business:** industry (rotate: restaurant, auto repair, boutique, gym, salon/barbershop, dental office, law firm, coffee shop, brewery, home services, etc.), size, years in business, neighborhood flavor.
- **Personality archetype** (rotate): skeptical "burned by marketers before", rushed and busy, warm and chatty, price-shopper, analytical "show me numbers", friendly but avoids decisions, hostile to cold calls, curious early adopter.
- **Attitude toward salespeople:** varies per persona.
- **Political/cultural lean** (left, right, or apolitical): expressed SUBTLY through small talk and values language — community pride, family business, faith, frustration with regulations, local roots. Never a stereotype, never a debate topic, never a punchline. The training goal is building rapport with anyone.
- **Hidden agenda:** each persona has 1–2 real objections they'll raise (too expensive, tried video before and it flopped, "my nephew does our Instagram", no time, "I need to ask my partner") and a secret "what would actually win them over."

Write the persona system prompt carefully: the owner stays in character no matter what. If I break character or ask for coaching mid-call, they react like a confused owner would ("huh?"). Coaching happens ONLY in the post-call scorecard. Owner responses are short and spoken-like — 1–3 sentences, like a real phone call, never paragraphs.

## Modes
1. **Random call** — full surprise, like real life.
2. **Pick your scenario** — I choose industry, personality, and difficulty (easy / realistic / brutal).
3. **Objection drill** — skip the small talk, jump straight to one specific objection, run it 5x in a row.

## Call-flow coach (on screen during the call)
A checklist tracking the phases of a good sales call:
1. Opener — permission-based, under 30 seconds
2. Who I am + why I'm calling
3. Discovery — ask questions BEFORE pitching (the app counts my questions)
4. Pitch — tied to what they actually said, not a generic monologue
5. Objection handling
6. Close — trial close, then a direct ask for the sale

Show which phase I'm in with one subtle hint per phase. Enforce the structure: if I pitch before asking at least 2 discovery questions, the persona should push back in character ("you don't even know what I need yet").

## Post-call scorecard (deliberate practice)
When I end the call, send the transcript to the API with a grader prompt and show:
- Scores 1–10: opener, discovery, listening (question-to-statement ratio), objection handling, close attempt, rapport.
- Whether I actually asked for the sale (flag it if I didn't — most beginners don't).
- Full transcript I can re-read.
- 2 specific things I did well, 1 concrete thing to fix next rep, with a drill suggestion.
- Save every call to history with a score trend over time so I can see improvement.

Difficulty progression: start at "realistic"; unlock "brutal" after 3 completed calls. Brutal personas interrupt, go cold mid-call, and stack objections.

## UI
- Clean, dark, phone-call aesthetic. Big persona card ("Maria, 52 — owns a family Mexican restaurant, skeptical of marketers"), call timer, push-to-talk button, live transcript, phase checklist sidebar, end-call button.
- Vary the AI voice per persona (different speechSynthesis voice/pitch/rate per character).
- Settings panel: API key, model, my name, what I sell (editable pitch context), voice options.

## Guardrails
- Personas are realistic people, never stereotypes. Political lean is texture, not a punchline.
- Never break character during a call.
- Short spoken-style responses only during calls.
