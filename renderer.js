// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const request = require('request'), rp = require('request-promise-native');
const Store = require('electron-store');

const { dialog } = require('electron').remote;

const ItemSetHandler = require('./objects/handlers/ItemSetHandler');

Mana.version = require('./package.json').version;
Mana.status = str => {
  $('.status').text(str + '...');
  console.log(str + '...');
};
Mana.store = new Store();

if (Mana.store.get('enableTrayIcon')) UI.tray();

Mana.status('Loading Storage');

$(document).ready(function() {
  if (!Mana.store.has('language'))
    Mana.store.set('language', 'en_US');

  if (!Mana.store.has('data'))
    Mana.store.set('data', {});

  if (!Mana.store.has('summonerspells'))
    Mana.store.set('summonerspells', {});

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

  if (!Mana.store.has('riot-stuff-consent-thingy')) {
    dialog.showMessageBox({ title: 'Informations', message: 'ManaFlux isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.\nLeague of Legends © Riot Games, Inc.' });
    Mana.store.set('riot-stuff-consent-thingy', true);
  }

  Mana.store.set('lastVersion', Mana.version);

  if (!Mana.store.has('leaguePath')) {
    Mana.status('Démarrage du launcher nécessaire');
    UI.error('Démarrez le launcher pour que je puisse trouver son emplacement');

    ipcRenderer.once('lcu-league-path', (event, path) => {
      Mana.status('League Path found');
      console.log(path);

      Mana.store.set('leaguePath', path);
      return ipcRenderer.send('lcu-connection', path);
    }).send('lcu-league-path');
  }
  else ipcRenderer.send('lcu-connection', Mana.store.get('leaguePath'));
  Mana.emit('settings', Mana.store);
});

ipcRenderer.on('lcu-connected', async (event, d) => Mana.base = d.baseUri);
ipcRenderer.once('lcu-connected', (event, d) => {
  Mana.user = new (require('./User'))(Mana.base);
  Mana.client = require('./objects/Client');
  Mana.championselect = new (require('./objects/ChampionSelect'))();

  Mana.status('Loading Data');
  Promise.all([Mana.client.getChampionSummary(), Mana.client.getSummonerSpells()]).then(data => {
    Mana.champions = data[0];
    Mana.summonerspells = data[1];
  });

  Mana.client.getVersion().then(ver => {
    if (Mana.store.get('gameVersion') !== ver) {
      Mana.store.set('data', {});
      ItemSetHandler.getItemSets().then(x => ItemSetHandler.deleteItemSets(x)).catch(UI.error);
    }

    Mana.store.set('gameVersion', ver);
    $('.version').text($('.version').text() + ' - V' + (Mana.gameVersion = ver));
  });
});

ipcRenderer.on('lcu-logged-in', async () => {
  Mana.status('Connecting (be sure to be logged on League of Legends)');

  await Mana.user.load();
  Mana.championselect.load();

  Mana.status('Waiting for Champion Select');

  global._devChampionSelect = () => new (require('./CustomGame'))().create().then(game => game.start());
});

ipcRenderer.on('lcu-disconnected', async () => {
  global._devChampionSelect = () => console.log(`Couldn't start a game: LeaguePlug is disconnected`);

  if (Mana.championselect) Mana.championselect.end().destroy();
  Mana.status('Disconnected');
});

global.autoStart = function(checked) {
  ipcRenderer.send(`auto-start-${checked ? 'en' : 'dis'}able`);
}

global._devChampionSelect = () => console.log(`Couldn't start a game: LeaguePlug is disconnected`);
