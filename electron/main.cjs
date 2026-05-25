const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

let mainWindow = null
let expressServer = null

// Use a random available port to avoid conflicts
const PORT = 34560 + Math.floor(Math.random() * 100)

function startExpress() {
  return new Promise((resolve, reject) => {
    const { startServer } = require(path.join(__dirname, '..', 'server', 'terminal-server.cjs'))
    startServer(PORT).then((server) => {
      expressServer = server
      resolve()
    }).catch(reject)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  mainWindow.loadURL(`http://localhost:${PORT}`)

  // Route external links to user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  try {
    await startExpress()
    createWindow()
  } catch (err) {
    console.error('Failed to start server:', err.message)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('before-quit', () => {
  if (expressServer) {
    expressServer.close()
  }
})
