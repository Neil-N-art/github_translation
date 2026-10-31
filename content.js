(() => {
  const originals = new Map();
  let generation = 0;
  let running = false;
  const excluded = 'script,style,noscript,code,pre,kbd,samp,textarea,input,select,option,[contenteditable]:not([contenteditable="false"]),svg,math';
  function collect() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {acceptNode(node) {
      const p = node.parentElement;
      if (!p || p.closest(excluded) || !/[a-zA-Z]{2}/.test(node.data) || !node.data.trim() || node.data.length > 4000) return NodeFilter.FILTER_REJECT;
      if (!p.getClientRects().length || getComputedStyle(p).visibility === 'hidden') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const nodes = [];
    while (walker.nextNode() && nodes.length < 200) nodes.push(walker.currentNode);
    return nodes;
  }
  async function translate() {
    if (running) return {error: '翻译正在进行'};
    running = true;
    const run = ++generation;
    let done = 0;
    try {
      const nodes = collect().filter(node => !originals.has(node));
      for (let i = 0; i < nodes.length; i += 20) {
        if (run !== generation) break;
        const batch = nodes.slice(i, i + 20);
        const values = batch.map(n => n.data);
        const response = await chrome.runtime.sendMessage({type: 'translate', texts: values});
        if (response?.error) throw new Error(response.error);
        if (!response?.texts) throw new Error('扩展未收到翻译结果');
        if (run !== generation) break;
        batch.forEach((node, index) => {
          if (node.isConnected && node.data === values[index]) {
            originals.set(node, {original: values[index], translated: response.texts[index]});
            node.data = response.texts[index];
            done++;
          }
        });
      }
      return {message: run !== generation ? '已停止并恢复原文' : `完成：翻译了 ${done} 段文本（每次最多 200 段）`};
    } catch (e) { return {error: `${e.message}；已翻译 ${done} 段，可恢复原文`}; }
    finally { running = false; }
  }
  chrome.runtime.onMessage.addListener((message, _sender, respond) => {
    if (message.type === 'restore') {
      generation++;
      for (const [node, entry] of originals) if (node.isConnected && node.data === entry.translated) node.data = entry.original;
      originals.clear();
      respond({message: '已恢复原文'});
    } else if (message.type === 'start') { translate().then(respond); return true; }
  });
})();
