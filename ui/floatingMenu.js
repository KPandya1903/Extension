window.QF = window.QF || {};

QF.createFloatingMenu = function(root, host, configPanel) {
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const mainBtn = document.createElement('button');
  mainBtn.className = 'main-btn';
  mainBtn.type = 'button';
  mainBtn.innerHTML = QF.Icons.plus;
  mainBtn.title = 'Quick Copy presets';

  let expanded = false;
  let configOpen = false;
  let configBackdrop = null;
  let subButtons = [];

  function renderSubButtons(allPresets) {
    const hostname = window.location.hostname;
    const presets = allPresets.filter(p => {
      if (!p.domain) return true;
      const domains = p.domain.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
      if (domains.length === 0) return true;
      return domains.some(d => hostname.includes(d) || d.includes(hostname));
    });

    subButtons.forEach((el) => el.remove());
    subButtons = [];
    
    // Header actions: Autofill (if detected) and Config
    const detectedFields = QF.detectFields();
    const actionButtons = [];

    const actionButtonDefinitions = [
      {
        id: 'smart-fill',
        icon: QF.Icons.brain,
        label: 'Smart Fill (AI)',
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        action: async (btn) => {
          const fields = QF.detectFields();
          const profile = await QF.Storage.getProfile();
          const filled = await QF.SmartFill.fillAll(fields, profile);
          if (filled > 0) {
            btn.classList.add('copied');
            setTimeout(() => btn.classList.remove('copied'), 800);
            QF.showToast(`AI filled ${filled} field(s)`, root);
          } else {
            QF.showToast('AI could not determine answers. Try manual!', root);
          }
        }
      },
      {
        id: 'autofill',
        icon: QF.Icons.magic,
        label: 'Standard Fill',
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        action: async (btn) => {
          const fields = QF.detectFields();
          const p = await QF.Storage.getProfile();
          const filled = await QF.autofillAll(fields, p);
          if (filled > 0) {
            btn.classList.add('copied');
            setTimeout(() => btn.classList.remove('copied'), 800);
            QF.showToast(`Filled ${filled} field(s)`, root);
          } else {
            QF.showToast('No matching data found.', root);
          }
        }
      }
    ];

    actionButtonDefinitions.forEach(def => {
      const btn = document.createElement('button');
      btn.className = `sub-btn qc-${def.id}-btn`;
      btn.type = 'button';
      btn.innerHTML = `<div class="qc-inner"><span class="qc-icon">${def.icon}</span><span class="qc-check">${QF.Icons.check}</span></div><span class="qc-label">${def.label}</span>`;
      btn.style.background = def.background;
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await def.action(btn);
      });
      actionButtons.push(btn);
    });

    const configBtn = document.createElement('button');
    configBtn.className = 'sub-btn qc-config-btn';
    configBtn.type = 'button';
    configBtn.innerHTML = `<div class="qc-inner"><span class="qc-icon">${QF.Icons.gear}</span><span class="qc-check">${QF.Icons.check}</span></div><span class="qc-label">Configure</span>`;
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
    actionButtons.push(configBtn);

    // Layout helper
    const totalActions = actionButtons.length;
    actionButtons.forEach((btn, i) => {
      const offsetY = -(presets.length + totalActions - i) * 56;
      btn.style.transform = `translateY(${offsetY}px) scale(0)`;
      btn.style.opacity = '0';
      btn.style.transition = `transform 0.25s cubic-bezier(0.34,1.56,0.64,1) 0ms, opacity 0.2s 0ms`;
      btn.dataset.offsetY = String(offsetY);
      wrap.appendChild(btn);
      subButtons.push(btn);
    });

    presets.forEach((preset, i) => {
      const btn = document.createElement('button');
      btn.className = 'sub-btn';
      btn.type = 'button';
      btn.innerHTML = QF.getButtonInnerHtml(preset) + `<span class="qc-label">${QF.escapeHtml(preset.label)}</span>`;
      btn.title = `${preset.label}: ${(preset.content || preset.text).slice(0, 50)}${(preset.content || preset.text).length > 50 ? '…' : ''}`;
      
      const offsetY = -(presets.length - i) * 56;
      btn.style.transform = `translateY(${offsetY}px) scale(0)`;
      btn.style.opacity = '0';
      btn.style.transition = `transform 0.25s cubic-bezier(0.34,1.56,0.64,1) ${i * 30}ms, opacity 0.2s ${i * 30}ms, background 0.2s`;
      btn.dataset.offsetY = String(offsetY);
      
      btn.draggable = true;
      btn.addEventListener('dragstart', (e) => {
        const contentStr = preset.content || preset.text || '';
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
      // Refresh presets and detect fields on expand to catch dynamic forms
      const allPresets = await QF.Storage.getPresets();
      renderSubButtons(allPresets);
    }

    mainBtn.innerHTML = expanded ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="#ffffff"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>` : QF.Icons.plus;
    
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
      }
      if (configOpen) {
        configOpen = false;
        configPanel.style.display = 'none';
      }
    }
  });

  QF.Storage.getPresets().then(renderSubButtons);
  QF.Storage.addChangeListener(renderSubButtons);

  wrap.appendChild(mainBtn);
  return wrap;
};
