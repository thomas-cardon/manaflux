const app = require('electron').app ? require('electron').app : require('electron').remote.app;
const fs = require('fs'), path = require('path');

class i18n {
  constructor() {
    this._locale = locale;

    try {
      this._default = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/en.json'), 'utf8'));

      if(fs.existsSync(path.join(__dirname, '/locales/', locale + '.json')))
        this._language = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/',  locale + '.json'), 'utf8')) || {};
    }
    catch(err) {
      console.error(err);
    }
  }

  __(...args) {
    console.log(args[0]);
    console.log(this._default[args[0]]);
    console.log(this._language[args[0]]);

    args[0] = this._language[args[0]] || this._default[args[0]] || args[0];
    return args[0].includes("%s") ? require('util').format.call(this, ...args) : args[0];
  }
}

let defaultLanguage = {}, language = {}, locale = app.getLocale().toLowerCase();


module.exports = i18n;
