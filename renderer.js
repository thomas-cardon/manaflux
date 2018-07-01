// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const EventEmitter = require('events');

const request = require('request'), rp = require('request-promise-native');

const LCUConnector = require('lcu-connector');
const connector = new LCUConnector();

const Store = require('electron-store');

const { dialog } = require('electron').remote;

class MF extends EventEmitter {}

global.Mana = new MF();

Mana.version = require('./package.json').version;
Mana.status = str => $('.status').text(str);
Mana.store = new Store();

console.log('Loading Storage...');
Mana.status('Loading Storage...');

$(document).ready(function() {
  if (!Mana.store.has('language'))
    Mana.store.set('language', 'en_US');

  if (!Mana.store.has('runes'))
    Mana.store.set('runes', {});

  if (!Mana.store.has('summonerspells'))
    Mana.store.set('summonerspells', {});

  if (Mana.store.get('lastVersion', '1.1.0') === '1.1.0') {
    Mana.store.set('runes', {});
    Mana.store.set('summonerspells', {});
  }

  if (!Mana.store.has('loadRunesAutomatically'))
    Mana.store.set('loadRunesAutomatically', true);

  if (!Mana.store.has('enableSummonerSpellButton'))
    Mana.store.set('enableSummonerSpellButton', false);

  if (!Mana.store.has('enableItemSets'))
    Mana.store.set('enableItemSets', false);

  if (!Mana.store.has('theme'))
    Mana.store.set('theme', 'themes/default-bg.jpg');

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
        ipcRenderer.send('start-lcu-connector', Mana.store.get('leaguePath'));
      });
    }
    else Mana.store.set('leaguePath', 'C:\\Riot Games\\League of Legends');
  }
  else ipcRenderer.send('start-lcu-connector', Mana.store.get('leaguePath'));

  console.log('Waiting for LCU...');
  Mana.status('Waiting for LCU...');
});

ipcRenderer.once('lcu', async (event, d) => {
  console.dir(d);

  Mana.base = `https://${d.username}:${d.password}@${d.address}:${d.port}/`;
  Mana.lcu = d;
  Mana.user = new (require('./User'))(Mana.base);

  Mana.status('Connected...');

  Mana.champions = {};
  Mana.summonerspells = {};

  const championSummaryData = JSON.parse(await rp(Mana.base + 'lol-game-data/assets/v1/champion-summary.json'));

  for (let champion of championSummaryData)
    Mana.champions[champion.id] = { id: champion.id, key: champion.alias, name: champion.name, img: Mana.base.slice(0, -1) + champion.squarePortraitPath };

  Mana.status('Champions loaded...');

  const summonerSpellData = JSON.parse(await rp(Mana.base + 'lol-game-data/assets/v1/summoner-spells.json'));

  for (let spell of summonerSpellData) {
    const x = spell.iconPath.slice(42, -4).replace('_', '');
    let key;

    if (x.startsWith('Summoner')) key = "Summoner" + (x.charAt(8).toUpperCase() + x.slice(9));
    else if ([30, 31, 33, 34, 35, 36, 39].includes(spell.id)) continue;

    Mana.summonerspells[key] = { id: spell.id, key, name: spell.name, gameModes: spell.gameModes };

    if (spell.id === 14)
      Mana.summonerspells['SummonerDot'] = Mana.summonerspells[key];
  }

  Mana.status('Summoner Spells loaded...');

  await Mana.user.load();

  Mana.status('Waiting for Champion Select...');

  /*
  * Champion Select checker
  */

  setInterval(function() {
    request(Mana.base + 'lol-champ-select/v1/session', function (error, response, body) {
      if (response && response.statusCode === 404) Mana.emit('champselect', false);
      else {
        try {
          Mana.emit('champselect', JSON.parse(body));
        }
        catch(err) {
          console.error(err);
          console.log(body);
        }
      }
    });
  }, 1000);
});

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
