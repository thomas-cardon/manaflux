class Provider {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  async getData(champion, preferredPosition, gameMode) {
    throw UI.error('providers-skipped', this.name, 'getData');
  }

  async getSummonerSpells(champion, position, gameMode) {
    const x = await this.getData(champion, position, gameMode);
    return x[position] && x[position].summonerspells ? x[position].summonerspells : {};
  }

  async getItemSets(champion, position, gameMode) {
    const x = await this.getData(champion, position, gameMode);
    return x[position] && x[position].itemsets ? x[position].itemsets : {};
  }

  async getPerks(champion, position, gameMode) {
    const x = await this.getData(champion, position, gameMode);
    return x[position] && x[position].perks ? x[position].perks : {};
  }

  getCondensedName() {
    return this.slice(0, 3).toUpperCase();
  }
}

module.exports = Provider;
