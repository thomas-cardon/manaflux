class PerksInventory {
  constructor(summoner) {
    this._summoner = summoner;
  }

  async getCount() {
    return JSON.parse(await rp(Mana.base + 'lol-perks/v1/inventory')).ownedPageCount;
  }

  async setCurrentPage(id) {
    return await rp({
      method: 'PUT',
      uri: Mana.base + 'lol-perks/v1/currentpage',
      body: { id },
      json: true
    });
  }

  async updatePerksPages(pages) {
    if (this.getSummonerLevel() < 8) return UI.error('runes-safeguard-level-error');
    log.log(2, `[PerksInventory] ${i18n.__('loading')}`);

    this._perks = this._perks || await this.getPerks();
    this._pageCount = this._pageCount || await this.getCount();

    if (!pages || pages.length === 0 || pages.find(x => x.selectedPerkIds.length === 0) !== undefined) return UI.error('runes-empty-error');

    let count = this._pageCount > Mana.store.get('runes-max', 2) ? Mana.store.get('runes-max', 2) : this._pageCount;
    count = count > pages.length ? pages.length : count;

    pages = pages.slice(0, count);

    for (let i = 0; i < count; i++) {
      if (!this._perks[i]) await this._perks.push(this.createPerkPage(Object.assign(pages[i], { current: count < 1 })));
      else if (this._perks[i].selectedPerkIds === pages[i].selectedPerkIds && this._perks[i].name === pages[i].name) continue;

      await this.updatePerkPage(this._perks[i].id, Object.assign(this._perks[i], pages[i], { current: count < 1, id: this._perks[i].id }));
    }
  }

  async getPerks() {
    return JSON.parse(await rp(Mana.base + 'lol-perks/v1/pages')).filter(page => page.isEditable);
  }

  async updatePerkPage(id, page) {
    return await rp({
      method: 'PUT',
      uri: Mana.base + `lol-perks/v1/pages/${id}`,
      body: page,
      json: true
    });
  }

  async createPerkPage(x) {
    return await rp({
      method: 'POST',
      uri: Mana.base + 'lol-perks/v1/pages',
      body: x,
      json: true
    });
  }

  async deletePerkPage(id) {
    return await rp.del(Mana.base + 'lol-perks/v1/pages/' + id);
  }

  async deletePerkPages() {
    await rp.del(Mana.base + 'lol-perks/v1/pages');
    this._perks = [];
  }
}

module.exports = PerksInventory;
