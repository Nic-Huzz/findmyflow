const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  // Express port is passed via URL query param from main process
  // but for simplicity, the renderer connects to the same origin
  // (since main.js loads localhost:PORT, all relative fetches go there)
})
