const rp = require('request-promise-native');
class CustomGame {
  constructor() {
    this._data = {
      "customGameLobby": {
        "configuration": {
          "gameMode": "CLASSIC",
          "gameMutator": "",
          "gameServerRegion": "euw",
          "gameTypeConfig": {
            "advancedLearningQuests": false,
            "allowTrades": false,
            "banMode": "SkipBanStrategy",
            "banTimerDuration": 0,
            "battleBoost": false,
            "crossTeamChampionPool": false,
            "deathMatch": false,
            "doNotRemove": false,
            "duplicatePick": false,
            "exclusivePick": false,
            "gameModeOverride": null,
            "id": 1,
            "learningQuests": false,
            "mainPickTimerDuration": 93,
            "maxAllowableBans": 0,
            "name": "GAME_CFG_PICK_BLIND",
            "numPlayersPerTeamOverride": null,
            "onboardCoopBeginner": false,
            "pickMode": "SimulPickStrategy",
            "postPickTimerDuration": 13,
            "reroll": false,
            "teamChampionPool": false
          },
          "mapId": 11,
          "maxPlayerCount": 1,
          "mutators": {
            "advancedLearningQuests": false,
            "allowTrades": false,
            "banMode": "SkipBanStrategy",
            "banTimerDuration": 0,
            "battleBoost": false,
            "crossTeamChampionPool": false,
            "deathMatch": false,
            "doNotRemove": false,
            "duplicatePick": false,
            "exclusivePick": false,
            "gameModeOverride": null,
            "id": 1,
            "learningQuests": false,
            "mainPickTimerDuration": 93,
            "maxAllowableBans": 0,
            "name": "GAME_CFG_PICK_BLIND",
            "numPlayersPerTeamOverride": null,
            "onboardCoopBeginner": false,
            "pickMode": "SimulPickStrategy",
            "postPickTimerDuration": 13,
            "reroll": false,
            "teamChampionPool": false
          },
          "spectatorPolicy": "NotAllowed",
          "teamSize": 1,
          "tournamentGameMode": "string",
          "tournamentPassbackDataPacket": "string",
          "tournamentPassbackUrl": "string"
        },
        "gameId": 0,
        "lobbyName": "ManaFlux Test Custom " + Mana.user.summoner.summonerId,
        "lobbyPassword": "",
        "practiceGameRewardsDisabledReasons": [
          "string"
        ],
        "spectators": [
          {
            "autoFillEligible": true,
            "autoFillProtectedForPromos": true,
            "autoFillProtectedForSoloing": true,
            "autoFillProtectedForStreaking": true,
            "botChampionId": 0,
            "botDifficulty": "NONE",
            "canInviteOthers": true,
            "excludedPositionPreference": "string",
            "id": 0,
            "isBot": true,
            "isOwner": true,
            "isSpectator": true,
            "positionPreferences": {
              "firstPreference": "string",
              "secondPreference": "string"
            },
            "showPositionExcluder": true,
            "summonerInternalName": "string"
          }
        ],
        "teamOne": [
          {
            "autoFillEligible": true,
            "autoFillProtectedForPromos": true,
            "autoFillProtectedForSoloing": true,
            "autoFillProtectedForStreaking": true,
            "botChampionId": 0,
            "botDifficulty": "NONE",
            "canInviteOthers": true,
            "excludedPositionPreference": "string",
            "id": 0,
            "isBot": true,
            "isOwner": true,
            "isSpectator": true,
            "positionPreferences": {
              "firstPreference": "string",
              "secondPreference": "string"
            },
            "showPositionExcluder": true,
            "summonerInternalName": "string"
          }
        ],
        "teamTwo": [
          {
            "autoFillEligible": true,
            "autoFillProtectedForPromos": true,
            "autoFillProtectedForSoloing": true,
            "autoFillProtectedForStreaking": true,
            "botChampionId": 0,
            "botDifficulty": "NONE",
            "canInviteOthers": true,
            "excludedPositionPreference": "string",
            "id": 0,
            "isBot": true,
            "isOwner": true,
            "isSpectator": true,
            "positionPreferences": {
              "firstPreference": "string",
              "secondPreference": "string"
            },
            "showPositionExcluder": true,
            "summonerInternalName": "string"
          }
        ]
      },
      "gameCustomization": {},
      "isCustom": true,
      "queueId": 0
    };
  }

  setTitle(title) {
    this._data.lobbyName = title;
    return this;
  }

  setPassword(password) {
    this._data.lobbyPassword = password;
  }

  async create() {
    await rp({
      method: 'POST',
      uri: Mana.base + 'lol-lobby/v2/lobby',
      body: this._data,
      json: true
    });

    return this;
  }

  async start() {
    return await rp({
      method: 'POST',
      uri: Mana.base + 'lol-lobby/v1/lobby/custom/start-champ-select'
    });
  }
}

module.exports = CustomGame;
