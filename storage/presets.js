window.QF = window.QF || {};

QF.STORAGE_KEY = 'quick_copy_presets';

QF.DEFAULT_PRESETS = [
  { id: 'def-1', label: 'My Email', type: 'text', content: 'your@email.com' },
  { id: 'def-2', label: 'My Phone', type: 'text', content: '+1 (555) 000-0000' },
  { id: 'def-3', label: 'LinkedIn', type: 'url', content: 'https://linkedin.com/in/yourhandle' }
];

QF.Storage = {
  getPresets: function() {
    return new Promise((resolve) => {
      chrome.storage.local.get(QF.STORAGE_KEY, (result) => {
        const stored = result[QF.STORAGE_KEY];
        resolve(stored && stored.length > 0 ? stored : QF.DEFAULT_PRESETS);
      });
    });
  },
  savePresets: function(presets) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [QF.STORAGE_KEY]: presets }, resolve);
    });
  },
  addChangeListener: function(callback) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[QF.STORAGE_KEY]) {
        callback(changes[QF.STORAGE_KEY].newValue || [], 'presets');
      }
    });
  }
};
