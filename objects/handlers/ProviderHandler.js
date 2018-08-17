class ProviderHandler {
  constructor() {
    this.providers = [new (require('../providers/ChampionGG.js'))(), new (require('../providers/OPGG.js'))(), new (require('../providers/LoLFlavor.js'))()];
  }

  async getChampionData(champion, preferredPosition, gameMode) {
    /*
    * 1/3 Storage Checking
    */
    if (Mana.store.has(`data.${champion.key}`)) {
      let data = Mana.store.get(`data.${champion.key}`);

      for (let x in data)
        for (let i = 0; i < data[x].itemsets.length; i++)
          console.dir(data[x].itemsets[i] = require('./ItemSetHandler').parse(champion.key, data[x].itemsets[i]._data));

      return data;
    }

    /*
     * 2/3 Downloading
    */

    let positions = {};

    for (let provider of this.providers) {
      console.log('Using provider: ' + provider.name);

      try {
        let method = 'getData';

        if (positions[preferredPosition]) {
          if (positions[preferredPosition].itemsets.length === 0 && Mana.store.get('enableItemSets'))
            method = 'getItemSets';
          else if (positions[preferredPosition].summonerspells.length === 0 && Mana.store.get('enableSummonerSpells'))
            method = 'getSummonerSpells';
          else if (positions[preferredPosition].runes.length === 0)
            method = 'getRunes';
        }

        const d = await provider[method](champion, preferredPosition, gameMode);

        for (let [position, data] of Object.entries(d)) {
          position.summonerspells = this.sortSummonerSpells(position.summonerspells);
          positions[position] = Object.assign(positions[position] || { runes: {}, itemsets: {}, summonerspells: {} }, data);
        }

        break;
      }
      catch(err) {
        console.error(err);
      }
    }

    /*
    * 3/3 Saving
    */

    if (positions !== {}) Mana.store.set(`data.${champion.key}`, positions);

    return positions;
  }

  sortSummonerSpells(spells) {
    return spells.sort((a, b) => a === 4 || a === 6 ? (Mana.store.get('summoner-spells-priority') === "f" ? 1 : -1) : -1);
  }
}

module.exports = ProviderHandler;
