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
const c = { log: console.log, dir: console.dir, warn: console.warn, error: console.error };

function LoggingHandler(level) {
  this.level = level;
  this.isRenderer = !process || typeof process === 'undefined' || !process.type || process.type === 'renderer';
  this.ipc = this.isRenderer ? ipcRenderer : require('electron').ipcMain;

  if (!this.isRenderer) this.stream = fs.createWriteStream(path.resolve(require('electron').app.getPath('logs'), new Date().toString().slice(0, 24).replace(/:/g, '-') + '.txt'));

  const self = this;
  console.log = function(level = 0, ...args) {
    const x = args || [];
    if (isNaN(level)) {
      x.unshift(level);
      level = 0;
    }
    else if (this.level < level) return x[0];

    c.log.call(console, `[${this.isRenderer ? 'Renderer' : 'Main'}]`, `[${self._getTimestamp()}]`, ...x);
    self.send.call(self, level, 'log', x.join(' '));

    return x[0];
  }

  console.warn = function(level = 0, ...args) {
    const x = args || [];
    if (isNaN(level)) {
      c.log.call(console, level);

      x.unshift(level);
      level = 0;
    }
    else if (this.level < level) return x[0];

    c.warn.call(console, `[${this.isRenderer ? 'Renderer' : 'Main'}]`, `[${self._getTimestamp()}]`, ...x);
    self.send.call(self, level, 'log', x);

    return x[0];
  }

  console.dir = function(level = 0, x) {
    if (isNaN(level)) {
      x = level;
      level = 0;
    }
    else if (this.level < level) return x;

    c.log.call(console, `[${this.isRenderer ? 'Renderer' : 'Main'}] [${self._getTimestamp()}]`);
    c.dir.call(console, x);

    self.send.call(self, level, 'dir', x);
    return x[0];
  }

  /*
  console.error = function(x) {
    c.log.call(console, `[${this.isRenderer ? 'Renderer' : 'Main'}] [${self._getTimestamp()}] Error`);
    c.error.apply(console, arguments);

    self.send.call(self, level, 'error', x);
  }*/

  let x = (t, arg) => {
    if (x === 'log' || x === 'warn') c[type].call(console, `[${this.isRenderer ? 'Renderer' : 'Main'}] [${self._getTimestamp()}] ${arg.msg.join(' ')}\n`);
    else {
      c.log.call(console, `[${this.isRenderer ? 'Main' : 'Renderer'}] [${self._getTimestamp()}]${t === 'error' ? ' Error' : ''}\n`);
      c[t].call(console, `${arg.msg.join(' ')}\n`);
    }

    if (this.stream) this.write(t, arg, 'Renderer');
  };

  this.ipc.on('logging-log', (event, arg) => x('log', arg));
  this.ipc.on('logging-dir', (event, arg) => x('dir', arg));
  this.ipc.on('logging-warn', (event, arg) => x('warn', arg));
  this.ipc.on('logging-error', (event, arg) => x('error', arg));
}

LoggingHandler.prototype.end = function() {
  return this.stream.end();
}

LoggingHandler.prototype.send = function(level, type, ...message) {
  if (this[this.isRenderer ? 'ipc' : 'webContents']) this[this.isRenderer ? 'ipc' : 'webContents'].send('logging-' + type, { level, timestamp: this._getTimestamp(), msg: message.map(x => type === 'dir' ? JSON.stringify(x) : x) });
  if (this.stream) this.write(type, message, 'Main');
}

LoggingHandler.prototype.write = function(t, arg, proc) {
  if (!arg.msg || arg.msg.length === 0) return;

  if (t === 'log' || t === 'warn') this.stream.write(`[${proc}] [${t}] [${this._getTimestamp()}] ${arg.msg.join(' ')}\n`);
  else this.stream.write(`[${proc}] [${t}] [${this._getTimestamp()}] ${arg.msg.join(' ')}\n${arg.msg.join(' ')}\n`);
}

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
}

module.exports = LoggingHandler;
