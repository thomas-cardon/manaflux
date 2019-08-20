const rp = require('request-promise-native');
class PerksInventory {

  async queryCount() {
    return this._pageCount = JSON.parse(await rp(Mana.base + 'lol-perks/v1/inventory')).ownedPageCount;
  }

  getCount() {
    return this._pageCount;
  }

  async setCurrentPage(id) {
    await rp({
      method: 'PUT',
      uri: Mana.base + 'lol-perks/v1/currentpage',
      body: id,
      json: true
    });

    this._perks.filter(x => x.id != id).forEach(x => x.current = false);
    this._perks.find(p => p.id == id).current = true;
  }

  async updatePerksPages(pages) {
    if (Mana.user.getSummonerLevel() < 8) throw UI.error('perks-error-safeguard-level');
    console.log(2, `[Perks] Loading`);

    let perks = await Mana.user.getPerksInventory().queryPerks() || this.getPerks(), count = this.getCount();

    if (!pages || pages.length === 0 || pages.find(x => x.selectedPerkIds.length === 0) !== undefined) throw Error('Runes are empty');

    count = count > Mana.getStore().get('perks-max', 2) ? Mana.getStore().get('perks-max', 2) : count;
    count = count > pages.length ? pages.length : count;
    pages = pages.slice(0, count);

    for (let i = 0; i < count; i++) {
      if (perks[i] && Mana.getStore().get('fixes-perks-editor'))
        await this.deletePerkPage(perks[i], i);

      if (Mana.getStore().get('fixes-perks-editor')) perks[i] = await this.createPerkPage(Object.assign(pages[i], { current: count === 0 }));
      else if (perks[i].selectedPerkIds !== pages[i].selectedPerkIds) perks[i] = await this.updatePerkPage(Object.assign(perks[i], pages[i], { current: count === 0 }));
    }
  }

  getPerks() {
    return this._perks;
  }

  async queryPerks() {
    return this._perks = JSON.parse(await rp(Mana.base + 'lol-perks/v1/pages')).filter(page => page.isEditable)
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

  async deletePerkPage(page, index) {
    if (typeof page !== 'object')
      page = this._perks.find(p => p.id == page);

    try {
      await rp.del(Mana.base + 'lol-perks/v1/pages/' + page.id);
      this._perks[index || this._perks.indexOf(page)] = null;
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
