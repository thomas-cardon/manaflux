class ClassicGameMode {
  constructor(ChampionSelectHandler, ProviderHandler, gameMode = 'CLASSIC') {
    this._championSelectHandler = ChampionSelectHandler;
    this._providerHandler = ProviderHandler;
    this.gameMode = gameMode;
  }

  getGameMode() {
    return this.gameMode;
  }

  getPosition(pos) {
    switch(pos) {
      case 'UTILITY':
        return 'SUPPORT';
      case 'BOTTOM':
        return 'ADC';
      case '':
        return null;
      default:
        return pos;
    }
  }

  getProviders() {
    return null;
  }
}

module.exports = ClassicGameMode;
