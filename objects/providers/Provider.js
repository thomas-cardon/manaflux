class Provider {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  async getData(champion, preferredPosition, gameMode) {
    console.log(`[ProviderHandler] ${this.name} ${i18n.__('providerhandler-skipped')}: #getData`);
  }

  async getSummonerSpells(champion, position, gameMode) {
    console.log(`[ProviderHandler] ${this.name} ${i18n.__('providerhandler-skipped')}: #getSummonerSpells`);
  }

  async getItemSets(champion, position, gameMode) {
    console.log(`[ProviderHandler] ${this.name} ${i18n.__('providerhandler-skipped')}: #getItemSets`);
  }

  async getRunes(champion, position, gameMode) {
    console.log(`[ProviderHandler] ${this.name} ${i18n.__('providerhandler-skipped')}: #getRunes`);
  }

  convertSkillOrderToLanguage(letter) {
    if (i18n._locale === 'fr') {
      switch(letter) {
        case 'Q':
        return 'A';
        case 'W':
        return 'Z';
        default:
        return letter;
      }
    }

    return letter;
  }
}

module.exports = Provider;
