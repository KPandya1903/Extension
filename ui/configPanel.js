window.QF = window.QF || {};

QF.createConfigPanel = function() {
  const panel = document.createElement('div');
  panel.className = 'qc-panel';
  panel.style.display = 'none';
  panel.innerHTML = `
    <div class="qc-panel-header">Configuration</div>
    <div class="qc-tabs-nav">
      <button type="button" class="qc-tab-btn active" data-target="snippets">Snippets</button>
      <button type="button" class="qc-tab-btn" data-target="identity">Identity</button>
    </div>
    <div class="qc-panel-body">
      <div id="qc-tab-snippets" class="qc-tab-content active">
        <p class="qc-max-hint">Add keywords to labels to trigger autofill (e.g. 'Email').</p>
        <div class="qc-add-row" style="flex-wrap: wrap;">
          <input type="text" class="qc-input-label" placeholder="Label" maxlength="32" style="flex: 1 1 80px;">
          <select class="qc-input-type" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;">
            <option value="text">Text</option>
            <option value="url">URL</option>
          </select>
          <input type="text" class="qc-input-domain" placeholder="Domain" style="flex: 1 1 100px;">
          <input type="text" class="qc-input-text" placeholder="Content/URL" style="flex: 1 1 100%; margin-top: 8px;">
          <button type="button" class="qc-btn-add" style="margin-top: 8px; width: 100%;">Add</button>
        </div>
        <div class="qc-preset-list"></div>
        <div class="qc-empty" style="display:none">No presets yet.</div>
      </div>
      <div id="qc-tab-identity" class="qc-tab-content">
        <div class="qc-profile-scroll" style="max-height: 280px; overflow-y: auto; padding-right: 4px;">
          <div class="qc-identity-grid">
            <input type="text" class="qc-p-firstName" placeholder="First Name">
            <input type="text" class="qc-p-lastName" placeholder="Last Name">
            <input type="text" class="qc-p-middleName" placeholder="Middle Name">
            <input type="text" class="qc-p-preferredName" placeholder="Preferred Name">
            <input type="text" class="qc-p-email" placeholder="Email Address" style="grid-column: span 2;">
            <input type="text" class="qc-p-phone" placeholder="Phone Number" style="grid-column: span 2;">
            <input type="text" class="qc-p-company" placeholder="Current Company" style="grid-column: span 2;">
            <input type="text" class="qc-p-salaryExpectation" placeholder="Salary Exp.">
            <input type="text" class="qc-p-yearsOfExperience" placeholder="Exp Yrs">
            <div style="grid-column: span 2; font-size: 11px; font-weight: 600; color: #2563eb; margin-top: 8px; border-bottom: 1px solid #ebf2ff;">Disclosures & Eligibility</div>
            <input type="text" class="qc-p-authorized" placeholder="Work Authorized? (Yes/No)">
            <input type="text" class="qc-p-sponsorship" placeholder="Require Spons? (Yes/No)">
            <input type="text" class="qc-p-nationality" placeholder="Nationality">
            <input type="text" class="qc-p-over18" placeholder="Over 18? (Yes/No)">
            <input type="text" class="qc-p-officeWilling" placeholder="Office Willing? (Yes/No)">
            <input type="text" class="qc-p-previousWork" placeholder="Worked here? (Yes/No)">
            <input type="text" class="qc-p-gender" placeholder="Gender">
            <input type="text" class="qc-p-ethnicity" placeholder="Race/Eth.">
            <input type="text" class="qc-p-veteranStatus" placeholder="Vet. Status">
            <input type="text" class="qc-p-disabilityStatus" placeholder="Dis. Status">
            <button type="button" class="qc-btn-save-profile" style="grid-column: span 2; margin-top: 8px; height: 32px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">Save Identity</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const list = panel.querySelector('.qc-preset-list');
  const empty = panel.querySelector('.qc-empty');
  const labelInput = panel.querySelector('.qc-input-label');
  const typeInput = panel.querySelector('.qc-input-type');
  const domainInput = panel.querySelector('.qc-input-domain');
  const textInput = panel.querySelector('.qc-input-text');
  const addBtn = panel.querySelector('.qc-btn-add');
  const saveProfileBtn = panel.querySelector('.qc-btn-save-profile');
  
  const pInputs = {
    firstName: panel.querySelector('.qc-p-firstName'),
    lastName: panel.querySelector('.qc-p-lastName'),
    middleName: panel.querySelector('.qc-p-middleName'),
    preferredName: panel.querySelector('.qc-p-preferredName'),
    email: panel.querySelector('.qc-p-email'),
    phone: panel.querySelector('.qc-p-phone'),
    company: panel.querySelector('.qc-p-company'),
    salaryExpectation: panel.querySelector('.qc-p-salaryExpectation'),
    yearsOfExperience: panel.querySelector('.qc-p-yearsOfExperience'),
    authorized: panel.querySelector('.qc-p-authorized'),
    sponsorship: panel.querySelector('.qc-p-sponsorship'),
    nationality: panel.querySelector('.qc-p-nationality'),
    over18: panel.querySelector('.qc-p-over18'),
    officeWilling: panel.querySelector('.qc-p-officeWilling'),
    previousWork: panel.querySelector('.qc-p-previousWork'),
    gender: panel.querySelector('.qc-p-gender'),
    ethnicity: panel.querySelector('.qc-p-ethnicity'),
    veteranStatus: panel.querySelector('.qc-p-veteranStatus'),
    disabilityStatus: panel.querySelector('.qc-p-disabilityStatus')
  };

  panel.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') e.target.focus();
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
      const textPreview = contentStr.length > 30 ? contentStr.slice(0, 30) + '…' : contentStr;
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
          const arr = r.filter((x) => x.id !== p.id);
          QF.Storage.savePresets(arr);
        });
      });
      list.appendChild(item);
    });
    addBtn.disabled = presets.length >= 50 && !editingId;
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
        presets.push({ 
          id: Date.now().toString(), 
          label, 
          type, 
          domain, 
          content: text 
        });
      }
      QF.Storage.savePresets(presets).then(() => {
        labelInput.value = '';
        domainInput.value = '';
        textInput.value = '';
        renderPanelItems(presets);
      });
    });
  });

  saveProfileBtn.addEventListener('click', () => {
    const profile = {};
    Object.keys(pInputs).forEach(k => profile[k] = pInputs[k].value.trim());
    QF.Storage.saveProfile(profile).then(() => {
      QF.showToast('Identity saved!', panel.parentElement);
    });
  });

  // Tab switching
  panel.querySelectorAll('.qc-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.querySelectorAll('.qc-tab-btn').forEach(b => b.classList.remove('active'));
      panel.querySelectorAll('.qc-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      panel.querySelector(`#qc-tab-${btn.dataset.target}`).classList.add('active');
    });
  });

  function updateAll(data, type) {
    if (type === 'presets' || !type) {
      QF.Storage.getPresets().then(renderPanelItems);
    }
    if (type === 'profile' || !type) {
      QF.Storage.getProfile().then(p => {
        Object.keys(pInputs).forEach(k => pInputs[k].value = p[k] || '');
      });
    }
  }

  updateAll();
  QF.Storage.addChangeListener(updateAll);

  return panel;
};
