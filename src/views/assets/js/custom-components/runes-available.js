const { Menu, MenuItem } = remote;

const AvailableRunes = UI.sidebar.runesList = {
  cached: {},
  remove: async () => {
    if (!document.getElementById(AvailableRunes._selected)) return console.error('Runes >> Context Menu: selected item doesn\'t exist !');

    document.getElementById(AvailableRunes._selected).remove();
    delete AvailableRunes.cached[AvailableRunes._selected];
  },
  transfer: () => {
    if (!document.getElementById(AvailableRunes._selected)) return console.error('Runes >> Context Menu: selected item doesn\'t exist !');
    $('#runesInventory').sortable('option', 'update')(null, { item: $('#' + AvailableRunes._selected), sender: $('#runesInventory') });
  },
  add: page => {
    if (document.getElementById(page._manaMeta.id)) return;
    AvailableRunes.cached[page._manaMeta.id] = page;
    document.getElementById('availableRunes').innerHTML += `<li id="${page._manaMeta.id}" + class="ui-state-default sidebar-button ui-sortable-handle">${page.name}</li>`;
  },
  remove: page => {
    console.error('Runes >> Context Menu: method not working yet !');
  }
};

const menu = new Menu();
menu.append(new MenuItem({ label: i18n.__('sidebar-runes-context-remove'), id: 'remove', click: AvailableRunes.remove }));
menu.append(new MenuItem({ type: 'separator' }));
menu.append(new MenuItem({ label: i18n.__('sidebar-runes-context-transfer'), id: 'transfer', type: 'checkbox', checked: true, click: AvailableRunes.transfer }));

window.addEventListener('contextmenu', (e) => {
  if (e.target.id.startsWith('runes-') || !e.target.id.startsWith('c')) return;
  e.preventDefault();

  if (!Mana.user.isLoggedIn) return; /* Security measure in case context menu is still opened when user disconnects */
  AvailableRunes._selected = e.target.id;

  menu.getMenuItemById('transfer').checked = Mana.user.getPerksInventory().getPerks().find(x => x._manaMeta.id == e.target.id);
  menu.getMenuItemById('transfer').enabled = !menu.getMenuItemById('transfer').checked;

  menu.popup({ window: remote.getCurrentWindow() });
}, false);

module.exports = {
  load: function(Mana) {
    $('#availableRunes').sortable({
      connectWith: '#runesInventory',
      receive: function(event, ui) {
        if (ui.sender[0].id === 'runesInventory')
          $(ui.sender).sortable('cancel');
      }
    });
  },
  inChampionSelect: function(e) {
    document.getElementById('availableRunes').style.display = 'block';
    document.getElementById('availableRunesLabel').style.display = 'block';
  },
  outChampionSelect: function(e) {
    document.getElementById('availableRunes').style.display = 'none';
    document.getElementById('availableRunesLabel').style.display = 'none';
  }
}
