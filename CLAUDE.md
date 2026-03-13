# QuickFill Extension — Agent Reference

## What This Project Is
QuickFill is a Manifest V3 Chrome extension for browser productivity. It auto-fills job application forms, inserts text snippets, and provides a keyboard-driven command palette. Built with Vanilla JS, zero build tools, Shadow DOM isolation, and a TensorFlow.js neural network for AI-powered field detection.

---

## Architecture Overview

```
manifest.json (MV3)
├── background.js          → Service worker (minimal, stub)
├── content.js             → Entry point: creates Shadow DOM host, injects all UI
├── features/
│   ├── tf.min.js          → TensorFlow.js library (loaded first)
│   ├── utils.js           → QF.escapeHtml, QF.isUrl, QF.copyToClipboard
│   ├── fieldDetector.js   → QF.detectFields() — DOM heuristics to find form fields
│   ├── autofill.js        → QF.autofillAll() — standard profile → field matching
│   ├── smartFill.js       → QF.SmartFill.fillAll() — neural network autofill
│   ├── snippets.js        → QF.insertSnippet() — text insertion with fallbacks
│   └── dragInsert.js      → QF.initDragInsert() — drag-drop event handler
├── storage/
│   └── presets.js         → QF.Storage — Chrome storage API wrapper (presets + profile)
├── ui/
│   ├── styles.js          → QF.SHEET — full CSS as string (Shadow DOM stylesheet)
│   ├── components.js      → QF.Icons, QF.showToast — SVG icons + toast notifications
│   ├── floatingMenu.js    → QF.createFloatingMenu() — main expandable button UI
│   ├── commandPalette.js  → QF.createCommandPalette() — Cmd+Shift+K search palette
│   └── configPanel.js     → QF.createConfigPanel() — tabbed settings panel
├── options/
│   ├── options.html       → Standalone settings page
│   └── options.js         → Import/export, full profile/preset management
└── models/
    ├── neural_model.json       → TF.js CNN model (13 field categories)
    ├── neural_model.weights.bin → Model weights
    └── smart_model.json        → Naive Bayes model (backup)
```

---

## Global Namespace
All code attaches to the `QF` global object. Scripts load in manifest order — never use ES module imports.

---

## Content Script Load Order (from manifest.json)
1. `features/tf.min.js`
2. `features/utils.js`
3. `storage/presets.js`
4. `features/snippets.js`
5. `features/fieldDetector.js`
6. `features/autofill.js`
7. `features/smartFill.js`
8. `features/dragInsert.js`
9. `ui/styles.js`
10. `ui/components.js`
11. `ui/configPanel.js`
12. `ui/commandPalette.js`
13. `ui/floatingMenu.js`
14. `content.js` (last — bootstraps everything)

---

## Key Data Flows

### Standard Autofill
```
User clicks "Fill" button
→ QF.detectFields()        fieldDetector.js  — scan DOM for form fields
→ QF.Storage.getProfile()  presets.js        — load user profile
→ QF.autofillAll()         autofill.js       — match field types to profile
→ QF.autofillField()       autofill.js       — insert value + dispatch events
```

### AI Smart Fill
```
User clicks "Smart Fill" button
→ QF.detectFields()              fieldDetector.js  — scan DOM
→ QF.Storage.getProfile()        presets.js        — load profile
→ QF.SmartFill.fillAll()         smartFill.js      — loop fields
→ QF.SmartFill.classify(label)   smartFill.js      — TF.js CNN prediction
→ _vectorize(text)               smartFill.js      — char-level encoding → tensor
→ model.predict()                TF.js             — softmax over 13 categories
→ QF.autofillField() or _fillAdvancedElement()     — insert value
```

### Snippet Insertion
```
User clicks preset / presses Enter in palette / drops snippet
→ QF.insertSnippet(preset)
  1. execCommand('insertText')     — preferred (React/Vue compatible)
  2. Direct value + input/change events  — textarea/input fallback
  3. Range API                     — contentEditable fallback
  4. QF.copyToClipboard()          — last resort
```

### Storage Sync (real-time, cross-tab)
```
Any tab saves presets/profile
→ chrome.storage.onChanged fires in ALL tabs
→ floatingMenu re-renders preset buttons
→ commandPalette updates snippet list
→ configPanel updates UI fields
→ options.js re-renders list
```

---

## Storage Schema

### Presets (`quick_copy_presets`)
```js
{
  id: string,        // timestamp-based
  label: string,     // display name (max 32 chars)
  type: 'text' | 'url' | 'template',
  content: string,   // text or URL to insert
  domain: string     // optional, comma-separated domain filters
}
```
Max 50 presets enforced everywhere.

### Profile (`quick_copy_profile`)
25+ fields including: firstName, lastName, middleName, preferredName, email, phone, address, city, zip, company, linkedin, github, portfolio, summary, yearsOfExperience, noticePeriod, salaryExpectation, gender, ethnicity, veteranStatus, disabilityStatus, sponsorship, authorized, nationality, over18, officeWilling, previousWork, currentEmployee.

---

## Neural Network (smartFill.js)
- **Input:** Field label text, char-encoded to 64-length sequence
- **Model:** Embedding → Conv1D (64 filters) → Dense → Softmax
- **Categories (13):** firstName, lastName, over18, sponsorship, authorized, officeWilling, gender, ethnicity, veteranStatus, disabilityStatus, salaryExpectation, noticePeriod, yearsOfExperience
- **Confidence threshold:** 60% — predictions below this are ignored
- **Loading:** Lazy, cached after first load via `chrome.runtime.getURL`

---

## UI Architecture
- All UI lives inside a **closed Shadow DOM** (z-index 2147483647)
- No external dependencies — all CSS embedded in `ui/styles.js`
- Full dark mode via `@media (prefers-color-scheme: dark)`
- Floating menu fans out presets + 3 action buttons (Smart Fill, Standard Fill, Config)
- Command palette opens with `Cmd+Shift+K` / `Ctrl+Shift+K`
- Config panel has 2 tabs: **Snippets** (CRUD) and **Identity** (profile form)

---

## Constraints & Rules
- **No build tools** — Vanilla JS only, no bundler, no transpilation
- **No ES modules** — everything attached to `QF` global
- **Shadow DOM only** — never inject styles into the host page directly
- **Max 50 presets** — enforced in configPanel.js and options.js
- **Framework compatibility** — always dispatch `input` and `change` events after filling
- **Overwrite protection** — `autofillAll` skips fields that already have a value

---

## Files NOT to touch
- `features/tf.min.js` — minified TensorFlow library, do not modify
- `models/neural_model.weights.bin` — binary model weights
- `models/neural_model.json` — trained model, only regenerate via training pipeline

---

## Training Pipeline (offline, Node.js)
```
trainer_helper.js     → generates synthetic training data (DATA_MAP variants)
tools/trainer.js      → trains Naive Bayes → smart_model.json
tools/ml_suite/       → trains TF.js CNN  → neural_model.json + weights
```
Run offline, not part of the extension itself.

---

## Figma Architecture Diagram
https://www.figma.com/online-whiteboard/create-diagram/5489dcf2-ff44-4766-adc6-a8cf4214e302
