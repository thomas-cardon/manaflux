class ClassicGameMode {
  constructor(ChampionSelectHandler, ProviderHandler, gameMode = 'CLASSIC') {
    this._championSelectHandler = ChampionSelectHandler;
    this._providerHandler = ProviderHandler;
    this.gameMode = gameMode;
  }

  onFirstTickEvent(data) {
    console.dir(3, data);
  }

  onTickEvent(data, gameMode) {
    this._timer = data.timer;
    this._myTeam = data.myTeam;
    this._theirTeam = data.theirTeam;
  }

  getGameMode() {
    return this.gameMode;
  }

  getPlayer() {
    return this._myTeam.find(x => x.summonerId === Mana.user.getSummonerId());
  }

  getPosition() {
    switch(this.getPlayer().assignedPosition) {
      case 'UTILITY':
        return 'SUPPORT';
      case 'BOTTOM':
        return 'ADC';
      case '':
        return null;
      default:
        return this.getPlayer().assignedPosition;
    }
  }

  getProviders() {
    return null;
  }
}

module.exports = ClassicGameMode;
