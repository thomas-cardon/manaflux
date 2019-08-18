const fs = require('fs'), path = require('path');
class ChampionSelectHandler {
  constructor() {
    this.path = path.join(require('electron').remote.app.getPath('userData'), '\\ChampionData');
    M.Utils.fs.cache = {};
  }

  async load() {
    await M.Utils.fs.ensureDir(this.path);
  }

  async get(championId) {
    if (M.Utils.fs.cache[championId]) return M.Utils.fs.cache[championId];

    try {
      const x = await M.Utils.fs.readFile(path.join(this.path, championId + '.json'));
      console.dir(JSON.parse(x));

      return M.Utils.fs.cache[championId] = JSON.parse(x);
    }
    catch(err) {
      if (err.code !== 'ENOENT') console.error(err);
      return null;
    }
  }

  set(championId, x) {
    M.Utils.fs.cache[championId] = x;
  }

  async remove(championId) {
    return M.Utils.fs.unlink(path.join(this.path, championId + '.json'));
  }

  async update(championId, cb) {
    M.Utils.fs.cache[championId] = await cb(M.Utils.fs.cache[championId] || await this.get(championId));
  }

  async save() {
    return await Promise.all(Object.entries(M.Utils.fs.cache).filter(x => typeof x[1] === 'object' && x[1].roles).map(x => M.Utils.fs.writeFile(path.join(this.path, x[0] + '.json'), JSON.stringify(x[1]))));
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
