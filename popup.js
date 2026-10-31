const status = document.querySelector('#status');
document.querySelector('#settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
async function send(type) {
  status.textContent = type === 'start' ? '正在翻译，请保持此窗口打开…' : '正在恢复…';
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const result = await chrome.tabs.sendMessage(tab.id, {type});
    status.textContent = result.error || result.message;
  } catch { status.textContent = '请先打开或刷新 github.com 页面后重试。'; }
}
document.querySelector('#start').addEventListener('click', () => send('start'));
document.querySelector('#restore').addEventListener('click', () => send('restore'));
