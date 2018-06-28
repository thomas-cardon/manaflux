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
    console.dir(runepages);
    
    this.runes = await this.getRunes();
    let count = await this.getPageCount();

    this.deleteRunePages();

    for (let i = 0; i < runepages.length; i++)
      if (this.runes[i]) await this.createRunePage(runepages[i]);

    return;
  }

  async getTidecallRunes(id) {
    const res = await rp('http://localhost:3000/api/v1/champions/' + id);
    const { name, statistics } = JSON.parse(res), perks = statistics[0].perks;
    return { name: 'MF ' + name, primaryStyleId: perks.primary, subStyleId: perks.sub, selectedPerkIds: [perks.perk0.id, perks.perk1.id, perks.perk2.id, perks.perk3.id, perks.perk4.id, perks.perk5.id] };
  }

  async getRunes() {
    let x = JSON.parse(await rp(this.base + 'lol-perks/v1/pages'));
    this.dynamicPage = x.find(p => p.name.startsWith('MF'));
    return x.filter(page => page.isEditable);
  }

  async createRunePage(data) {
    return await rp({
      method: 'POST',
      uri: this.base + 'lol-perks/v1/pages',
      body: data,
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
