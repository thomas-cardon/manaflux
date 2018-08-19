const fs = require('fs'), path = require('path');
const { ItemSet, Block } = require('../ItemSet');

class ItemSetHandler {

  static parse(key, obj, position) {
    let set = new ItemSet(key, position);
    set._data = obj;

    for (let i = 0; i < set._data.blocks.length; i++) {
      if (!set._data.blocks[i].items) continue;

      let items = {};
      for (let j = 0; j < set._data.blocks[i].items.length; j++)
        items[set._data.blocks[i].items[j].id] = set._data.blocks[i].items[j].count;

      set._data.blocks[i] = new Block(set._data.blocks[i].type, items, set._data.blocks[i].recMath);
    }

    return set;
  }

  static async getItemSets() {
    const CHAMPIONS_PATH = path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions\\`);

    await this._ensureDir(CHAMPIONS_PATH);
    const dir = await this._readdir(CHAMPIONS_PATH);

    if (dir.length === 0) return [];

    const values = await Promise.all(dir.map(key => this.getItemSetsByChampionKey(key)));
    let res = [];

    for (let x of values)
      res = res.concat(x);

    return res;
  }

  static async getItemSetsByChampionKey(key) {
    await this._ensureDir(path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions`));
    await this._ensureDir(path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions\\${key}`));
    await this._ensureDir(path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions\\${key}\\Recommended`));

    const dir = await this._readdir(path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions\\${key}\\Recommended`));
    if (dir.length === 0) return [];

    let arr = [];
    for (let file of dir)
      if (file.startsWith('MFLUX_')) arr.push(path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions\\${key}\\Recommended\\${file}`));

    return arr;
  }

  static async deleteItemSets(list) {
    for (let path of list)
      await this._deleteFile(path);
  }

  static _ensureDir(path) {
    return new Promise((resolve, reject) => {
      fs.mkdir(path, err => {
        if (err && err.code === 'EEXIST') resolve();
        else if (err) reject(err);
        else resolve();
      })
    })
  }

  static _readdir(path) {
    return new Promise((resolve, reject) => {
      fs.readdir(path, (err, dir) => {
        if (err) return reject(err);
        resolve(dir);
      });
    });
  }

  static _readFile(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf8', function (err, data) {
        if (err) return reject(err);
        resolve(JSON.parse(data));
      });
    });
  }

  static _deleteFile(path) {
    return new Promise((resolve, reject) => {
      fs.unlink(path, err => {
        if (!err) return resolve(true);

        if (err.code === 'ENOENT') resolve(false);
        else reject(err);
      });
    });
  }
}

module.exports = ItemSetHandler;
