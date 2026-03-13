window.QF = window.QF || {};

QF.initDragInsert = function() {
  document.addEventListener('drop', (e) => {
    // Check if the dropped item is a QuickFill preset
    if (e.dataTransfer && e.dataTransfer.types.includes('application/x-quickfill-preset')) {
      const target = e.target;
      
      // Native drag-and-drop handles the actual text insertion at the drop caret.
      // We just wait a tick for the DOM to update, then fire framework events.
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        setTimeout(() => {
          target.dispatchEvent(new Event('input', { bubbles: true }));
          target.dispatchEvent(new Event('change', { bubbles: true }));
        }, 50);
      }
    }
  });
};
