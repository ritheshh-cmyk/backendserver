const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Loading URL:', process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : path.join(__dirname, '..', 'dist', 'public', 'index.html'));

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5000');
  } else {
    win.loadFile('client/dist/index.html');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 