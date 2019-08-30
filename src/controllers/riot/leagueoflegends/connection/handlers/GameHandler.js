const fs = require('fs'), path = require('path');
const { exec } = require('child_process');
const { dialog } = require('electron');

class GameHandler {
  watch() {
    setInterval(async () => {
      try {
        const dir = await this.watchGameProcess();

        if (dir) {
          if (!this.isRunning)
            this.onGameStart();

          this.isRunning = true;
          this._wmicArguments = dir;
        }
        else {
          if (this.isRunning)
            this.onGameEnd();

          this.isRunning = false;
        }
      }
      catch(err) {
        console.error(err);
      }
    }, 1000);
  }

  onGameStart() {
    console.log('>> Game has started. This method isn\'t hooked up to anything.');
  }

  onGameEnd() {
    console.log('>> Game has closed. This method isn\'t hooked up to anything.');
  }

  isPlatformCompatible() {
    return process.platform === 'win32';
  }

  /* TODO: cross-platform compatible */
  watchGameProcess() {
    const command = 'WMIC.exe PROCESS WHERE name="League of Legends.exe" GET Name,Caption,Status,CommandLine /format:csv';

    return new Promise((resolve, reject) => {
      exec(command, process.platform === 'win32' ? { shell: 'C:\\WINDOWS\\system32\\cmd.exe', cwd: 'C:\\Windows\\System32\\wbem\\' } : {}, function(error, stdout, stderr) {
        if (error) return reject(error);
        if (stderr.length > 0) return resolve(false);

        stdout = stdout.trim().split('\n');
        let args = {}, keys = stdout[0].split(','), values = stdout[1].split(',');
        keys.forEach((x, i) => args[x] = values[i]);

        resolve(args);
      });
    });
  }
}

module.exports = GameHandler;
