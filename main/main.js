const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let isVisible = true;
let clickThrough = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true);

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
    clickThrough ? mainWindow.setIgnoreMouseEvents(false) : mainWindow.setIgnoreMouseEvents(true, { forward: true });
    clickThrough = !clickThrough;
  });

  // set click-through
  ipcMain.on('set-click-through', (_, value) => {
    clickThrough = value;
    mainWindow.setIgnoreMouseEvents(value, { forward: true });
  });

  /*app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });*/
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
