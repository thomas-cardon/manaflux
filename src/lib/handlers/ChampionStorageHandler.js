class ChampionSelectHandler {
  constructor() {
    this.path = require('path').join(require('electron').remote.app.getPath('userData'), '\\ChampionData');
    this._cache = {};
  }

  async load() {
    await M.Utils.fs.ensureDir(this.path);
  }

  async get(championId) {
    if (this._cache[championId]) return this._cache[championId];

    try {
      const x = await M.Utils.fs.readFile(path.join(this.path, championId + '.json'));
      console.dir(JSON.parse(x));

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
    return M.Utils.fs.unlink(path.join(this.path, championId + '.json'));
  }

  async update(championId, cb) {
    this._cache[championId] = await cb(this._cache[championId] || await this.get(championId));
  }

  async save() {
    return await Promise.all(Object.entries(this._cache).filter(x => typeof x[1] === 'object' && x[1].roles).map(x => M.Utils.fs.writeFile(path.join(this.path, x[0] + '.json'), JSON.stringify(x[1]))));
  }

  async clear() {
    let dir;

    try {
      dir = await M.Utils.fs.readdir(this.path);
    }
    catch(err) {
      dir = [];
      if (err.code !== 'ENOENT') console.error(err);
    }

    return await Promise.all(dir.map(x => M.Utils.fs.unlink(path.join(this.path, x))));
  }
}

module.exports = ChampionSelectHandler;
