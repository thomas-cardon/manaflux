const fs = require('fs'), path = require('path');
const chokidar = require('chokidar');

const { EventEmitter } = require('events');
class ConnectionHandler extends EventEmitter {

  start(path) {
    this._startLockfileWatcher(path);
  }

  hasStarted() {
    return this._lockfileWatcher;
  }

  waitForConnection() {
    const self = this;
    function timer(cb, ms = 0) {
      self._sessionCheckTimerId = setTimeout(() => {
        self._checkSession().then(data => {
          if (data) return cb(data);

          timer(cb, 500);
          self.emit('logged-off');
        }).catch(err => {
          if (err.code !== 'ECONNREFUSED') return console.error(err);

          timer(cb, 500);
          self.emit('logged-off');
        });
      }, ms);
    }

    console.log(3, '[ConnectionHandler] Checking session...');
    return new Promise(resolve => timer(data => resolve(data)));
  }

  _checkSession(port = this._lockfile.port) {
    const token = this.getAuthenticationToken();
    return new Promise((resolve, reject) => {
      require('https').get({
        host: '127.0.0.1',
        port: port,
        path: '/lol-summoner/v1/current-summoner',
        headers: { 'Authorization': token },
        rejectUnauthorized: false,
      }, res => {
        if (res.statusCode === 200) {
          let body = '';

          res.on('data', chunk => body += chunk);
          res.on('end', () => resolve(JSON.parse(body)));
        }
        else if (res.statusCode === 404) resolve(false);
      }).on('error', err => reject(err));
    });
  }

  _readLockfile(leaguePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(leaguePath, 'lockfile'), 'utf8', (err, data) => {
        if (err) return reject(err);
        const d = data.split(':');
        resolve({ pid: d[1], port: d[2], password: d[3], protocol: d[4], authToken: 'Basic ' + Buffer.from('riot:' + d[3]).toString('base64'), baseUri: `${d[4]}://riot:${d[3]}@127.0.0.1:${d[2]}/` });
      });
    });
  }

  _isLockFileOutdated(lockfile) {
    return new Promise((resolve, reject) => {
      require('https').get({
        host: '127.0.0.1',
        port: lockfile.port,
        headers: { 'Authorization': lockfile.authToken },
        rejectUnauthorized: false,
      }, res => {
        if (res.statusCode === 404) resolve(false);
        else resolve(true);
      }).on('error', err => {
        resolve(true);
      });
    });
  }

  _startLockfileWatcher(leaguePath) {
    const self = this;
    async function check(path) {
      console.log(2, '[ConnectionHandler] League of Legends connection data detected');
      console.log(2, '[ConnectionHandler] Reading connection file');

      try {
        const lockfile = await self._readLockfile(leaguePath);
        if (await self._isLockFileOutdated(lockfile)) return;

        self._connected = true;
        this.emit('connected', self._lockfile = lockfile);
      }
      catch(err) {
        console.error(err);
        return;
      }
    }

    this._lockfileWatcher = chokidar.watch(path.join(leaguePath, 'lockfile'), { disableGlobbing: true })
    .on('add', check)
    .on('change', check)
    .on('unlink', path => {
      console.log(2, '[ConnectionHandler] Connection to League has ended');

      this._connected = false;
      this._loginData = this._lockfile = null;

      this.emit('disconnected');
    });
  }

  async login() {
    this._loginData = await this.waitForConnection();
    console.log(2, '[ConnectionHandler] Player is logged into League of Legends');

    this.emit('logged-in', this._loginData);
  }

  _endLockfileWatcher() {
    this._lockfileWatcher.close();
  }

  end() {
    if (this._lockfileWatcher) this._endLockfileWatcher();
    if (this._sessionCheckTimerId) clearTimeout(this._sessionCheckTimerId);
  }

  getAuthenticationToken() {
    return this._lockfile.authToken;
  }

  getLockfile() {
    return this._lockfile;
  }
}

module.exports = ConnectionHandler;
