# QuickFill (formerly Quick Copy)

A powerful browser productivity layer that lets users insert snippets, autofill common fields, and launch templates anywhere on the web while remaining fast, minimal, keyboard-driven, and reliable.

## Features

- **Floating Menu** — Sleek, glassmorphic menu that fans out with your snippets.
- **Command Palette** — Press `Cmd+Shift+K` (or `Ctrl+Shift+K`) to search and insert snippets instantly.
- **Smart Field Detection** — Automatically detects inputs like LinkedIn, GitHub, Email, and Name to offer one-click autofill.
- **Snippet Manager** — Modular manager for text snippets, URLs, and templates.
- **Drag & Drop** — Drag snippets from the menu or palette directly into any text field.
- **Context-Aware Snippets** — Define domains to only show specific snippets where they are relevant.
- **Import/Export** — Easily backup or share your snippets via JSON files.
- **Premium Design** — Modern UI with glassmorphism, smooth animations, and automatic dark mode support.

## Installation

### Load unpacked (developer)

1. Clone or download this project.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `Extension` folder.

## Usage

### Floating Menu
- Click the blue **+** button at the bottom-right of any page.
- Hover over snippets to see their content.
- Click to insert (or copy to clipboard if no field is focused).
- Drag a snippet into any input or textarea.

### Command Palette
- Press `Cmd+Shift+K` to open the palette.
- Search by label, content, or type.
- Use arrow keys and `Enter` to select and insert.

### Configuration
- Open the floating menu and click the **Gear** icon to configure presets inline.
- Go to **Extension Options** for a full-page management experience with Import/Export.

## Tech Stack

- **Manifest V3**
- **Vanilla JavaScript** (ES6 modules via content script injection)
- **Zero Build Tools** — Maximum performance and ease of development.
- **Chrome APIs:** `storage`, `clipboardWrite`.

## Project Structure

```
Extension/
├── manifest.json       # Extension configuration
├── content.js         # Entry point and orchestrator
├── background.js      # Service worker
├── features/          # Core functionality logic
│   ├── snippets.js    # Insertion & management
│   ├── autofill.js    # Form filling engine
│   ├── fieldDetector.js # DOM heuristic engine
│   └── dragInsert.js  # Drag & drop handling
├── ui/                # UI Components (Shadow DOM)
│   ├── floatingMenu.js
│   ├── commandPalette.js
│   ├── configPanel.js
│   ├── components.js  # Shared UI logic/icons
│   └── styles.js      # CSS strings
├── storage/           # Data persistence
│   └── presets.js
├── options/           # Options page
│   ├── options.html
│   └── options.js
└── icons/             # Assets
```

## Permissions

- **clipboardWrite** — Copy preset text to clipboard (fallback).
- **storage** — Save presets locally (no data sent to external servers).
- **<all_urls>** — Necessary for field detection and snippet insertion across sites.
