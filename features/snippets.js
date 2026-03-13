window.QF = window.QF || {};

QF.insertSnippet = async function(preset) {
  const content = preset.content || preset.text || '';
  const active = document.activeElement;
  
  // Try inserting into the active element
  if (active && (
      active.tagName === 'INPUT' || 
      active.tagName === 'TEXTAREA' || 
      active.isContentEditable
  )) {
    active.focus();
    
    // Attempt standard execCommand for native undo/redo & event firing matching React/Vue
    const success = document.execCommand('insertText', false, content);
    
    // Fallback if execCommand fails
    if (!success) {
      if (typeof active.selectionStart === 'number') {
        const start = active.selectionStart;
        const end = active.selectionEnd;
        const val = active.value;
        active.value = val.slice(0, start) + content + val.slice(end);
        
        // Restore cursor position
        active.selectionStart = active.selectionEnd = start + content.length;
        
        // Dispatch React/Vue compatible events
        active.dispatchEvent(new Event('input', { bubbles: true }));
        active.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (active.isContentEditable) {
        // Fallback for content editable manually
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(content));
          range.collapse(false);
        } else {
          active.textContent += content;
        }
        active.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // If all else fails
        await QF.copyToClipboard(content);
        return;
      }
    }
  } else {
    // If no writable field is active, just copy to clipboard
    await QF.copyToClipboard(content);
  }
};
