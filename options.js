const provider = document.querySelector('#provider');
const status = document.querySelector('#status');
const fields = Object.fromEntries(['url', 'model', 'key'].map(id => [id, document.querySelector('#' + id)]));
const defaults = {deepseek: {url: 'https://api.deepseek.com/v1', model: 'deepseek-chat'}, openai: {url: 'https://api.openai.com/v1', model: 'gpt-4o-mini'}, custom: {url: '', model: ''}};
let configs = {};
function show() {
  const config = {...defaults[provider.value], ...configs[provider.value]};
  for (const [name, element] of Object.entries(fields)) element.value = config[name] || '';
  status.textContent = '';
}
provider.addEventListener('change', show);
chrome.storage.local.get(['configs', 'currentProvider']).then(data => { configs = data.configs || {}; provider.value = data.currentProvider || 'deepseek'; show(); });
document.querySelector('#save').addEventListener('click', async () => {
  try {
    const config = Object.fromEntries(Object.entries(fields).map(([name, el]) => [name, el.value.trim()]));
    if (!config.key || !config.model || !config.url) throw new Error('请填写全部设置。');
    const url = TranslationCore.endpoint(config.url);
    const granted = await chrome.permissions.request({origins: [new URL(url).origin + '/*']});
    if (!granted) throw new Error('需要允许访问 API 地址才能翻译。');
    configs[provider.value] = config;
    await chrome.storage.local.set({configs, currentProvider: provider.value});
    status.textContent = '已保存并启用。';
  } catch (e) { status.textContent = e.message || '保存失败。'; }
});
