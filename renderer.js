// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const request = require('request'), rp = require('request-promise-native');

const LCUConnector = require('lcu-connector');
const connector = new LCUConnector();

const Store = require('electron-store');

const { dialog } = require('electron').remote;

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

  if (!Mana.store.has('runes'))
    Mana.store.set('runes', {});

  if (!Mana.store.has('summonerspells'))
    Mana.store.set('summonerspells', {});

  if (Mana.store.get('lastVersion', Mana.version) === '1.1.10') {
    Mana.store.set('enableSummonerSpells', Mana.store.get('enableSummonerSpellButton', false));
    Mana.store.delete('enableSummonerSpellButton');
  }

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
    if (!require('fs').existsSync('C:\\Riot Games\\League of Legends')) {
      dialog.showOpenDialog({
        title: 'Répertoire d\'installation de League of Legends',
        buttonLabel: 'Sauvegarder',
        properties: ['openDirectory', 'showHiddenFiles'],
        message: 'Indiquez où se trouve le répertoire d\'installation du jeu'
      }, function(filePaths) {
        if (filePaths.length === 0) return;

        Mana.store.set('leaguePath', filePaths[0]);
        ipcRenderer.send('lcu-connection', Mana.store.get('leaguePath'));
      });
    }
    else Mana.store.set('leaguePath', 'C:\\Riot Games\\League of Legends');
  }
  else ipcRenderer.send('lcu-connection', Mana.store.get('leaguePath'));

  Mana.status('Connection to LeaguePlug..');
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

    Mana.status('Data loaded');
  });

  Mana.client.getVersion().then(ver => $('.version').text($('.version').text() + ' - V' + (Mana.gameVersion = ver)));
});

ipcRenderer.on('lcu-logged-in', async () => {
  Mana.status('Connected');

  await Mana.user.load();
  Mana.championselect.load();

  Mana.status('Waiting for Champion Select');
});

ipcRenderer.on('lcu-disconnected', async () => {
  Mana.status('Disconnected');
  Mana.championselect.destroy().end();
});

global.autoStart = function(checked) {
  ipcRenderer.send(`auto-start-${checked ? 'en' : 'dis'}able`);
}

global._devConnect = function(obj) {
  connector.on('connect', d => {
    console.dir(d);
    ipcRenderer.emit('lcu', null, d);
  });
  connector.start();
}

global._devFakeChampionSelect = function() {
  Mana.fakeMode = true;
  new (require('./CustomGame'))().create().then(game => game.start());
}

global._devEndFakeChampionSelect = function() {
  Mana.fakeMode = false;
  rp({ method: 'POST', uri: Mana.base + 'lol-lobby/v1/lobby/custom/cancel-champ-select' });
}
