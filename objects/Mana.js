process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { dialog, app } = require('electron').remote;

const Store = require('electron-store');

class Mana {
  constructor() {
    UI.loading(true);

    this.devMode = ipcRenderer.sendSync('is-dev');

    document.getElementById('version').innerHTML = `V${this.version = app.getVersion() + (!require('electron').remote.app.isPackaged ? '-BUILD' : '')}`;
    console.log('Mana >> Starting backend, version:', document.getElementById('version').innerHTML);

    this._store = new Store();

    if (!this.getStore().has('language'))
    this.getStore().set('language', require('electron').remote.app.getLocale().toLowerCase());

    global.i18n = new (require('./i18n'))(this.getStore().get('language'));

    if (!this.getStore().get('lastVersion') || this.getStore().get('lastVersion').startsWith("1.")) {
      this.getStore().clear();
      this.getStore().set('lastVersion', this.version);

      ipcRenderer.send('restart');
    }

    if (!this.getStore().has('riot-consent')) {
      dialog.showMessageBox({ title: i18n.__('common-info'), message: i18n.__('riot-consent') });
      this.getStore().set('riot-consent', true);
    }

    this.load();

    ipcRenderer.on('lcu-connected', (event, d) => {
      this.updateAuthenticationTokens(d);
      this.onLeagueStart().then(() => ipcRenderer.send('lcu-logged-in'));
    });

    ipcRenderer.on('lcu-disconnected', () => this.onLeagueDisconnect());
    ipcRenderer.on('lcu-logged-in', (event, d) => {
      if (d) this.onLeagueUserConnected(d);
    });

    setTimeout(() => Sounds.play('loaded'), 800);
  }

  async load() {
    this.gameClient = new (require('./riot/leagueoflegends/GameClient'))();

    this.assetsProxy = new (require('./riot/leagueoflegends/GameAssetsProxy'))();
    this.remoteConnectionHandler = new (require('./handlers/RemoteConnectionHandler'))();

    this.alertHandler = new (require('./handlers/AlertHandler'))();

    this.championStorageHandler = new (require('./handlers/ChampionStorageHandler'))();
    this.championSelectHandler = new (require('./handlers/ChampionSelectHandler'))();
    this.statisticsHandler = new (require('./handlers/StatisticsHandler'))();

    this.providerHandler = new (require('./handlers/ProviderHandler'))(this.devMode);

    this.overlayHandler = new (require('./handlers/OverlayHandler'))();

    this.gameflow = require('./riot/leagueoflegends/Gameflow');

    UI.loadSettings(this);
    UI.loadCustomComponents(this);
    UI.tabs.load();

    if (!this.getStore().get('league-client-path'))
    require('../objects/Wizard')(this.devMode).on('closed', () => {
      const path = ipcRenderer.sendSync('lcu-get-path');
      console.log('[UI] Wizard has been closed');

      ipcRenderer.send('lcu-connection', path);
      this.getStore().set('league-client-path', path);

      document.getElementById('league-client-path').dispatchEvent(new Event('leaguePathChange'));
    });
    else ipcRenderer.send('lcu-connection', this.getStore().get('league-client-path'));

    this.featureCheck('mobile-app').then(x => {
      if (!x) document.querySelector('[data-tabid="settings"][data-tabn="5"]').innerHTML = '<center><p style="color: #c0392b;">This tab is disabled for now. Check back soon!</p></center>';
    })
  }

  async featureCheck(id) {
    if (this.devMode) return true;

    try {
      let req = await require('request-promise-native')(`https://manaflux-server.herokuapp.com/api/features/v1/${id}`);
      return req.enabled;
    }
    catch(err) {
      console.log('Feature Checker >> Couldn\'t check!');
      console.error(err);
    }

    return false;
  }

  async onLeagueStart() {
    document.getElementById('connection').style.display = 'none';
    UI.status('status-please-login');

    this.assetsProxy.load();

    const data = await UI.indicator(Promise.all([this.gameClient.load(), this.gameClient.queryChampionSummary(), this.gameClient.querySummonerSpells()]), 'status-loading-resources');

    this.preseason = data[0];
    $('.version').text(`V${this.version} - V${this.gameClient.version}`);

    await this.championStorageHandler.load();
    await this.statisticsHandler.load();

    if (this.getStore().get('lastVersionSeen') !== this.gameClient.version) {
      this.championStorageHandler.clear();
      require('./handlers/ItemSetHandler').getItemSets().then(x => require('./handlers/ItemSetHandler').deleteItemSets(x)).catch(UI.error);
    }

    this.getStore().set('lastVersionSeen', this.gameClient.version);
    document.querySelectorAll('[data-custom-component]').forEach(x => x.dispatchEvent(new Event('clientLoaded')));

    this.alertHandler.load();

    ipcRenderer.send('lcu-preload-done');

    //this.overlayHandler.start();
  }

  onLeagueUserConnected(data) {
    if (this.user && this.user.getSummonerId() === data.summonerId) return;
    UI.status('league-client-connection');

    this.user = new (require('./User'))(data);

    global._devChampionSelect = () => new (require('../CustomGame'))().create().then(game => game.start());
    document.querySelectorAll('[data-custom-component]').forEach(x => x.dispatchEvent(new Event('userConnected')));

    this.championSelectHandler.loop();
    UI.status('champion-select-waiting');

    this.alertHandler.login();
  }

  onLeagueDisconnect() {
    if (this.user)
      this.user.connected = false;

    this.assetsProxy.stop();

    global._devChampionSelect = () => console.log(`[${i18n.__('error')}] ${i18n.__('developer-game-start-error')}\n${i18n.__('league-client-disconnected')}`);
    document.getElementById('connection').style.display = 'block';

    UI.status('status-disconnected');
    document.querySelectorAll('[data-custom-component]').forEach(x => x.dispatchEvent(new Event('userDisconnected')));
  }

  updateAuthenticationTokens(data) {
    this.base = data.baseUri;
    this.riot = data;
  }

  getStore() {
    return this._store;
  }
}

module.exports = Mana;
