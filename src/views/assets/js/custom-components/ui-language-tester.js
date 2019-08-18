const { BrowserWindow } = require('electron').remote;

module.exports = {
  click: function() {
    const win = new BrowserWindow({ parent: require('electron').remote.getCurrentWindow(), width: 350, height: 550, frame: false, icon: __dirname + '/build/icon.' + (process.platform === 'win32' ? 'ico' : 'png'), backgroundColor: '#000A13', maximizable: false, resizable: false, modal: true, show: false, webPreferences: { nodeIntegration: true } });

    win.loadURL(`file://${__dirname}/../../../languagetester.html`);
    win.setMenu(null);

    win.once('ready-to-show', () => win.show());
    if (Mana.devMode) win.webContents.openDevTools({ mode: 'detach' });
  }
};
