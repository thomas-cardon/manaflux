console.log(2, `[UI] Loading language: ${Mana.getStore().get('language')}`);
module.exports = {
  change: function() {
    console.log(2, `[UI] Changed background to ${this.value}`);
    Mana.getStore().set('language', this.value);
    ipcRenderer.send('restart');
  }
};
