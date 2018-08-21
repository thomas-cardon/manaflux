module.exports = function(el) {
  log.log(2, '[UI] Settings reset asked.');
  Mana.store.clear();
  UI.status('UI', 'reset-settings-status');

  el.click(() => ipcRenderer.send('restart'));
};
