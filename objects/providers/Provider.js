class Provider {
  constructor(id, name) {
    this.id = id;
    this.name = name;
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
}

module.exports = Provider;
