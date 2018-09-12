/*
* LoggingHandler
* This class allows ManaFlux to:
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
  this.ipc = this.isRenderer ? ipcRenderer : null;

  // TODO: fix LoggingHandler's stream / getPath('logs')
  //if (!this.isRenderer)
    //this.stream = fs.createWriteStream(path.resolve(require('electron').app.getPath('logs') || , new Date().toDateString() + '.txt'));
}

LoggingHandler.prototype.log = function(level, ...args) {
  const x = args.join(' ');
  if (this.level < level) return x;

  console.log.call(this, `[${this._getTimestamp()}] [${this.isRenderer ? 'Renderer' : 'Main'}] ${x}`);
  this.send(level, 'log', x);
  return x;
}

LoggingHandler.prototype.dir = function(level, x) {
  if (this.level < level) return x;
  console.dir(x);
  this.send(level, 'dir', JSON.stringify(x));
  return x;
}

LoggingHandler.prototype.error = function(level, error) {
  if (this.level < level) return;
  console.log.call(this, `[${this._getTimestamp()}] [${this.isRenderer ? 'Renderer' : 'Main'}] Error`);
  console.error(error);

  this.send(level, 'error', error);
}

LoggingHandler.prototype.send = function(level, type, message) {
  message = type === 'dir' ? JSON.stringify(message) : `[${this._getTimestamp()}] [${this.isRenderer ? 'Renderer' : 'Main'}] ${message}`;

  if (this.ipc) this.ipc.send('logging-' + type, { level, message });
  //if (!this.isRenderer) this.stream.write(message + '\n');
}

LoggingHandler.prototype.onMessage = function(cb) {
  if (!this.ipc) return;

  this.ipc.on('logging-log', (event, arg) => cb('log', arg.message));
  this.ipc.on('logging-dir', (event, arg) => cb('dir', arg.message));
  this.ipc.on('logging-error', (event, arg) => cb('error', arg.message));
}

LoggingHandler.prototype.setBrowserWindow = function(win) {
  this.ipc = win.webContents;
}

LoggingHandler.prototype._getTimestamp = function() {
  return new Date().toISOString().slice(11,-5);
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
