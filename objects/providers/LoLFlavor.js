const rp = require('request-promise-native');
const { ItemSet, Block } = require('../ItemSet');

class LoLFlavorProvider {
  constructor() {
    this.base = 'http://lolflavor.com/champions/';
    this.name = 'LoLFlavor';
  }

  async getItemSets(champion, preferredPosition, gameMode) {
    try {
      if (!preferredPosition || preferredPosition === 'middle') preferredPosition = 'mid';

      const res = await rp({
        method: 'GET',
        uri: `${this.base}${champion.key}/Recommended/${champion.key}_${gameMode === 'ARAM' ? 'aram' : preferredPosition}_scrape.json`,
        json: true
      });

      return this._aggregate(res, champion, preferredPosition, gameMode);
    }
    catch(err) {
      UI.error(`[LoLFlavor] ${i18n.__('providers-error-itemsets-not-found')}`);
      console.error(err);

      if (err.statusCode === 404) return { itemsets: [] };
    }
  }

  async _aggregate(itemset, champion, position, gameMode) {
    position = position.charAt(0).toUpperCase() + position.slice(1);

    let itemset = new ItemSet(champion.key, position);

    itemset._data = itemset;
    itemset._data.blocks[0].type = 'Consommables | set mis-à-jour le ' + itemset.title.split(' - ')[1];

    itemset.setTitle(`LFR ${champion.name} - ${gameMode === 'ARAM' ? 'ARAM' : preferredPosition}`)

    return { itemsets: [itemset] };
  }
}

module.exports = LoLFlavorProvider;
