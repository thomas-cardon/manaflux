const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

const LCUConnector = require('lcu-connector');
const connector = new LCUConnector();

let win;

function createWindow () {
  win = new BrowserWindow({ width: 600, height: 600, frame: false, icon: __dirname + '/build/icon.png', backgroundColor: '#000A13', show: false });

  win.loadURL(`file://${__dirname}/src/index.html`);
  win.setMenu(null);

  win.once('ready-to-show', () => {
    win.show();
  });

  if (process.argv[2] === '--dev') win.webContents.openDevTools({ mode: 'detach' });

  /*win.on('ready-to-show', () => {
    connector.on('connect', d => {
      console.dir(d);
      win.webContents.send('lcu', d);
    });
    connector.start();
  });*/

  win.on('closed', () => win = null);
}

app.on('ready', () => {
  createWindow();
  autoUpdater.checkForUpdates();
});

autoUpdater.on('update-downloaded', (info) => {
  console.dir(info);

  ipcMain.on('can-update', (event, arg) => autoUpdater.quitAndInstall());
  win.webContents.send('can-update');
});

ipcMain.on('win-minimize', () => win.minimize());
ipcMain.on('win-close', () => win.close());

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
});

app.on('window-all-closed', () => {
  // Sur macOS, il est commun pour une application et leur barre de menu
  // de rester active tant que l'utilisateur ne quitte pas explicitement avec Cmd + Q
  if (process.platform !== 'darwin') app.quit();
})

app.on('activate', () => {
  if (win === null) createWindow();
});
