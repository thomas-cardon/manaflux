module.exports = {
  click: function() {
    console.log(2, '[UI] Settings reset asked.');
    Mana.getStore().clear();
    
    UI.status('UI', 'reset-settings-status');
    ipcRenderer.send('restart');
  }
};
