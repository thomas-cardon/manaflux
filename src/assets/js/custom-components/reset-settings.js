module.exports = {
  click: function() {
    console.log(2, '[UI] Settings reset asked.');
    Mana.getStore().clear();

    UI.status('reset-settings-status');
    ipcRenderer.send('restart');
  }
};
