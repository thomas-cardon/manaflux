const { EventEmitter } = require('events');

class LeaguePlug extends EventEmitter {
  constructor() {
    super();
    this.connectionHandler = new (require('./handlers/ConnectionHandler'))();
  }

  async load() {
    return await this.pathHandler.load();
  }

  start(path = this.getPathHandler().getLeaguePath()) {
    return this.connectionHandler.start(path);
  }

  getPath() {
    return this.pathHandler.getLeaguePath();
  }

  getPathHandler() {
    return !this.pathHandler ? this.pathHandler = new (require('./handlers/PathHandler'))() : this.pathHandler;
  }

  getConnectionHandler() {
    return this.connectionHandler;
  }
}

module.exports = LeaguePlug;
