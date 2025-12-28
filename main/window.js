const { BrowserWindow, app } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

// Config file path for persisting window bounds
const configPath = path.join(app.getPath('userData'), 'window-config.json');

function loadWindowBounds() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    // Ignore errors, use defaults
  }
  return { width: 900, height: 600 };
}

function saveWindowBounds() {
  if (!mainWindow) return;
  try {
    const bounds = mainWindow.getBounds();
    fs.writeFileSync(configPath, JSON.stringify(bounds));
  } catch (e) {
    // Ignore save errors
  }
}

function createWindow() {
  const bounds = loadWindowBounds();
  
  mainWindow = new BrowserWindow({
    ...bounds,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });

  mainWindow.loadFile("renderer/index.html");

  // Optional: make movable by dragging background
  mainWindow.setMovable(true);

  // Disable menu
  mainWindow.setMenu(null);

  // Save bounds when window is moved or resized
  mainWindow.on('moved', saveWindowBounds);
  mainWindow.on('resized', saveWindowBounds);
  mainWindow.on('close', saveWindowBounds);
}

function getMainWindow() {
  return mainWindow;
}

module.exports = { createWindow, getMainWindow };