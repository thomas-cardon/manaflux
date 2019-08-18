module.exports = {
  load: Mana => console.log(2, `[UI] Loading language: ${Mana.getStore().get('language')}`),
  change: function() {
    console.log(2, `[UI] Changed background to ${this.value}`);
    Mana.getStore().set('language', this.value);
    ipcRenderer.send('restart');
  }
};
