const EventEmitter = require('events');
const ManaSettings = require('./Mana/Settings');
const { dialog, app } = require('electron').remote;

class Mana extends EventEmitter {
  constructor() {
    super();
    this.version = app.getVersion();
    this._settings = new ManaSettings();

    $(document).ready(() => this._settings.load());
  }

  getSettings() {
    return this._settings;
  }

  getStore() {
    return this._settings._store;
  }
}

module.exports = Mana;
