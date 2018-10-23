module.exports = {
  click: function() {
    if (Mana.devMode) return UI.error(`Can't setup startup mode due to devleoper mode!`);
    
    console.log(2, `[UI] ${this.checked ? 'En' : 'Dis'}abled automatic startup`);
    ipcRenderer.send(`auto-start-${this.checked ? 'en' : 'dis'}able`);
  }
};
