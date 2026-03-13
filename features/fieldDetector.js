window.QF = window.QF || {};

QF.detectFields = function() {
  const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]), textarea, select'));
  const detected = [];
  
  const processedRadios = new Set();

  inputs.forEach(input => {
    // Group radio buttons by name
    if (input.type === 'radio') {
      if (input.name && processedRadios.has(input.name)) return;
      if (input.name) processedRadios.add(input.name);
    }

    let labelStr = input.getAttribute('placeholder') || 
                   input.getAttribute('aria-label') || 
                   input.getAttribute('title') ||
                   input.name || 
                   input.id || '';
                   
    if (input.id) {
      const labelEl = document.querySelector(`label[for="${input.id}"]`);
      if (labelEl) labelStr += ' ' + labelEl.textContent;
    }
    
    // Check parent and previous siblings for text
    const parentLabel = input.closest('label');
    if (parentLabel) labelStr += ' ' + parentLabel.textContent;

    const prevSibling = input.previousElementSibling;
    if (prevSibling && (prevSibling.tagName === 'LABEL' || prevSibling.tagName === 'SPAN' || prevSibling.tagName === 'DIV')) {
      labelStr += ' ' + prevSibling.textContent;
    }

    // Workday specific: Check legend for fieldsets (common for radios)
    const fieldset = input.closest('fieldset');
    if (fieldset) {
      const legend = fieldset.querySelector('legend');
      if (legend) labelStr += ' ' + legend.textContent;
    }

    if (input.parentElement && input.parentElement.previousElementSibling) {
      labelStr += ' ' + input.parentElement.previousElementSibling.textContent;
    }
    
    labelStr = labelStr.toLowerCase();
    
    const keywords = [
      'first name', 'last name', 'first-name', 'last-name', 'fname', 'lname', 'given name', 'family name',
      'middle name', 'middle-name', 'preferred name', 'preferred-name',
      'summary', 'cover letter', 'about you',
      'gender', 'pronoun', 'ethnicity', 'race', 'veteran', 'disability',
      'sponsorship', 'authorized', 'visa', 'legal',
      'nationality', 'citizenship', 'over 18', 'age', 'office', 'five days', 'contractor', 'former', 'current employee',
      'address', 'street', 'city', 'zip', 'email', 'phone', 'mobile',
      'linkedin', 'github', 'portfolio', 'website', 'resume', 'name', 'company'
    ];
    for (const kw of keywords) {
      if (labelStr.includes(kw)) {
        detected.push({ type: kw, element: input, labelStr });
        break; 
      }
    }
  });
  
  // Deduplicate elements
  return detected.filter((v, i, a) => a.findIndex(t => (t.element === v.element)) === i);
};
