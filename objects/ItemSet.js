const fs = require('fs'), path = require('path');

class ItemSet {
  constructor(key, file = `MFLUX_${key.toLowerCase()}_${Mana.gameVersion}_${Mana.version}.json`) {
    this.championKey = key.toLowerCase();

    this.file = file;
    this.path = path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions\\${this.championKey}\\Recommended\\${this.file}`);

    this._data = {
      title: 'Unknown ManaFlux ItemSet',
      type: 'custom',
      map: 'any',
      mode: 'any',
      blocks: []
    };
  }

  setTitle(title) {
    this._data.title = title;
    return this;
  }

  setMap(map) {
    this._data.map = map;
    return this;
  }

  setGameMode(mode) {
    this._data.mode = mode;
    return this;
  }

  addBlock(block) {
    this._data.blocks.push(block.build());
    return this;
  }

  build() {
    return this._data;
  }

  save() {
    let p = this.path;
    return new Promise((resolve, reject) => {
      fs.writeFile(p, JSON.stringify(this.build()), 'utf8', err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  exists() {
    let p = this.path;
    return new Promise((resolve, reject) => {
      fs.access(p, fs.constants.F_OK | fs.constants.W_OK, err => {
        if (err && err.code === 'ENOENT') resolve(false);
        else if (err) reject(err);
        else resolve(true);
      });
    });
  }

  remove() {
    let p = this.path;
    return new Promise((resolve, reject) => {
      fs.unlink(p, err => {
        if (err && err.code === 'ENOENT') resolve(false);
        else if (err) reject(err);
        else resolve(true);
      });
    });
  }
}

class Block {
  constructor() {
    this._data = { type: "Unknown ManaFlux Block", items: [] };
  }

  enableTutorialMode() {
    this._data.recMath = true;
    return this;
  }

  setName(name) {
    this._data.type = name;
    return this;
  }

  setItems(array) {
    this._data.items = array;
    return this;
  }

  addItem(id, count = 1) {
    this._data.items.push({ id: `${id}`, count });
    return this;
  }

  build() {
    return this._data;
  }
}

module.exports = { ItemSet, Block };
