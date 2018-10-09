const ClassicGameMode = require('./CLASSIC');
class ARAMGameMode extends ClassicGameMode {
  constructor(ChampionSelectHandler, ProviderHandler) {
    super(ChampionSelectHandler, ProviderHandler);
  }

  getPosition() {
    return null;
  }
}

module.exports = ARAMGameMode;
