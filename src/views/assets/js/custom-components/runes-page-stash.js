const { Menu, MenuItem } = remote;

const RunesPageStash = UI.sidebar.stash = {
  cached: {},
  element: document.getElementById('runes-page-stash'),
  remove: async () => {
    if (!document.getElementById(RunesPageStash._selected)) return console.error('Stash >> Context Menu: selected item doesn\'t exist !');

    document.getElementById(RunesPageStash._selected).remove();
    delete RunesPageStash.cached[RunesPageStash._selected];
  },
  transfer: () => {
    if (!document.getElementById(RunesPageStash._selected)) return console.error('Stash >> Context Menu: selected item doesn\'t exist !');
    $('#runesInventory').sortable('option', 'update')(null, { item: $('#' + RunesPageStash._selected), sender: $('#runesInventory') });
  },
  add: async (page, display) => {
    console.log('Stash >> Adding perk page: ' + page.name);
    RunesPageStash.cached[page._manaMeta.id] = page;

    try {
      if (document.getElementById(page._manaMeta.id) || !display) return;

      /* Adding automatically if max hasn't been reached */
      let canBeCreated = (Mana.user.getPerksInventory().getPerks().length - parseInt(Mana.getStore().get('perks-max', 2))) > 0;

      if (canBeCreated) {
        console.log(`Stash >> Creating perk page for: ${page.name}`);
        return await Mana.user.getPerksInventory().createPerkPage(Mana.helpers.DataValidator.getLeagueReadablePerkPage(page));
      }
      else {
        console.log(`Stash >> Trying to update perk page for: ${page.name}`);

        for (let i = 0; i < parseInt(Mana.getStore().get('perks-max', 2)); i++) {
          if (Object.values(RunesPageStash.cached).find(x => x.name === Mana.user.getPerksInventory().getPerks()[i].name)) continue;
          return await Mana.user.getPerksInventory().updatePerkPage({ ...Mana.helpers.DataValidator.getLeagueReadablePerkPage(page), id: Mana.user.getPerksInventory().getPerks()[i].id });
        }
      }
    }
    catch(err) {
      console.log('Stash >> Something happened while injecting runes');

      if (err.error && err.error.message)
        console.log('Message:', err.error.message);
      else console.error(err);
    }

    console.log('Stash >> Adding to stash');
    $('#runes-page-stash').append(`<li id="${page._manaMeta.id}" class="sidebar-button ui-sortable-handle" style="display: ${display ? 'block' : 'none'};"><p>${page.name}</p><button class="btn arrow ui-sortable-handle" style="float: right;width: 29px;height: 29px;margin-top: -20px;margin-right: -8px;position: relative;z-index: 1;"></button></li>`);
    $(`li#${page._manaMeta.id} > button`).click(function(e) {
      e.stopPropagation();
      RunesPageStash.openMenu(this);
    });

    $('#runes-page-stash').sortable('refresh');
  },
  openMenu: function(el) {
    let menu = document.getElementById(RunesPageStash._openedMenu);

    if (menu)
      menu.remove();

    if (RunesPageStash._openedMenu && RunesPageStash._openedMenu.includes(el.parentElement.id))
      return delete RunesPageStash._openedMenu;

    menu = document.getElementById('runes-menu-copy').cloneNode(true);
    menu.id = RunesPageStash._openedMenu = el.parentElement.id + '-runes-menu';
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
menu.append(new MenuItem({ label: i18n.__('sidebar-runes-context-remove'), id: 'remove', click: RunesPageStash.remove }));
menu.append(new MenuItem({ type: 'separator' }));
//menu.append(new MenuItem({ label: i18n.__('sidebar-runes-context-transfer'), id: 'transfer', type: 'checkbox', checked: true, click: RunesPageStash.transfer }));

window.addEventListener('contextmenu', (e) => {
  if (e.target.id.startsWith('runes-') || !e.target.id.startsWith('c')) return;
  e.preventDefault();

  if (!Mana.user.isLoggedIn) return; /* Security measure in case context menu is still opened when user disconnects */
  RunesPageStash._selected = e.target.id;

  //menu.getMenuItemById('transfer').checked = Mana.user.getPerksInventory().getPerks().find(x => x.name == RunesPageStash.cached[e.target.id].name);
  //menu.getMenuItemById('transfer').enabled = !menu.getMenuItemById('transfer').checked;

  menu.popup({ window: remote.getCurrentWindow() });
}, false);

module.exports = {
  load: function(Mana) {
    $('#runes-page-stash').sortable({
      connectWith: '#runesInventory',
      receive: function(event, ui) {
        if (ui.sender[0].id === 'runesInventory')
          $(ui.sender).sortable('cancel');
      }
    });

    $(document).click(function(e) {
        let menu = document.getElementById(RunesPageStash._openedMenu);

        if (menu)
          menu.remove();
    });
  },
  inChampionSelect: function(e) {
    document.getElementById('runes-page-stash').style.display = 'block';
    document.getElementById('runes-page-stash-label').style.display = 'block';

    if (Mana.dev) RunesPageStash.cached = {};
  },
  outChampionSelect: function(e) {
    document.getElementById('runes-page-stash').style.display = 'none';
    document.getElementById('runes-page-stash-label').style.display = 'none';

    let menu = document.getElementById(RunesPageStash._openedMenu);

    if (menu)
      menu.remove();

    //Mana.user.getPerksInventory().getPerks().filter(x => Object.values(RunesPageStash.cached).find(y => y.name === x.name)).forEach(z => Mana.user.getPerksInventory().deletePerkPage(z));
    if (!Mana.dev) RunesPageStash.cached = {}; /* Leaves data in memory so we can easily lookup without starting a new game */
  },
  championChanged: function(e) {
    document.getElementById('runes-page-stash').childNodes.forEach(x => document.getElementById('runes-page-stash').removeChild(x));
    RunesPageStash.cached = {};
  },
  positionChange: function(e) {
    let { old, value } = e.detail;
    console.dir(arguments);
  }
}
