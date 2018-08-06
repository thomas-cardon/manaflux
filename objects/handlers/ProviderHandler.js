class ProviderHandler {
  constructor() {
    this.providers = [new (require('../providers/ChampionGG.js'))(), new (require('../providers/LoLFlavor.js'))()];
  }

  async getChampionData(champion, preferredPosition, gameMode) {
    /*
    * 1/3 Storage Checking
    */

    if (Mana.store.has(`data.${champion.id}.${preferredPosition}`))
      return Mana.store.get(`runes.${champion.id}.${preferredPosition}`);

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

        if (!provider[method]) {
          console.log(`Provider ${provider.name} doesn't have a method called #${method}. Skipping.`);
          continue;
        }

        const d = await provider[method](champion, preferredPosition, gameMode);

        for (let [position, data] of Object.entries(d))
          positions[position] = Object.assign(positions[position] || { runes: {}, itemsets: {}, summonerspells: {} }, data);
      }
      catch(err) {
        console.error(err);
      }
    }

    /*
    * 3/3 Saving
    */

    for (let [position, data] of Object.entries(positions))
      Mana.store.set(`data.${champion.id}.${position}`, data);

    console.dir(positions);
    return positions;
  }
}

module.exports = ProviderHandler;
