const fs = require('fs'), path = require('path');
const { ItemSet, Block } = require('../ItemSet');

class ItemSetHandler {

  static async parse(key, obj) {
    if (typeof obj === 'string') obj = await ItemSetHandler._readFile(obj);

    let set = new ItemSet(key);
    set._data = obj;

    return set;
  }

  static getItemSets() {
    let self = this;
    console.log(path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions\\`));
    return new Promise((resolve, reject) => {
      fs.readdir(path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions\\`), (err, dir) => {
        if (err) return reject(err);
        if (dir.length === 0) return reject(Error('Champions folder is empty?'));

        let arr = [], res = [];

        for (let key of dir)
          arr.push(self.getItemSetsByChampionKey(key));

        Promise.all(arr).then(values => {
          for (let x of values)
            res = res.concat(x);

          resolve(res);
        }).catch(reject);
      });
    });
  }

  static async deleteItemSets(list) {
    for (let path of list)
      await this._deleteFile(path);
  }

  static getItemSetsByChampionKey(key) {
    key = key.toLowerCase();
    return new Promise((resolve, reject) => {
      fs.readdir(path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions\\${key}\\Recommended`), (err, dir) => {
        if (err) return reject(err);
        if (dir.length === 0) return resolve([]);

        let arr = [];
        for (let file of dir)
          if (file.startsWith('MFLUX_')) arr.push(path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions\\${key}\\Recommended\\${file}`));

        resolve(arr);
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
        if (err && err.code === 'ENOENT') resolve(false);
        else if (err) reject(err);
        else resolve(true);
      });
    });
  }
}

module.exports = ItemSetHandler;
