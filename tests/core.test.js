const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');

test('normalizes OpenAI-compatible endpoint', () => {
  assert.equal(core.endpoint('https://api.deepseek.com/v1/'), 'https://api.deepseek.com/v1/chat/completions');
  assert.equal(core.endpoint('https://example.com/v1/chat/completions'), 'https://example.com/v1/chat/completions');
  assert.throws(() => core.endpoint('http://example.com/v1'), /HTTPS/);
});

test('validates response count and keeps text as text', () => {
  assert.deepEqual(core.parseTranslations('{"translations":["你好", "世界"]}', 2), ['你好', '世界']);
  assert.throws(() => core.parseTranslations('{"translations":["你好"]}', 2), /数量/);
});

test('protects paths, URLs and identifiers using placeholders', () => {
  const result = core.protect('Run npm install in src/main.js or visit https://example.com/test');
  assert.ok(!result.text.includes('src/main.js'));
  assert.ok(!result.text.includes('https://example.com/test'));
  assert.equal(core.restore(result.text, result.tokens), 'Run npm install in src/main.js or visit https://example.com/test');
  assert.throws(() => core.restore('missing tokens', result.tokens), /占位符/);
});
