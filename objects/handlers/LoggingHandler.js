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
function LoggingHandler(level) {
  this.level = level;
  this.isRenderer = !process || typeof process === 'undefined' || !process.type || process.type === 'renderer';
  this.ipc = this.isRenderer ? ipcRenderer : require('electron').ipcMain;

  if (!this.isRenderer)
    this.stream = fs.createWriteStream(path.resolve(require('electron').app.getPath('logs'), new Date().toString().slice(0, 24).replace(/:/g, '-') + '.txt'));
}

LoggingHandler.prototype.end = function() {
  return this.stream.end();
}

LoggingHandler.prototype.log = function(level, ...args) {
  if (this.level < level) return x[0];
  const x = args.join(' ');

  console.log.call(this, `[${this.isRenderer ? 'Renderer' : 'Main'}]`, `[${this._getTimestamp()}]`, ...args);
  this.send(level, 'log', x);

  return x[0];
}

LoggingHandler.prototype.dir = function(level, x) {
  if (this.level < level) return x;
  console.log(this, `[${this.isRenderer ? 'Renderer' : 'Main'}] [${this._getTimestamp()}]`);
  console.dir(x);

  this.send(level, 'dir', x);
  return x[0];
}

LoggingHandler.prototype.error = function(level, error) {
  if (this.level < level) return;
  console.log(`[${this.isRenderer ? 'Renderer' : 'Main'}] [${this._getTimestamp()}]`);
  console.error(error);

  this.send(level, 'error', error);
}

LoggingHandler.prototype.send = function(level, type, ...message) {
  this[this.isRenderer ? 'ipc' : 'webContents'].send('logging-' + type, { level, timestamp: this._getTimestamp(), msg: message.map(x => type === 'dir' ? JSON.stringify(x) : x) });
  if (!this.isRenderer) this.stream.write(message + '\n');
}

LoggingHandler.prototype.onMessage = function(cb) {
  let x = (x, y) => {
    cb(x, y);

    if (!this.isRenderer) {
      if (x === 'log') this.stream.write(`[Renderer] [${this._getTimestamp()}]` + y.msg.join(' ') + '\n');
      else {
        console.log(`[Renderer] [${this._getTimestamp()}]`);
        console[x](args[0]);
      }
    }
  };

  this.ipc.on('logging-log', (event, arg) => x('log', arg));
  this.ipc.on('logging-dir', (event, arg) => x('dir', arg));
  this.ipc.on('logging-error', (event, arg) => x('error', arg));

}

LoggingHandler.prototype.setBrowserWindow = function(win) {
  this.webContents = win.webContents;
}

LoggingHandler.prototype._getTimestamp = function() {
  return new Date().toISOString().slice(11, -5);
}

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
