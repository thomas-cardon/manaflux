process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const EventEmitter = require('events');
const { dialog, app } = require('electron').remote;

const Store = require('electron-store');

class Mana {
  constructor() {
    UI.loading(true);

    this.devMode = ipcRenderer.sendSync('is-dev');
    $('.version').text(`V${this.version = app.getVersion()}`);

    UI.status('status-loading-storage');
    this._store = new Store();
    //this.features = new (require('../objects/FeatureEnabler'))();

    if (!this.getStore().get('league-client-path'))
      require('../objects/Wizard')(this.devMode).on('closed', () => {
        const path = ipcRenderer.sendSync('lcu-get-path');
        console.log('[UI] Wizard has been closed');

        ipcRenderer.send('lcu-connection', path);
        $('#league-client-path').trigger('lcu:path', path);
        this.getStore().set('league-client-path', path);
      });
    else ipcRenderer.send('lcu-connection', this.getStore().get('league-client-path'));

    if (!this.getStore().has('riot-consent')) {
      dialog.showMessageBox({ title: i18n.__('common-info'), message: i18n.__('riot-consent') });
      this.getStore().set('riot-consent', true);
    }

    ipcRenderer.on('lcu-connected', (event, d) => {
      this.updateAuthenticationTokens(d);
      this.preload().then(() => ipcRenderer.send('lcu-logged-in'));
    });

    ipcRenderer.on('lcu-disconnected', () => this.disconnect());
    ipcRenderer.on('lcu-logged-in', (event, d) => {
      if (d) this.load(d);
    });

    setTimeout(() => Sounds.play('loaded'), 800);
  }

  async preload() {
    UI.status('status-please-login');

    this.gameClient = new (require('./riot/leagueoflegends/GameClient'))();
    this.assetsProxy = new (require('./riot/leagueoflegends/GameAssetsProxy'))();

    this.championSelectHandler = new (require('./handlers/ChampionSelectHandler'))();
    this.providerHandler = new (require('./handlers/ProviderHandler'))();

    this.assetsProxy.load();

    const data = await UI.indicator(Promise.all([this.gameClient.load(), this.gameClient.getChampionSummary(), this.gameClient.getSummonerSpells()]), 'status-loading-resources');

    this.champions = data[1];
    this.summonerspells = data[2];

    $('.version').text(`V${this.version} - V${this.gameClient.branch}`);

    if (this.getStore().get('lastBranchSeen') !== this.gameClient.branch || this.getStore().get('lastVersion') !== this.version) {
      this.getStore().set('data', {});
      require('./handlers/ItemSetHandler').getItemSets().then(x => require('./handlers/ItemSetHandler').deleteItemSets(x)).catch(UI.error);
    }

    this.getStore().set('lastVersion', this.version);
    this.getStore().set('lastBranchSeen', this.gameClient.branch);
  }

  async load(data) {
    UI.status('league-client-connection');

    this.user = new (require('./User'))(data);
    this.championSelectHandler.load();

    UI.status('champion-select-waiting');
    global._devChampionSelect = () => new (require('../CustomGame'))().create().then(game => game.start());
  }

  disconnect() {
    global._devChampionSelect = () => console.log(`[${i18n.__('error')}] ${i18n.__('developer-game-start-error')}\n${i18n.__('league-client-disconnected')}`);

    if (this.championSelectHandler) this.championSelectHandler.stop();
    delete this.user;

    UI.status('status-disconnected');
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
