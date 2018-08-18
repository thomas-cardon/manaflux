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
        });
      }, ms);
    }

    return new Promise(resolve => timer(data => resolve(data)));
  }

  _checkSession(port = this._lcu.port) {
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
      }).on('error', () => null);
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

  _startLockfileWatcher(leaguePath) {
    this._lockfileWatcher = chokidar.watch(path.join(leaguePath, 'lockfile'), { disableGlobbing: true })
    .on('add', async path => {
      console.log(`[LeaguePlug] [ConnectionHandler] League of Legends connection data detected`);
      const lockfile = await this._readLockfile(leaguePath);

      this._authentication = lockfile.authToken;
      this._connected = true;

      this.emit('connected', this._lcu = lockfile);

      const loginData = await this.waitForConnection();
      console.log(`[LeaguePlug] [ConnectionHandler] Player is logged into League of Legends`);

      this._loggedIn = true;
      this.emit('logged-in', loginData);
    })
    .on('unlink', path => {
      console.log(`[LeaguePlug] [ConnectionHandler] League of Legends has been probably closed`);

      this._connected = false;
      this.emit('disconnected');
    });
  }

  _endLockfileWatcher() {
    this._lockfileWatcher.close();
  }

  end() {
    if (this._lockfileWatcher) this._endLockfileWatcher();
    if (this._sessionCheckTimerId) clearTimeout(this._sessionCheckTimerId);
  }

  getAuthenticationToken() {
    return this._authentication;
  }
}

module.exports = ConnectionHandler;
