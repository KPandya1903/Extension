(function () {
  'use strict';

  const MAX_PRESETS = 50;

  const presetList = document.getElementById('preset-list');
  const emptyState = document.getElementById('empty-state');
  const newLabel = document.getElementById('new-label');
  const newType = document.getElementById('new-type');
  const newDomain = document.getElementById('new-domain');
  const newContent = document.getElementById('new-content');
  const btnAdd = document.getElementById('btn-add');
  const btnExport = document.getElementById('btn-export');
  const btnImport = document.getElementById('btn-import');
  const importFile = document.getElementById('import-file');
  const modalOverlay = document.getElementById('modal-overlay');
  const editLabel = document.getElementById('edit-label');
  const editType = document.getElementById('edit-type');
  const editDomain = document.getElementById('edit-domain');
  const editContent = document.getElementById('edit-content');
  const modalCancel = document.getElementById('modal-cancel');
  const modalSave = document.getElementById('modal-save');
  const btnSaveProfile = document.getElementById('btn-save-profile');
  const tabs = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  const profileInputs = {
    firstName: document.getElementById('p-firstName'),
    lastName: document.getElementById('p-lastName'),
    middleName: document.getElementById('p-middleName'),
    preferredName: document.getElementById('p-preferredName'),
    email: document.getElementById('p-email'),
    phone: document.getElementById('p-phone'),
    address: document.getElementById('p-address'),
    city: document.getElementById('p-city'),
    zip: document.getElementById('p-zip'),
    summary: document.getElementById('p-summary'),
    yearsOfExperience: document.getElementById('p-yearsOfExperience'),
    noticePeriod: document.getElementById('p-noticePeriod'),
    salaryExpectation: document.getElementById('p-salaryExpectation'),
    gender: document.getElementById('p-gender'),
    ethnicity: document.getElementById('p-ethnicity'),
    veteranStatus: document.getElementById('p-veteranStatus'),
    disabilityStatus: document.getElementById('p-disabilityStatus'),
    authorized: document.getElementById('p-authorized'),
    sponsorship: document.getElementById('p-sponsorship'),
    nationality: document.getElementById('p-nationality'),
    dualCitizenship: document.getElementById('p-dualCitizenship'),
    over18: document.getElementById('p-over18'),
    officeWilling: document.getElementById('p-officeWilling'),
    previousWork: document.getElementById('p-previousWork'),
    currentEmployee: document.getElementById('p-currentEmployee'),
    company: document.getElementById('p-company'),
    linkedin: document.getElementById('p-linkedin'),
    github: document.getElementById('p-github'),
    portfolio: document.getElementById('p-portfolio')
  };

  let presets = [];
  let editingId = null;

  function loadData() {
    window.QF.Storage.getPresets().then((result) => {
      presets = result || [];
      render();
    });
    window.QF.Storage.getProfile().then((profile) => {
      Object.keys(profileInputs).forEach(key => {
        if (profileInputs[key]) profileInputs[key].value = profile[key] || '';
      });
    });
  }

  function savePresets() {
    window.QF.Storage.savePresets(presets).then(() => {
      render();
    });
  }

  function addPreset(label, type, domain, content) {
    if (presets.length >= MAX_PRESETS) return;
    const trimmedLabel = (label || '').trim();
    const trimmedContent = (content || '').trim();
    const trimmedDomain = (domain || '').trim();
    if (!trimmedLabel || !trimmedContent) return;

    presets.push({
      id: Date.now().toString(),
      label: trimmedLabel,
      type: type || 'text',
      domain: trimmedDomain,
      content: trimmedContent,
    });
    savePresets();
    newLabel.value = '';
    newDomain.value = '';
    newContent.value = '';
    newLabel.focus();
  }

  function updatePreset(id, label, type, domain, content) {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    const trimmedLabel = (label || '').trim();
    const trimmedContent = (content || '').trim();
    const trimmedDomain = (domain || '').trim();
    if (!trimmedLabel || !trimmedContent) return;

    p.label = trimmedLabel;
    p.type = type || 'text';
    p.domain = trimmedDomain;
    p.content = trimmedContent;
    delete p.text;
    savePresets();
    closeModal();
  }

  function deletePreset(id) {
    presets = presets.filter((p) => p.id !== id);
    savePresets();
  }

  function openModal(preset) {
    editingId = preset ? preset.id : null;
    editLabel.value = preset ? preset.label : '';
    editType.value = preset ? (preset.type || 'text') : 'text';
    editDomain.value = preset ? (preset.domain || '') : '';
    editContent.value = preset ? (preset.content || preset.text || '') : '';
    modalOverlay.classList.remove('hidden');
    editLabel.focus();
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
    editingId = null;
  }

  function exportPresets() {
    const data = JSON.stringify(presets, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quickfill_presets_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importPresets(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          if (confirm(`Import ${imported.length} presets? This will overwrite existing ones.`)) {
            presets = imported.slice(0, MAX_PRESETS);
            savePresets();
          }
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
      importFile.value = '';
    };
    reader.readAsText(file);
  }

  function renderPreset(preset) {
    const div = document.createElement('div');
    div.className = 'preset-item';
    div.dataset.id = preset.id;

    const contentStr = preset.content || preset.text || '';
    const textPreview = contentStr.length > 60 ? contentStr.slice(0, 60) + '…' : contentStr;
    const typeBadge = preset.type ? `<span style="font-size: 10px; background: #e5e7eb; padding: 2px 6px; border-radius: 4px; margin-left: 8px; vertical-align: middle; color: #4b5563;">${preset.type}</span>` : '';
    const domainBadge = preset.domain ? `<span style="font-size: 10px; background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; margin-left: 4px; vertical-align: middle;">${preset.domain}</span>` : '';

    div.innerHTML = `
      <div class="preset-content">
        <div class="preset-label">${window.QF.escapeHtml(preset.label)}${typeBadge}${domainBadge}</div>
        <div class="preset-text" title="${window.QF.escapeHtml(contentStr)}">${window.QF.escapeHtml(textPreview)}</div>
      </div>
      <div class="preset-actions">
        <button class="btn-edit">Edit</button>
        <button class="btn-delete">Delete</button>
      </div>
    `;

    div.querySelector('.btn-edit').addEventListener('click', () => openModal(preset));
    div.querySelector('.btn-delete').addEventListener('click', () => deletePreset(preset.id));

    return div;
  }

  function render() {
    presetList.innerHTML = '';
    presetList.appendChild(
      presets.reduce((frag, p) => {
        frag.appendChild(renderPreset(p));
        return frag;
      }, document.createDocumentFragment())
    );

    emptyState.classList.toggle('hidden', presets.length > 0);
    btnAdd.disabled = presets.length >= MAX_PRESETS;
  }

  btnAdd.addEventListener('click', () => {
    addPreset(newLabel.value, newType.value, newDomain.value, newContent.value);
  });

  newContent.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addPreset(newLabel.value, newType.value, newDomain.value, newContent.value);
  });

  btnExport.addEventListener('click', exportPresets);
  btnImport.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', importPresets);

  modalCancel.addEventListener('click', closeModal);
  modalSave.addEventListener('click', () => {
    if (!editingId) return;
    updatePreset(editingId, editLabel.value, editType.value, editDomain.value, editContent.value);
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Profile save
  btnSaveProfile.addEventListener('click', () => {
    const profile = {};
    Object.keys(profileInputs).forEach(key => {
      profile[key] = profileInputs[key].value.trim();
    });
    window.QF.Storage.saveProfile(profile).then(() => {
      alert('Profile saved successfully!');
    });
  });

  // Tab switching
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabs.forEach(b => b.classList.toggle('active', b === btn));
      tabContents.forEach(c => c.classList.toggle('active', c.id === `tab-${target}`));
    });
  });

  loadData();
})();
