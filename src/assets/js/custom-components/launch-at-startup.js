module.exports = {
  click: function() {
    if (Mana.devMode) return UI.error(`Can't open app at login due to devleoper mode!`);
    if (process.platform === 'linux') return UI.error("This feature isn't supported in Linux yet! Please create a feedback if you're on Linux.");

    console.log(2, `[UI] ${this.checked ? 'En' : 'Dis'}abled open at login`);
    remote.app.setLoginItemSettings({ openAtLogin: this.checked });
  }
};
