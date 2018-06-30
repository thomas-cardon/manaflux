const fs = require('fs'), path = require('path');

class ItemSet {
  constructor(key) {
    this.championKey = key.toLowerCase();

    this.file = `${this.championKey}.ManaFlux.${Mana.version}.json`;
    this.path = path.join(Mana.store.get('leaguePath'), `\\Config\\Champions\\${this.championKey}\\Recommended\\${this.file}`);

    this._set = {
      title: 'Unknown ManaFlux ItemSet',
      type: 'custom',
      map: 'any',
      mode: 'any',
      blocks: []
    };
  }

  setTitle(title) {
    this._set.title = title;
    return this;
  }

  setMap(map) {
    this._set.map = map;
    return this;
  }

  setGameMode(mode) {
    this._set.mode = mode;
    return this;
  }

  setTitle(title) {
    this._set.title = title;
    return this;
  }

  addBlock(block) {
    this._set.blocks.push(block);
    return this;
  }

  setBlocks(blocks) {
    this._set.blocks = blocks;
    return this;
  }

  build() {
    return this._set;
  }

  save() {
    return new Promise(function(resolve, reject) {
      fs.writeFile(path.resolve(this.path), this.build(), 'utf8', function() {
        if (err) return reject(err);
        resolve();
      });
    })
  }
}

class Block {
  constructor() {
    this._set = { type: "Unknown ManaFlux Block", items: [] };
  }

  enableTutorialMode() {
    this._set.recMath = true;
    return this;
  }

  setName(name) {
    this._set.type = name;
    return this;
  }

  setItems(array) {
    this._set.items = array;
    return this;
  }

  addItem(id, count = 1) {
    this._set.items.push({ id: `${id}`, count });
    return this;
  }

  build() {
    return this._set;
  }
}

module.exports = { ItemSet, Block };
