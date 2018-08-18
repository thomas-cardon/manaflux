const app = require('electron').app ? require('electron').app : require('electron').remote.app;
const fs = require('fs'), path = require('path');

let defaultLanguage = {}, language = {}, locale = app.getLocale().toLowerCase();

function i18n() {
  this._locale = locale;

  try {
    defaultLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/en.json'), 'utf8'));

    if(fs.existsSync(path.join(__dirname, '/locales/', locale + '.json')))
      language = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/',  locale + '.json'), 'utf8')) || {};
  }
  catch(err) {
    console.error(err);
  }
}

i18n.prototype.__ = (...args) => {
  args[0] = language[args[0]] || defaultLanguage[args[0]] || args[0];
  return require('util').format.call(this, ...args);
}
module.exports = i18n;
