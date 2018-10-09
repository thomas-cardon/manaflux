class Provider {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  async getData(champion, preferredPosition, gameMode) {
    throw Error(`[ProviderHandler] ${this.name} ${i18n.__('providers-skipped')}: #getData`);
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

}

module.exports = Provider;
