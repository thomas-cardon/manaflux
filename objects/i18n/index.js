const fs = require('fs'), path = require('path');

function i18n() {
  this._locale = ((process && process.type === 'renderer') ? require('electron').remote.app : require('electron').app).getLocale().toLowerCase();

  try {
    this._default = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/en.json'), 'utf8'));

    if((process && process.type === 'renderer') && fs.existsSync(path.join(__dirname, '/locales/', this._locale + '.json')))
      this._language = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/',  this._locale + '.json'), 'utf8'));
  }
  catch(err) {
    log.error(0, err);
  }

  if (process && process.type === 'renderer')
    this._unused = [...new Set([...Object.keys(this._default || {}), ...Object.keys(this._language || {})])];
  /* Set removes duplicates */
}

i18n.prototype.__d = function(...args) {
  if (process && process.type === 'renderer' && this._unused && this._unused.includes(args[0])) this._unused.splice(this._unused.indexOf(args[0]), 1);

  args[0] = this._default[args[0]] || args[0];
  return args[0].includes("%s") ? require('util').format.call(this, ...args) : args[0];
}

i18n.prototype.__ = function(...args) {
  if (process && process.type === 'renderer' && this._unused && this._unused.includes(args[0])) this._unused.splice(this._unused.indexOf(args[0]), 1);

  for (let i = 0; i < args.length; i++)
    args[i] = (this._language && this._language[args[i]] ? this._language[args[i]] : this._default[args[i]]) || args[i];

  return args[0].includes("%s") ? require('util').format.call(this, ...args) : args[0];
}

i18n.prototype.getLanguagesList = function() {
  return fs.readdirSync(require('path').join(__dirname, '/locales')).map(x => x.slice(0, -5));
}

i18n.prototype.getLanguages = function(x) {
  if (!x) {
    const d = {};
    fs.readdirSync(require('path').join(__dirname, '/locales')).forEach(x => d[x.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/', x), 'utf8')));
    return d;
  }
  else return JSON.parse(fs.readFileSync(path.join(__dirname, '/locales/' + x + '.json'), 'utf8'));
}

i18n.prototype.getUnusedLines = function() {
  return this._unused;
}

module.exports = i18n;
