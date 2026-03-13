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

/**
 * QF.autofillAll
 * Fills all detected fields using:
 *   Tier 1 — user profile (rule-based, comprehensive keyword matching)
 *   Tier 2 — stored presets fallback (label/content keyword matching)
 *
 * @param {Array}  detectedFields  Output of QF.detectFields()
 * @param {Object} [profile]       Optional pre-fetched profile (avoids redundant storage read)
 */
QF.autofillAll = async function(detectedFields, profile) {
  let filledCount = 0;

  // Accept a pre-fetched profile from the caller, or fetch fresh if not provided
  const p = (profile && typeof profile === 'object' && !Array.isArray(profile))
    ? profile
    : await QF.Storage.getProfile();

  // Always fetch presets for the Tier-2 fallback pass
  const presets = await QF.Storage.getPresets();

  for (const field of detectedFields) {
    // Overwrite protection — skip if the field already has a value
    const currentValue = field.element.value || field.element.textContent || '';
    if (currentValue.trim().length > 0) continue;

    let content = null;
    const type = field.type.toLowerCase();

    // ── Tier 1: Profile → field-type mapping ────────────────────────────────
    if (type.includes('preferred name') || type === 'preferred-name')
      content = p.preferredName;
    else if (type.includes('middle name') || type.includes('middle-name') || type.includes('middle initial'))
      content = p.middleName;
    else if (type.includes('first name') || type === 'fname' || type.includes('given name') || type.includes('forename'))
      content = p.firstName;
    else if (type.includes('last name') || type === 'lname' || type.includes('family name') || type.includes('surname'))
      content = p.lastName;
    else if (type === 'email' || type.includes('e-mail') || type.includes('email address'))
      content = p.email;
    else if (type.includes('phone') || type === 'mobile' || type.includes('cell') || type.includes('telephone'))
      content = p.phone;
    else if (type.includes('address') || type === 'street' || type.includes('street address'))
      content = p.address;
    else if (type === 'city' || type.includes('town') || type.includes('municipality'))
      content = p.city;
    else if (type === 'zip' || type.includes('postal') || type.includes('post code') || type.includes('zip code'))
      content = p.zip;
    else if (type === 'linkedin' || type.includes('linkedin url') || type.includes('linkedin profile'))
      content = p.linkedin;
    else if (type === 'github' || type.includes('github url') || type.includes('github profile'))
      content = p.github;
    else if (type === 'portfolio' || type === 'website' || type.includes('personal website') || type.includes('portfolio url'))
      content = p.portfolio;
    else if (type === 'company' || type.includes('employer') || type.includes('organization') || type.includes('current company'))
      content = p.company;
    else if (type.includes('summary') || type.includes('cover letter') || type.includes('about you') || type.includes('bio') || type.includes('professional summary'))
      content = p.summary;
    else if (type.includes('experience') || type.includes('years') || type.includes('years of experience'))
      content = p.yearsOfExperience;
    else if (type.includes('notice') || type.includes('notice period') || type.includes('availability'))
      content = p.noticePeriod;
    else if (type.includes('salary') || type.includes('compensation') || type.includes('pay') || type.includes('expected salary') || type.includes('desired'))
      content = p.salaryExpectation;
    else if (type.includes('gender') || type.includes('gender identity') || type.includes('sex'))
      content = p.gender;
    else if (type.includes('ethnicity') || type.includes('race') || type.includes('ethnic background'))
      content = p.ethnicity;
    else if (type.includes('veteran') || type.includes('military') || type.includes('armed forces'))
      content = p.veteranStatus;
    else if (type.includes('disability') || type.includes('disabled') || type.includes('accommodation'))
      content = p.disabilityStatus;
    else if (type.includes('sponsorship') || type.includes('visa') || type.includes('work permit'))
      content = p.sponsorship;
    else if (type.includes('authorized') || type.includes('authorised') || type.includes('work authorization') || type.includes('eligible to work'))
      content = p.authorized;
    else if (type.includes('nationality') || type.includes('citizenship') || type.includes('country of citizenship'))
      content = p.nationality;
    else if (type.includes('dual citizenship') || type.includes('dual citizen') || type.includes('second citizenship'))
      content = p.dualCitizenship;
    else if (type.includes('over 18') || type.includes('18 years') || type.includes('minimum age') || type.includes('legal age'))
      content = p.over18;
    else if (type.includes('office') || type.includes('five days') || type.includes('on-site') || type.includes('onsite') || type.includes('in-person'))
      content = p.officeWilling;
    else if (type.includes('contractor') || type.includes('former') || type.includes('previous') || type.includes('worked here') || type.includes('rehire'))
      content = p.previousWork;
    else if (type.includes('current employee') || type.includes('currently employed') || type.includes('internal applicant'))
      content = p.currentEmployee;
    else if (type === 'name' || type.includes('full name') || type.includes('signature') || type.includes('e-sign') || type.includes('your name')) {
      const parts = [p.firstName, p.middleName, p.lastName].filter(Boolean);
      content = parts.join(' ');
    }

    if (content && String(content).trim().length > 0) {
      await QF.autofillField(field.element, { content: String(content) });
      filledCount++;
      await new Promise(r => setTimeout(r, 40));
      continue;
    }

    // ── Tier 2: Preset fallback — match by label or content keywords ─────────
    const match = presets.find(preset => {
      const label = (preset.label || '').toLowerCase();
      const pContent = (preset.content || preset.text || '').toLowerCase();
      return label.includes(type) || type.includes(label) || pContent.includes(type);
    });
    if (match) {
      await QF.autofillField(field.element, match);
      filledCount++;
      await new Promise(r => setTimeout(r, 60));
    }
  }

  return filledCount;
};
