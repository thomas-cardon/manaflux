module.exports = function(el) {
  log.log(2, '[UI] Empty cache asked.');
  Mana.getStore().set('data', {});

  UI.status('UI', 'empty-cache-status');
};
