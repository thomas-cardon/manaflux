const rp = require('request-promise-native');

class User {
  constructor(base) {
    this.base = base;
  }

  async load() {
    this.runes = await this.getRunes();

    const summoner = await rp(this.base + 'lol-summoner/v1/current-summoner');
    this.summoner = JSON.parse(summoner);

    Mana.gameVersion = await this.getVersion();
  }

  async getGameMode() {
    return (await this.getChatMe()).lol.gameMode;
  }

  async getVersion(full) {
    return JSON.parse(await rp(this.base + 'system/v1/builds'))[full ? 'version' : 'gameBranch'];
  }

  async getChatMe() {
    return JSON.parse(await rp(this.base + 'lol-chat/v1/me'));
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
    if (!runepages || runepages.length === 0) return console.log('Tried to update summoner spells but data given was empty.');
    let count = await this.getPageCount();

    await this.deleteRunePages();
    this.runes = [];

    for (let i = 0; i < runepages.length; i++)
      if (count > i) await this.runes.push(this.createRunePage(runepages[i], { current: count < 1 }));
  }

  async updateSummonerSpells(spells) {
    if (!spells || spells.length === 0) return console.log('Tried to update summoner spells but data given was empty.');

    let body = {};
    if (spells.length > 1) body.spell2Id = spells[1];
    if (spells.length > 0) body.spell1Id = spells[0];
    return await rp({
      method: 'PATCH',
      uri: this.base + 'lol-champ-select/v1/session/my-selection',
      body,
      json: true
    })
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
