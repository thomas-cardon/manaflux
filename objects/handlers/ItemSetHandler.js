const fs = require('fs'), path = require('path');
const { ItemSet, Block } = require('../ItemSet');

class ItemSetHandler {

  static async parse(key, obj) {
    if (typeof obj === 'string') obj = await ItemSetHandler._readFile(obj);

    let set = new ItemSet(key);
    set._data = obj;

    return set;
  }

  static _readFile(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf8', function (err, data) {
        if (err) return reject(err);
        resolve(JSON.parse(data));
      });
    });
  }

  static getItemSets() {
    let self = this;
    return new Promise((resolve, reject) => {
      fs.readdir(path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions\\`), (err, dir) => {
        if (err) return reject(err);
        if (dir.length === 0) return resolve([]);

        let arr = [];
        for (let key of dir)
          arr.push(self.getItemSetsByChampionKey(key));

        Promise.all(arr).then(values => {
          let array = [];

          for (let x of array)
            array = array.concat(x);

          resolve(array);
        }).catch(reject);
      });
    });
  }

  static getItemSetsByChampionKey(key) {
    key = key.toLowerCase();
    return new Promise((resolve, reject) => {
      fs.readdir(path.resolve(Mana.store.get('leaguePath') + `\\Config\\Champions\\${key}\\Recommended`), (err, dir) => {
        if (err) return reject(err);
        if (dir.length === 0) return resolve([]);

        let arr = [];
        for (let file of dir)
          if (file.startsWith('MFLUX_')) arr.push(path.resolve(Mana.store.get('leaguePath'), `\\Config\\Champions\\${key}\\Recommended\\${file}`));

        resolve(arr);
      });
    });
  }
}

module.exports = ItemSetHandler;
