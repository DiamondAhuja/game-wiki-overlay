const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  setClickThrough: (value) => {
    ipcRenderer.send('set-click-through', value);
  }
});