const { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray } = require('electron');

global.log = new (require('./objects/handlers/LoggingHandler'))(3);
const i18n = new (require('./objects/i18n'));

const { autoUpdater } = require('electron-updater');

const LeaguePlug = require('./objects/leagueplug');
const AutoLaunch = require('auto-launch');

require('./crash-reporting.js');

let connector = new LeaguePlug();
let win, tray;

autoUpdater.fullChangelog = true;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

app.requestSingleInstanceLock();
app.on('second-instance', function (argv, cwd) {
  if (!win) app.quit();

  if (win.isMinimized()) win.restore();
  else if (!win.isVisible()) win.show();

  win.focus();
});

let launcher = new AutoLaunch({ name: 'Manaflux' });

function createWindow () {
  win = new BrowserWindow({ width: 600, height: 600, frame: false, icon: __dirname + '/build/icon.' + (process.platform === 'win32' ? 'ico' : 'png'), backgroundColor: '#000A13', maximizable: false, resizable: false, disableblinkfeatures: 'BlockCredentialedSubresources', show: false });

  win.loadURL(`file://${__dirname}/src/index.html`);
  win.setMenu(null);

  win.once('ready-to-show', () => !tray ? win.show() : null);

  log.setBrowserWindow(win);

  if (process.argv[2] === '--dev')
    win.webContents.openDevTools({ mode: 'detach' });

  win.on('closed', () => {
    if (connector) connector.getConnectionHandler().end();
    if (tray && !tray.isDestroyed()) tray.destroy();
    if (log.stream) log.stream.end();

    win = tray = null;
  });
}

app.on('ready', () => {
  createWindow();

  const { Menu, MenuItem } = require('electron');
  const menu = new Menu();

  if (process.argv[2] !== '--dev') return autoUpdater.checkForUpdates();
  menu.append(new MenuItem({
    label: 'Dev Tools',
    accelerator: 'CommandOrControl+Shift+I',
    click: () => BrowserWindow.getFocusedWindow().toggleDevTools()
  }));

  Menu.setApplicationMenu(menu);
});

ipcMain.on('restart', () => {
  console.log(2, '[IPC] Restarting app...');

  app.relaunch();
  app.exit(0);
});

autoUpdater.on('update-available', info => {
  win.webContents.send('update-available', info);
  ipcMain.once('update-download', () => autoUpdater.downloadUpdate().then(cancelToken => ipcMain.once('update-cancel', () => cancelToken.cancel())));
});

autoUpdater.on('update-not-available', info => win.webContents.send('update-not-available', info));
autoUpdater.on('download-progress', info => win.webContents.send('update-progress', info));

autoUpdater.on('update-downloaded', info => {
  ipcMain.once('update-install', (event, arg) => autoUpdater.quitAndInstall());
  win.webContents.send('update-ready', info);
});

ipcMain.on('champion-select-in', (event, arg) => {
  globalShortcut.register('Alt+Left', () => event.sender.send('perks-shortcut', true));
  globalShortcut.register('Alt+Right', () => event.sender.send('perks-shortcut', false));
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

  tray = new Tray(__dirname + '/build/icon.' + (process.platform === 'win32' ? 'ico' : 'png'));
  tray.setToolTip(i18n.__('tray-show'));

  tray.on('click', () => win.isVisible() ? win.hide() : win.showInactive());
});

ipcMain.on('auto-start', (event, enable) => {
  if (process.argv[2] === '--dev') return;

  launcher.isEnabled()
  .then(enabled => !enabled && enable ? launcher.enable() : (enabled && !enable ? launcher.disable() : null))
  .catch(err => event.sender.send('error', { type: 'AUTO-START', error: err }));
});

ipcMain.on('lcu-connection', (event, path) => {
  if (!path) return;

  if (connector.getConnectionHandler().hasStarted()) {
    connector.getConnectionHandler().removeAllListeners();
    connector.getConnectionHandler().end();
  }

  connector.start(path);

  connector.getConnectionHandler().on('connected', d => event.sender.send('lcu-connected', d));
  connector.getConnectionHandler().on('logged-in', d => event.sender.send('lcu-logged-in', d));
  connector.getConnectionHandler().on('logged-off', () => event.sender.send('lcu-logged-off'));
  connector.getConnectionHandler().on('disconnected', () => event.sender.send('lcu-disconnected'));
});

ipcMain.on('lcu-get-path', event => {
  event.returnValue = connector.getPath()
});

ipcMain.on('lcu-find-path', event => connector.getPathHandler().findLeaguePath().then(x => event.sender.send('lcu-find-path', x)));
ipcMain.on('lcu-set-path', (event, path) => connector.getPathHandler().setLeaguePath(path));

ipcMain.on('lcu-is-connected', event => {
  event.returnValue = connector.isConnected()
});

ipcMain.on('lcu-logged-in', (event, arg) => event.sender.send('lcu-logged-in', connector.getLoginData()));

ipcMain.on('is-dev', event => event.returnValue = process.argv[2] === '--dev');

ipcMain.on('win-show', (event, inactive) => {
  if (!win.isVisible()) win[inactive ? 'showInactive' : 'show']();
});

ipcMain.on('win-hide', () => win.hide());
app.on('window-all-closed', () => app.quit());

process.on('SIGTERM', function () {
  log.end();
  globalShortcut.unregisterAll();
  process.exit(0);
});

app.on('will-quit', () => {
  log.end();
  globalShortcut.unregisterAll();
});

app.on('activate', () => {
  if (win === null) createWindow();
});
