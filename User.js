const rp = require('request-promise-native');

class User {
  constructor(base) {
    this.base = base;

    rp(this.base + 'lol-game-data/assets/v1/champion-summary.json').then(res => console.dir);
  }

  async load() {
    this.runes = await this.getRunes();

    const summoner = await rp(this.base + 'lol-summoner/v1/current-summoner');
    this.summoner = JSON.parse(summoner);
  }

  getDynamicPage() {
    return this.dynamicPage;
  }

  async getPageCount() {
    let x = JSON.parse(await rp(this.base + 'lol-perks/v1/inventory'));
    return x.ownedPageCount;
  }

  async updateDynamicPage(runepage) {
    this.dynamicPage = Object.assign(this.dynamicPage, runepage);

    await rp({
      method: 'PUT',
      uri: this.base + 'lol-perks/v1/pages/' + this.dynamicPage.id,
      body: this.dynamicPage
    });

    if (!this.dynamicPage.current) await rp(this.base + 'lol-perks/v1/currentpage/' + this.dynamicPage.id);
  }

  async updateRunePages(runepages) {
    let count = await this.getPageCount();

    await this.deleteRunePages();
    this.runes = [];

    for (let i = 0; i < runepages.length; i++)
      if (count > i) await this.runes.push(this.createRunePage(runepages[i], { current: count < 1 }));
  }

  async setCurrentPage(id) {
    return await rp({
      method: 'PUT',
      uri: this.base + 'lol-perks/v1/currentpage',
      body: { id },
      json: true
    });
  }

  async getRunes() {
    let x = JSON.parse(await rp(this.base + 'lol-perks/v1/pages'));
    this.dynamicPage = x.find(p => p.name.startsWith('MF'));
    return x.filter(page => page.isEditable);
  }

  async createRunePage(data, x) {
    return await rp({
      method: 'POST',
      uri: this.base + 'lol-perks/v1/pages',
      body: x ? Object.assign(data, x) : data,
      json: true
    });
  }

  async deleteRunePage(id) {
    return await rp.del(this.base + 'lol-perks/v1/pages/' + id);
  }

  async deleteRunePages() {
    return await rp.del(this.base + 'lol-perks/v1/pages');
  }
}

module.exports = User;
