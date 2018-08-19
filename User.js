const rp = require('request-promise-native');

class User {
  load(data) {
    this.summoner = data;
  }

  async getGameMode() {
    return (await this.getChatMe()).lol.gameMode;
  }

  async getChatMe() {
    return JSON.parse(await rp(Mana.base + 'lol-chat/v1/me'));
  }

  async updateSummonerSpells(spells) {
    if (!spells || spells.length !== 2) throw Error(i18n.__('summoner-spells-empty-error'));
    return await rp({
      method: 'PATCH',
      uri: Mana.base + 'lol-champ-select/v1/session/my-selection',
      body: { spell1Id: spells[0], spell2Id: spells[1] },
      json: true
    });
  }

  async setCurrentPage(id) {
    return await rp({
      method: 'PUT',
      uri: Mana.base + 'lol-perks/v1/currentpage',
      body: { id },
      json: true
    });
  }

  async getPageCount() {
    return JSON.parse(await rp(Mana.base + 'lol-perks/v1/inventory')).ownedPageCount;
  }

  async updateRunePages(pages) {
    if (Mana.user.summoner.summonerLevel < 8) throw Error(i18n.__('runes-safeguard-level-error'));
    console.log(`[Runes] ${i18n.__('loading')}`);

    this.runes = this.runes || await this.getRunes();
    if (!pages || pages.length === 0 || pages.find(x => x.selectedPerkIds.length === 0) !== undefined) throw Error(i18n.__('runes-empty-error'));

    let count = this._pageCount > Mana.store.get('maxRunes', 2) ? Mana.store.get('maxRunes', 2) : this._pageCount;
    count = count > pages.length ? pages.length : count;

    pages = pages.slice(0, count);

    for (let i = 0; i < count; i++) {
      if (!this.runes[i]) continue;
      if (this.runes[i].selectedPerkIds === pages[i].selectedPerkIds && this.runes[i].name === pages[i].name) continue;
      await this.updateRunePage(this.runes[i].id, Object.assign(this.runes[i], pages[i], { current: count < 1, id: this.runes[i].id }));
    }
  }

  async getRunes() {
    return JSON.parse(await rp(Mana.base + 'lol-perks/v1/pages')).filter(page => page.isEditable);
  }

  async updateRunePage(id, page) {
    return await rp({
      method: 'PUT',
      uri: Mana.base + `lol-perks/v1/pages/${id}`,
      body: page,
      json: true
    });
  }

  async createRunePage(data, x) {
    return await rp({
      method: 'POST',
      uri: Mana.base + 'lol-perks/v1/pages',
      body: x ? Object.assign(data, x) : data,
      json: true
    });
  }

  async deleteRunePage(id) {
    return await rp.del(Mana.base + 'lol-perks/v1/pages/' + id);
  }

  async deleteRunePages() {
    await rp.del(Mana.base + 'lol-perks/v1/pages');
    this.runes = [];
  }
}

module.exports = User;
