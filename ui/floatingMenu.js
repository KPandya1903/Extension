window.QF = window.QF || {};

QF.createFloatingMenu = function(root, host, configPanel) {
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const mainBtn = document.createElement('button');
  mainBtn.className = 'main-btn';
  mainBtn.type = 'button';
  mainBtn.innerHTML = QF.Icons.plus;
  mainBtn.title = 'QuickCopy snippets';

  let expanded = false;
  let configOpen = false;
  let configBackdrop = null;
  let subButtons = [];

  function renderSubButtons(allPresets) {
    const hostname = window.location.hostname;
    const presets = allPresets.filter(p => QF.matchesDomain(p, hostname));

    subButtons.forEach((el) => el.remove());
    subButtons = [];

    // Config button always at top
    const configBtn = document.createElement('button');
    configBtn.className = 'sub-btn qc-config-btn';
    configBtn.type = 'button';
    configBtn.innerHTML = `<div class="qc-inner"><span class="qc-icon">${QF.Icons.gear}</span><span class="qc-check">${QF.Icons.check}</span></div><span class="qc-label">Snippets</span>`;
    configBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      configOpen = !configOpen;
      configPanel.style.display = configOpen ? 'flex' : 'none';
      if (configOpen) {
        configBackdrop = document.createElement('div');
        configBackdrop.className = 'qc-panel-backdrop';
        root.appendChild(configBackdrop);
        configBackdrop.addEventListener('click', () => {
          configOpen = false;
          configPanel.style.display = 'none';
          if (configBackdrop) configBackdrop.remove();
          configBackdrop = null;
        });
        setTimeout(() => configPanel.querySelector('.qc-input-label').focus(), 50);
      } else {
        if (configBackdrop) configBackdrop.remove();
        configBackdrop = null;
      }
    });

    const totalActions = 1;
    const configOffsetY = -(presets.length + totalActions) * 56;
    configBtn.style.transform = `translateY(${configOffsetY}px) scale(0)`;
    configBtn.style.opacity = '0';
    configBtn.style.transition = `transform 0.25s cubic-bezier(0.34,1.56,0.64,1) 0ms, opacity 0.2s 0ms`;
    configBtn.dataset.offsetY = String(configOffsetY);
    wrap.appendChild(configBtn);
    subButtons.push(configBtn);

    // Snippet buttons
    presets.forEach((preset, i) => {
      const btn = document.createElement('button');
      btn.className = 'sub-btn';
      btn.type = 'button';
      btn.innerHTML = QF.getButtonInnerHtml(preset) + `<span class="qc-label">${QF.escapeHtml(preset.label)}</span>`;
      const contentStr = preset.content || preset.text || '';
      btn.title = `${preset.label}: ${contentStr.slice(0, 50)}${contentStr.length > 50 ? '…' : ''}`;

      const offsetY = -(presets.length - i) * 56;
      btn.style.transform = `translateY(${offsetY}px) scale(0)`;
      btn.style.opacity = '0';
      btn.style.transition = `transform 0.25s cubic-bezier(0.34,1.56,0.64,1) ${i * 30}ms, opacity 0.2s ${i * 30}ms, background 0.2s`;
      btn.dataset.offsetY = String(offsetY);

      btn.draggable = true;
      btn.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', contentStr);
        e.dataTransfer.setData('application/x-quickfill-preset', contentStr);
        e.dataTransfer.effectAllowed = 'copy';
      });

      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await QF.insertSnippet(preset);
          btn.classList.add('copied');
          btn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.style.background = '';
          }, 800);
        } catch { /* copy failed */ }
      });

      wrap.appendChild(btn);
      subButtons.push(btn);
    });
  }

  async function toggleExpand() {
    expanded = !expanded;

    if (expanded) {
      const allPresets = await QF.Storage.getPresets();
      renderSubButtons(allPresets);
    }

    mainBtn.innerHTML = expanded ? QF.Icons.close : QF.Icons.plus;

    subButtons.forEach((sub) => {
      const oy = sub.dataset.offsetY || '0';
      sub.style.transform = expanded ? `translateY(${oy}px) scale(1)` : `translateY(${oy}px) scale(0)`;
      sub.style.opacity = expanded ? '1' : '0';
      sub.style.pointerEvents = expanded ? 'auto' : 'none';
    });
  }

  mainBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  mainBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleExpand();
  });

  wrap.addEventListener('mousedown', (e) => e.stopPropagation());

  document.addEventListener('click', (e) => {
    const inPanel = host.contains(e.target) || configPanel.contains(e.target);
    if (!inPanel) {
      if (configOpen && configBackdrop) {
        configOpen = false;
        configPanel.style.display = 'none';
        configBackdrop.remove();
        configBackdrop = null;
      }
      if (expanded) {
        expanded = false;
        subButtons.forEach((sub) => {
          const oy = sub.dataset.offsetY || '0';
          sub.style.transform = `translateY(${oy}px) scale(0)`;
          sub.style.opacity = '0';
        });
        mainBtn.innerHTML = QF.Icons.plus;
      }
    }
  });

  QF.Storage.getPresets().then(renderSubButtons);
  QF.Storage.addChangeListener(renderSubButtons);

  wrap.appendChild(mainBtn);
  return wrap;
};
