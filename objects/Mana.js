process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const EventEmitter = require('events');
const { dialog, app } = require('electron').remote;

const Store = require('electron-store');

class Mana {
  constructor() {
    $('.version').text(`V${this.version = app.getVersion()}`);

    UI.status('Status', 'status-loading-storage');
    this._store = new Store();

    if (!this.getStore().get('league-client-path'))
      require('../objects/Wizard')(true).on('closed', () => {
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
      if (!this.user) this.preload();
    });

    ipcRenderer.on('lcu-logged-in', (event, d) => this.load(d));
    ipcRenderer.on('lcu-disconnected', () => this.disconnect());
  }

  async preload() {
    UI.status('Status', 'status-loading-data-login');

    this.user = new (require('./User'))();
    this.gameClient = new (require('./riot/leagueoflegends/GameClient'))();
    this.assetsProxy = new (require('./riot/leagueoflegends/GameAssetsProxy'))();

    this.championSelectHandler = new (require('./handlers/ChampionSelectHandler'))();

    this.assetsProxy.load();

    const data = await UI.loading(Promise.all([this.gameClient.load(), this.gameClient.getChampionSummary(), this.gameClient.getSummonerSpells()]));
    
    this.champions = data[1];
    this.summonerspells = data[2];

    $('.version').text(`V${this.version} - V${this.gameClient.branch}`);

    if (this.getStore().get('lastBranchSeen') !== this.gameClient.branch || this.getStore().get('lastVersion') !== this.version) {
      this.getStore().set('data', {});
      require('./handlers/ItemSetHandler').getItemSets().then(x => require('./handlers/ItemSetHandler').deleteItemSets(x)).catch(UI.error);
    }

    this.getStore().set('lastVersion', this.version);
    this.getStore().set('lastBranchSeen', this.gameClient.branch);

    UI.status('Status', 'common-loaded');
  }

  async load(data) {
    UI.status('League', 'league-client-connection');

    this.user._load(data);
    this.championSelectHandler.load();

    UI.status('Status', 'champion-select-waiting');

    global._devChampionSelect = () => new (require('../CustomGame'))().create().then(game => game.start());
  }

  disconnect() {
    global._devChampionSelect = () => console.log(`[${i18n.__('error')}] ${i18n.__('developer-game-start-error')}\n${i18n.__('league-client-disconnected')}`);

    if (this.championSelectHandler) this.championSelectHandler.stop();
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
