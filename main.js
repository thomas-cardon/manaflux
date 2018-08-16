const { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray } = require('electron');
const i18n = new (require('./objects/i18n'));

const { autoUpdater } = require('electron-updater');
const platform = process.platform;

const LeaguePlug = require('./objects/leagueplug');
const AutoLaunch = require('auto-launch');

process.on('unhandledRejection', (reason, p) => console.log(`${i18n.__('process-unhandled-rejection')}: ${p}, ${i18n.__('reason')}: ${reason}`));
process.on('uncaughtException', function (err) {
  console.error(err);
});

let connector = new LeaguePlug();
let win, tray;

const shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  if (win) {
    if (win.isMinimized()) win.restore();
    else if (!win.isVisible()) win.show();

    win.focus();
  }
});

if (shouldQuit) return app.quit();

let launcher = new AutoLaunch({ name: 'Manaflux', isHidden: true });

function createWindow () {
  win = new BrowserWindow({ width: 600, height: 600, frame: false, icon: __dirname + '/build/icon.' + (platform === 'win32' ? 'ico' : 'png'), backgroundColor: '#000A13', maximizable: false, disableblinkfeatures: 'BlockCredentialedSubresources', show: false });

  win.loadURL(`file://${__dirname}/src/index.html`);
  win.setMenu(null);

  win.once('ready-to-show', () => !tray ? win.show() : null);

  if (process.argv[2] === '--dev')
    win.webContents.openDevTools({ mode: 'detach' });

  win.on('closed', () => {
    if (connector) connector.getConnectionHandler().end();
    if (tray && !tray.isDestroyed()) tray.destroy();

    win = tray = null;
  });
}

app.on('ready', () => {
  createWindow();

  if (process.argv[2] !== '--dev') autoUpdater.checkForUpdates();

  globalShortcut.register('CommandOrControl+Shift+I', () => win.webContents.openDevTools({ mode: 'detach' }));
});

autoUpdater.on('update-downloaded', info => {
  ipcMain.on('update-install', (event, arg) => autoUpdater.quitAndInstall());
  win.webContents.send('update-ready', info);
});

ipcMain.on('champion-select-in', (event, arg) => {
  globalShortcut.register('Alt+Left', () => event.sender.send('runes-previous'));
  globalShortcut.register('Alt+Right', () => event.sender.send('runes-next'));
});

ipcMain.on('champion-select-out', () => {
  globalShortcut.unregister('Alt+Left');
  globalShortcut.unregister('Alt+Right');
});

ipcMain.on('tray', (event, show) => {
  if (show && tray && !tray.isDestroyed()) return;
  else if (!show) {
    if (!tray || tray && tray.isDestroyed()) return;
    return tray.destroy();
  }

  tray = new Tray(__dirname + '/build/icon.' + (platform === 'win32' ? 'ico' : 'png'));
  tray.setToolTip(i18n.__('tray-show'));

  tray.on('click', () => win.isVisible() ? win.hide() : win.showInactive());
});

ipcMain.on('auto-start', (event, enable) => {
  if (process.argv[2] === '--dev') return;

  launcher.isEnabled()
  .then(enabled => !enabled && enable ? launcher.enable() : (enabled && !enable ? launcher.disable() : null))
  .catch(err => event.sender.send('error', { type: 'AUTO-START', error: err }));
});

ipcMain.on('lcu-league-path', event => {
  const id = setInterval(async () => {
    try {
      await connector.load();
      clearInterval(id);
      event.sender.send('lcu-league-path', connector.getPathHandler().getLeaguePath());
    }
    catch(err) {}
  }, 500);
});

ipcMain.on('lcu-connection', (event, path) => {
  if (connector.getConnectionHandler().hasStarted()) {
    connector.getConnectionHandler().removeAllListeners();
    connector.getConnectionHandler().end();
  }

  connector.getPathHandler().setLeaguePath(path);
  connector.start();

  connector.getConnectionHandler().on('connected', d => event.sender.send('lcu-connected', d));
  connector.getConnectionHandler().on('logged-in', d => event.sender.send('lcu-logged-in', d));
  connector.getConnectionHandler().on('logged-off', () => event.sender.send('lcu-logged-off'));
  connector.getConnectionHandler().on('disconnected', () => event.sender.send('lcu-disconnected'));
});

ipcMain.on('lcu-is-connected', event => event.sender.send('lcu-is-connected', connector.isConnected()));
ipcMain.on('lcu-is-logged-in', event => event.sender.send('lcu-is-logged-in', connector.isLoggedIn()));

ipcMain.on('win-show', (event, inactive) => {
  if (!win.isVisible()) win[inactive ? 'showInactive' : 'show']();
});

ipcMain.on('win-hide', () => win.hide());
ipcMain.on('win-close', () => win.close());
ipcMain.on('win-minimize', () => win.minimize());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
})

app.on('will-quit', () => globalShortcut.unregisterAll());

app.on('activate', () => {
  if (win === null) createWindow();
});
