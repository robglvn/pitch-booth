import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// The server builds every prompt with the same files the browser uses: the call data in data/ and the
// instructions in js/prompts.js. They're plain browser scripts that set window.PB_*, so they run here in a
// small sandbox with its own `window`. vercel.json includes these files in the /api/claude function.
const FILES = ['data/call-types.js', 'data/industries.js', 'data/personalities.js', 'data/business-types.js', 'data/call-flow.js', 'js/prompts.js'];

let shared = null;
export function loadShared() {
  if (shared) return shared;
  const sandbox = vm.createContext({ window: {}, console });
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(process.cwd(), f), 'utf8'), sandbox, { filename: f });
  shared = sandbox.window;
  return shared;
}
