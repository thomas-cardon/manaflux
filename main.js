const { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray } = require('electron');
const { autoUpdater } = require('electron-updater');
const platform = process.platform;

const LeaguePlug = require(__dirname + '/objects/lcu/LeaguePlug');
const AutoLaunch = require('auto-launch');

process.on('uncaughtException', function (err) {
  console.error(err);
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
});

let connector = new LeaguePlug();

let win, top;
let tray;

let launcher = new AutoLaunch({
    name: 'Manaflux',
    isHidden: true
});

function createWindow () {
  win = new BrowserWindow({ width: 600, height: 600, frame: false, icon: __dirname + '/build/icon.' + (platform === 'win32' ? 'ico' : 'png'), backgroundColor: '#000A13', maximizable: false, disableBlinkFeatures: 'BlockCredentialedSubresources', show: false });
  top = new BrowserWindow({ width: 600, height: 100, frame: false, icon: __dirname + '/build/icon.' + (platform === 'win32' ? 'ico' : 'png'), backgroundColor: '#000A13', alwaysOnTop: true, maximizable: false, minimizable: false, resizable: false, closable: false, show: false });

  win.loadURL(`file://${__dirname}/src/index.html`);
  win.setMenu(null);

  win.once('ready-to-show', () => !tray ? win.show() : null);

  if (process.argv[2] === '--dev')
    win.webContents.openDevTools({ mode: 'detach' });

  win.on('closed', () => {
    if (connector) connector.end();

    if (top) top.destroy();
    if (tray && !tray.isDestroyed()) tray.destroy();

    win = top = tray = null;
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

ipcMain.on('tray', (event, show) => {
  if (show && tray && !tray.isDestroyed()) return;
  else if (!show) {
    if (!tray || tray && tray.isDestroyed()) return;
    return tray.destroy();
  }

  tray = new Tray(__dirname + '/build/icon.' + (platform === 'win32' ? 'ico' : 'png'));
  tray.setToolTip('Cliquez pour afficher ManaFlux');

  tray.on('click', () => win.isVisible() ? win.hide() : win.showInactive());
});

ipcMain.on('auto-start', (event, enable) => {
  if (process.argv[2] === '--dev') return;

  launcher.isEnabled()
  .then(enabled => !enabled && enable ? launcher.enable() : (enabled && !enable ? launcher.disable() : null))
  .catch(err => ipcMain.send('error', { type: 'AUTO-START', error: err }));
});

ipcMain.on('lcu-league-path', (event) => {
  let id = setInterval(() => connector.constructor.getLeaguePath().then(dir => {
    if (!dir) return;
    clearInterval(id);

    event.sender.send('lcu-league-path', dir);
  }), 500);
});

ipcMain.once('lcu-connection', (event, path) => {
  connector.setLeaguePath(path);
  console.dir(connector);

  /*if (connector.hasStarted()) {
    connector.removeAllListeners();

    if (connector.isConnected()) {
      event.sender.send('lcu-connected', connector.getConnectionData());
      if (connector.isLoggedIn()) event.sender.send('lcu-logged-in');
    }
    else event.sender.send('lcu-disconnected');
  }
  else*/
  connector.start();

  connector.on('connected', d => event.sender.send('lcu-connected', d));
  connector.on('logged-in', () => event.sender.send('lcu-logged-in'));
  connector.on('logged-off', () => event.sender.send('lcu-logged-off'));
  connector.on('disconnected', () => event.sender.send('lcu-disconnected'));
});

ipcMain.on('lcu-is-connected', event => {
  event.sender.send('lcu-is-connected', connector.isConnected());
});

ipcMain.on('lcu-is-logged-in', event => {
  event.sender.send('lcu-is-logged-in', connector.isLoggedIn());
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

ipcMain.on('win-show', (event, inactive) => {
  if (!win.isVisible()) win[inactive ? 'showInactive' : 'show']();
});

ipcMain.on('win-hide', () => win.hide());
ipcMain.on('win-close', () => win.close());
ipcMain.on('win-minimize', () => win.minimize());

// Needed to access League's local resources
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    console.log(url);

    event.preventDefault();
    callback(true);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
})

app.on('activate', () => {
  if (win === null) createWindow();
});
