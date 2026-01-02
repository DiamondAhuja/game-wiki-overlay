# Game Wiki Overlay

An Electron-based transparent overlay that lets you search and view game wiki articles while playing.

## Features

- 🎮 **Transparent overlay** - Works on top of your games
- ⌨️ **Global hotkeys** - Control without alt-tabbing
- 🔍 **Quick search** - Search any wiki site
- 📖 **Multi-wiki support** - 12+ popular game wikis built-in, plus custom URL support
- 🎮 **Full controller support** - Xbox/XInput gamepad with virtual cursor and on-screen keyboard
- 🖱️ **Click-through mode** - Make overlay non-interactive when needed
- 🌓 **Opacity control** - Adjust transparency to see your game behind it

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

### Controller Support (Xbox/XInput)

The app has full gamepad support with a virtual cursor that appears automatically when you use the controller!

| Button | Action |
|--------|--------|
| **Back + Start** | Toggle overlay visibility (works in-game!) |
| **Back + B** | Close/quit the app |
| **Left Stick** | Move cursor |
| **D-Pad** | Move cursor (with repeat) |
| **Right Stick** | Scroll page |
| **A** | Click at cursor position |
| **B** | Go back to previous page |
| **Y** | Home (return to wiki selection) |
| **X** | Open on-screen keyboard |
| **LB** | Page up |
| **RB** | Page down |
| **Start** | Submit search (when keyboard open) |

#### On-Screen Keyboard

Press **X** to open the keyboard for searching. The keyboard appears with letter and number layouts. While open:

| Button | Action |
|--------|--------|
| **D-Pad / Left Stick** | Navigate keyboard keys |
| **A** | Type selected key |
| **B** | Close keyboard (cancel) |
| **X** | Backspace |
| **Y** | Space |
| **LB / RB** | Switch between letter and number layouts |
| **Start** | Submit search and close keyboard |

### How to Use

1. Launch the app with `npm start`
2. Position the overlay window where you want it (drag the title bar to move, use resize handles on edges)
3. Start your game
4. Press **Ctrl+Shift+W** to show/hide the overlay
5. Select a wiki from the landing page or enter a custom URL
6. Type in the search box and press Enter to search
7. Click on results to view full articles
8. Use **Ctrl+Shift+C** to toggle click-through mode if you need to interact with your game
9. Use your gamepad's Left Stick and A button to navigate if using a controller

## Customization

### Using Built-in Wikis

The application includes 12 popular game wikis:
- Minecraft
- Terraria
- Stardew Valley
- The Legend of Zelda
- Dark Souls
- Elden Ring
- Hollow Knight
- Baldur's Gate 3
- Palworld
- Path of Exile
- League of Legends
- Genshin Impact

Simply click any wiki card on the landing page to start browsing.

### Adding Custom Wikis

You can add any MediaWiki-based website by entering the URL directly in the "Enter wiki URL" field on the landing page. The app will automatically detect and use the wiki's search functionality.

## Tech Stack

- Electron (v39.2.7)
- Vanilla JavaScript
- XInput for gamepad support (Windows only)
- Electron webview for displaying wiki content