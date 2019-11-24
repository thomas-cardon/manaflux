const rp = require('request-promise-native');

function Gameflow() {};

Gameflow.emulate = function(toggle) {
  if (toggle) {
    this._update = this.update;
    this.update = () => {
      this._data = {"gameClient":{"observerServerIp":"","observerServerPort":0,"running":false,"serverIp":"","serverPort":0,"visible":false},"gameData":{"gameId":0,"gameName":"","isCustomGame":true,"password":"","playerChampionSelections":[],"queue":{"allowablePremadeSizes":[],"areFreeChampionsAllowed":true,"assetMutator":"","category":"Custom","championsRequiredToPlay":0,"description":"","detailedDescription":"","gameMode":"CLASSIC","gameTypeConfig":{"advancedLearningQuests":false,"allowTrades":false,"banMode":"SkipBanStrategy","banTimerDuration":0,"battleBoost":false,"crossTeamChampionPool":false,"deathMatch":false,"doNotRemove":false,"duplicatePick":false,"exclusivePick":false,"id":1,"learningQuests":false,"mainPickTimerDuration":93,"maxAllowableBans":0,"name":"GAME_CFG_PICK_BLIND","onboardCoopBeginner":false,"pickMode":"SimulPickStrategy","postPickTimerDuration":13,"reroll":false,"teamChampionPool":false},"id":-1,"isRanked":false,"isTeamBuilderManaged":false,"isTeamOnly":false,"lastToggledOffTime":0,"lastToggledOnTime":0,"mapId":11,"maxLevel":0,"maxSummonerLevelForFirstWinOfTheDay":0,"maximumParticipantListSize":1,"minLevel":0,"minimumParticipantListSize":0,"name":"","numPlayersPerTeam":1,"queueAvailability":"Available","queueRewards":{"isChampionPointsEnabled":false,"isIpEnabled":false,"isXpEnabled":false,"partySizeIpRewards":[]},"removalFromGameAllowed":false,"removalFromGameDelayMinutes":0,"shortName":"","showPositionSelector":false,"spectatorEnabled":false,"type":"PRACTICE_GAME"},"spectatorsAllowed":false,"teamOne":[],"teamTwo":[]},"gameDodge":{"dodgeIds":[],"phase":"None","state":"Invalid"},"map":{"assets":{"champ-select-background-sound":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Shared/sound/music-cs-blindpick-default.ogg","champ-select-flyout-background":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/champ-select-flyout-background.jpg","champ-select-planning-intro":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/champ-select-planning-intro.jpg","game-select-icon-active":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/game-select-icon-active.png","game-select-icon-active-video":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/video/game-select-icon-active.webm","game-select-icon-default":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/game-select-icon-default.png","game-select-icon-disabled":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/game-select-icon-disabled.png","game-select-icon-hover":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/game-select-icon-hover.png","game-select-icon-intro-video":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/video/game-select-icon-intro.webm","gameflow-background":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/gameflow-background.jpg","gameselect-button-hover-sound":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Shared/sound/sfx-gameselect-button-hover.ogg","icon-defeat":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/icon-defeat.png","icon-defeat-video":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/video/icon-defeat.webm","icon-empty":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/icon-empty.png","icon-hover":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/icon-hover.png","icon-leaver":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/icon-leaver.png","icon-victory":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/icon-victory.png","icon-victory-video":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/video/icon-victory.webm","map-north":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/map-north.png","map-south":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/map-south.png","music-inqueue-loop-sound":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/sound/music-inqueue-loop-summonersrift.ogg","parties-background":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/parties-background.jpg","postgame-ambience-loop-sound":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/sound/sfx-ambience-loop-summonersrift.ogg","ready-check-background":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/ready-check-background.png","ready-check-background-sound":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/sound/sfx-readycheck-sr-portal.ogg","sfx-ambience-pregame-loop-sound":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/sound/sfx-ambience-loop-summonersrift.ogg","social-icon-leaver":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/social-icon-leaver.png","social-icon-victory":"lol-game-data/assets/content/src/LeagueClient/GameModeAssets/Classic_SRU/img/social-icon-victory.png"},"categorizedContentBundles":{},"description":"The newest and most venerated battleground is known as Summoner's Rift. Traverse down one of three different paths in order to attack your enemy at their weakest point. Work with your allies to siege the enemy base and destroy their Nexus!","gameMode":"CLASSIC","gameModeName":"Summoner's Rift","gameModeShortName":"Summoner's Rift","gameMutator":"","id":11,"isRGM":false,"mapStringId":"SR","name":"Summoner's Rift","platformId":"","platformName":"","properties":{"suppressRunesMasteriesPerks":false}},"phase":"ChampSelect"};
    }
  }
  else this.update = this._update;
}

Gameflow.update = async function() {
  this._data = await rp({
    method: 'GET',
    uri: Mana.base + 'lol-gameflow/v1/session',
    json: true
  });
}

Gameflow.destroy = function() {
  this._data = null;
}

Gameflow.isUpdated = function() {
  return typeof this._data !== null;
}

Gameflow.getPhase = function() {
  return this._data.phase;
}

Gameflow.getGameMode = function() {
  return this._data.gameData.queue.gameMode;
}

Gameflow.getMap = function() {
  return this._data.map;
}

Gameflow.isRanked = function() {
  return this._data.gameData.queue.isRanked;
}

Gameflow.shouldEnableLockFeature = function() {
  return this._data.gameData.queue.pickMode !== 'AllRandomPickStrategy' && !this._data.gameData.queue.gameTypeConfig.allowTrades && !this._data.gameData.queue.gameTypeConfig.allowTrades && !this._data.gameData.queue.gameTypeConfig.reroll && !this._data.gameData.queue.gameTypeConfig.teamChampionPool;
}

module.exports = Gameflow;
