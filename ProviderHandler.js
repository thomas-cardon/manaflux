class ProviderHandler {
  constructor() {
    this.providers = [new (require('./providers/ChampionGG.js'))()/*, new (require('./providers/Tidecall.js'))()*/];
  }

  async getChampionRunePages(champion, position) {
    for (let provider of this.providers) {
      try {
        let runes = await provider.getRunes(champion, position);
        return runes;
      }
      catch(err) {
        console.error(err);
      }
    }
  }
}

module.exports = ProviderHandler;
