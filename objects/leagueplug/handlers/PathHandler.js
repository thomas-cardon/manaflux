const fs = require('fs'), path = require('path');
const i18n = new (require('../../i18n'));
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

  async findLeaguePath() {
    console.log('[PathHandler] Trying to find path.');
    if (await this._exists('C:\\Riot Games\\League of Legends\\')) return 'C:\\Riot Games\\League of Legends\\';

    let leaguePath = await this.getLeaguePathByCommandLine();
    console.log(`[PathHandler] Path found by commandline: ${leaguePath}`);

    while(!leaguePath || await !this._exists(path.resolve(leaguePath + '\\LeagueClient.' + (process.platform === 'win32' ? 'exe' : 'app'))) /* OSX WIN ONLY SHOULD CHANGE SOON */ ) {
      leaguePath = dialog.showOpenDialog({properties: ['openDirectory', 'showHiddenFiles'], message: i18n.__('league-client-enter-path'), title: i18n.__('league-client-enter-path') })[0];
    }

    console.log(`[PathHandler] Path selected: ${leaguePath}`);
    return leaguePath;
  }

  async getLeaguePathByCommandLine() {
    const command = process.platform === 'win32' ? "WMIC PROCESS WHERE name='LeagueClient.exe' GET commandline" : "ps x -o args | grep 'LeagueClient'";

    return new Promise((resolve, reject) => {
      exec(command, process.platform === 'win32' ? { shell: 'cmd.exe' } : {}, function(error, stdout, stderr) {
        if (error) return reject(error);

        const matches = stdout.match(/[^"]+?(?=RADS)/gm);

        if (!matches || matches.length === 0) resolve(false);
        else resolve(matches[0]);
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
