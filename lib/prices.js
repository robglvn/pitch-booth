// $ per million tokens: [input, output, cache-read multiplier]. Cache writes are 1.25x input.
// Used only to estimate spend for the admin page; the Anthropic invoice is the source of truth.
export const PRICES = {
  'claude-haiku-5-5': [0.10, 0.50, 0.1],
  'claude-sonnet-5-5': [2, 10, 0.1],
  'claude-opus-5-5': [4, 20, 0.05],
  'claude-opus-4-8': [5, 25, 0.1],
};

export const ALLOWED_MODELS = new Set(['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5']);

export function costUsd(model, u) {
  const p = PRICES[model];
  if (!p || !u) return 0;
  return ((u.input_tokens || 0) * p[0] + (u.cache_read_input_tokens || 0) * p[0] * p[2]
    + (u.cache_creation_input_tokens || 0) * p[0] * 1.25 + (u.output_tokens || 0) * p[1]) / 1e6;
}
