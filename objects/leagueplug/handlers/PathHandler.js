const fs = require('fs'), path = require('path');
const { exec } = require('child_process');
const drivelist = require('drivelist');

class PathHandler {
  async load() {
    if ((this._leaguePath = await this.findLeaguePath()) === null)
      throw Error("Couldn't find League of Legends path. Please start the client.");
  }

  getLeaguePath() {
    return this._leaguePath;
  }

  setLeaguePath(p) {
    return this._leaguePath = p;
  }

  async isConnectedtoLeague() {
    return await this.getLeaguePathByCommandLine() !== false;
  }

  async findLeaguePath() {
    const drives = await this._getDrives();

    for (let i = 0; i < drives.length; i++) {
      const path = drives[i].mountpoints[0].path + 'Riot Games\\League of Legends\\';
      if (await this._exists(path)) return path;
    }

    const path = await this.getLeaguePathByCommandLine();
    return path === false ? null : path;
  }

  async getLeaguePathByCommandLine() {
    const command = process.platform === 'win32' ? "WMIC PROCESS WHERE name='LeagueClient.exe' GET commandline" : "ps x -o args | grep 'LeagueClient'";

    return new Promise((resolve, reject) => {
      exec(command, process.platform === 'win32' ? { shell: 'cmd.exe' } : {}, function(error, stdout, stderr) {
        console.dir(arguments);
        if (error) return reject(err);

        const matches = stdout.match(/[^"]+?(?=RADS)/gm);

        if (!matches || matches.length === 0) resolve(false);
        else resolve(matches[0]);
      });
    });
  }

  _getDrives() {
    return new Promise((resolve, reject) => {
      drivelist.list((error, drives) => {
        if (error) return reject(err);
        resolve(drives);
      });
    });
  }

  _exists(path) {
    return new Promise((resolve, reject) => {
      fs.access(path, fs.constants.F_OK, err => {
        if (err) return resolve(false);
        else resolve(true);
      });
    });
  }
}

module.exports = PathHandler;
