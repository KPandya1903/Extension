window.QF = window.QF || {};

QF.createConfigPanel = function() {
  const panel = document.createElement('div');
  panel.className = 'qc-panel';
  panel.style.display = 'none';
  panel.innerHTML = `
    <div class="qc-panel-header">Snippets</div>
    <div class="qc-panel-body">
      <div class="qc-add-row" style="flex-wrap: wrap;">
        <input type="text" class="qc-input-label" placeholder="Label" maxlength="32" style="flex: 1 1 80px;">
        <select class="qc-input-type" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;">
          <option value="text">Text</option>
          <option value="url">URL</option>
        </select>
        <input type="text" class="qc-input-domain" placeholder="Domain (optional)" style="flex: 1 1 100px;">
        <input type="text" class="qc-input-text" placeholder="Content / URL" style="flex: 1 1 100%; margin-top: 8px;">
        <button type="button" class="qc-btn-add" style="margin-top: 8px; width: 100%;">Add</button>
      </div>
      <div class="qc-preset-list"></div>
      <div class="qc-empty" style="display:none">No snippets yet. Add one above.</div>
    </div>
  `;

  const list = panel.querySelector('.qc-preset-list');
  const empty = panel.querySelector('.qc-empty');
  const labelInput = panel.querySelector('.qc-input-label');
  const typeInput = panel.querySelector('.qc-input-type');
  const domainInput = panel.querySelector('.qc-input-domain');
  const textInput = panel.querySelector('.qc-input-text');
  const addBtn = panel.querySelector('.qc-btn-add');

  panel.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
      e.target.focus();
    }
  });
  panel.addEventListener('click', (e) => e.stopPropagation());

  let editingId = null;
  let draggedId = null;

  function renderPanelItems(presets) {
    list.innerHTML = '';
    empty.style.display = presets.length === 0 ? 'block' : 'none';
    presets.forEach((p) => {
      const item = document.createElement('div');
      item.className = 'qc-preset-item';
      item.draggable = true;
      item.dataset.id = p.id;
      const contentStr = p.content || p.text || '';
      const textPreview = contentStr.length > 36 ? contentStr.slice(0, 36) + '…' : contentStr;
      const typeBadge = p.type ? `<span style="font-size: 9px; opacity: 0.6; margin-left: 4px;">[${p.type}]</span>` : '';

      item.innerHTML = `
        <span class="qc-drag-handle">${QF.Icons.dragHandle}</span>
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center;">
            <span class="qc-preset-label">${QF.escapeHtml(p.label)}</span>
            ${typeBadge}
          </div>
          <span class="qc-preset-text" title="${QF.escapeHtml(contentStr)}">${QF.escapeHtml(textPreview)}</span>
        </div>
        <button type="button" class="qc-btn-edit">Edit</button>
        <button type="button" class="qc-btn-del">Del</button>
      `;

      item.addEventListener('dragstart', (e) => {
        draggedId = p.id;
        item.classList.add('dragging');
        e.dataTransfer.setData('text/plain', p.id);
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => {
        draggedId = null;
        item.classList.remove('dragging');
        list.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
      });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedId && item.dataset.id !== draggedId) item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        const fromId = e.dataTransfer.getData('text/plain');
        if (!fromId || fromId === item.dataset.id) return;
        QF.Storage.getPresets().then(arr => {
          const fromIdx = arr.findIndex((x) => x.id === fromId);
          const toIdx = arr.findIndex((x) => x.id === item.dataset.id);
          if (fromIdx === -1 || toIdx === -1) return;
          const [moved] = arr.splice(fromIdx, 1);
          arr.splice(toIdx, 0, moved);
          QF.Storage.savePresets(arr);
        });
      });

      item.querySelector('.qc-btn-edit').addEventListener('click', (ev) => {
        ev.stopPropagation();
        editingId = p.id;
        labelInput.value = p.label;
        typeInput.value = p.type || 'text';
        domainInput.value = p.domain || '';
        textInput.value = contentStr;
        addBtn.textContent = 'Save';
        textInput.focus();
      });
      item.querySelector('.qc-btn-del').addEventListener('click', (ev) => {
        ev.stopPropagation();
        QF.Storage.getPresets().then(r => {
          QF.Storage.savePresets(r.filter((x) => x.id !== p.id));
        });
      });

      list.appendChild(item);
    });
    addBtn.disabled = presets.length >= 50 && editingId === null;
  }

  addBtn.addEventListener('click', () => {
    const label = (labelInput.value || '').trim();
    const text = (textInput.value || '').trim();
    const type = typeInput.value;
    const domain = (domainInput.value || '').trim();
    if (!label || !text) return;

    QF.Storage.getPresets().then(presets => {
      if (editingId) {
        const p = presets.find((x) => x.id === editingId);
        if (p) {
          p.label = label;
          p.type = type;
          p.domain = domain;
          p.content = text;
          delete p.text;
        }
        editingId = null;
        addBtn.textContent = 'Add';
      } else {
        if (presets.length >= 50) return;
        presets.push({ id: Date.now().toString(), label, type, domain, content: text });
      }
      QF.Storage.savePresets(presets).then(() => {
        labelInput.value = '';
        domainInput.value = '';
        textInput.value = '';
        typeInput.value = 'text';
        renderPanelItems(presets);
      });
    });
  });

  // Enter key submits from any input field
  [labelInput, typeInput, domainInput, textInput].forEach(el => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addBtn.click(); }
    });
  });

  QF.Storage.getPresets().then(renderPanelItems);
  QF.Storage.addChangeListener((_, type) => {
    if (type === 'presets' || !type) QF.Storage.getPresets().then(renderPanelItems);
  });

  return panel;
};
