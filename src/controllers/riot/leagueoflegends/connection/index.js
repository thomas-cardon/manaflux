const { EventEmitter } = require('events');

class LeaguePlug extends EventEmitter {
  constructor() {
    super();
    this.connectionHandler = new (require('./handlers/ConnectionHandler'))();
    this.pathHandler = new (require('./handlers/PathHandler'))();
    this.gameHandler = new (require('./handlers/GameHandler'))();
  }

  async load() {
    return await this.pathHandler.load();
  }

  start(path = this.getPathHandler().getLeaguePath()) {
    this.gameHandler.watch();
    return this.connectionHandler.start(path);
  }

  getPath() {
    return this.pathHandler.getLeaguePath();
  }

  getPathHandler() {
    return this.pathHandler;
  }

  getGameHandler() {
    return this.gameHandler;
  }

  getConnectionHandler() {
    return this.connectionHandler;
  }

  isConnected() {
    return this.connectionHandler._connected;
  }

  isLoggedIn() {
    return this.connectionHandler._loggedIn && this.connectionHandler._connected;
  }

  getLoginData() {
    return this.connectionHandler._loginData;
  }
}

module.exports = LeaguePlug;
