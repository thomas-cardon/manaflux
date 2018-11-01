const rp = require('request-promise-native');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class LoLFlavorProvider extends Provider {
  constructor() {
    super('lolflavor', 'LoLFlavor');
    this.base = 'http://lolflavor.com/champions/';
  }

  getPosition(pos) {
    switch(pos.toLowerCase()) {
      case 'bottom':
        return 'adc';
      case 'middle':
        return 'mid';
      default:
        return pos.toLowerCase();
    }
  }

  async getData(champion, preferredPosition, gameMode) {
    return await this.getItemSets(champion, preferredPosition, gameMode);
  }

  async getItemSets(champion, preferredPosition, gameMode) {
    let LolflavorPosition = preferredPosition ? this.getPosition(preferredPosition) : 'aram';

    try {
      const res = await rp({
        method: 'GET',
        uri: `${this.base}${champion.key}/Recommended/${champion.key}_${LolflavorPosition}_scrape.json`,
        json: true
      });

      let r = { roles: {} };
      r.roles[preferredPosition || 'ARAM'] = this._parse(res, champion, preferredPosition || 'ARAM', gameMode);

      return r;
    }
    catch(err) {
      if (err.statusCode === 404) throw Error('No item sets available for this champion and position');
      else throw err;
    }
  }

  _parse(data, champion, position, gameMode) {
    let itemset = new ItemSet(champion.key, UI.stylizeRole(position), this.id);

    if (gameMode === 'ARAM') itemset.setMap('HA');

    let types = [
      'item-sets-block-consumables',
      { i18n: 'item-sets-block-starter-skill-order', arguments: [data.blocks[2].type.slice(-5).split('').map(x => x === '>' ? ' > ' : i18n.__('key-' + x))] },
      'item-sets-block-core-build',
      'item-sets-block-endgame',
      'item-sets-block-boots',
      'item-sets-block-situational'
    ];

    data.blocks.forEach((data, i) => {
      let block = new Block().setType(types[i] || data.type);
      data.items.forEach(x => block.addItem(x.id, x.count));

      itemset.addBlock(block);
    });

    return { itemsets: [itemset], perks: [], summonerspells: [], gameMode };
  }

  getCondensedName() {
    return 'LFV';
  }
}

module.exports = LoLFlavorProvider;
