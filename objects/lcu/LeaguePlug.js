const { EventEmitter } = require('events');
const fs = require('fs'), path = require('path');
const chokidar = require('chokidar');
const { exec } = require('child_process');
const https = require('https');

class LeaguePlug extends EventEmitter {
  constructor(dirPath = 'C:\\Riot Games\\League of Legends\\') {
    super();

    this._dirPath = dirPath;
  }

  setLeaguePath(path) {
    this._dirPath = path;
  }

  start() {
    this._startLockfileWatcher();
  }

  hasStarted() {
    return this._lockfileWatcher !== null;
  }

  getLoginTimer() {
    const self = this;
    function timer(cb, ms = 0) {
      self._loginTimerId = setTimeout(() => {
        self.login().then(loggedIn => {
          if (loggedIn) return cb();

          timer(cb, (ms === 0 ? 100 : ms) * 1.6);
          self.emit('logged-off');
        });
      }, ms);
    }

    return new Promise(resolve => timer(resolve));
  }

  login(port = this._lcu.port) {
    const token = this.getAuthenticationToken();
    return new Promise((resolve, reject) => {
      https.get({
        host: '127.0.0.1',
        port: port,
        path: '/lol-login/v1/session',
        headers: { 'Authorization': token },
        rejectUnauthorized: false,
      }, res => {
        if (res.statusCode === 200) resolve(true);
        else if (res.statusCode === 404) resolve(false);
      }).on('error', () => null);
    });
  }

  getAuthenticationToken() {
    return this._authentication;
  }

  static async getLeaguePath() {
    const command = process.platform === 'win32' ? "WMIC PROCESS WHERE name='LeagueClient.exe' GET commandline" : "ps x -o args | grep 'LeagueClient'";

    return new Promise(resolve => {
      exec(command, function(error, stdout, stderr) {
        if (error) throw error;
        console.log('stdout: ' + stdout);
        resolve(stdout);
      });
    });
  }

  static async hasLeagueStarted() {
    return await LeaguePlug.getLeaguePath() !== null;
  }

  _readLockfile() {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(this._dirPath, 'lockfile'), 'utf8', (err, data) => {
        if (err) return reject(err);
        let d = data.split(':');
        resolve({ pid: d[1], port: d[2], password: d[3], protocol: d[4], baseUri: `${d[4]}://riot:${d[3]}@127.0.0.1:${d[2]}/` });
      });
    });
  }

  _startLockfileWatcher() {
    this._lockfileWatcher = chokidar.watch(path.join(this._dirPath, 'lockfile'), { disableGlobbing: true })
    .on('add', path => {
      console.log('Lockfile change');
      LeaguePlug.hasLeagueStarted().then(started => {
        if (!started) return; // Indicates if League is started or not
        console.log('League has started');

        this._connected = true;
        this._readLockfile().then(d => {
          this._authentication = 'Basic ' + Buffer.from('riot:' + d.password).toString('base64');
          this.emit('connected', this._lcu = d);

          this.getLoginTimer().then(() => {
            console.log('League is logged in');

            this._loggedIn = true;
            this.emit('logged-in');
          });
        }).catch(err => this.emit('error', err));
      })
    })
    .on('unlink', path => {
      console.log('League has been shut down');

      this._connected = false;
      this.emit('disconnected');
    });
  }

  _endLockfileWatcher() {
    this._lockfileWatcher.close();
  }

  end() {
    this._endLockfileWatcher();
    clearTimeout(this._loginTimerId);
  }

  isLoggedIn() {
    return this._loggedIn;
  }

  isConnected() {
    return this._connected;
  }

  getConnectionData() {
    return this._lcu;
  }

  isDisconnected() {
    return !this._connected;
  }
}

module.exports = LeaguePlug;
