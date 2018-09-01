log.log(2, `[UI] Loading gradient: ${$('[data-settings-key="ui-background"]').val()}`);
$('body').css('background', `${Mana.getStore().get('ui-gradient') ? 'linear-gradient(to bottom, rgba(125, 185, 232, 0) -1%, rgba(50, 96, 122, 0) 65%, rgba(10, 49, 64, 0.8) 100%), ' : ''}url(./assets/img/${$('[data-settings-key="ui-background"]').val()}) no-repeat ${$('[data-settings-key="ui-background"]').find(':selected').data('background-position') || ''})`);

module.exports = {
  change: function(el) {
    log.log(2, `[UI] Changed gradient to ${this.checked}`);
    $('body').css('background', `${this.checked ? 'linear-gradient(to bottom, rgba(125, 185, 232, 0) -1%, rgba(50, 96, 122, 0) 65%, rgba(10, 49, 64, 0.8) 100%), ' : ''}url(./assets/img/${Mana.getStore().get('ui-background')}) no-repeat ${$('[data-settings-key="ui-background"]').find(':selected').data('background-position') || ''})}`);
    Mana.getStore().set('ui-gradient', this.checked);
  }
};
