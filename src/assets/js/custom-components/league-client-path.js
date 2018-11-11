module.exports = {
  load: Mana => this.value = Mana.getStore().get('league-client-path') || i18n.__('common-loading'),
  lcuPathChange: function() {
    console.log(2, `[UI] League path has changed to: ${path}`);
    Mana.getStore().set('league-client-path', this.value = path);
  }
};
