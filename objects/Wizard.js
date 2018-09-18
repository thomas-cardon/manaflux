const { BrowserWindow } = require('electron').remote;

module.exports = function(dev) {
  let wiz = new BrowserWindow({ width: 700, height: 220, frame: false, icon: __dirname + '/build/icon.' + (process.platform === 'win32' ? 'ico' : 'png'), backgroundColor: '#000A13', maximizable: false, parent: require('electron').remote.getCurrentWindow(), modal: true, show: false });

  wiz.loadURL(`file://${__dirname}/../src/wizard.html`);
  wiz.setMenu(null);

  wiz.once('ready-to-show', () => wiz.show());

  if (dev) wiz.webContents.openDevTools({ mode: 'detach' });
}
