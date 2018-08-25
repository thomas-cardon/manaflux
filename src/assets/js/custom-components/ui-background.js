log.log(2, `[UI] Loading background: ${$('[data-settings-key="ui-background"]').val()}`);
$('body').css('background', `${Mana.getStore().get('ui-gradient') ? 'linear-gradient(to bottom, rgba(125, 185, 232, 0) -1%, rgba(50, 96, 122, 0) 65%, rgba(10, 49, 64, 0.8) 100%), ' : ''}url(./assets/img/${$('[data-settings-key="ui-background"]').val()})`);

module.exports = {
  change: function(el) {
    log.log(2, `[UI] Changed background to ${this.value}`);
    $('body').css('background', `${Mana.getStore().get('ui-gradient') ? 'linear-gradient(to bottom, rgba(125, 185, 232, 0) -1%, rgba(50, 96, 122, 0) 65%, rgba(10, 49, 64, 0.8) 100%), ' : ''}url(./assets/img/${this.value})`);
  }
};
