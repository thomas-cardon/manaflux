const { BrowserWindow } = require('electron').remote;

module.exports = function(dev) {
  let wizard = new BrowserWindow({ width: 700, height: 230, frame: false, icon: __dirname + '/build/icon.' + (process.platform === 'win32' ? 'ico' : 'png'), backgroundColor: '#000A13', maximizable: false, parent: require('electron').remote.getCurrentWindow(), show: false });

  wizard.loadURL(`file://${__dirname}/../src/wizard.html`);
  wizard.setMenu(null);

  wizard.once('ready-to-show', () => wizard.show());

  if (dev) wizard.webContents.openDevTools({ mode: 'detach' });
}
