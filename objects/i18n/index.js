const fs = require('fs'), path = require('path');

function i18n() {
  this._locale = (require('electron').app ? require('electron').app : require('electron').remote.app).getLocale().toLowerCase();

  try {
    this._default = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/en.json'), 'utf8'));

    if(fs.existsSync(path.join(__dirname, '/locales/', this._locale + '.json')))
      this._language = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/',  this._locale + '.json'), 'utf8')) || {};
  }
  catch(err) {
    log.error(0, err);
  }
}

i18n.prototype.__d = function(...args) {
  args[0] = this._default[args[0]] || args[0];
  return args[0].includes("%s") ? require('util').format.call(this, ...args) : args[0];
}

i18n.prototype.__ = function(...args) {
  args[0] = this._language[args[0]] || this._default[args[0]] || args[0];
  return args[0].includes("%s") ? require('util').format.call(this, ...args) : args[0];
}

module.exports = i18n;
