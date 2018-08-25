process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const ManaSettings = require('./Mana/Settings');
const { dialog, app } = require('electron').remote;
const ItemSetHandler = require('./objects/handlers/ItemSetHandler');

class Mana extends EventEmitter {
  constructor() {
    super();
    this.version = app.getVersion();

    UI.status('Status', 'loading-storage');
    this._settings = new ManaSettings();

    /*if (!Mana.store.has('riot-consent')) {
      dialog.showMessageBox({ title: i18n.__('info'), message: i18n.__('consent') });
      Mana.store.set('riot-consent', true);
    }*/

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

  getSettings() {
    return this._settings;
  }

  getStore() {
    return this._settings._store;
  }
}

module.exports = Mana;
