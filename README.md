# Pitch Booth

Practice sales calls out loud with an AI customer, then get a score and coaching.

You pick the kind of call (cold call, interested lead, follow-up, or past customer). The app invents a
realistic person who fits what you sell, they pick up the phone, and you talk. Afterwards a coach grades
the call and tells you the one thing to fix next time.

It's a plain website with no build step: HTML, CSS and JavaScript files the browser loads directly, plus a
few serverless functions on Vercel and a Postgres database (Neon).

## How it's organized

```
index.html              the page layout (every screen's markup)
admin.html              the admin page at /admin: invites, usage, spend, universal code

css/
  tokens.css            colors, fonts, radii, shadows — change the whole look here
  base.css              page, text, inputs, buttons, cards, the top bar
  screens.css           each screen, plus phone sizes

data/                   ← edit these to change who people practice with
  professions.js        ~370 jobs people search for ("Videographer", "Barber"…), each pointing to a group below
  industries.js         the 20 groups: examples, objections, customer types
  call-types.js         cold call, interested lead, follow-up, past customer
  personalities.js      personality traits, how common each is, rules, presets, backgrounds
  business-types.js     kinds of business and owner types, for people who call business owners

js/                     loaded in this order (see the bottom of index.html)
  core.js               shared helpers and screen switching
  icons.js              the line icons (phone, star, settings…) used on buttons and cards
  picker.js             the "What do you do?" search and browse list
  state.js              settings, call history, invite links, the person's profile
  ai.js                 talking to Claude, friendly error messages
  prompts.js            ← every instruction the AI gets (building the person, playing them, coaching,
                        and drafting a custom industry)
  voice.js              how the other person sounds (ElevenLabs, browser voices) and the ring tone
  call.js               the call: building the person, Get ready screen, dialing, each turn
  talk.js               the microphone: hold to talk, or hands-free
  grading.js            ending a call and getting the score
  screens/              scorecard, home, setup, settings, welcome, questionnaire, industry (the "Change" picker),
                        draft ("Write your own": Claude drafts an industry, the person confirms it)
  app.js                browser checks and startup (loaded last)

api/                    serverless functions (Vercel)
  claude.js             forwards AI requests with the server's API key and logs usage
  voice.js              turns a reply into speech through ElevenLabs
  join.js               invite codes, the universal code, and quick start
  me.js                 the person's profile
  calls.js              saved calls
  admin/                admin page data, invites (and emailing them), settings

lib/                    shared server code: database, HTTP helpers, email, voice, prices
```

The `js/` files share one global scope and must load in the order listed at the bottom of
`index.html`: data first, then shared code, then screens, then `app.js`.

## Common changes

| I want to… | Edit |
|---|---|
| Add a job people can search for | `data/professions.js` — one line |
| Add an industry group | `data/industries.js` — copy an entry, change the words. (People can also "Write your own": Claude drafts one just for them.) |
| Add customer types or objections | `data/industries.js`, in that industry's `types` / `objections` |
| Add personality traits or make some rarer | `data/personalities.js` (instructions at the top) |
| Change how the call types work | `data/call-types.js` |
| Add a kind of business people can call | `data/business-types.js` |
| Change how the AI customer behaves | `js/prompts.js` → `personaSystemPrompt` |
| Change how people are invented | `js/prompts.js` → `personaBuilderPrompt` |
| Change how calls are graded | `js/prompts.js` → `coachPrompt` and `GRADE_SCHEMA` |
| Change how custom industries are drafted | `js/prompts.js` → `industryDraftPrompt` and `INDUSTRY_SCHEMA` |
| Change colors, text sizes, or spacing | `css/tokens.css` (sizes and spacing are a scale; every screen uses it) |
| Add or change an icon | `js/icons.js` |

## How a call works

1. **Build the person.** `call.js` rolls a customer type (from the industry), a personality mix
   (`data/personalities.js`), age and background, and asks Claude to write a specific person.
2. **Get ready.** The caller sees who they're calling, what they know, their goal, and what they're selling.
3. **The call.** Each thing the caller says goes to Claude playing that person (`personaSystemPrompt`).
   The reply also reports the person's mood (the Cold-to-Sold meter) and what kind of line the caller
   said (for the call-flow checklist). Replies are spoken by ElevenLabs, or the browser's voice.
4. **The coach.** The transcript goes to Claude as a coach (`coachPrompt`), which returns scores and feedback.

## Setup (Vercel)

Environment variables:

| Variable | Needed for |
|---|---|
| `ANTHROPIC_API_KEY` | the AI (required) |
| `DATABASE_URL` or `POSTGRES_URL` | profiles and saved calls (add Neon under Storage) |
| `ADMIN_PASSWORD` | the admin page |
| `ELEVENLABS_API_KEY` | studio voices (optional; browser voices otherwise) |
| `ELEVENLABS_MODEL` | optional, defaults to `eleven_flash_v2_5` |
| `RESEND_API_KEY`, `INVITE_FROM` | emailing invites (optional) |
| `APP_URL` | optional, the site address used in invite emails |
| `DAILY_LIMIT` | optional, AI requests per person per day (default 250) |
| `UNIVERSAL_DAILY_JOINS` | optional, new profiles per day via the universal code or quick start (default 25) |

Database tables are created automatically on the first request. After changing environment
variables, redeploy.

## Running it locally

Static pages only (the AI needs the server functions, so use your own Anthropic key on the welcome screen):

```bash
python3 -m http.server 8777
```

Everything including the server functions:

```bash
npx vercel dev
```

Voice input needs Chrome, Edge, or Safari, and microphone permission.
