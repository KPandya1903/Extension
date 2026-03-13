window.QF = window.QF || {};

/**
 * QF.SmartFill
 * Purely Local ML inference using a Naive Bayes classifier.
 * 0 API calls. 100% offline.
 */
QF.SmartFill = {
  _model: null,
  _categories: [
    'firstName', 'lastName', 'over18', 'sponsorship', 'authorized', 
    'officeWilling', 'gender', 'ethnicity', 'veteranStatus', 
    'disabilityStatus', 'salaryExpectation', 'noticePeriod', 'yearsOfExperience'
  ],
  _chars: " abcdefghijklmnopqrstuvwxyz0123456789?,.:!(*)@#",
  _maxLen: 64,

  /**
   * Loads the pre-trained TensorFlow.js model
   */
  async _loadModel() {
    if (this._model) return this._model;
    try {
      const url = chrome.runtime.getURL('models/neural_model.json');
      this._model = await tf.loadLayersModel(url);
      console.log('[QF AI] TensorFlow model loaded.');
      return this._model;
    } catch (err) {
      console.error('[QF] Failed to load Neural model:', err);
      return null;
    }
  },

  /**
   * Prepares text for neural inference (consistent with neural_trainer.js)
   */
  _vectorize(text) {
    const sequence = new Int32Array(this._maxLen);
    const cleaned = text.toLowerCase().slice(0, this._maxLen);
    for (let i = 0; i < cleaned.length; i++) {
      const charIdx = this._chars.indexOf(cleaned[i]);
      sequence[i] = charIdx !== -1 ? charIdx + 1 : 0;
    }
    return tf.tensor2d([sequence], [1, this._maxLen]);
  },

  /**
   * Classifies text using the Neural Network
   */
  async classify(text) {
    const model = await this._loadModel();
    if (!model) return null;

    return tf.tidy(() => {
      const input = this._vectorize(text);
      const prediction = model.predict(input);
      const index = prediction.argMax(1).dataSync()[0];
      const probability = prediction.dataSync()[index];

      // Confidence threshold
      if (probability < 0.6) {
        console.log(`[QF AI] Low confidence (${probability.toFixed(2)}) for: "${text.slice(0, 30)}"`);
        return null;
      }

      const category = this._categories[index];
      console.log(`[QF AI] Classifying: "${text.slice(0, 40)}" -> Result: ${category} (${(probability * 100).toFixed(1)}%)`);
      return category;
    });
  },

  /**
   * Main entry point for Smart Fill
   */
  async fillAll(detectedFields, profile) {
    console.log('[QF AI] Starting Advanced Smart Fill...');
    let filled = 0;

    for (const field of detectedFields) {
      const val = field.element.value || '';
      if (val.trim().length > 0) continue; 

      const predictedCategory = await this.classify(field.labelStr);
      if (!predictedCategory || !profile[predictedCategory]) continue;

      const profileValue = String(profile[predictedCategory]);
      const el = field.element;

      console.log(`[QF AI] Match Found: "${field.labelStr.slice(0, 30)}" -> ${predictedCategory} (${profileValue})`);

      if (el.tagName === 'SELECT' || el.type === 'radio') {
        const success = await this._fillAdvancedElement(el, profileValue);
        if (success) filled++;
      } else {
        await QF.autofillField(el, { content: profileValue });
        filled++;
      }
      
      await new Promise(r => setTimeout(r, 100));
    }

    console.log('[QF AI] Completed. Total filled:', filled);
    return filled;
  },

  /**
   * Handles semantically matching profile values to form options (Yes/No, etc)
   */
  async _fillAdvancedElement(el, profileValue) {
    let options = [];
    if (el.tagName === 'SELECT') {
      options = Array.from(el.options).map(o => ({ text: o.text, value: o.value, element: o }));
    } else if (el.type === 'radio' && el.name) {
      const group = document.querySelectorAll(`input[type="radio"][name="${el.name}"]`);
      options = Array.from(group).map(r => {
        const label = document.querySelector(`label[for="${r.id}"]`) || r.closest('label');
        return { text: label ? label.textContent.trim() : '', value: r.value, element: r };
      });
    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      // Look for sibling buttons that might be 'Yes/No' options
      const parent = el.closest('div, td, .form-group');
      if (parent) {
        const buttons = Array.from(parent.querySelectorAll('button, [role="button"]'));
        if (buttons.length > 0) {
          options = buttons.map(b => ({ text: b.textContent.trim(), value: b.textContent.trim(), element: b }));
        }
      }
    }

    if (options.length === 0) return false;

    // Use a tiny semantic heuristic for Yes/No/Decline
    const bestOpt = this._findBestOption(options, profileValue);
    if (bestOpt) {
      console.log(`[QF AI]   -> Semantic Choice: "${bestOpt.text}"`);
      if (el.tagName === 'SELECT') {
        el.value = bestOpt.value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        bestOpt.element.click();
      }
      return true;
    }
    return false;
  },

  _findBestOption(options, target) {
    const t = target.toLowerCase();
    
    // Exact match first
    let match = options.find(o => o.text.toLowerCase() === t || o.value.toLowerCase() === t);
    if (match) return match;

    // Binary logic (Yes/No mapping)
    if (t === 'yes') {
      match = options.find(o => {
        const ot = o.text.toLowerCase();
        return ot === 'y' || ot.startsWith('yes') || ot.includes('confirm') || ot === 'true';
      });
    } else if (t === 'no') {
      match = options.find(o => {
        const ot = o.text.toLowerCase();
        return ot === 'n' || ot.startsWith('no') || ot === 'false';
      });
    }

    // Similarity scoring (very basic fallback)
    if (!match) {
      match = options.sort((a, b) => {
        const scoreA = this._simpleSimilarity(a.text.toLowerCase(), t);
        const scoreB = this._simpleSimilarity(b.text.toLowerCase(), t);
        return scoreB - scoreA;
      })[0];
    }

    return match;
  },

  _simpleSimilarity(s1, s2) {
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    return 0;
  }
};
