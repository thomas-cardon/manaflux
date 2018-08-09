const fs = require('fs'), path = require('path');

class ItemSet {
  constructor(key, file) {
    this.championKey = key.toLowerCase();

    this.file = (file && file.startsWith('MFLUX_')) ? file : `MFLUX_${this.championKey}${file ? '_' + file + '_' : '_'}${Mana.gameVersion}_${Mana.version}.json`;
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
    this._data.blocks.push(block);
    return this;
  }

  swapBlock(x, y) {
    let b = this._data.blocks[x];
    this._data.blocks[x] = this._data.blocks[y];
    this._data.blocks[y] = b;
    return this;
  }

  save() {
    const p = this.path, data = JSON.stringify(this._data);

    /*
    * Creates the required folders if needed
    */
    require('./handlers/ItemSetHandler')._ensureDir(path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions\\${this.championKey}`));
    require('./handlers/ItemSetHandler')._ensureDir(path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions\\${this.championKey}\\Recommended`));

    console.dir(data);

    return new Promise((resolve, reject) => {
      fs.writeFile(p, data, 'utf8', err => {
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

  delete() {
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
    this.type = "Unknown ManaFlux Block";
    this.items = [];
  }

  enableTutorialMode() {
    this.recMath = true;
    return this;
  }

  setName(name) {
    this.type = name;
    return this;
  }

  setItems(array) {
    this.items = array;
    return this;
  }

  addItem(id, count = 1) {
    this.items.push({ id: `${id}`, count });
    return this;
  }
}

module.exports = { ItemSet, Block };
