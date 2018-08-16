const { EventEmitter } = require('events');
const { exec } = require('child_process');

class LeaguePlug extends EventEmitter {
  constructor() {
    super();

    this.pathHandler = new (require('./handlers/PathHandler'))();
    this.connectionHandler = new (require('./handlers/ConnectionHandler'))();
  }

  async load() {
    return await this.pathHandler.load();
  }

  start() {
    return this.connectionHandler.start(this.getPathHandler().getLeaguePath());
  }

  getPath() {
    return this.pathHandler.getLeaguePath();
  }

  getPathHandler() {
    return this.pathHandler;
  }

  getConnectionHandler() {
    return this.connectionHandler;
  }

  async isConnected() {

  }
}

module.exports = LeaguePlug;
