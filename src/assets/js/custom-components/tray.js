module.exports = {
  click: function() {
    console.log(2, `[UI] ${this.checked ? 'En' : 'Dis'}abled hide in tray feature`);
    UI.tray(this.checked);
  }
};
