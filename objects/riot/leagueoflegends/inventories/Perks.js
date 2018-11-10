const rp = require('request-promise-native');
class PerksInventory {
  async getCount() {
    if (!this._pageCount) this._pageCount = JSON.parse(await rp(Mana.base + 'lol-perks/v1/inventory')).ownedPageCount;
    return this._pageCount;
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
    if (Mana.user.getSummonerLevel() < 8) throw UI.error('perks-error-safeguard-level');
    console.log(2, `[Perks] Loading`);

    let perks = this.getPerks(), count = await this.getCount();

    if (!pages || pages.length === 0 || pages.find(x => x.selectedPerkIds.length === 0) !== undefined) throw Error('Runes are empty');

    count = count > Mana.getStore().get('perks-max', 2) ? Mana.getStore().get('perks-max', 2) : count;
    count = count > pages.length ? pages.length : count;
    pages = pages.slice(0, count);

    for (let i = 0; i < count; i++) {
      if (perks[i] && Mana.getStore().get('fixes-perks-editor'))
        await this.deletePerkPage(perks[i], i);

      if (!perks[i]) perks[i] = await this.createPerkPage(Object.assign(pages[i], { current: count === 0 }));
      else if (perks[i].selectedPerkIds !== pages[i].selectedPerkIds) await this.updatePerkPage(Object.assign(perks[i], pages[i], { current: count === 0 }));
    }
  }

  getPerks() {
    return this._perks;
  }

  async queryPerks() {
    this._perks = JSON.parse(await rp(Mana.base + 'lol-perks/v1/pages')).filter(page => page.isEditable)
  }

  async updatePerkPage(x) {
    return await rp({
      method: 'PUT',
      uri: Mana.base + `lol-perks/v1/pages/${x.id}`,
      body: x,
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

  async deletePerkPage(page, index = this._perks.indexOf(page)) {
    try {
      await rp.del(Mana.base + 'lol-perks/v1/pages/' + page.id);
      this._perks[index] = null;
    }
    catch(err) {
      if (err.statuscode === 404) {
        await this.queryPerks();
      }
      else throw err;
    }
  }

  async deletePerkPages() {
    await rp.del(Mana.base + 'lol-perks/v1/pages');
    this._perks = [];
  }
}

module.exports = PerksInventory;
