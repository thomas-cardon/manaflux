module.exports = function(el) {
  log.log(2, `[UI] ${this.checked ? 'En' : 'Dis'}abled automatic startup`);
  ipcRenderer.send(`auto-start-${this.checked ? 'en' : 'dis'}able`);
};
