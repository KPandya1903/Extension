window.QF = window.QF || {};

/**
 * QF.detectFields()
 * Scans the live DOM for form inputs relevant to job applications and user profiles.
 *
 * Label extraction order (all sources concatenated, then lowercased):
 *   1. placeholder / aria-label / title / data-label attributes
 *   2. name / id attributes (hyphens/underscores converted to spaces)
 *   3. aria-labelledby resolved to actual element text
 *   4. <label for="id"> element
 *   5. Ancestor <label>
 *   6. Previous siblings (up to 2, any inline/block text element)
 *   7. Parent's previous sibling
 *   8. Fieldset <legend> (Workday / Greenhouse radio groups)
 *   9. Nearest [role="group"] aria-label
 *
 * Keywords are ordered specific-to-generic so longer, more precise strings
 * match before short ones (e.g. "email address" before "address", "first name"
 * before "name").
 *
 * Returns: Array of { type: string, element: HTMLElement, labelStr: string }
 */
QF.detectFields = function() {
  const inputs = Array.from(document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"])' +
    ':not([type="checkbox"]):not([type="file"]):not([type="reset"]):not([type="image"]), ' +
    'textarea, select'
  ));

  const detected = [];
  const processedRadios = new Set();

  inputs.forEach(input => {
    // Radio deduplication — only process the first radio in each name group
    if (input.type === 'radio') {
      if (input.name && processedRadios.has(input.name)) return;
      if (input.name) processedRadios.add(input.name);
    }

    // ── Accumulate label text from every available source ────────────────────
    const parts = [];

    const attr = (a) => (input.getAttribute(a) || '').trim();
    if (attr('placeholder'))  parts.push(attr('placeholder'));
    if (attr('aria-label'))   parts.push(attr('aria-label'));
    if (attr('title'))        parts.push(attr('title'));
    if (attr('data-label'))   parts.push(attr('data-label'));
    if (attr('name'))         parts.push(attr('name').replace(/[-_]/g, ' '));
    if (attr('id'))           parts.push(attr('id').replace(/[-_]/g, ' '));

    // aria-labelledby → resolve referenced element text
    const labelledBy = attr('aria-labelledby');
    if (labelledBy) {
      labelledBy.split(/\s+/).forEach(refId => {
        const el = document.getElementById(refId);
        if (el) parts.push(el.textContent.trim());
      });
    }

    // <label for="id">
    if (input.id) {
      try {
        const lbl = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
        if (lbl) parts.push(lbl.textContent.trim());
      } catch (_) { /* ignore malformed id */ }
    }

    // Ancestor <label>
    const ancestorLabel = input.closest('label');
    if (ancestorLabel) parts.push(ancestorLabel.textContent.trim());

    // Previous siblings (up to 2)
    let prev = input.previousElementSibling;
    let steps = 0;
    while (prev && steps < 2) {
      const tag = prev.tagName;
      if (['LABEL', 'SPAN', 'DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'LEGEND', 'DT'].includes(tag)) {
        parts.push(prev.textContent.trim());
      }
      prev = prev.previousElementSibling;
      steps++;
    }

    // Parent's previous sibling (label row above input row)
    if (input.parentElement) {
      const pp = input.parentElement.previousElementSibling;
      if (pp) parts.push(pp.textContent.trim());
    }

    // Fieldset legend (Workday, Greenhouse radio questions)
    const fieldset = input.closest('fieldset');
    if (fieldset) {
      const legend = fieldset.querySelector('legend');
      if (legend) parts.push(legend.textContent.trim());
    }

    // Nearest [role="group"] aria-label
    const roleGroup = input.closest('[role="group"]');
    if (roleGroup) {
      const ga = roleGroup.getAttribute('aria-label') || '';
      if (ga) parts.push(ga.trim());
    }

    const labelStr = parts.join(' ').replace(/\s+/g, ' ').toLowerCase();
    if (!labelStr.trim()) return;

    // ── Keyword list — ORDERED: specific → generic ───────────────────────────
    // Longer / more specific strings must appear before shorter generic ones
    // to prevent early-exit on a weaker match.
    const keywords = [
      // Name — specific before generic
      'preferred name', 'preferred-name',
      'middle name', 'middle-name', 'middle initial',
      'first name', 'first-name', 'given name', 'forename', 'fname',
      'last name', 'last-name', 'family name', 'surname', 'lname',
      'full name', 'e-sign', 'signature',

      // Contact
      'email address', 'email', 'e-mail',
      'phone number', 'phone', 'mobile', 'telephone', 'cell',

      // Address — specific first
      'street address', 'address line',
      'street', 'address',
      'city', 'town', 'municipality',
      'zip code', 'zip', 'postal code', 'postal',

      // Professional
      'linkedin profile', 'linkedin url', 'linkedin',
      'github profile', 'github url', 'github',
      'personal website', 'portfolio url', 'portfolio',
      'current company', 'employer', 'organization', 'organisation', 'company',
      'professional summary', 'cover letter', 'about you', 'summary', 'bio',
      'years of experience', 'experience',
      'notice period', 'availability to start', 'availability', 'notice',
      'salary expectation', 'expected salary', 'desired salary', 'compensation', 'desired pay', 'salary',

      // Disclosures
      'gender identity', 'gender', 'sex', 'pronoun',
      'race/ethnicity', 'ethnic background', 'ethnicity', 'race',
      'protected veteran', 'veteran status', 'veteran', 'military service', 'military', 'armed forces',
      'disability status', 'self-identify disability', 'disability', 'disabled',
      'visa sponsorship', 'require sponsorship', 'sponsorship',
      'work authorization', 'authorized to work', 'authorised to work', 'eligible to work', 'authorized', 'authorised', 'visa', 'work permit', 'legal',
      'dual citizenship', 'dual citizen',
      'country of citizenship', 'nationality', 'citizenship',
      'over 18', '18 years', 'legal age', 'minimum age',
      'in-person', 'on-site', 'onsite', 'five days', 'office',
      'former employee', 'rehire', 'worked here', 'previous employment', 'contractor',
      'current employee', 'currently employed', 'internal applicant',

      // Catch-all (keep last)
      'website', 'resume', 'name'
    ];

    for (const kw of keywords) {
      if (labelStr.includes(kw)) {
        detected.push({ type: kw, element: input, labelStr });
        break;
      }
    }
  });

  // Deduplicate by element reference
  return detected.filter((v, i, a) => a.findIndex(t => t.element === v.element) === i);
};
