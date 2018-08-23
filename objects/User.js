const rp = require('request-promise-native');
const Summoner = require('./riot/leagueoflegends/Summoner');
const PerksInventory = require('./riot/leagueoflegends/inventories/Perks');

class User extends Summoner {
  constructor(d) {
    super(d);
    this._perksInventory = new PerksInventory(this);
  }

  async getGameMode() {
    return (await this.getChatMe()).lol.gameMode;
  }

  async getChatMe() {
    return JSON.parse(await rp(Mana.base + 'lol-chat/v1/me'));
  }

  getPerksInventory() {
    return this._perksInventory;
  }

  async updateSummonerSpells(spells) {
    if (!spells || spells.length !== 2) throw Error(i18n.__('summoner-spells-empty-error'));
    spells = this.sortSummonerSpells(spells);

    return await rp({
      method: 'PATCH',
      uri: Mana.base + 'lol-champ-select/v1/session/my-selection',
      body: log.dir(3, { spell1Id: spells[0], spell2Id: spells[1] }),
      json: true
    });
  }

  sortSummonerSpells(spells) {
    return spells.sort((a, b) => a === 4 || a === 6 ? (Mana.store.get('summoner-spells-priority') === "f" ? 1 : -1) : -1);
  }
}

module.exports = User;
