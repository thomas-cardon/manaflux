const rp = require('request-promise-native');
const DataValidator = new (require('../helpers/DataValidator'))();

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

  async getChampionData(champion, preferredPosition, gameModeHandler, cache) {
    const gameMode = gameModeHandler.getGameMode() || 'CLASSIC';

    /* 1/5 - Storage Checking */
    if (Mana.getStore().has(`data.${champion.id}`) && cache) {
      const data = Mana.getStore().get(`data.${champion.id}`);
      DataValidator.onDataUpload(data, champion.id, gameMode);

      return data;
    }

    /* 2/5 - Downloading */
    const providers = Mana.getStore().get('providers-order', Object.keys(this.providers)).filter(x => gameModeHandler.getProviders() === null || gameModeHandler.getProviders().includes(x));
    providers.unshift(...providers.splice(providers.indexOf('flux'), 1));
    providers.push(providers.splice(providers.indexOf('lolflavor'), 1)[0])

    let data;

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
    DataValidator.onDataDownloaded(data, champion.id, gameMode);

    /* 4/5 - Saving to offline cache
       5/5 - Uploading to online cache */
    if (!cache) return console.dir(data);
    this._cache.push(data);

    return console.dir(data);
  }

  /**
   * Runs tasks when champion select ends
   */
  onChampionSelectEnd() {
    this._cache.forEach(data => {
      UI.loading(true);

      Object.values(data.roles).forEach(r => {
        r.itemsets = r.itemsets.map(x => x._data ? x.build(false, false) : x)
      });

      Mana.getStore().set(`data.${data.championId}`, data);
      UI.indicator(this.providers.flux.upload(data), 'providers-flux-uploading');
    });

    this._cache = [];
  }

  /**
   * Copies properties or merges arrays if necessary
   * @param {object} x - The source object
   * @param {object} y - The object to copy properties from
   */
  _merge(x, y) {
    for (const [name, role] of Object.entries(y.roles)) {
      if (!x.roles[name]) x.roles[name] = role;
      else {
        for (const [k, v] of Object.entries(role)) {
          if (!x.roles[name][k]) x.roles[name][k] = v;
          else if (Array.isArray(x.roles[name][k])) x.roles[name][k] = x.roles[name][k].concat(v);
        }
      }
    }
  }
}

module.exports = ProviderHandler;
