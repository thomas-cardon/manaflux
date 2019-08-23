const { BrowserWindow } = require('electron').remote;

module.exports = {
  userConnected: function(e) {
    this.disabled = false;
  },
  userDisconnected: function(e) {
    this.disabled = true;
  },
  click: function(e) {
    this.disabled = true;

    let win = new BrowserWindow({ parent: require('electron').remote.getCurrentWindow(), width: 350, height: 550, frame: false, icon: __dirname + '/build/icon.' + (process.platform === 'win32' ? 'ico' : 'png'), backgroundColor: '#000A13', maximizable: false, resizable: false, modal: true, show: false, webPreferences: { nodeIntegration: true } });

    win.loadURL(require('url').format({
      pathname: require('path').join(__dirname, '/../../../../components/runes/views/chooser.html'),
      protocol: 'file:',
      slashes: true,
    }));

    win.removeMenu();

    win.once('ready-to-show', () => win.show());
    win.once('did-finish-load', async () => {
      win.webContents.send('perks', Mana.user.getPerksInventory().getPerks(), Mana.user.getPerksInventory().getCount());

      win.webContents.on('newPage', () => {
        Mana.user.getPerksInventory().createPerkPage({ name: i18n.__('sidebar-rune-pages-chooser-title') })
      });
    });

    win.once('closed', () => {
      UI.success(i18n.__('sidebar-rune-pages-chooser-saved'));
    });

    if (Mana.devMode) win.webContents.openDevTools({ mode: 'detach' });
  }
};
