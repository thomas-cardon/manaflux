const { Menu, MenuItem } = remote;

const AvailableRunes = {
  delete: async () => {
    if (!document.getElementById(Runes._selected)) return console.error('Runes >> Context Menu: selected item doesn\'t exist !');
  },
  select: async () => {
    if (!document.getElementById(Runes._selected)) return console.error('Runes >> Context Menu: selected item doesn\'t exist !');
  }
};

const menu = new Menu();

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
}, false);

module.exports = function(Mana) {
  $('#availableRunes').sortable({
    connectWith: '#runesInventory',
    update: function( event, ui ) {}
  });
}
