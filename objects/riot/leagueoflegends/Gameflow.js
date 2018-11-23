const rp = require('request-promise-native');

function Gameflow() {};

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
