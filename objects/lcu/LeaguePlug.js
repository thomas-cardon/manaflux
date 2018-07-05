const { EventEmitter } = require('events');
const fs = require('fs'), path = require('path');
const chokidar = require('chokidar');
const cp = require('child_process');
const https = require('https');

class LeaguePlug extends EventEmitter {
  constructor(dirPath = 'C:\\Riot Games\\League of Legends\\') {
    super();

    this._dirPath = dirPath;

    this.on('connected', d => {
      let id = setInterval(() => {
        https.get({
          host: '127.0.0.1',
          port: d.port,
          path: '/lol-login/v1/session',
          headers: { 'Authorization': this.getAuthenticationToken() },
          rejectUnauthorized: false,
        }, res => {
          if (res.statusCode === 200) {
            clearInterval(id);
            this._loggedIn = true;
            this.emit('logged-in');
          }
          else if (res.statusCode === 404) this.emit('logged-off');
        }).on('error', err => console.error(err));
      }, 1000);
    });

    this.on('disconnected', () => console.log('lcu-disconnected'));
    this.on('logged-in', () => console.log('lcu-logged-in'));
    this.on('logged-off', () => console.log('lcu-logged-off'));
  }

  start() {
    this._startLockfileWatcher();

  }

  getAuthenticationToken() {
    return this._authentication;
  }

  static getLeaguePath() {
    return new Promise(resolve => {
      const command = process.platform === 'win32' ? "wmic process where name='LeagueClientUx.exe' get commandline" : "ps x -o args | grep 'LeagueClientUx'";

      cp.exec(command, (err, stdout, stderr) => {
        if (err || !stdout || stderr) return resolve();

        const data = stdout.match(/[^"]+?(?=RADS)/);
        if (data.length > 0) resolve(parts[0]);
        else resolve();
      });
    });
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
      this._connected = true;
      this._readLockfile().then(d => {
        this._authentication = 'Basic ' + Buffer.from('riot:' + d.password).toString('base64');
        this.emit('connected', this._lcu = d);
      }).catch(err => this.emit('error', err));
    })
    .on('unlink', path => {
      this._connected = false;
      this.emit('disconnected');
    });
  }

  _endLockfileWatcher() {
    this._lockfileWatcher.close();
  }

  end() {
    this._endLockfileWatcher();
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
