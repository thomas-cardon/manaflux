/*
* LoggingHandler
* This class allows Manaflux to:
* - Log in both process
* - Save logs into files
* - Have different levels of logging, and return the sent value for easier logging
*/

/*
* Level 0: Fatal errors
* Level 1: Errors
* Level 2: Logging
* Level 3: Everything
*/

const fs = require('fs'), path = require('path');
const c = global.debug = { log: console.log, dir: console.dir, warn: console.warn, error: console.error };

function LoggingHandler(level) {
  this.level = level;
  this.isRenderer = !process || typeof process === 'undefined' || !process.type || process.type === 'renderer';
  this.ipc = this.isRenderer ? ipcRenderer : require('electron').ipcMain;

  if (!this.isRenderer) this.start();

  const self = this;
  console.log = function(level = 0, ...args) {
    const x = args || [];
    if (isNaN(level)) {
      x.unshift(level);
      level = 0;
    }

    if (x.length === 0) {
      c.log.call(console, `[${self.isRenderer ? 'Renderer' : 'Main'}]`, `[${self._getTimestamp()}]`, 'No arguments but level passed:',  level);
      self.send.call(self, level, 'log', level);
    }
    else if (self.level >= level) {
      c.log.call(console, `[${self.isRenderer ? 'Renderer' : 'Main'}]`, `[${self._getTimestamp()}]`, ...x);
      self.send.call(self, level, 'log', ...x);
    }

    return x[0];
  };

  console.warn = function(level = 0, ...args) {
    const x = args || [];
    if (isNaN(level)) {
      x.unshift(level);
      level = 0;
    }

    if (self.level >= level) {
      c.warn.call(console, `[${self.isRenderer ? 'Renderer' : 'Main'}]`, `[${self._getTimestamp()}]`, ...x);
      self.send.call(self, level, 'warn', ...x);
    }

    return x[0];
  };

  console.dir = function(level = 0, x) {
    if (isNaN(level)) {
      x = level;
      level = 0;
    }

    if (self.level >= level) {
      c.log.call(console, `[${self.isRenderer ? 'Renderer' : 'Main'}] [${self._getTimestamp()}]`);
      c.dir.call(console, x);
      self.send.call(self, level, 'dir', x);
    }

    return x;
  };

  console.error = function(x) {
    c.log.call(console, `[${self.isRenderer ? 'Renderer' : 'Main'}] [${self._getTimestamp()}] Error`);
    c.error.apply(console, arguments);

    self.send.call(self, level, 'error', x.toString());

    return x;
  };

  this.ipc.on('logging-log', (event, arg) => this.onMessageCallback('log', arg));
  this.ipc.on('logging-dir', (event, arg) => this.onMessageCallback('dir', arg));
  this.ipc.on('logging-warn', (event, arg) => this.onMessageCallback('warn', arg));
  this.ipc.on('logging-error', (event, arg) => this.onMessageCallback('error', arg));

  if (!this.isRenderer) {
    this.ipc.on('logging-start', e => e.returnValue = self.start());
    this.ipc.on('logging-end', e => e.returnValue = self.end());
  }
}


LoggingHandler.prototype.start = function() {
  if (this.isRenderer) return this.ipc.sendSync('logging-start');
  let logsPath;

  if (process.platform === 'linux')
    this._folder = require('electron').app.getPath('userData') + '/logs';
  else {
    try {
      this._folder = require('electron').app.getPath('logs');
    }
    catch(err) {
      console.error('Couldn\'t find logs path. Using another one.');
      this._folder = path.resolve(__dirname, '/logs');
    }
  }

  if (!fs.existsSync(this._folder)) fs.mkdirSync(this._folder);

  this._path = path.resolve(this._folder, new Date().toString().slice(0, 24).replace(/:/g, '-') + '.txt');
  this.stream = fs.createWriteStream(this._path);

  this.stream = fs.createWriteStream(this._path = path.resolve(this._folder, new Date().toString().slice(0, 24).replace(/:/g, '-') + '.txt'));
  this.stream.write(`----------[ Log file level ${this.level} ]----------\n`);
  this.stream.write(`Electron v${process.versions.electron}\n`);
  this.stream.write(`NodeJS v${process.versions.node}\n`);
  this.stream.write(`Chrome v${process.versions.chrome}\n`);
  this.stream.write('----------------------------------------\n');

  return this._path;
}

LoggingHandler.prototype.end = function() {
  if (this.isRenderer) return this.ipc.sendSync('logging-end');

  if (this.stream) {
    this.stream.end();
    this.stream = null;

    console.log(`----------[ Log file warning ]----------\n`);
    console.log(`Stopped saving logs in file`);
    console.log('Path: ', this._path);
    console.log(`----------[ Log file warning ]----------\n`);

    return this._path;
  }

  return false;
};

LoggingHandler.prototype.onMessageCallback = function(t, arg) {
  if (!arg.msg || arg.msg.length === 0) return;

  if (t === 'log' || t === 'warn') c[t].call(console, `[${this.isRenderer ? 'Main' : 'Renderer'}] [${arg.timestamp}]`, ...arg.msg);
  else {
    c.log.call(console, `[${this.isRenderer ? 'Main' : 'Renderer'}] [${arg.timestamp}]${t === 'error' ? ' Error' : ''}`);
    c[t].call(console, ...(t === 'dir' ? arg.msg.map(JSON.parse) : arg.msg));
  }

  if (this.stream) this.write(t, arg, 'Renderer');
}

LoggingHandler.prototype.send = function(level, type, ...message) {
  if (!message || message.length === 0) return;

  let d = { level, timestamp: this._getTimestamp(), msg: message.map(x => type === 'dir' ? JSON.stringify(x) : x) };

  if (this[this.isRenderer ? 'ipc' : 'webContents']) this[this.isRenderer ? 'ipc' : 'webContents'].send('logging-' + type, d);
  if (this.stream) this.write(type, d);
}

LoggingHandler.prototype.write = function(t, arg, proc = 'Main') {
  this.stream.write(`[${proc}] [${t}] [${arg.timestamp}]${t === 'log' || t === 'warn' ? ' ' : '\n'}${arg.msg.join(' ')}\n`);
};

LoggingHandler.prototype.setBrowserWindow = win => this.webContents = win.webContents;

LoggingHandler.prototype._getTimestamp = () => new Date().toISOString().slice(11, -5);

LoggingHandler.prototype._ensureDir = function(path) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, err => {
      if (err && err.code === 'EEXIST') resolve();
      else if (err) reject(err);
      else resolve();
    })
  })
};

LoggingHandler.prototype.disable = function() {
  console.log('LoggingHandler now redirects to console.');
  LoggingHandler.prototype.log = console.log;
  LoggingHandler.prototype.dir = console.dir;
  LoggingHandler.prototype.error = console.error;
}

module.exports = LoggingHandler;
