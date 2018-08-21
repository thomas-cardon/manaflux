const fs = require('fs'), path = require('path');
const { exec } = require('child_process');
const { dialog } = require('electron');

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

  /* TODO: Support for Garena - OS X - Linux */
  async findLeaguePath() {
    log.log(2, '[PathHandler] Trying to find path.');
    if (await this._exists('C:\\Riot Games\\League of Legends\\')) return 'C:\\Riot Games\\League of Legends\\';

    let leaguePath = await this.getLeaguePathByCommandLine();
    log.log(2, `[PathHandler] Path found by commandline: ${leaguePath}`);

    while(!leaguePath || await !this._exists(path.resolve(leaguePath + '\\LeagueClient.' + (process.platform === 'win32' ? 'exe' : 'app')))) {
      leaguePath = log.dir(3, dialog.showOpenDialog({ properties: ['openDirectory', 'showHiddenFiles'], message: 'Please open League of Legends folder', title: 'Please open League of Legends folder' }));
      leaguePath = leaguePath.length > 0 ? leaguePath[0] : false;
    }

    log.log(2, `[PathHandler] Path selected: ${leaguePath}`);
    return leaguePath;
  }

  async getLeaguePathByCommandLine() {
    const command = process.platform === 'win32' ? "WMIC.exe PROCESS WHERE name='LeagueClient.exe' GET commandline" : "ps x -o args | grep 'LeagueClient'";

    return new Promise((resolve, reject) => {
      exec(command, process.platform === 'win32' ? { shell: 'C:\\WINDOWS\\system32\\cmd.exe', cwd: 'C:\\Windows\\System32\\wbem\\' } : {}, function(error, stdout, stderr) {
        if (error) return reject(log.error(3, error));

        log.dir(3, stdout);
        const matches = stdout.match(/[^"]+?(?=RADS)/gm);

        if (!matches || matches.length === 0) resolve(false);
        else resolve(log.log(3, matches[0]));
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
