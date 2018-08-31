log.log(2, `[Update] Loaded channel: ${$('[data-settings-key="update-channel"]').val()}`);
ipcRenderer.send('update-channel-change', $('[data-settings-key="update-channel"]').val());

module.exports = {
  change: function(el) {
    log.log(2, `[Update] Changed to channel: ${this.value}`);
    ipcRenderer.send('update-channel-change', this.value);
  }
};
