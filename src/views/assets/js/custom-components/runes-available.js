const { Menu, MenuItem } = remote;

// TODO: rename to RuneStash?
const AvailableRunes = UI.sidebar.runesList = {
  cached: {},
  remove: async () => {
    if (!document.getElementById(AvailableRunes._selected)) return console.error('Available Runes >> Context Menu: selected item doesn\'t exist !');

    document.getElementById(AvailableRunes._selected).remove();
    delete AvailableRunes.cached[AvailableRunes._selected];
  },
  transfer: () => {
    if (!document.getElementById(AvailableRunes._selected)) return console.error('Available Runes >> Context Menu: selected item doesn\'t exist !');
    $('#runesInventory').sortable('option', 'update')(null, { item: $('#' + AvailableRunes._selected), sender: $('#runesInventory') });
  },
  add: async page => {
    console.log('Available Runes >> Adding perk page: ' + page.name);
    AvailableRunes.cached[page._manaMeta.id] = page;

    try {
      if (document.getElementById(page._manaMeta.id)) return;

      /* Adding automatically if max hasn't been reached */

      let canBeCreated = (Mana.user.getPerksInventory().getPerks().length - parseInt(Mana.getStore().get('perks-max', 2))) > 0;

      if (canBeCreated) {
        console.log(`Available Runes >> Adding automatically: ${page.name}`);
        return await Mana.user.getPerksInventory().createPerkPage(Mana.helpers.DataValidator.getLeagueReadablePerkPage(page));
      }
      else {
        for (let i = 0; i < parseInt(Mana.getStore().get('perks-max', 2)); i++) {
          if (Object.values(AvailableRunes.cached).find(x => x.name === Mana.user.getPerksInventory().getPerks()[i].name)) continue;
          return await Mana.user.getPerksInventory().updatePerkPage({ ...Mana.helpers.DataValidator.getLeagueReadablePerkPage(page), id: Mana.user.getPerksInventory().getPerks()[i].id });
        }
      }
    }
    catch(err) {
      console.log('Available Runes >> Something happened while injecting runes');

      if (err.error && err.error.message)
        console.log('Message:', err.error.message);
      else console.error(err);
    }

    console.log('Available Runes >> Adding to stash');
    $('#availableRunes').append(`<li id="${page._manaMeta.id}" + class="sidebar-button ui-sortable-handle"><p>${page.name}</p><button class="btn arrow ui-sortable-handle" style="float: right;width: 29px;height: 29px;margin-top: -20px;margin-right: -8px;position: relative;z-index: 1;"></button></li>`);
    $('#availableRunes').sortable('refresh');
  },
  openMenu: function(el) {
    let menu = document.getElementById(UI.sidebar.runesList._openedMenu);

    if (menu)
      menu.remove();

    menu = document.getElementById('runes-menu-copy').cloneNode(true);
    menu.id = UI.sidebar.runesList._openedMenu = el.parentElement.id + '-runes-menu';
    menu.style.top = el.parentElement.offsetTop + 'px';
    menu.style.display = 'block';

    menu.style['z-index'] = 15;

    Array.from(menu.childNodes).slice(Mana.getStore().get('perks-max')).forEach(x => x.display = 'none');
    Array.from(menu.childNodes).slice(0, Mana.getStore().get('perks-max')).forEach(x => {
      x.disabled = true;
    });

    $('#window').append(menu);
  }
};

const menu = new Menu();
menu.append(new MenuItem({ label: i18n.__('sidebar-runes-context-remove'), id: 'remove', click: AvailableRunes.remove }));
menu.append(new MenuItem({ type: 'separator' }));
//menu.append(new MenuItem({ label: i18n.__('sidebar-runes-context-transfer'), id: 'transfer', type: 'checkbox', checked: true, click: AvailableRunes.transfer }));

window.addEventListener('contextmenu', (e) => {
  if (e.target.id.startsWith('runes-') || !e.target.id.startsWith('c')) return;
  e.preventDefault();

  if (!Mana.user.isLoggedIn) return; /* Security measure in case context menu is still opened when user disconnects */
  AvailableRunes._selected = e.target.id;

  //menu.getMenuItemById('transfer').checked = Mana.user.getPerksInventory().getPerks().find(x => x.name == AvailableRunes.cached[e.target.id].name);
  //menu.getMenuItemById('transfer').enabled = !menu.getMenuItemById('transfer').checked;

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

    Mana.getStore().get('perks-max')

    $('li.sidebar-button > .btn').click(function(e) {
      e.stopPropagation();
      UI.sidebar.runesList.openMenu(this);
    });

    $(document).click(function(e) {
        let menu = document.getElementById(UI.sidebar.runesList._openedMenu);

        if (menu)
          menu.remove();
    });
  },
  inChampionSelect: function(e) {
    document.getElementById('availableRunes').style.display = 'block';
    document.getElementById('availableRunesLabel').style.display = 'block';

    if (Mana.dev) AvailableRunes.cached = {};
  },
  outChampionSelect: function(e) {
    document.getElementById('availableRunes').style.display = 'none';
    document.getElementById('availableRunesLabel').style.display = 'none';

    //Mana.user.getPerksInventory().getPerks().filter(x => Object.values(AvailableRunes.cached).find(y => y.name === x.name)).forEach(z => Mana.user.getPerksInventory().deletePerkPage(z));
    if (!Mana.dev) AvailableRunes.cached = {}; /* Leaves data in memory so we can easily lookup without starting a new game */
  },
  championChanged: function(e) {
    document.getElementById('availableRunes').childNodes.forEach(x => document.getElementById('availableRunes').removeChild(x));
    AvailableRunes.cached = {};
  },
  positionChange: function(e) {
    let { old, value } = e.detail;
    console.dir(arguments);
  }
}
