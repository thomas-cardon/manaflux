process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const EventEmitter = require('events');
const { dialog, app } = require('electron').remote;

const ManaSettings = require('./Mana/Settings');
const ItemSetHandler = require('./handlers/ItemSetHandler');

const Store = require('electron-store');

class Mana extends EventEmitter {
  constructor() {
    super();
    this.version = app.getVersion();

    UI.status('Status', 'loading-storage');
    this._store = new Store();

    this.getStore().set('lastVersion', this.version);
    if (!this.getStore().has('league-client-path')) {
      UI.status('Status', 'league-client-start-required');

      ipcRenderer.once('league-client-path', (event, path) => {
        UI.status('League', 'path-found');

        this.getStore().set('league-client-path', path);
        ipcRenderer.send('lcu-connection', path);
      }).send('league-client-path');
    }
    else ipcRenderer.send('lcu-connection', this.getStore().get('league-client-path'));
    //this.emit('settings', this.getStore());

    if (!this.getStore().has('riot-consent')) {
      dialog.showMessageBox({ title: i18n.__('info'), message: i18n.__('consent') });
      this.getStore().set('riot-consent', true);
    }

    $(document).ready(() => this._settings.load());

    ipcRenderer.on('lcu-connected', (event, d) => this.updateAuthenticationTokens(d));
    ipcRenderer.on('lcu-logged-in', (event, d) => this.load());
    ipcRenderer.on('lcu-disconnected', () => this.disconnect());
    ipcRenderer.once('lcu-connected', (event, d) => this.preload());
  }

  async preload() {
    UI.status('Status', 'loading');

    this.user = new (require('./objects/User'))();
    this.gameClient = new (require('./objects/riot/leagueoflegends/GameClient'))();
    this.assetsProxy = new (require('./objects/riot/leagueoflegends/GameAssetsProxy'))();

    this.championSelectHandler = new (require('./objects/handlers/ChampionSelectHandler'))();

    UI.status('Status', 'loading-data-login');

    this.assetsProxy.load();
    const data = await Promise.all([Mana.gameClient.getChampionSummary(), Mana.gameClient.getSummonerSpells(), Mana.gameClient.load()]);

    Mana.champions = data[0];
    Mana.summonerspells = data[1];

    $('.version').text($('.version').text() + ' - V' + Mana.gameClient.branch);

    if (this.getStore().get('lastBranchSeen') !== Mana.gameClient.branch) {
      this.getStore().set('data', {});
      ItemSetHandler.getItemSets().then(x => ItemSetHandler.deleteItemSets(x)).catch(UI.error);
    }

    Mana.store.set('lastBranchSeen', Mana.gameClient.branch);
  }

  async load() {
    UI.status('League', 'league-client-connection');

    Mana.user._load(data);
    Mana.championSelectHandler.load();

    UI.status('Status', 'champion-select-waiting');
    $('#loading').hide();

    global._devChampionSelect = () => new (require('./CustomGame'))().create().then(game => game.start());
  }

  disconnect() {
    global._devChampionSelect = () => console.log(`[${i18n.__('error')}] ${i18n.__('developer-game-start-error')}\n${i18n.__('league-client-disconnected')}`);

    Mana.championSelectHandler.stop();
    UI.status('League', 'disconnected');
  }

  updateAuthenticationTokens(data) {
    Mana.base = data.baseUri;
    Mana.riot = data;
  }

  getStore() {
    return this._store;
  }
}

module.exports = Mana;
