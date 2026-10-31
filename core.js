(function (root) {
  function endpoint(value) {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:') throw new Error('API 地址必须使用 HTTPS');
    if (url.username || url.password || url.search || url.hash) throw new Error('API 地址不能包含凭据、查询参数或片段');
    url.pathname = url.pathname.replace(/\/+$/, '');
    if (!url.pathname.endsWith('/chat/completions')) url.pathname += '/chat/completions';
    return url.toString();
  }
  function parseTranslations(raw, count) {
    let parsed;
    try { parsed = JSON.parse(raw); } catch { throw new Error('服务返回的翻译不是有效 JSON'); }
    if (!Array.isArray(parsed.translations) || parsed.translations.length !== count || !parsed.translations.every(x => typeof x === 'string')) throw new Error('服务返回的翻译数量或格式不正确');
    return parsed.translations;
  }
  function protect(text) {
    const tokens = [];
    const masked = text.replace(/https?:\/\/[^\s<>]+|\b(?:[\w.-]+\/)+[\w.-]+\b|\b[a-zA-Z_$][\w$]*(?:[_.-][\w$]+)+\b/g, value => {
      const token = `⟦KEEP${tokens.length}⟧`;
      tokens.push({token, value});
      return token;
    });
    return {text: masked, tokens};
  }
  function restore(text, tokens) {
    for (const {token, value} of tokens) {
      if (text.split(token).length !== 2) throw new Error('翻译结果丢失或重复了保护占位符');
      text = text.replace(token, () => value);
    }
    return text;
  }
  const api = { endpoint, parseTranslations, protect, restore };
  if (typeof module !== 'undefined') module.exports = api;
  else root.TranslationCore = api;
})(globalThis);
