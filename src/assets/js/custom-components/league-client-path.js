module.exports = function() {
  this.value = i18n.__('common-loading');
  ipcRenderer.on('lcu-get-path', (event, path) => {
    log.log(2, `[UI] League path has changed to: ${path}`);
    Mana.getStore().set('league-client-path', this.value = path);
  });
};
