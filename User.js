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

  async updateSummonerSpells(spells) {
    if (!spells || spells.length !== 2) return UI.error('Tried to update summoner spells but data given was empty.');
    return await rp({
      method: 'PATCH',
      uri: this.base + 'lol-champ-select/v1/session/my-selection',
      body: { spell1Id: spells[0], spell2Id: spells[1] },
      json: true
    });
  }

  async setCurrentPage(id) {
    return await rp({
      method: 'PUT',
      uri: this.base + 'lol-perks/v1/currentpage',
      body: { id },
      json: true
    });
  }

  async getPageCount() {
    return JSON.parse(await rp(this.base + 'lol-perks/v1/inventory')).ownedPageCount;
  }

  async updateRunePages(pages) {
    if (!pages || pages.length === 0 || pages.find(x => x.selectedPerkIds.length === 0) === undefined) return UI.error(`Can't update runes: empty`);
    let count = await this.getPageCount();

    count = count > Mana.store.get('maxRunes', 2) ? Mana.store.get('maxRunes', 2) : count;
    count = count > pages.length ? pages.length : count;

    pages = pages.slice(0, count);

    await this.deleteRunePages();

    for (let i = 0; i < count; i++)
      await this.runes.push(this.createRunePage(pages[i], { current: count < 1 }));
  }

  async getRunes() {
    return JSON.parse(await rp(this.base + 'lol-perks/v1/pages')).filter(page => page.isEditable);
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
    await rp.del(this.base + 'lol-perks/v1/pages');
    this.runes = [];
  }
}

module.exports = User;
