// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { ipcRenderer } = require('electron');
const EventEmitter = require('events');

const request = require('request'), rp = require('request-promise-native');

const LCUConnector = require('lcu-connector');
const connector = new LCUConnector();

const Store = require('electron-store');
const store = new Store();

class MF extends EventEmitter {}

global.Mana = new MF();

Mana.status = str => $('#status').text(str);

ipcRenderer.once('lcu', async (event, d) => {
  Mana.base = `https://${d.username}:${d.password}@${d.address}:${d.port}/`;
  Mana.lcu = d;
  Mana.user = new (require('./User'))(Mana.base);

  Mana.status('Connected...');

  if (!store.has('language')) store.set({ language: 'en_US', runes: {} });

  Mana.champions = [];

  const data = JSON.parse(await rp(Mana.base + 'lol-game-data/assets/v1/champion-summary.json'));

  for (let champion of data)
    Mana.champions[champion.id] = { key: champion.alias, name: champion.name, img: Mana.base.slice(0, -1) + champion.squarePortraitPath };

  Mana.status('Champions loaded...');

  await Mana.user.load();

  Mana.status('Waiting for champion select...');

  /*
  * Champion Select checker
  */
  setInterval(function() {
    request(Mana.base + 'lol-champ-select/v1/session', function (error, response, body) {
      if (response && response.statusCode === 404) Mana.emit('champselect', false);
      else Mana.emit('champselect', JSON.parse(body));
    });
  }, 3000);
});

global._devConnect = function(obj) {
  connector.on('connect', d => {
    console.dir(d);
    ipcRenderer.emit('lcu', null, d);
  });
  connector.start();
}

_devConnect();
