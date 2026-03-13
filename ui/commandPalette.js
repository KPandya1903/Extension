window.QF = window.QF || {};

QF.createCommandPalette = function(root) {
  const palette = document.createElement('div');
  palette.className = 'qc-palette-overlay';
  palette.style.display = 'none';

  palette.innerHTML = `
    <div class="qc-palette">
      <input type="text" class="qc-palette-input" placeholder="Search snippets...">
      <div class="qc-palette-list"></div>
    </div>
  `;

  const input = palette.querySelector('.qc-palette-input');
  const list = palette.querySelector('.qc-palette-list');
  let open = false;
  let snippets = [];
  let selectedIndex = 0;

  function renderList(query = '') {
    list.innerHTML = '';
    const q = query.toLowerCase();
    const filtered = snippets.filter(s => 
      s.label.toLowerCase().includes(q) || 
      (s.content || s.text || '').toLowerCase().includes(q) ||
      (s.type || '').toLowerCase().includes(q)
    );
    
    if (filtered.length === 0) {
      list.innerHTML = '<div class="qc-palette-empty">No snippets found.</div>';
      return;
    }
    
    selectedIndex = Math.min(selectedIndex, filtered.length - 1);
    if (selectedIndex < 0) selectedIndex = 0;

    filtered.forEach((s, idx) => {
      const item = document.createElement('div');
      item.className = 'qc-palette-item' + (idx === selectedIndex ? ' qc-selected' : '');
      const contentStr = s.content || s.text || '';
      const typeBadge = s.type ? `<span class="qc-palette-type">${QF.escapeHtml(s.type)}</span>` : '';
      item.innerHTML = `
        <div class="qc-palette-label">${QF.escapeHtml(s.label)}${typeBadge}</div>
        <div class="qc-palette-content">${QF.escapeHtml(contentStr)}</div>
      `;
      
      item.draggable = true;
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', contentStr);
        e.dataTransfer.setData('application/x-quickfill-preset', contentStr);
        e.dataTransfer.effectAllowed = 'copy';
      });

      item.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        closePalette();
        setTimeout(async () => {
           await QF.insertSnippet(s);
        }, 50);
      });
      list.appendChild(item);
    });
  }

  function togglePalette() {
    open = !open;
    if (open) {
      QF.Storage.getPresets().then(allRes => {
        const hostname = window.location.hostname;
        snippets = allRes.filter(p => QF.matchesDomain(p, hostname));
        palette.style.display = 'flex';
        input.value = '';
        selectedIndex = 0;
        renderList();
        setTimeout(() => input.focus(), 50);
      });
    } else {
      closePalette();
    }
  }

  function closePalette() {
    open = false;
    palette.style.display = 'none';
  }

  palette.addEventListener('mousedown', (e) => {
    // Prevent focus loss when clicking background
    if (e.target === palette) {
      e.preventDefault();
    }
  });

  palette.addEventListener('click', (e) => {
    if (e.target === palette) closePalette();
  });

  input.addEventListener('keydown', async (e) => {
    const items = list.querySelectorAll('.qc-palette-item');
    if (e.key === 'Escape') {
      closePalette();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectedIndex < items.length - 1) {
        selectedIndex++;
        renderList(input.value);
        const el = list.querySelector(`.qc-palette-item:nth-child(${selectedIndex + 1})`);
        if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedIndex > 0) {
        selectedIndex--;
        renderList(input.value);
        const el = list.querySelector(`.qc-palette-item:nth-child(${selectedIndex + 1})`);
        if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const q = input.value.toLowerCase();
      const filtered = snippets.filter(s => 
        s.label.toLowerCase().includes(q) || 
        (s.content || s.text || '').toLowerCase().includes(q) ||
        (s.type || '').toLowerCase().includes(q)
      );
      if (filtered[selectedIndex]) {
        closePalette();
        // Give time for focus to return to original document element
        setTimeout(async () => {
          await QF.insertSnippet(filtered[selectedIndex]);
        }, 50);
      }
    }
  });

  input.addEventListener('input', () => {
    selectedIndex = 0;
    renderList(input.value);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      togglePalette();
    }
  });

  return palette;
};
