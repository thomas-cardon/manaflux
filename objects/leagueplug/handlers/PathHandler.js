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

  async findLeaguePath() {
    console.log(2, '[PathHandler] Trying to find path.');

    for (const x of ['C:\\Riot Games\\League of Legends\\', '/Applications/League of Legends.app/Contents/LoL/']) {
      if (await this._exists(path.resolve(x + '\\LeagueClient.' + this.getExtensionByPlatform(process.platform))))
        return x;
    }

    let leaguePath = await this.getLeaguePathByCommandLine();
    console.log(2, `[PathHandler] Path found: ${leaguePath}`);

    return leaguePath;
  }

  getExtensionByPlatform(platform) {
    switch(platform) {
      case 'darwin':
      return 'app';
    }

    return 'exe';
  }

  /* Supports Windows, Linux and OS X */
  async getLeaguePathByCommandLine() {
    const command = process.platform === 'win32' ? "WMIC.exe PROCESS WHERE name='LeagueClient.exe' GET ExecutablePath" : "ps x -o args | grep 'LeagueClient'";

    return new Promise((resolve, reject) => {
      exec(command, process.platform === 'win32' ? { shell: 'C:\\WINDOWS\\system32\\cmd.exe', cwd: 'C:\\Windows\\System32\\wbem\\' } : {}, function(error, stdout, stderr) {
        if (error) return reject(console.error(3, error));

        console.dir(3, stdout);
        const matches = stdout.match(/[^\n]+?(?=RADS)/gm);
        if (!matches || matches.length === 0 ) {
          const normalizedPath = path.normalize(stdout);
          const LCUExePath = process.platform ? normalizedPath.split(/\n|\n\r/)[1] : normalizedPath;
          const LCUDir = path.dirname(LCUExePath);
          if (!LCUDir || LCUDir.length === 0) resolve(false)
          else resolve(LCUDir)
        } else {
          if (!matches || matches.length === 0) resolve(false);
          resolve(matches[0]);
        }
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
