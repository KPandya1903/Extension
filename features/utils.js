window.QF = window.QF || {};

QF.escapeHtml = function(s) {
  const div = document.createElement('div');
  div.textContent = s || '';
  return div.innerHTML;
};

QF.isUrl = function(text) {
  const t = (text || '').trim();
  return t.startsWith('http://') || t.startsWith('https://') || t.startsWith('www.');
};

QF.getDomainFromUrl = function(url) {
  try {
    const t = (url || '').trim();
    const u = t.startsWith('http') ? t : 'https://' + t;
    const host = new URL(u).hostname;
    return host.replace(/^www\./, '') || '';
  } catch { return ''; }
};

QF.getFaviconUrl = function(url) {
  const domain = QF.getDomainFromUrl(url);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
};

QF.copyToClipboard = function(text) {
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    Object.assign(ta.style, {
      position: 'fixed', top: '0', left: '0',
      width: '1px', height: '1px', opacity: '0',
      border: 'none', padding: '0', margin: '0',
    });
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copy failed'));
    } catch (e) {
      document.body.removeChild(ta);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(resolve).catch(reject);
      } else reject(e);
    }
  });
};
