class Provider {
  constructor(id, name, emitter) {
    this.id = id;
    this.name = name;
    this._emitter = emitter;
  }

  request(gameMode, champion, position) {
    console.log(2, `${this.name} >> Requesting ${champion.name} - POS/${position} - GM/${gameMode}`);
    throw UI.error('providers-skipped', this.name, 'request');
  }

  // WIP
  _ensureSkillOrderCharacters(x) {
    return x;
  }

  getCondensedName() {
    return this.id.slice(0, 3).toUpperCase();
  }

  sendPerkPages(data, champion, role) {
    if (!Array.isArray(data)) return console.error('Provider Validation - PerkPages >> Expected PerkPage[], received:', x);

    this._emitter.emit('data', this, 'perks', this._dataValidator.checkPerkPages(data, champion, role, this), role);
  }

  sendItemSets(data, champion, role) {
    console.dir(3, data);

    if (!Array.isArray(data)) return console.error('Provider Validation - ItemSets >> Expected ItemSet[], received:', x);

    console.dir(3, data);
    this._emitter.emit('data', this, 'itemsets', this._dataValidator.checkItemSets(data, champion, role, this), role);
  }

  sendSummonerSpells(data, champion, role) {
    if (!Array.isArray(data)) return console.error('Provider Validation - SummonerSpells >> Expected array, received:', x);
    this._emitter.emit('data', this, 'summonerspells', this._dataValidator.validateSummonerSpells(data), role);
  }

  end(role) {
    this._emitter.emit('provider-ended', this, role);
  }
}

module.exports = Provider;
