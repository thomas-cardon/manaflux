const fs = require('fs'), path = require('path');

function i18n(x, loadUnusedLines) {
  this._locale = x || ((process && process.type === 'renderer') ? require('electron').remote.app : require('electron').app).getLocale().toLowerCase();

  try {
    this._default = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/en.json'), 'utf8'));

    if((process && process.type === 'renderer') && fs.existsSync(path.join(__dirname, '/locales/', this._locale + '.json')))
      this._language = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/',  this._locale + '.json'), 'utf8'));
  }
  catch(err) {
    console.error(err);
  }

  if (process && process.type === 'renderer' && (loadUnusedLines || require('electron').ipcRenderer.sendSync('is-dev')))
    this._unused = [...new Set([...Object.keys(this._default || {}), ...Object.keys(this._language || {})])];
    // Set removes duplicates
}

/**
 * Returns the value of an english line
 * @param {string} line - The key of the line
 * @param {...string} args - The other arguments to format the string
 */
i18n.prototype.__d = function(...args) {
  if (process && process.type === 'renderer' && this._unused && this._unused.includes(args[0])) this._unused.splice(this._unused.indexOf(args[0]), 1);

  args[0] = this._default[args[0]] || args[0];
  return args[0].includes("%s") ? require('util').format.call(this, ...args) : args[0];
}

/**
 * Returns the value of the language line
 * @param {string} line - The key of the line
 * @param {...string} args - The other arguments to format the string
 */
i18n.prototype.__ = function(...args) {
  if (process && process.type === 'renderer' && this._unused && this._unused.includes(args[0])) this._unused.splice(this._unused.indexOf(args[0]), 1);

  for (let i = 0; i < args.length; i++)
    args[i] = (this._language && this._language[args[i]] ? this._language[args[i]] : this._default[args[i]]) || args[i];

  return args[0].includes("%s") ? require('util').format.call(this, ...args) : args[0];
}

/** Returns an string array containing the language codes. */
i18n.prototype.getLanguagesList = function() {
  return fs.readdirSync(require('path').join(__dirname, '/locales')).map(x => x.slice(0, -5));
}

/**
 * Loads and returns an object containing all the data from every language available
 */
i18n.prototype.getLanguages = function(x) {
  const d = {};

  fs.readdirSync(require('path').join(__dirname, '/locales')).forEach(x => {
    try {
      d[x.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/', x), 'utf8'));
    }
    catch(err) {
      console.log('[i18n] Couldn\'t load language file', x);
    }
  });

  return d;
}

i18n.prototype.getUnusedLines = function() {
  return this._unused || [];
}

module.exports = i18n;
