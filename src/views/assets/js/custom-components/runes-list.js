const { Menu, MenuItem } = remote;

const Runes = {
  delete: async () => {
    if (!document.getElementById(Runes._selected)) return console.error('Runes >> Context Menu: selected item doesn\'t exist !');

    try {
      await Mana.user.getPerksInventory().deletePerkPage(Runes._selected.split('-')[1]);
      document.getElementById(Runes._selected).remove();
    }
    catch(err) {
      console.error('Runes >> Context Menu: couldn\'t delete rune page !');
      console.error(err);
    }
  },
  select: async () => {
    if (!document.getElementById(Runes._selected)) return console.error('Runes >> Context Menu: selected item doesn\'t exist !');

    try {
      await Mana.user.getPerksInventory().setCurrentPage(Runes._selected.split('-')[1]);
      menu.getMenuItemById('checked') = true;
    }
    catch(err) {
      console.error('Runes >> Context Menu: couldn\'t select rune page !');
      console.error(err);
    }
  }
};

const menu = new Menu();
menu.append(new MenuItem({ label: i18n.__('ui-sidebar-runes-context-delete'), id: 'delete', click: Runes.delete }));
menu.append(new MenuItem({ type: 'separator' }));
menu.append(new MenuItem({ label: i18n.__('ui-sidebar-runes-context-select'), id: 'select', type: 'checkbox', checked: true, click: Runes.select }));

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();

  if (e.target.id.startsWith('runes-')) {
    Runes._selected = e.target.id;

    menu.getMenuItemById('checked') = true;
    menu.popup({ window: remote.getCurrentWindow() });
  }
}, false);

module.exports = function(Mana) {
  $('#availableRunes').sortable({
    connectWith: '#runesInventory',
    update: function( event, ui ) {}
  });
}
