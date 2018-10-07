class ClassicGameMode {
  constructor(ChampionSelectHandler, ProviderHandler) {
    this._championSelectHandler = ChampionSelectHandler;
    this._providerHandler = ProviderHandler;
  }

  async load() {

  }

  async end() {

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

  onFirstTickEvent(data) {
    console.dir(3, data);
  }

  onTickEvent(data, gameMode) {
    this._timer = data.timer;
    this._myTeam = data.myTeam;
    this._theirTeam = data.theirTeam;
  }

  onChampionChangeEvent(champion) {
  }
}

module.exports = ClassicGameMode;
