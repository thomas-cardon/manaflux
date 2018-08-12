const app = require('electron').app ? require('electron').app : require('electron').remote.app;
const fs = require('fs'), path = require('path');
let loadedLanguage, locale = app.getLocale() || 'en';

function i18n() {
  try {
    if(fs.existsSync(path.join(__dirname, '/locales/', app.getLocale() + '.json')))
      loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/',  app.getLocale() + '.json'), 'utf8'));
    else loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/en.json'), 'utf8'));
  }
  catch(err) {
    console.error(err);
    UI.error(err);
  }
}

i18n.prototype.__ = phrase => loadedLanguage[phrase] || phrase;
module.exports = i18n;
