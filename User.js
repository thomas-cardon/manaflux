const rp = require('request-promise-native');

class User {
  load() {
    const self = this;
    return new Promise((resolve, reject) => self._waitForConnection(d => resolve(self.summoner = d), reject));
  }
  async _waitForConnection(cb, reject) {
    try {
      const res = await rp(Mana.base + 'lol-summoner/v1/current-summoner');
      cb(JSON.parse(res));
    }
    catch(err) {
      if (err.statusCode === 404) {
        setTimeout(() => this._waitForConnection(cb, reject), 1000);
      }
      reject(err);
    }
  }

  async getGameMode() {
    return (await this.getChatMe()).lol.gameMode;
  }

  async getChatMe() {
    return JSON.parse(await rp(Mana.base + 'lol-chat/v1/me'));
  }

  async updateSummonerSpells(spells) {
    if (!spells || spells.length !== 2) return UI.error('Can\'t update summoner spells: empty');
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
    console.log('Updating rune pages');

    this.runes = this.runes || await this.getRunes();
    if (!pages || pages.length === 0 || pages.find(x => x.selectedPerkIds.length === 0) !== undefined) return UI.error('Can\'t update runes: empty');

    let count = this._pageCount > Mana.store.get('maxRunes', 2) ? Mana.store.get('maxRunes', 2) : this._pageCount;
    count = count > pages.length ? pages.length : count;

    pages = pages.slice(0, count);
    if ((this.runes.length - count) <= 0) await this.deleteRunePages();

    for (let i = 0; i < count; i++)
        await this.runes.push(this.createRunePage(pages[i], { current: count < 1 }));
  }

  async getRunes() {
    return JSON.parse(await rp(Mana.base + 'lol-perks/v1/pages')).filter(page => page.isEditable);
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
