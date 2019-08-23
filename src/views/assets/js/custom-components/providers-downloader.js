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
      pathname: require('path').join(__dirname, '/../../../downloader.html'), // important
      protocol: 'file:',
      slashes: true,
    }));

    win.removeMenu();

    win.once('ready-to-show', () => win.show());
    win.once('show', async () => {
      const champions = Object.values(Mana.gameClient.champions).filter(x => x.id !== -1);
      console.log('Providers downloader >>', champions.length, 'to load!');

      win.webContents.send('champions-length', champions.length);

      let minRoles = Mana.getStore().get('champion-select-min-roles', 2);
      Mana.getStore().set('champion-select-min-roles', 5);

      try {
        console.log('Providers downloader >> Downloading from Flu.x');
        win.webContents.send('flux-download');

        const data = await Mana.providerHandler.providers.flux.bulkDownloadQuery();

        for (let championId in data) {
          if (!Mana.gameClient.champions[championId]) continue;

          console.log(`[Downloader] Treating ${Mana.gameClient.champions[championId].name}`);
          Mana.providerHandler._cache.push(data[championId]);

          win.webContents.send('champion-treated-flux', Mana.gameClient.champions[championId].name);
        }

        win.webContents.send('flux-download-done');
      }
      catch(err) {
        console.error(err);
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

      await UI.indicator(Mana.providerHandler.onChampionSelectEnd(), 'providers-downloader-saving-status');
      Mana.getStore().set('champion-select-min-roles', minRoles);

      if (win) win.webContents.send('download-done');
    });

    win.once('closed', () => {
      this.disabled = win = false;
      UI.success(i18n.__('providers-downloader-window-closed'));
    });

    if (Mana.devMode) win.webContents.openDevTools({ mode: 'detach' });
  }
};
