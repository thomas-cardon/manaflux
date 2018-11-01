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

    let win = new BrowserWindow({ parent: require('electron').remote.getCurrentWindow(), width: 350, height: 550, frame: false, icon: __dirname + '/build/icon.' + (process.platform === 'win32' ? 'ico' : 'png'), backgroundColor: '#000A13', maximizable: false, resizable: false, modal: true, show: false });

    win.loadURL(`file://${__dirname}/../../../downloader.html`);
    win.setMenu(null);

    win.once('ready-to-show', () => win.show());
    win.once('show', async () => {
      const champions = Object.values(Mana.champions).filter(x => x.id !== -1 && !Mana.getStore().has(`data.${x.id}`));
      win.webContents.send('champions-length', champions.length);

      let minRoles = Mana.getStore().get('champion-select-min-roles');
      Mana.getStore().set('champion-select-min-roles', 5);


      for (let i = 0; i < champions.length; i++) {
        if (!win) break;

        for (let prop in Mana.championSelectHandler.gameModeHandlers) {
          if (!win) break;

          console.log(`[ProviderHandlerDownloader] Downloading ${champions[i].name} (${Mana.championSelectHandler.gameModeHandlers[prop].getGameMode()})`);

          win.webContents.send('champion-download', { name: champions[i].name, gameMode: Mana.championSelectHandler.gameModeHandlers[prop].getGameMode() });
          await Mana.providerHandler.getChampionData(champions[i], null, Mana.championSelectHandler.gameModeHandlers[prop], true, null, true);
        }

        if (win) win.webContents.send('champion-downloaded');
      }

      Mana.getStore().set('champion-select-min-roles', minRoles);
      Mana.providerHandler.onChampionSelectEnd();
      if (win) win.webContents.send('download-done');
    });

    win.once('closed', () => {
      this.disabled = win = false;
    });

    if (Mana.devMode) win.webContents.openDevTools({ mode: 'detach' });
  }
};
