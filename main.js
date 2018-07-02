const { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray } = require('electron');
const { autoUpdater } = require('electron-updater');

const LCUConnector = require('lcu-connector');
const AutoLaunch = require('auto-launch');

let connector;

let win, top;
let tray;

let launcher = new AutoLaunch({
    name: 'Manaflux',
    isHidden: true
});

function createWindow () {
  win = new BrowserWindow({ width: 600, height: 600, frame: false, icon: __dirname + '/build/icon.png', backgroundColor: '#000A13', maximizable: false, disableBlinkFeatures: 'BlockCredentialedSubresources', show: false });
  top = new BrowserWindow({ width: 600, height: 100, frame: false, icon: __dirname + '/build/icon.png', backgroundColor: '#000A13', alwaysOnTop: true, maximizable: false, minimizable: false, closable: false, show: false });

  win.loadURL(`file://${__dirname}/src/index.html`);
  win.setMenu(null);

  win.once('ready-to-show', () => win.show());

  ipcMain.on('tray', () => {
    if (tray && !tray.isDestroyed()) return;

    tray = new Tray(__dirname + '/build/icon.png');
    tray.setToolTip('Cliquez pour afficher ManaFlux');

    tray.on('click', () => win.isVisible() ? win.hide() : win.show());
  });

  ipcMain.on('tray-destroy', (event, data) => {
    if (!tray || tray && tray.isDestroyed()) return;
    tray.destroy();
  });

  ipcMain.on('auto-start-enable', () => {
    launcher.isEnabled()
    .then(enabled => !enabled ? launcher.enable() : null)
    .catch(err => ipcMain.send('error', { type: 'AUTO-START', error: err }));
  });

  ipcMain.on('auto-start-disable', () => {
    launcher.isEnabled()
    .then(enabled => enabled ? launcher.disable() : null)
    .catch(err => ipcMain.send('error', { type: 'AUTO-START', error: err }));
  });

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
  globalShortcut.register('CommandOrControl+Shift+L', () => top.webContents.openDevTools({ mode: 'detach' }));
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
  if (top) top.destroy();
  top = new BrowserWindow({ width: data.width, height: data.height, frame: false, icon: __dirname + '/build/icon.png', backgroundColor: '#000A13', alwaysOnTop: true, maximizable: false, minimizable: false, closable: false, show: false });

  top.loadURL(`file://${__dirname}/src/topwindow.html`);

  top.once('ready-to-show', () => {
    top.webContents.send('data', data);
    ipcMain.once('top-window-ready', () => top.show());
  });
});

ipcMain.on('top-window-close', (event, data) => {
  if (top) top.close();
});

ipcMain.on('win-show', () => win.show());
ipcMain.on('win-hide', () => win.hide());
ipcMain.on('win-close', () => win.close());
ipcMain.on('win-minimize', () => win.minimize());

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
