// background.js — Service Worker
// TF.js lives here to avoid MV3 content-script CSP (no unsafe-eval allowed there).
// Content scripts send a 'classify' message and get the category back.

importScripts('features/tf.min.js');

const CATEGORIES = [
  'firstName', 'lastName', 'over18', 'sponsorship', 'authorized',
  'officeWilling', 'gender', 'ethnicity', 'veteranStatus',
  'disabilityStatus', 'salaryExpectation', 'noticePeriod', 'yearsOfExperience'
];

const CHARS = ' abcdefghijklmnopqrstuvwxyz0123456789?,.:!(*)@#-/+\'&%';
const MAX_LEN = 64;

let _model = null;
let _modelFailed = false;

async function loadModel() {
  if (_model) return _model;
  if (_modelFailed) return null;
  try {
    const url = chrome.runtime.getURL('models/neural_model.json');
    _model = await tf.loadLayersModel(url);
    console.log('[QF BG] Neural model loaded.');
    return _model;
  } catch (err) {
    console.warn('[QF BG] Neural model unavailable — rule-based only.', err.message);
    _modelFailed = true;
    return null;
  }
}

function vectorize(text) {
  const seq = new Int32Array(MAX_LEN);
  const cleaned = text.toLowerCase().slice(0, MAX_LEN);
  for (let i = 0; i < cleaned.length; i++) {
    const idx = CHARS.indexOf(cleaned[i]);
    seq[i] = idx !== -1 ? idx + 1 : 0;
  }
  return tf.tensor2d([Array.from(seq)], [1, MAX_LEN]);
}

async function neuralClassify(text) {
  const model = await loadModel();
  if (!model) return null;
  let index, probability;
  tf.tidy(() => {
    const input = vectorize(text);
    const pred = model.predict(input);
    const probs = pred.dataSync();
    index = pred.argMax(1).dataSync()[0];
    probability = probs[index];
  });
  if (probability < 0.60) return null;
  return CATEGORIES[index];
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'QF_CLASSIFY') {
    neuralClassify(msg.text)
      .then(category => sendResponse({ category }))
      .catch(() => sendResponse({ category: null }));
    return true; // keep channel open for async response
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[QF] QuickFill installed.');
});
