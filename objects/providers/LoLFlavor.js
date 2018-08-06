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
      UI.error('LoLFlavor - Couldn\'t find item sets');
      console.error(err);

      if (err.statusCode === 404) return { itemsets: [] };
    }
  }

  async _aggregate(itemset, champion, preferredPosition, gameMode) {
    preferredPosition = preferredPosition.charAt(0).toUpperCase() + preferredPosition.slice(1);

    itemset.blocks[0].type = 'Consommables | set mis-à-jour le ' + itemset.title.split(' - ')[1];
    itemset.title = `${champion.name} ${gameMode === 'ARAM' ? 'ARAM' : preferredPosition} (LoLFlavor)`;

    return { itemsets: [itemset] };
  }
}

module.exports = LoLFlavorProvider;
