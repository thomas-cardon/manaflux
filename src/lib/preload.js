console.log('Injecting Mana\'s util functions and models');
global.M = {
  Models: {
    /* Injecting ItemSet and Block class */
    ...require('../models/riot/leagueoflegends/ItemSet')
  },
  Utils: {
    fs: {
      ensureDir: function(path) {
        return new Promise((resolve, reject) => {
          fs.mkdir(path, err => {
            if (err && err.code === 'EEXIST') resolve();
            else if (err) reject(err);
            else resolve();
          })
        })
      },
      readdir: function(path) {
        return new Promise((resolve, reject) => {
          fs.readdir(path, (err, dir) => {
            if (err) return reject(err);
            resolve(dir);
          });
        });
      },
      readFile: function(path) {
        return new Promise((resolve, reject) => {
          fs.readFile(path, 'utf8', function (err, data) {
            if (err) return reject(err);
            resolve(JSON.parse(data));
          });
        });
      },
      deleteFile: function(path) {
        return new Promise((resolve, reject) => {
          fs.unlink(path, err => {
            if (!err) return resolve(true);

            if (err.code === 'ENOENT') resolve(false);
            else reject(err);
          });
        });
      }
    }
  }
};
