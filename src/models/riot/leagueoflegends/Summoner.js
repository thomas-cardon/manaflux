class Summoner {
  constructor(data) {
    if (data) this._load(data);
  }

  getAccountId() {
    return this._accountId;
  }

  getDisplayName() {
    return this._displayName;
  }

  getInternalName() {
    return this._internalName;
  }

  getLastSeasonHighestRank() {
    return this._lastSeasonHighestRank;
  }

  getPercentCompleteForNextLevel() {
    return this._percentCompleteForNextLevel;
  }

  getProfileIconId() {
    return this._profileIconId;
  }

  getPlayerUUID() {
    return this._puuid;
  }

  getSummonerId() {
    return this._summonerId;
  }

  getSummonerLevel() {
    return this._summonerLevel;
  }

  getXPSinceLastLevel() {
    return this._xpSinceLastLevel;
  }

  getXPUntilNextLevel() {
    return this._xpUntilNextLevel;
  }

  _load(data) {
    this._accountId = data.accountId;
    this._displayName = data.displayName;
    this._internalName = data.internalName;
    this._lastSeasonHighestRank = data.lastSeasonHighestRank;
    this._percentCompleteForNextLevel = data.percentCompleteForNextLevel;
    this._profileIconId = data.profileIconId;
    this._puuid = data.puuid;
    this._rerollPoints = data.rerollPoints;
    this._summonerId = data.summonerId;
    this._summonerLevel = data.summonerLevel;
    this._xpSinceLastLevel = data.xpSinceLastLevel;
    this._xpUntilNextLevel = data.xpUntilNextLevel;
  }
}

module.exports = Summoner;
