const rp = require('request-promise-native');
class ProviderHandler {
  constructor() {
    this._cache = [];
    this.providers = {
      championgg: new (require('../providers/ChampionGG'))(),
      opgg: new (require('../providers/OPGG'))(),
      /*ugg: new (require('../providers/UGG'))(),*/
      leagueofgraphs: new (require('../providers/LeagueofGraphs'))(),
      lolflavor: new (require('../providers/LoLFlavor'))(),
      flux: new (require('../providers/Flux'))()
    };
  }

  async getChampionData(champion, preferredPosition, gameModeHandler, cache) {
    const gameMode = gameModeHandler.getGameMode();

    /* 1/4 - Storage Checking */
    if (Mana.getStore().has(`data.${champion.championId}`) && cache) return Mana.getStore().get(`data.${champion.key}`);

    /* 2/4 - Downloading */
    const providers = Mana.getStore().get('providers-order', Object.keys(this.providers)).filter(x => gameModeHandler.getProviders() === null || gameModeHandler.getProviders().includes(x));
    providers.unshift(...providers.splice(providers.indexOf('flux'), 1), ...providers.splice(providers.indexOf('lolflavor'), 1));

    let data;

    for (let provider of providers) {
      provider = this.providers[provider];
      console.log(2, `[ProviderHandler] Using ${provider.name}`);

      if (!data) {
        try {
          const x = await provider.getData(champion, preferredPosition, gameMode);
          data = { roles: {}, championId: champion.id, gameMode, version: Mana.version, gameVersion: Mana.gameClient.branch, region: Mana.gameClient.region, ...x };
        }
          catch(err) {
          console.error(err);
          console.log('[ProviderHandler] Couldn\'t aggregate data.');
          continue;
        }
      }
      else {
        try {
          this._merge(data, await provider.getData(champion, preferredPosition, gameMode));
        }
        catch(err) {
          console.error(err);
          console.log('[ProviderHandler] Couldn\'t aggregate data.');
          continue;
        }
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

    /* 3/4 - Saving to offline cache
       4/4 - Uploading to online cache */
    if (!cache) return console.dir(data);
    this._cache.push(data);

    return data;
  }

  /**
   * Runs tasks when champion select ends
   */
  onChampionSelectEnd() {
    this._cache.forEach(data => {
      UI.loading(true);

      Object.values(data.roles).forEach(r => {
        r.itemsets = r.itemsets.map(x => x._data ? x.build(false) : x)
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
