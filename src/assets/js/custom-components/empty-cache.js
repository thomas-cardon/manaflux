module.exports = {
  click: function() {
    console.log(2, '[UI] Empty cache asked.');
    UI.indicator(Mana.championStorageHandler.clear(), 'empty-cache-status');
  }
};
