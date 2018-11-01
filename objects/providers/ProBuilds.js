const rp = require('request-promise-native');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class ProBuildsProvider extends Provider {
  constructor() {
    super('probuilds', 'ProBuilds');
    this.base = 'https://www.probuilds.net/champions/details/';
  }

  async getData(champion, preferredPosition, gameMode) {
    const res = await rp(`${this.base}${champion.key}`);
    return this._scrape(res, champion, gameMode);
  }

  async getItemSets(champion, position, gameMode) {
    return await this.getData(champion, position, gameMode)[position].itemsets;
  }

  _scrape(html, champion, gameMode) {
    const $ = cheerio.load(html);

    let itemset = new ItemSet(champion.key, position, this.id);

    itemset._data = itemset;
    itemset._data.blocks[0].type = i18n.__('item-sets-block-consumables');

    itemset.setTitle(`PBD ${champion.name} - ${gameMode === 'ARAM' ? 'ARAM' : preferredPosition}`)

    return { itemsets: [itemset], gameMode };
  }

  getCondensedName() {
    return 'PBD';
  }
}

module.exports = ProBuildsProvider;
