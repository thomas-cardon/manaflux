const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const { autoUpdater } = require('electron-updater');

const LCUConnector = require('lcu-connector');
let connector;

let win, top;

/*
* TODO: Penser à créer une "version mini", qui reste toujours devant n'importe quel programme
*/

function createWindow () {
  win = new BrowserWindow({ width: 600, height: 600, frame: false, icon: __dirname + '/build/icon.png', backgroundColor: '#000A13', maximizable: false, disableBlinkFeatures: 'BlockCredentialedSubresources', show: false });
  top = new BrowserWindow({ width: 600, height: 100, frame: false, icon: __dirname + '/build/icon.png', backgroundColor: '#000A13', alwaysOnTop: true, maximizable: false, minimizable: false, closable: false, show: false });

  win.loadURL(`file://${__dirname}/src/index.html`);
  win.setMenu(null);

  win.once('ready-to-show', () => win.show());

  if (process.argv[2] === '--dev') win.webContents.openDevTools({ mode: 'detach' });

  win.on('closed', () => {
    connector.stop();
    win = null;
  });
}

app.on('ready', () => {
  createWindow();
  if (process.argv[2] !== '--dev') autoUpdater.checkForUpdates();

  globalShortcut.register('CommandOrControl+Shift+I', () => win.webContents.openDevTools({ mode: 'detach' }));
});

autoUpdater.on('update-downloaded', (info) => {
  console.dir(info);

  ipcMain.on('update-install', (event, arg) => autoUpdater.quitAndInstall());
  win.webContents.send('update-ready', info);
});

ipcMain.on('start-lcu-connector', (event, path) => {
  if (connector) connector.stop();
  connector = new LCUConnector(require('path').resolve(path, 'LeagueClient.exe'));

  connector.once('connect', d => win.webContents.send('lcu', d));
  connector.start();
});

ipcMain.on('top-window-start', (event, data) => {
  if (!top) top = new BrowserWindow({ width: 600, height: 100, frame: false, icon: __dirname + '/build/icon.png', backgroundColor: '#000A13', alwaysOnTop: true, maximizable: false, minimizable: false, closable: false, show: false });

  top.loadURL(`file://${__dirname}/src/topwindow.html`);
  top.show();

  win.once('ready-to-show', () => {
    top.webContents.send('data', data);
    ipcMain.once('top-window-ready', () => win.show());
  });
});

ipcMain.on('top-window-message', (event, data) => {
  if (!top) return;
  win.webContents.send('update-ready', info);
});

ipcMain.on('main-window-message', (event, data) => {
  win.webContents.send(data.event, data.body);
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
