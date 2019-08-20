const { Menu, MenuItem } = remote;
const Runes = {
  remove: async () => {
    if (!document.getElementById('runes-' + Runes._selected)) return console.error('Runes >> Context Menu: selected item doesn\'t exist !');

    try {
      await Mana.user.getPerksInventory().deletePerkPage(Runes._selected);
      document.getElementById('runes-' + Runes._selected).remove();
    }
    catch(err) {
      console.error('Runes >> Context Menu: couldn\'t remove rune page !');
      console.error(err);
    }
  },
  select: async () => {
    if (!document.getElementById('runes-' + Runes._selected)) return console.error('Runes >> Context Menu: selected item doesn\'t exist !');

    try {
      await Mana.user.getPerksInventory().setCurrentPage(Runes._selected);
      menu.getMenuItemById('select').checked = true;
    }
    catch(err) {
      console.error('Runes >> Context Menu: couldn\'t select rune page !');
      console.error(err);
    }
  }
};

const menu = new Menu();
menu.append(new MenuItem({ label: i18n.__('sidebar-runes-context-remove'), id: 'remove', click: Runes.remove }));
menu.append(new MenuItem({ type: 'separator' }));
menu.append(new MenuItem({ label: i18n.__('sidebar-runes-context-select'), id: 'select', type: 'checkbox', checked: true, click: Runes.select }));

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();

  if (!Mana.user.isLoggedIn) return; /* Security measure in case context menu is still opened when user disconnects */
  if (e.target.id.startsWith('runes-')) {
    Runes._selected = e.target.id.split('-')[1];

    menu.getMenuItemById('select').checked = Mana.user.getPerksInventory().getPerks().find(x => x.current) && Mana.user.getPerksInventory().getPerks().find(x => x.current).id == Runes._selected;
    menu.getMenuItemById('select').enabled = !menu.getMenuItemById('select').checked;

    menu.popup({ window: remote.getCurrentWindow() });
  }
}, false);

let timer = 0;
module.exports = {
  load: function(Mana) {
    $('#runesInventory').sortable({
      connectWith: '#availableRunes',
      update: function( event, ui ) {
        console.dir(arguments);
      }
    });
  },
  userConnected: function(e) {
    trigger(true);
    timer = 5000;
  },
  userDisconnected: function(e) {
    timer = -1;
  },
  inChampionSelect: function(e) {
    timer = 500;
  },
  outChampionSelect: function(e) {
    timer = 5000;
  }
};

function trigger(now) {
  if (timer < 0) return;

  setTimeout(() => {
    Mana.user.getPerksInventory().queryPerks().then(perks => {
      $('#runesInventory').children().remove();

      for (let perk of perks)
        $('#runesInventory').append(`<li class="ui-state-default sortable-button ui-sortable-handle" id="runes-${perk.id}">${perk.name}</li>`);
      $('#runesInventory').sortable('refresh');
      trigger();
    });
  }, now ? 0 : timer);
}
