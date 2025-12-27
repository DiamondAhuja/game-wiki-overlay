# Game Wiki Overlay

An Electron-based transparent overlay that lets you search and view game wiki articles while playing.

## Features

- 🎮 **Transparent overlay** - Works on top of your games
- ⌨️ **Global hotkeys** - Control without alt-tabbing
- 🔍 **Quick search** - Search Minecraft wiki instantly
- 📖 **Clean rendering** - Easy-to-read wiki content
- 🖱️ **Click-through mode** - Make overlay non-interactive when needed

## Installation

```bash
npm install
```

## Usage

Start the overlay:
```bash
npm start
```

### Keyboard Shortcuts

- **Ctrl+Shift+W** - Toggle overlay visibility
- **Ctrl+Shift+C** - Toggle click-through mode (overlay becomes non-interactive)

### How to Use

1. Launch the app with `npm start`
2. Position the overlay window where you want it
3. Start your game
4. Press **Ctrl+Shift+W** to show/hide the overlay
5. Type in the search box and press Enter
6. Click on results to view full articles
7. Use **Ctrl+Shift+C** if you need to click through the overlay

## Customization

You can change the wiki source in [wikiService.js](renderer/wikiService.js):

```javascript
const API = "https://minecraft.fandom.com/api.php";
// Change to any MediaWiki-based wiki
```

## Tech Stack

- Electron
- Vanilla JavaScript
- MediaWiki API