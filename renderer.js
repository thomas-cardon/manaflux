// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const request = require('request'), rp = require('request-promise-native');
const Store = require('electron-store');

const { dialog, app } = require('electron').remote;

const ItemSetHandler = require('./objects/handlers/ItemSetHandler');

Mana.version = app.getVersion();
Mana.store = new Store();

if (Mana.store.get('enableTrayIcon')) UI.tray();

UI.status('Status', 'loading-storage');

$(document).ready(function() {
  if (!Mana.store.has('data'))
    Mana.store.set('data', {});

  if (!Mana.store.has('loadRunesAutomatically'))
    Mana.store.set('loadRunesAutomatically', true);

  if (!Mana.store.has('enableSummonerSpells'))
    Mana.store.set('enableSummonerSpellButton', false);

  if (!Mana.store.has('enableItemSets'))
    Mana.store.set('enableItemSets', false);

  if (!Mana.store.has('auto-start'))
    Mana.store.set('auto-start', false);

  if (!Mana.store.has('enableTrayIcon'))
    Mana.store.set('enableTrayIcon', false);

  if (!Mana.store.has('theme'))
    Mana.store.set('theme', 'themes/default-bg.jpg');

  if (!Mana.store.has('runes-max'))
    Mana.store.set('runes-max', 2);

  if (!Mana.store.has('runes-updating-method'))
    Mana.store.set('runes-updating-method', false);

  if (!Mana.store.has('summoner-spells-priority'))
    Mana.store.set('summoner-spells-priority', 'd');

  if (!Mana.store.has('riot-consent')) {
    dialog.showMessageBox({ title: i18n.__('info'), message: i18n.__('consent') });
    Mana.store.set('riot-consent', true);
  }

  Mana.store.set('lastVersion', Mana.version);

  if (!Mana.store.has('leaguePath')) {
    UI.status('Status', 'league-client-start-required');

    ipcRenderer.once('lcu-league-path', (event, path) => {
      UI.status('League', 'path-found');

      Mana.store.set('leaguePath', path);
      ipcRenderer.send('lcu-connection', path);
    }).send('lcu-league-path');
  }
  else ipcRenderer.send('lcu-connection', Mana.store.get('leaguePath'));
  Mana.emit('settings', Mana.store);
});

ipcRenderer.on('lcu-connected', async (event, d) => {
  Mana.base = d.baseUri;
  Mana.riot = d;
});

ipcRenderer.once('lcu-connected', async (event, d) => {
  Mana.user = new (require('./objects/User'))();
  Mana.gameClient = new (require('./objects/riot/leagueoflegends/GameClient'))();
  Mana.assetsProxy = new (require('./objects/riot/leagueoflegends/GameAssetsProxy'))();

  Mana.championSelectHandler = new (require('./objects/handlers/ChampionSelectHandler'))();

  UI.status('Status', 'loading-data-login');

  Mana.assetsProxy.load();
  const data = await Promise.all([Mana.gameClient.getChampionSummary(), Mana.gameClient.getSummonerSpells()]);

  Mana.champions = data[0];
  Mana.summonerspells = data[1];

  await Mana.gameClient.load();
  $('.version').text($('.version').text() + ' - V' + Mana.gameClient.branch);

  if (Mana.store.get('lastBranchSeen') !== Mana.gameClient.branch) {
    Mana.store.set('data', {});
    ItemSetHandler.getItemSets().then(x => ItemSetHandler.deleteItemSets(x)).catch(UI.error);
  }

  Mana.store.set('lastBranchSeen', Mana.gameClient.branch);
});

ipcRenderer.on('lcu-logged-in', async (event, data) => {
  UI.status('League', 'league-client-connection');

  Mana.user._load(data);
  Mana.championSelectHandler.load();

  UI.status('Status', 'champion-select-waiting');
  $('#loading').hide();

  global._devChampionSelect = () => new (require('./CustomGame'))().create().then(game => game.start());
});

ipcRenderer.on('lcu-disconnected', async () => {
  global._devChampionSelect = () => console.log(`[${i18n.__('error')}] ${i18n.__('developer-game-start-error')}\n${i18n.__('league-client-disconnected')}`);

  Mana.championSelectHandler.stop();
  UI.status('League', 'disconnected');
});

global.autoStart = function(checked) {
  ipcRenderer.send(`auto-start-${checked ? 'en' : 'dis'}able`);
}

global._devChampionSelect = () => console.log(`[${i18n.__('error')}] ${i18n.__('developer-game-start-error')}\n${i18n.__('league-client-disconnected')}`);
