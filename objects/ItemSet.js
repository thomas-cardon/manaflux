const fs = require('fs'), path = require('path');

class ItemSet {
  constructor(key, file, ...metadata) {
    this.championKey = key;

    if (file && file.startsWith('MFLUX_'))
      this.file = file;
    else metadata.unshift(file);

    this.file = `MFLUX_${key}_${metadata.join('_')}${metadata.length > 0 ? '_' : ''}${Mana.gameClient.version}_${Mana.version}.json`;
    this.path = path.join(Mana.getStore().get('league-client-path'), `\\Config\\Champions\\${this.championKey}\\Recommended\\${this.file}`);

    this._data = {
      title: i18n.__('item-sets-unknown'),
      type: 'custom',
      map: 'any',
      mode: 'any',
      blocks: [],
      priority: true
    };
  }

  /**
  * Sets data from an ItemSet object, and transforms blocks into the Block object
  * @param {object} data - ItemSet object
  */
  setData(data) {
    data.blocks = data.blocks.map(x => new Block(x.type, x.items, x.recMath));
    this._data = data;
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

  /**
  * Transforms blocks array into a Block class array
  * @param {array} blocks
  */
  setBlocks(blocks) {
    this._data.blocks = blocks.map(x => x.getType() ? x : new Block(x.type, x.items, x.recMath));
    return this;
  }

  addBlock(block) {
    this._data.blocks.push(block);
    return this;
  }

  addBlocks(...blocks) {
    blocks.forEach(block => this.addBlock(block));
    return this;
  }

  swapBlock(x, y) {
    let b = this._data.blocks[x];
    this._data.blocks[x] = this._data.blocks[y];
    this._data.blocks[y] = b;
    return this;
  }

  build(json = true, buildingForLeague) {
    return json ? JSON.stringify({ ...this._data, blocks: this._data.blocks.map(x => x.build(buildingForLeague)) }) : { ...this._data, blocks: this._data.blocks.map(x => x.build(buildingForLeague)) };
  }

  save() {
    const self = this;

    // Creates the required folders if needed
    require('./handlers/ItemSetHandler')._ensureDir(path.join(Mana.getStore().get('league-client-path'), `\\Config\\Champions\\${this.championKey}`));
    require('./handlers/ItemSetHandler')._ensureDir(path.join(Mana.getStore().get('league-client-path'), `\\Config\\Champions\\${this.championKey}\\Recommended`));

    return new Promise((resolve, reject) => {
      fs.writeFile(self.path, self.build(true, true), 'utf8', err => {
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
  constructor(items = {}, recMath = false) {
    this.items = items;
    this.recMath = recMath;
  }

  enableTutorialMode() {
    this.recMath = true;
    return this;
  }

  setItems(o) {
    this.items = o;
    return this;
  }

  setType(obj) {
    if (typeof obj === 'string') this._type = { i18n: obj };
    else this._type = obj;

    return this;
  }

  getType() {
    if (this._type) return this._type.display ? this._type.display(i18n.__(this._type.i18n, ...(this._type.arguments || [])), ...(this._type.arguments || [])) : i18n.__(this._type.i18n, ...(this._type.arguments || []));
    return 'Unknown ManaFlux Block';
  }

  addItem(id, count = 1) {
    this.items[id] = (count === false) ? 1 : this.items[id] + count || count;
    return this;
  }

  build(buildingForLeague) {
    let items = Object.keys(this.items).map(x => ({ id: x, count: this.items[x] }));
    return buildingForLeague ? { type: this.getType(), recMath: this.recMath, items } : { type: this.getType(), _type: this._type, recMath: this.recMath, items };
  }
}

module.exports = { ItemSet, Block };
