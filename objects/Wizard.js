const { BrowserWindow } = require('electron').remote;

module.exports = function(dev) {
  let wiz = new BrowserWindow({ parent: require('electron').remote.getCurrentWindow(), width: 700, height: 220, frame: false, icon: __dirname + '/build/icon.' + (process.platform === 'win32' ? 'ico' : 'png'), backgroundColor: '#000A13', maximizable: false, resizable: false, modal: true, show: false, webPreferences: { nodeIntegration: true } });

  wiz.loadURL(require('url').format({
    pathname: require('path').join(__dirname, '/../src/wizard.html'), // important
    protocol: 'file:',
    slashes: true,
  }));

  wiz.removeMenu();

  wiz.once('ready-to-show', () => wiz.show());

  if (dev) wiz.webContents.openDevTools({ mode: 'detach' });

  return wiz;
}
