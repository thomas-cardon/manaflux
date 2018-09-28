module.exports = {
  click: function() {
    console.log(2, '[UI] Empty cache asked.');
    Mana.getStore().set('data', {});

    UI.status('UI', 'empty-cache-status');
  }
};
