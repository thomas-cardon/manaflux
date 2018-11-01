const { BrowserWindow } = require('electron').remote;
const rp = require('request-promise-native');

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
      const champions = Object.values(Mana.champions).filter(x => x.id !== -1);
      win.webContents.send('champions-length', champions.length);

      let minRoles = Mana.getStore().get('champion-select-min-roles');
      Mana.getStore().set('champion-select-min-roles', 5);

      console.log('[Downloader] Started downloading Flu.x database');
      const data = await Mana.providerHandler.providers.flux.bulkDownloadQuery();

      for (let championId in data) {
        if (!Mana.champions[championId]) continue;

        console.log(`[Downloader] Treating ${Mana.champions[championId].name}`);
        const d = Mana.getStore().get(`data.${championId}`);

        Mana.getStore().set(`data.${championId}`, data[championId]);
      }

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
