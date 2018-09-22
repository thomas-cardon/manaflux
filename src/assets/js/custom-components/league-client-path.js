module.exports = function(el) {
  log.log(2, '[UI] League path loaded');
  ipcRenderer.on('lcu-get-path', (event, path) => log.log(3, this.value = this.getStore().set('league-client-path', path)));
}
