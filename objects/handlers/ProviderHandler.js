const rp = require('request-promise-native');
const DataValidator = new (require('../helpers/DataValidator'))();
const EventEmitter = require('events');

class ProviderHandler {
  constructor() {
    this._cache = [];
    this.providers = {
      championgg: new (require('../providers/ChampionGG'))(),
      opgg: new (require('../providers/OPGG'))(),
      leagueofgraphs: new (require('../providers/LeagueofGraphs'))(),
      lolflavor: new (require('../providers/LoLFlavor'))(),
      metasrc: new (require('../providers/METAsrc'))(),
      flux: new (require('../providers/Flux'))()
    };
  }

  getProvider(x) {
    return this.providers[x];
  }

  isProviderEnabled(x) {
    return Mana.getStore().get('providers-order-' + x.id, true);
  }

  async getChampionData(champion, preferredPosition, gameModeHandler, cache, providerList, bulkDownloadMode) {
    console.log(2, '[ProviderHandler] Downloading data for', champion.name);
    const gameMode = bulkDownloadMode ? gameModeHandler.getGameMode() : Mana.gameflow.getGameMode();

    /* 1/5 - Storage Checking */
    let data = await Mana.championStorageHandler.get(champion.id);
    if (data && cache) {
      if (!bulkDownloadMode && (data.roles[preferredPosition || Object.keys(data.roles)[0]]).gameMode === gameMode) {
        console.log(2, `[ProviderHandler] Using local storage`);

        DataValidator.onDataDownloaded(data, champion);
        return data;
      }
    }

    /* 2/5 - Downloading */
    let providers = providerList || Mana.getStore().get('providers-order', Object.keys(this.providers)).filter(x => this.isProviderEnabled(x));
    if (gameModeHandler.getProviders() !== null) providers = providers.filter(x => gameModeHandler.getProviders() === null || gameModeHandler.getProviders().includes(x));

    console.log('[ProviderHandler] Using providers: ', providers.map(x => this.providers[x].name).join(' => '));

    for (let provider of providers) {
      provider = this.providers[provider];
      console.log(2, `[ProviderHandler] Using ${provider.name}`);

      try {
        if (data) this._merge(data, await provider.getData(champion, preferredPosition, gameMode));
        else data = await provider.getData(champion, preferredPosition, gameMode);

        DataValidator.onDataChange(data, provider.id, gameMode);
      }
      catch(err) {
        console.log('[ProviderHandler] Couldn\'t aggregate data.');
        console.error(err);
        continue;
      }

      /* If a provider can't get any data on that role/position, let's use another provider */
      if (!data || preferredPosition && !data.roles[preferredPosition] || !preferredPosition && Object.keys(data.roles).length < Mana.getStore().get('champion-select-min-roles', 2)) continue;
      else if (!preferredPosition) preferredPosition = Object.keys(data.roles)[0];

      /* Else we need to check the provider provided the required data */
      if (data.roles[preferredPosition].perks.length === 0)
          data.roles[preferredPosition] = { ...data.roles[preferredPosition], ...await provider.getPerks(champion, preferredPosition, gameMode) || {} };
      else if (data.roles[preferredPosition].itemsets.length === 0 && Mana.getStore().get('item-sets-enable'))
          data.roles[preferredPosition] = { ...data.roles[preferredPosition], ...await provider.getItemSets(champion, preferredPosition, gameMode) || {} };
      else if (data.roles[preferredPosition].summonerspells.length === 0 && Mana.getStore().get('summoner-spells'))
          data.roles[preferredPosition] = { ...data.roles[preferredPosition], ...await provider.getSummonerSpells(champion, preferredPosition, gameMode) || {} };

      break;
    }

    /* 3/5 - Validate */
    data = DataValidator.onDataDownloaded(data, champion);

    /* 4/5 - Saving to offline cache
       5/5 - Uploading to online cache */
    if (cache) this._cache.push(data);
    return data;
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
        DataValidator.onDataUpload(cache[i]);
        await UI.indicator(flux.upload(cache[i]), 'providers-flux-uploading');
      }

      DataValidator.onDataStore(cache[i]);

      await Mana.championStorageHandler.update(cache[i].championId, x => this._merge(cache[i], x));
      cache.splice(i, 1);
    }

    await Mana.championStorageHandler.save();
  }

  /**
   * Copies properties or merges arrays if necessary
   * @param {object} x - The source object
   * @param {object} y - The object to copy properties from
   */
  _merge(x, y) {
    if (!x) return y;
    else if (!y) return x;

    for (const [name, role] of Object.entries(y.roles)) {
      if (!x.roles[name]) x.roles[name] = role;
      else {
        for (const [k, v] of Object.entries(role)) {
          if (!x.roles[name][k]) x.roles[name][k] = v;
          else if (Array.isArray(x.roles[name][k])) x.roles[name][k] = x.roles[name][k].concat(v).filter((x, pos, self) => self.indexOf(x) === pos);
        }
      }
    }

    return x;
  }
}

module.exports = ProviderHandler;
