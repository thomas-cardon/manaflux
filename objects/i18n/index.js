const electron = require('electron');
const fs = require('fs'), path = require('path');

let app = electron.app ? electron.app : electron.remote.app;
let loadedLanguage;

function i18n() {
  if(fs.existsSync(path.join(__dirname, '/locales/', app.getLocale() + '.json')))
    loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/',  app.getLocale() + '.json'), 'utf8'))
  else loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/en.json'), 'utf8'));
}

i18n.prototype.__ = function(phrase) {
  let translation = loadedLanguage[phrase]

  if(translation === undefined)
    translation = phrase;
  return translation
}

module.exports = i18n;
