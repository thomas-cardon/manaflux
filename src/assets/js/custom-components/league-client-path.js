module.exports = {
  load: Mana => this.value = Mana.getStore().get('league-client-path') || i18n.__('common-loading'),
  leaguePathChange: function() {
    this.value = Mana.getStore().get('league-client-path');
  }
};
