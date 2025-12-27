const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let isVisible = true;
let clickThrough = false;

function createWindow() {
  // Get screen dimensions for 3/4 size in landscape
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  
  // Calculate 3/4 screen size in landscape orientation
  const windowWidth = Math.floor(screenWidth * 0.75);
  const windowHeight = Math.floor(screenHeight * 0.75);
  
  // Center the window
  const x = Math.floor((screenWidth - windowWidth) / 2);
  const y = Math.floor((screenHeight - windowHeight) / 2);
  
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 400,
    minHeight: 500,
    x: x,
    y: y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    fullscreenable: false,
    resizable: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true);
  
  // Ensure window stays on top even during game focus
  mainWindow.setFocusable(true);
  
  // Open DevTools in development
  // mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Toggle overlay
  globalShortcut.register('CommandOrControl+Shift+W', () => {
    if (!mainWindow) return;
    isVisible ? mainWindow.hide() : mainWindow.show();
    isVisible = !isVisible;
  });

  // Toggle click-through
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (!mainWindow) return;
    clickThrough = !clickThrough;
    mainWindow.setIgnoreMouseEvents(clickThrough, { forward: true });
    mainWindow.webContents.send('click-through-changed', clickThrough);
  });

  // Set click-through from renderer
  ipcMain.on('set-click-through', (_, value) => {
    clickThrough = value;
    mainWindow.setIgnoreMouseEvents(value, { forward: true });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
