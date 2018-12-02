const fs = require('fs'), path = require('path');
class ChampionSelectHandler {
  constructor() {
    this.path = path.join(require('electron').remote.app.getPath('userData'), '\\ChampionData');
    this._cache = {};
  }

  async load() {
    await this._ensureDir(this.path);
  }

  async get(championId) {
    if (this._cache[championId]) return this._cache[championId];

    try {
      const x = await this._readFile(path.join(this.path, championId + '.json'));
      return this._cache[championId] = JSON.parse(x);
    }
    catch(err) {
      if (err.code !== 'ENOENT') console.error(err);
      return null;
    }
  }

  set(championId, x) {
    this._cache[championId] = x;
  }

  async remove(championId) {
    return this._unlink(path.join(this.path, championId + '.json'));
  }

  async update(championId, cb) {
    this._cache[championId] = await cb(this._cache[championId] || await this.get(championId));
  }

  async save() {
    return await Promise.all(Object.entries(this._cache).filter(x => typeof x[1] === 'object' && x[1].roles).map(x => this._writeFile(path.join(this.path, x[0] + '.json'), JSON.stringify(x[1]))));
  }

  async clear() {
    const dir = await this._readdir(this.path);
    return await Promise.all(dir.map(x => this._unlink(path.join(this.path, x))));
  }

  _ensureDir(path) {
    return new Promise((resolve, reject) => {
      fs.mkdir(path, err => {
        if (err && err.code === 'EEXIST') resolve();
        else if (err) reject(err);
        else resolve();
      })
    })
  }

  _writeFile(filePath, data) {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, data, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  _unlink(filePath) {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  _readFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });
  }

  _readdir(filePath) {
    return new Promise((resolve, reject) => {
      fs.readdir(filePath, function(err, dir) {
        if (err) return reject(err);
        resolve(dir);
      });
    });
  }
}

module.exports = ChampionSelectHandler;
