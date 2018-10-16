const fs = require('fs'), path = require('path');

class ItemSet {
  constructor(key, file, ...metadata) {
    this.championKey = key;

    this.file = (file && file.startsWith('MFLUX_')) ? file : `MFLUX_${this.championKey}${file ? ('_' + file.toLowerCase() + '_') : '_'}${metadata.length > 0 ? metadata.join('_') + '_' : ''}${Mana.gameClient.branch}_${Mana.version}.json`;
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
    this._data.blocks = blocks.map(x => new Block(x.type, x.items, x.recMath));
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

  build(json = true) {
    const x = Object.assign({}, this._data, { blocks: this._data.blocks.map(x => x.build()) });
    return json ? JSON.stringify(x) : x;
  }

  save() {
    const self = this;

    // Creates the required folders if needed
    require('./handlers/ItemSetHandler')._ensureDir(path.join(Mana.getStore().get('league-client-path'), `\\Config\\Champions\\${this.championKey}`));
    require('./handlers/ItemSetHandler')._ensureDir(path.join(Mana.getStore().get('league-client-path'), `\\Config\\Champions\\${this.championKey}\\Recommended`));

    return new Promise((resolve, reject) => {
      fs.writeFile(self.path, self.build(), 'utf8', err => {
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
  constructor(type, items, recMath) {
    this.type = type || 'Unknown ManaFlux Block';
    this.items = items || {};
    this.recMath = recMath;
  }

  enableTutorialMode() {
    this.recMath = true;
    return this;
  }

  setName(name) {
    this.type = name;
    return this;
  }

  setItems(o) {
    this.items = o;
    return this;
  }

  setType(obj) {
    if (typeof obj === 'string') this._type = { i18n: obj };
    else this._type = obj;
  }

  getType() {
    if (this._type) return this._type.display ? this._type.display(i18n.__(this._type.i18n, ...(this._type.arguments || []))) : i18n.__(this._type.i18n, ...(this._type.arguments || []));
    else return this.type;
  }

  addItem(id, count = 1) {
    this.items[id] = (count === false) ? 1 : this.items[id] + count || count;
    return this;
  }

  build() {
    let items = Object.keys(this.items).map(x => ({ id: x, count: this.items[x] }));

    return { type: this.getType(), _type: this._type, recMath: this.recMath, items };
  }
}

module.exports = { ItemSet, Block };
