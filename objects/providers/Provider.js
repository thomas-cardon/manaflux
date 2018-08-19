class Provider {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  async getData(champion, preferredPosition, gameMode) {
    throw Error(`[ProviderHandler] ${this.name} ${i18n.__('providers-skipped')}: #getData`);
  }

  async getSummonerSpells(champion, position, gameMode) {
    throw Error(`[ProviderHandler] ${this.name} ${i18n.__('providers-skipped')}: #getSummonerSpells`);
  }

  async getItemSets(champion, position, gameMode) {
    throw Error(`[ProviderHandler] ${this.name} ${i18n.__('providers-skipped')}: #getItemSets`);
  }

  async getRunes(champion, position, gameMode) {
    throw Error(`[ProviderHandler] ${this.name} ${i18n.__('providers-skipped')}: #getRunes`);
  }
}

module.exports = Provider;
