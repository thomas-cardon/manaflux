module.exports = {
  click: async function() {
    console.log(2, '[UI] Settings reset asked.');

    await Mana.championStorageHandler.clear();
    Mana.getStore().clear();

    UI.status('reset-settings-status');
    ipcRenderer.send('restart');
  }
};
