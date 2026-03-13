window.QF = window.QF || {};

QF.autofillField = async function(element, preset) {
  const content = (preset.content || preset.text || '').toString().trim();
  if (!content) return;

  element.focus();

  if (element.tagName === 'SELECT') {
    const options = Array.from(element.options);
    const lowerContent = content.toLowerCase();
    
    // Try exact match first
    let bestOption = options.find(o => o.text.trim().toLowerCase() === lowerContent);
    // Try partial match if no exact match
    if (!bestOption) {
      bestOption = options.find(o => o.text.trim().toLowerCase().includes(lowerContent) || lowerContent.includes(o.text.trim().toLowerCase()));
    }

    if (bestOption) {
      element.value = bestOption.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return;
  }

  if (element.type === 'radio') {
    const name = element.name;
    if (!name) return;
    const group = Array.from(document.querySelectorAll(`input[type="radio"][name="${name}"]`));
    const lowerContent = content.toLowerCase();

    for (const radio of group) {
      // Find label for this radio
      let labelText = '';
      if (radio.id) {
        const l = document.querySelector(`label[for="${radio.id}"]`);
        if (l) labelText = l.textContent;
      }
      if (!labelText) {
        const parent = radio.closest('label');
        if (parent) labelText = parent.textContent;
      }
      
      if (labelText.trim().toLowerCase().includes(lowerContent) || lowerContent.includes(labelText.trim().toLowerCase())) {
        radio.click();
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
    return;
  }

  const success = document.execCommand('insertText', false, content);
  if (!success) {
    if (typeof element.selectionStart === 'number') {
      element.value = content;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      element.innerHTML = content;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
};

QF.autofillAll = async function(detectedFields, presets) {
  let filledCount = 0;
  const profile = await window.QF.Storage.getProfile();

  for (const field of detectedFields) {
    // Overwrite Protection: Don't fill if field already has content
    const currentValue = field.element.value || field.element.textContent || '';
    if (currentValue.trim().length > 0) continue;

    let content = null;
    const type = field.type.toLowerCase();

    // 1. Try Profile matches (Strict)
    if (type.includes('preferred name') || type === 'preferred-name') content = profile.preferredName;
    else if (type.includes('middle name') || type === 'middle-name') content = profile.middleName;
    else if (type.includes('first name') || type === 'fname' || type === 'given name') content = profile.firstName;
    else if (type.includes('last name') || type === 'lname' || type === 'family name') content = profile.lastName;
    else if (type === 'email') content = profile.email;
    else if (type.includes('phone') || type === 'mobile') content = profile.phone;
    else if (type.includes('address') || type === 'street') content = profile.address;
    else if (type === 'city') content = profile.city;
    else if (type === 'zip') content = profile.zip;
    else if (type === 'linkedin') content = profile.linkedin;
    else if (type === 'github') content = profile.github;
    else if (type === 'portfolio' || type === 'website') content = profile.portfolio;
    else if (type === 'company') content = profile.company;
    else if (type.includes('summary') || type.includes('cover letter')) content = profile.summary;
    else if (type.includes('experience') || type.includes('years')) content = profile.yearsOfExperience;
    else if (type.includes('notice') || type.includes('period')) content = profile.noticePeriod;
    else if (type.includes('salary') || type.includes('compensation') || type.includes('pay')) content = profile.salaryExpectation;
    else if (type.includes('gender')) content = profile.gender;
    else if (type.includes('ethnicity') || type.includes('race')) content = profile.ethnicity;
    else if (type.includes('veteran')) content = profile.veteranStatus;
    else if (type.includes('disability')) content = profile.disabilityStatus;
    else if (type.includes('sponsorship')) content = profile.sponsorship;
    else if (type.includes('authorized') || type.includes('legal')) content = profile.authorized;
    else if (type.includes('nationality')) content = profile.nationality;
    else if (type.includes('citizenship')) content = profile.dualCitizenship;
    else if (type.includes('over 18') || type.includes('age')) content = profile.over18;
    else if (type.includes('office') || type.includes('five days')) content = profile.officeWilling;
    else if (type.includes('contractor') || type.includes('former') || type.includes('previous')) content = profile.previousWork;
    else if (type.includes('current employee')) content = profile.currentEmployee;
    else if (type === 'name' || type.includes('signature') || type.includes('full name') || type.includes('e-sign')) {
      const parts = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean);
      content = parts.join(' ');
    }

    if (content && content.length > 0) {
      await QF.autofillField(field.element, { content });
      filledCount++;
      await new Promise(r => setTimeout(r, 40));
      continue;
    }

    // 2. Fallback to Presets
    const match = presets.find(p => 
      p.label.toLowerCase().includes(type) || 
      (p.type && p.type.toLowerCase() === type) || 
      (p.content || p.text || '').toLowerCase().includes(type)
    );
    if (match) {
      await QF.autofillField(field.element, match);
      filledCount++;
      await new Promise(r => setTimeout(r, 60));
    }
  }
  return filledCount;
};
