const rp = require('request-promise-native');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class LoLFlavorProvider extends Provider {
  constructor() {
    super('lolflavor', 'LoLFlavor', false);
    this.base = 'http://lolflavor.com/champions/';
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
      if (err.statusCode === 404) throw Error(i18n.__('providers-error-itemsets-not-found'));
      else throw err;
    }
  }

  async _aggregate(data, champion, position, gameMode) {
    position = position.charAt(0).toUpperCase() + position.slice(1);

    let itemset = new ItemSet(champion.key, position);

    itemset._data = data;
    itemset._data.blocks[0].type = i18n.__('itemsets-block-consumables');

    itemset.setTitle(`LFR ${champion.name} - ${gameMode === 'ARAM' ? 'ARAM' : preferredPosition}`)

    return { itemsets: [itemset] };
  }
}

module.exports = LoLFlavorProvider;
