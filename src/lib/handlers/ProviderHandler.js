const rp = require('request-promise-native');
const DataValidator = new (require('../helpers/DataValidator'))();
const { EventEmitter } = require('events');

class ProviderHandler {
  constructor() {
    this._cache = [];

    this.downloads = new EventEmitter();

    this.providers = {
      championgg: new (require('../providers/ChampionGG'))(this.downloads),
      opgg: new (require('../providers/OPGG'))(this.downloads),
      opgg_urf: new (require('../providers/OPGG_URF'))(this.downloads),
      leagueofgraphs: new (require('../providers/LeagueofGraphs'))(this.downloads),
      metasrc: new (require('../providers/METAsrc'))(this.downloads),
      ugg: new (require('../providers/UGG'))(this.downloads),
      flux: new (require('../providers/Flux'))(this.downloads)
    };

    Object.values(this.providers).forEach(x => x._dataValidator = DataValidator);

    this.downloads.on('provider-ended', (provider, role) => {
      console.log('Passing data to ChampionSelectHandler');
      Mana.championSelectHandler.onDataReceived(this._data);

      //if (cache) this._cache.push(data);
    });
  }

  getProvider(x) {
    return this.providers[x];
  }

  isProviderEnabled(x) {
    return Mana.getStore().get('providers-order-' + x.id, true);
  }

  getProviders() {
    return Mana.getStore().get('providers-order', Object.keys(this.providers)).filter(x => this.providers[x] && this.isProviderEnabled(x));
  }

  async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  isEmpty(myObject) {
    for(var key in myObject) {
        if (myObject.hasOwnProperty(key)) {
            return false;
        }
    }

    return true;
  }

  async getChampionData(champion, preferredRole, gameModeHandler, cache, providers = this.getProviders(), bulkDownloadMode) {
    console.log(2, '[ProviderHandler] Downloading data for', champion.name);
    const gameMode = bulkDownloadMode ? gameModeHandler.getGameMode() : Mana.gameflow.getGameMode();

    /* 1/5 - Storage Checking */
    console.log(3, '[ProviderHandler] Checking in offline storage');

    this._data = await Mana.championStorageHandler.get(champion.id) || {};

    if (!this.isEmpty(this._data) && cache) {
      if (!bulkDownloadMode && (this._data.roles[preferredRole || Object.keys(this._data.roles)[0]]).gameMode === gameMode) {
        console.log(2, `[ProviderHandler] Using local storage`);

        DataValidator.onDataDownloaded(this._data, champion);
        return this._data;
      }
    }

    console.log(3, 'ProviderHandler >> Downloading from providers');

    /* 2/5 - Downloading */
    if (gameModeHandler.getProviders() !== null) providers = providers.filter(x => gameModeHandler.getProviders() === null || gameModeHandler.getProviders().includes(x));

    console.log('ProviderHandler >> Using providers:', providers.map(x => this.providers[x].name).join(' => '));

    let roles;
    if (preferredRole && gameMode === 'CLASSIC')
      roles = [...new Set(preferredRole, 'TOP', 'MIDDLE', 'JUNGLE', 'ADC', 'SUPPORT')];
    else if (gameMode === 'CLASSIC')
      roles = ['TOP', 'MIDDLE', 'JUNGLE', 'ADC', 'SUPPORT'];

    console.log('ProviderHandler >> Roles chosen in the order:', roles.join(' => '));
    this._data.roles = {
      TOP: { perks: [], summonerspells: [], itemsets: [] },
      MIDDLE: { perks: [], summonerspells: [], itemsets: [] },
      JUNGLE: { perks: [], summonerspells: [], itemsets: [] },
      ADC: {perks: [], summonerspells: [], itemsets: [] },
      SUPPORT: { perks: [], summonerspells: [], itemsets: [] }
    };

    this.downloads.on('data', (provider, type, d, role) => {
      console.log('ProviderHandler >> Received data from', provider.name, 'role: ' + role);
      console.dir([provider, type, d, role]);

      if (type === 'perks')
        this._data.roles[role].perks = DamageControl.Perks.concat(this._data.roles[role][type], d);
      else
        this._data.roles[role][type] = this._data.roles[role][type].concat(d);
    });

    providers.forEach(async (provider, index, array) => {
      provider = this.providers[provider];
      console.log(2, `[ProviderHandler] Using ${provider.name}`);

      if (roles) roles.forEach(pos => this.process(provider, gameMode, champion, pos, this._data, index + 1, array.length));
      else await this.process(provider, gameMode, champion, undefined, this._data);
    });
  }

  async process(provider, gameMode, champion, position, data = {}, x, y) {
    try {
      // TODO: status is removed every time download finishes, user doesn't have time to read status
      let d = await UI.status(provider.request(gameMode, champion, position), i18n.__('providers-downloader-downloading-from', provider.name, x, y));
    }
    catch(err) {
      console.log(`ProviderHandler >> Something happened while downloading data! (${provider.name}) - ${champion.name} - ${position}`);
      console.error(err);

      return null;
    }
  }
  /**
   * Runs tasks when champion select ends
   */
  async onChampionSelectEnd(cache = this._cache, flux = this.providers.flux) {
    var i = cache.length;

    while (i--) {
      if (!cache[i]) {
        cache.splice(i, 1);
        continue;
      }

      if (!cache[i].flux) {
        let data = DataValidator.onDataUpload(cache[i]);

        try {
          console.log('Flu.x >> Upload');
          await UI.indicator(flux.upload(data), 'providers-flux-uploading');
          console.log('Flu.x >> Upload done!');
        }
        catch(err) {
          console.log('Flu.x >> Upload error');

          console.error(err);
          UI.status('providers-flux-upload-error');
        }
      }

      DataValidator.onDataStore(cache[i]);

      await Mana.championStorageHandler.update(cache[i].championId, x => cache[i]);
      cache.splice(i, 1);
    }

    await Mana.championStorageHandler.save();
  }
}

module.exports = ProviderHandler;
