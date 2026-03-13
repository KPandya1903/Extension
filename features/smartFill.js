window.QF = window.QF || {};

/**
 * QF.SmartFill
 * Two-tier intelligent autofill engine — 100% offline, 0 API calls.
 *
 * Tier 1 — Neural Network (TensorFlow.js CNN, 13 trained categories)
 *   Classifies ambiguous/natural-language form labels (e.g. "Are you authorized
 *   to work in this country?" → 'authorized').
 *
 * Tier 2 — Rule-Based classifier
 *   Deterministic keyword matching for the remaining ~17 profile fields
 *   (email, phone, address, linkedin, github, etc.) that the neural model
 *   does not cover. Fast and zero-error.
 *
 * Option matching uses Jaro-Winkler string similarity for robust handling
 * of SELECT dropdowns and radio groups on real-world job applications.
 *
 * References:
 *   - Winkler, W.E. (1990). String Comparator Metrics and Enhanced Decision Rules
 *     in the Fellegi-Sunter Model of Record Linkage.
 *   - Jaro, M.A. (1989). Advances in Record-Linkage Methodology.
 */
QF.SmartFill = {
  _model: null,
  _modelFailed: false,

  // Categories the neural network was trained to predict
  _categories: [
    'firstName', 'lastName', 'over18', 'sponsorship', 'authorized',
    'officeWilling', 'gender', 'ethnicity', 'veteranStatus',
    'disabilityStatus', 'salaryExpectation', 'noticePeriod', 'yearsOfExperience'
  ],

  _chars: ' abcdefghijklmnopqrstuvwxyz0123456789?,.:!(*)@#',
  _maxLen: 64,

  // ─── Model loading ──────────────────────────────────────────────────────────

  async _loadModel() {
    if (this._model) return this._model;
    if (this._modelFailed) return null;
    try {
      const url = chrome.runtime.getURL('models/neural_model.json');
      this._model = await tf.loadLayersModel(url);
      console.log('[QF AI] Neural model loaded successfully.');
      return this._model;
    } catch (err) {
      console.error('[QF AI] Failed to load neural model — falling back to rule-based only.', err);
      this._modelFailed = true;
      return null;
    }
  },

  // ─── Neural inference ───────────────────────────────────────────────────────

  _vectorize(text) {
    const sequence = new Int32Array(this._maxLen);
    const cleaned = text.toLowerCase().slice(0, this._maxLen);
    for (let i = 0; i < cleaned.length; i++) {
      const charIdx = this._chars.indexOf(cleaned[i]);
      sequence[i] = charIdx !== -1 ? charIdx + 1 : 0;
    }
    return tf.tensor2d([Array.from(sequence)], [1, this._maxLen]);
  },

  async _neuralClassify(text) {
    const model = await this._loadModel();
    if (!model) return null;

    return tf.tidy(() => {
      const input = this._vectorize(text);
      const prediction = model.predict(input);
      const probs = prediction.dataSync();
      const index = prediction.argMax(1).dataSync()[0];
      const probability = probs[index];

      if (probability < 0.60) {
        console.log(`[QF AI] Low confidence (${(probability * 100).toFixed(1)}%) for: "${text.slice(0, 40)}"`);
        return null;
      }

      const category = this._categories[index];
      console.log(`[QF AI] Neural: "${text.slice(0, 40)}" → ${category} (${(probability * 100).toFixed(1)}%)`);
      return category;
    });
  },

  // ─── Rule-based classifier (covers remaining profile fields) ────────────────

  _ruleClassify(labelStr) {
    const l = labelStr.toLowerCase();

    // Name fields (check specifics before generic "name")
    if (l.includes('preferred name') || l.includes('preferred-name')) return 'preferredName';
    if (l.includes('middle name') || l.includes('middle initial') || l.includes('middle-name')) return 'middleName';
    if (l.includes('first name') || l.includes('given name') || l.includes('forename') || l.includes('fname')) return 'firstName';
    if (l.includes('last name') || l.includes('family name') || l.includes('surname') || l.includes('lname')) return 'lastName';
    if ((l.includes('full name') || l === 'name' || l.includes('your name') || l.includes('e-sign') || l.includes('signature')) &&
        !l.includes('first') && !l.includes('last')) return 'fullName';

    // Contact
    if (l.includes('email') || l.includes('e-mail')) return 'email';
    if (l.includes('phone') || l.includes('mobile') || l.includes('cell') || l.includes('telephone')) return 'phone';

    // Address
    if (l.includes('street') || l.includes('address line 1') || (l.includes('address') && !l.includes('email'))) return 'address';
    if (l.includes('city') || l.includes('town') || l.includes('municipality')) return 'city';
    if (l.includes('zip') || l.includes('postal') || l.includes('post code')) return 'zip';

    // Professional
    if (l.includes('linkedin')) return 'linkedin';
    if (l.includes('github')) return 'github';
    if (l.includes('portfolio') || l.includes('personal website') || l.includes('personal url')) return 'portfolio';
    if (l.includes('company') || l.includes('employer') || l.includes('organization') || l.includes('organisation')) return 'company';
    if (l.includes('summary') || l.includes('cover letter') || l.includes('about you') || l.includes('bio') || l.includes('professional summary')) return 'summary';

    // Eligibility
    if (l.includes('dual citizenship') || l.includes('dual citizen') || l.includes('second citizenship')) return 'dualCitizenship';
    if (l.includes('nationality') || l.includes('country of citizenship')) return 'nationality';
    if (l.includes('current employee') || l.includes('currently employed') || l.includes('internal applicant')) return 'currentEmployee';

    return null;
  },

  // ─── Main public entry point ────────────────────────────────────────────────

  /**
   * classify(text) — public API used by floatingMenu for individual label classification
   * Tries neural first, then falls back to rule-based.
   */
  async classify(text) {
    const neural = await this._neuralClassify(text);
    if (neural) return neural;
    const rule = this._ruleClassify(text);
    if (rule) console.log(`[QF AI] Rule-based: "${text.slice(0, 40)}" → ${rule}`);
    return rule;
  },

  /**
   * fillAll(detectedFields, profile) — fills every detected empty field.
   * Returns the number of fields successfully filled.
   */
  async fillAll(detectedFields, profile) {
    console.log('[QF AI] Smart Fill started...');
    let filled = 0;

    for (const field of detectedFields) {
      const val = field.element.value || field.element.textContent || '';
      if (val.trim().length > 0) continue;

      const category = await this.classify(field.labelStr);
      if (!category) continue;

      // Resolve the profile value — handle composite fields like fullName
      let profileValue;
      if (category === 'fullName') {
        const parts = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean);
        profileValue = parts.join(' ');
      } else {
        profileValue = profile[category];
      }

      if (!profileValue || String(profileValue).trim().length === 0) continue;

      const el = field.element;
      const valueStr = String(profileValue).trim();

      console.log(`[QF AI] Filling: "${field.labelStr.slice(0, 30)}" → ${category} = "${valueStr}"`);

      if (el.tagName === 'SELECT' || el.type === 'radio') {
        const success = await this._fillAdvancedElement(el, valueStr);
        if (success) filled++;
      } else {
        await QF.autofillField(el, { content: valueStr });
        filled++;
      }

      await new Promise(r => setTimeout(r, 80));
    }

    console.log(`[QF AI] Completed. Filled ${filled} field(s).`);
    return filled;
  },

  // ─── Advanced element filling (SELECT / radio / ARIA button groups) ──────────

  async _fillAdvancedElement(el, profileValue) {
    let options = [];

    if (el.tagName === 'SELECT') {
      options = Array.from(el.options)
        .filter(o => o.value !== '' && o.text.trim() !== '')
        .map(o => ({ text: o.text.trim(), value: o.value, element: o }));

    } else if (el.type === 'radio' && el.name) {
      const group = document.querySelectorAll(`input[type="radio"][name="${CSS.escape(el.name)}"]`);
      options = Array.from(group).map(r => {
        let text = '';
        if (r.id) {
          const lbl = document.querySelector(`label[for="${CSS.escape(r.id)}"]`);
          if (lbl) text = lbl.textContent.trim();
        }
        if (!text) {
          const parent = r.closest('label');
          if (parent) text = parent.textContent.trim();
        }
        if (!text) text = r.value;
        return { text, value: r.value, element: r };
      }).filter(o => o.text.length > 0);

    } else {
      // ARIA button groups (common in Workday, Greenhouse, Lever)
      const parent = el.closest('[role="group"], fieldset, .form-group, div, td');
      if (parent) {
        const btns = Array.from(parent.querySelectorAll('[role="button"], button, [role="radio"], [role="option"]'));
        if (btns.length > 0) {
          options = btns.map(b => ({ text: b.textContent.trim(), value: b.textContent.trim(), element: b }));
        }
      }
    }

    if (options.length === 0) return false;

    const bestOpt = this._findBestOption(options, profileValue);
    if (!bestOpt) return false;

    console.log(`[QF AI]   → Option selected: "${bestOpt.text}"`);

    if (el.tagName === 'SELECT') {
      el.value = bestOpt.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      bestOpt.element.click();
      bestOpt.element.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  },

  // ─── Option matching ─────────────────────────────────────────────────────────

  _findBestOption(options, target) {
    const t = target.toLowerCase().trim();
    const validOptions = options.filter(o => o.text.length > 0);

    // 1. Exact match
    let match = validOptions.find(o => o.text.toLowerCase() === t || o.value.toLowerCase() === t);
    if (match) return match;

    // 2. Binary Yes/No/Decline semantic mapping
    const YES_TOKENS = ['yes', 'y', 'true', '1', 'confirm', 'i confirm', 'i do', 'agree', 'authorized', 'eligible'];
    const NO_TOKENS  = ['no', 'n', 'false', '0', 'decline', 'not required', 'not applicable', 'n/a', 'prefer not', 'do not'];
    const DECLINE_TOKENS = ['decline', 'prefer not', 'i do not wish', 'choose not', 'not disclosed'];

    if (YES_TOKENS.includes(t)) {
      match = validOptions.find(o => YES_TOKENS.some(tok => o.text.toLowerCase().startsWith(tok)));
      if (match) return match;
    }
    if (NO_TOKENS.includes(t)) {
      match = validOptions.find(o => NO_TOKENS.some(tok => o.text.toLowerCase().startsWith(tok)));
      if (match) return match;
    }
    if (DECLINE_TOKENS.some(tok => t.includes(tok))) {
      match = validOptions.find(o => DECLINE_TOKENS.some(tok => o.text.toLowerCase().includes(tok)));
      if (match) return match;
    }

    // 3. Substring containment (bidirectional)
    match = validOptions.find(o => o.text.toLowerCase().includes(t) || t.includes(o.text.toLowerCase()));
    if (match) return match;

    // 4. Jaro-Winkler similarity — best score wins (threshold ≥ 0.72)
    let best = null;
    let bestScore = 0.72;
    for (const o of validOptions) {
      const score = this._jaroWinkler(o.text.toLowerCase(), t);
      if (score > bestScore) {
        bestScore = score;
        best = o;
      }
    }
    return best;
  },

  /**
   * Jaro-Winkler string similarity.
   * Returns a score in [0, 1] — 1.0 means identical strings.
   *
   * Winkler, W.E. (1990). "String Comparator Metrics and Enhanced Decision Rules
   * in the Fellegi-Sunter Model of Record Linkage."
   */
  _jaroWinkler(s1, s2) {
    if (s1 === s2) return 1;
    const len1 = s1.length, len2 = s2.length;
    if (len1 === 0 || len2 === 0) return 0;

    const matchDist = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0);
    const s1Matched = new Uint8Array(len1);
    const s2Matched = new Uint8Array(len2);
    let matches = 0;

    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchDist);
      const end   = Math.min(i + matchDist + 1, len2);
      for (let j = start; j < end; j++) {
        if (s2Matched[j] || s1[i] !== s2[j]) continue;
        s1Matched[i] = s2Matched[j] = 1;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0;

    let transpositions = 0;
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!s1Matched[i]) continue;
      while (!s2Matched[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    const jaro = (
      matches / len1 +
      matches / len2 +
      (matches - transpositions / 2) / matches
    ) / 3;

    // Winkler prefix bonus (up to 4 characters, weight 0.1)
    let prefix = 0;
    const maxPrefix = Math.min(4, Math.min(len1, len2));
    for (let i = 0; i < maxPrefix; i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }

    return jaro + prefix * 0.1 * (1 - jaro);
  }
};
