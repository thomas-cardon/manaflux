process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const EventEmitter = require('events');
const { dialog, app } = require('electron').remote;

const Store = require('electron-store');

class Mana extends EventEmitter {
  constructor() {
    super();
    $('.version').text(`V${this.version = app.getVersion()}`);

    UI.status('Status', 'status-loading-storage');
    this._store = new Store();

    this.getStore().set('lastVersion', this.version);
    if (!this.getStore().has('league-client-path'))
      require('../objects/Wizard')(true).on('closed', () => {
        console.log('[UI] Wizard has been closed');
        ipcRenderer.send('lcu-get-path');
        ipcRenderer.send('lcu-connection');
      });

    else ipcRenderer.send('lcu-connection', this.getStore().get('league-client-path'));

    if (!this.getStore().has('riot-consent')) {
      dialog.showMessageBox({ title: i18n.__('info'), message: i18n.__('consent') });
      this.getStore().set('riot-consent', true);
    }

    ipcRenderer.on('lcu-connected', (event, d) => this.updateAuthenticationTokens(d));
    ipcRenderer.on('lcu-logged-in', (event, d) => this.load(d));
    ipcRenderer.on('lcu-disconnected', () => this.disconnect());
    ipcRenderer.once('lcu-connected', (event, d) => this.preload());
  }

  async preload() {
    UI.status('Status', 'common-loading');

    this.user = new (require('./User'))();
    this.gameClient = new (require('./riot/leagueoflegends/GameClient'))();
    this.assetsProxy = new (require('./riot/leagueoflegends/GameAssetsProxy'))();

    this.championSelectHandler = new (require('./handlers/ChampionSelectHandler'))();

    UI.status('Status', 'status-loading-data-login');

    this.assetsProxy.load();

    const data = await Promise.all([this.gameClient.getChampionSummary(), this.gameClient.getSummonerSpells(), this.gameClient.load()]);

    this.champions = data[0];
    this.summonerspells = data[1];

    $('.version').text(`V${this.version} - V${this.gameClient.branch}`);

    if (this.getStore().get('lastBranchSeen') !== this.gameClient.branch) {
      this.getStore().set('data', {});
      require('./handlers/ItemSetHandler').getItemSets().then(x => require('./handlers/ItemSetHandler').deleteItemSets(x)).catch(UI.error);
    }

    this._store.set('lastBranchSeen', this.gameClient.branch);
  }

  async load(data) {
    UI.status('League', 'league-client-connection');

    this.user._load(data);
    this.championSelectHandler.load();

    UI.status('Status', 'champion-select-waiting');
    $('#loading').hide();

    global._devChampionSelect = () => new (require('../CustomGame'))().create().then(game => game.start());
  }

  disconnect() {
    global._devChampionSelect = () => console.log(`[${i18n.__('error')}] ${i18n.__('developer-game-start-error')}\n${i18n.__('league-client-disconnected')}`);

    this.championSelectHandler.stop();
    UI.status('League', 'status-disconnected');
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
