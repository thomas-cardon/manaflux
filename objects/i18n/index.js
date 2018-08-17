const app = require('electron').app ? require('electron').app : require('electron').remote.app;
const fs = require('fs'), path = require('path');
let language, locale = app.getLocale().toLowerCase() || 'en';

function i18n() {
  this._locale = locale;

  try {
    if(fs.existsSync(path.join(__dirname, '/locales/', locale + '.json')))
      language = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/',  locale + '.json'), 'utf8'));
    else language = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/en.json'), 'utf8'));
  }
  catch(err) {
    console.error(err);
    UI.error(err);
  }
}

i18n.prototype.__ = phrase => language[phrase] || phrase;
module.exports = i18n;
