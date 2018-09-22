module.exports = {
  click: function() {
    log.log(2, '[UI] Empty cache asked.');
    Mana.getStore().set('data', {});

    UI.status('UI', 'empty-cache-status');
  }
};
