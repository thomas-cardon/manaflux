const rp = require('request-promise-native');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class LoLFlavorProvider extends Provider {
  constructor() {
    super('lolflavor', 'LoLFlavor');
    this.base = 'http://lolflavor.com/champions/';
  }

  getPosition(pos = 'aram') {
    switch(pos.toLowerCase()) {
      case 'bottom':
        return 'adc';
      case 'middle':
        return 'mid';
      default:
        return pos.toLowerCase();
    }
  }

  async getItemSets(champion, preferredPosition, gameMode) {
    preferredPosition = getPosition(preferredPosition);

    try {
      const res = await rp({
        method: 'GET',
        uri: `${this.base}${champion.key}/Recommended/${champion.key}_${preferredPosition}_scrape.json`,
        json: true
      });

      return this._parse(res, champion, preferredPosition, gameMode);
    }
    catch(err) {
      if (err.statusCode === 404) throw Error('No item sets available for this champion and position');
      else throw err;
    }
  }

  async _parse(data, champion, position, gameMode) {
    let itemset = new ItemSet(champion.key, UI.stylizeRole(position), this.id);

    itemset.setData(data);

    itemset._data.blocks[0].setType('item-sets-block-consumables');
    itemset._data.blocks[1].setType({ i18n: 'item-sets-block-starter', arguments: [itemset._data.blocks[2].getType().slice(-5)], display: line => line.split(' | ')[0] });
    itemset._data.blocks[2].setType('item-sets-block-core-build');
    itemset._data.blocks[3].setType('item-sets-block-endgame');
    itemset._data.blocks[4].setType('item-sets-block-boots');

    itemset.setTitle(`LFR ${champion.name} - ${UI.stylizeRole(position)}`)

    return { itemsets: [itemset] };
  }
}

module.exports = LoLFlavorProvider;
