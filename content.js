(function () {
  'use strict';

  const CONTAINER_ID = 'quick-copy-container';

  function createHost() {
    const host = document.createElement('div');
    host.id = CONTAINER_ID;
    const root = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = window.QF.SHEET;
    root.appendChild(style);
    return { host, root };
  }

  function inject() {
    if (document.getElementById(CONTAINER_ID)) return;

    const { host, root } = createHost();
    const configPanel = window.QF.createConfigPanel();
    const floatingMenu = window.QF.createFloatingMenu(root, host, configPanel);
    const commandPalette = window.QF.createCommandPalette(root);

    root.appendChild(floatingMenu);
    root.appendChild(configPanel);
    root.appendChild(commandPalette);
    document.body.appendChild(host);
  }

  const observer = new MutationObserver(() => {
    if (!document.getElementById(CONTAINER_ID)) inject();
  });

  function init() {
    inject();
    if (typeof window.QF.initDragInsert === 'function') {
      window.QF.initDragInsert();
    }
    if (document.body) observer.observe(document.body, { childList: true, subtree: false });
  }

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
