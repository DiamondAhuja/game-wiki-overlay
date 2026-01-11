const { app, ipcMain, screen } = require('electron');
const { createWindow, getMainWindow } = require('./window');
const { setupShortcuts } = require('./shortcuts');
const { setupSecurity } = require('./security');
const { startPolling, stopPolling, setBackgroundMode } = require('./gamepad-module/gamepad');

app.whenReady().then(() => {
  setupSecurity();
  createWindow();
  setupShortcuts();

  const win = getMainWindow();

  // Start gamepad polling (Windows only)
  if (process.platform === 'win32') {
    try {
      startPolling();
    } catch (err) {
      console.log('Gamepad support not available:', err.message);
    }
  }

  // Switch to background mode when overlay loses focus
  // Background mode only listens for visibility toggle combo (Back+Start)
  // Full mode processes all navigation inputs
  if (win) {
    win.on('hide', () => {
      setBackgroundMode(true);
    });

    win.on('show', () => {
      setBackgroundMode(false);
    });

    win.on('blur', () => {
      setBackgroundMode(true);
    });

    win.on('focus', () => {
      setBackgroundMode(false);
    });
  }
});

// Handle close window request from renderer
ipcMain.on('close-window', () => {
  app.quit();
});

// Handle resize from renderer - manual implementation
let resizeInterval = null;
let resizeDirection = null;

ipcMain.on('start-resize', (event, direction) => {
  const win = getMainWindow();
  if (!win) return;

  resizeDirection = direction;

  // Clear any existing interval
  if (resizeInterval) {
    clearInterval(resizeInterval);
  }

  resizeInterval = setInterval(() => {
    if (!resizeDirection) {
      clearInterval(resizeInterval);
      return;
    }

    const cursorPos = screen.getCursorScreenPoint();
    const bounds = win.getBounds();
    const minWidth = 400;
    const minHeight = 300;

    let newBounds = { ...bounds };

    if (resizeDirection.includes('e')) {
      newBounds.width = Math.max(minWidth, cursorPos.x - bounds.x);
    }
    if (resizeDirection.includes('w')) {
      const newWidth = Math.max(minWidth, bounds.x + bounds.width - cursorPos.x);
      newBounds.x = bounds.x + bounds.width - newWidth;
      newBounds.width = newWidth;
    }
    if (resizeDirection.includes('s')) {
      newBounds.height = Math.max(minHeight, cursorPos.y - bounds.y);
    }
    if (resizeDirection.includes('n')) {
      const newHeight = Math.max(minHeight, bounds.y + bounds.height - cursorPos.y);
      newBounds.y = bounds.y + bounds.height - newHeight;
      newBounds.height = newHeight;
    }

    win.setBounds(newBounds);
  }, 16); // ~60fps
});

ipcMain.on('stop-resize', () => {
  resizeDirection = null;
  if (resizeInterval) {
    clearInterval(resizeInterval);
    resizeInterval = null;
  }
});

// Handle opacity change
ipcMain.on('set-opacity', (event, opacity) => {
  const win = getMainWindow();
  if (win) {
    win.setOpacity(opacity);
  }
});

app.on('window-all-closed', () => {
  stopPolling();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});