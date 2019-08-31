const rp = require('request-promise-native');
const ItemSetHandler = require('./ItemSetHandler');

class ChampionSelectHandler {
  constructor() {
    this._inChampionSelect = false;
    this.gameModeHandlers = {
      CLASSIC: {
        getGameMode: () => 'CLASSIC',
        getRole: pos => {
          switch(pos) {
            case 'UTILITY':
              return 'SUPPORT';
            case 'BOTTOM':
              return 'ADC';
            case '':
              return null;
            default:
              return pos;
          }
        },
        getProviders: () => null
      },
      ARAM: {
        getGameMode: () => 'ARAM',
        getRole: pos => null,
        getProviders: () => ['metasrc', 'lolflavor', 'leagueofgraphs']
      },
      URF: {
        getGameMode: () => 'URF',
        getRole: pos => null,
        getProviders: () => ['opgg_urf', 'metasrc']
      },
      '10': {
        getGameMode: () => 'TWISTED_TREELINE',
        getRole: pos => null,
        getMap: map => 10,
        getProviders: () => ['metasrc']
      }
    };

    document.getElementById('roles').onfocus = function() {
      this.oldValue = this.value;
    }

    document.getElementById('roles').onchange = function() {
      console.log('[ChampionSelect] Selected role:', this.value.toUpperCase());
      Mana.emit('roleChange', { old: this.oldValue, value: this.value });

      this.oldValue = this.value;
    };

    ipcRenderer.on('perks-shortcut', this.onShortcutPressedEvent);
  }

  async onChampionSelectStart() {
    console.log(`[ChampionSelectHandler] Entering champion select`);
    document.getElementById('developerGame').disabled = true;

    await Mana.gameflow.update();
    console.log(`[ChampionSelectHandler] Entering into ${Mana.gameflow.getGameMode()}`);

    if (Mana.gameflow.getGameMode() === 'TFT') return UI.status('status-tft');

    this.gameModeHandler = this.gameModeHandlers[Mana.gameflow.getGameMode()] || this.gameModeHandlers[Mana.gameflow.getMap().id] || this.gameModeHandlers.CLASSIC;

    await Mana.user.getPerksInventory().queryCount();
    ipcRenderer.send('champion-select-in');

    Mana.emit('inChampionSelect');
  }

  async onChampionSelectEnd() {
    console.log(`[ChampionSelectHandler] Leaving champion select`);
    document.getElementById('developerGame').disabled = false;

    this._inChampionSelect = false;
    this._lastChampionPicked = this._locked = null;

    ipcRenderer.send('champion-select-out');

    Mana.user.getPerksInventory()._pageCount = null;

    this.destroyDisplay();

    Mana.providerHandler.onChampionSelectEnd();
    Mana.gameflow.destroy();

    if (this._hasCrashed) this._recoverCrash();
    this.loop();

    Mana.emit('outChampionSelect');
  }

  async onChampionChange(champion) {
    console.log(`[ChampionSelectHandler] Champion changed to: ${champion.name}`);
    if (Mana.gameflow.getGameMode() === 'TFT') return UI.status('status-tft');

    this.onDisplayUpdatePreDownload(champion);
    if (Mana.getStore().get('champion-select-lock') && Mana.gameflow.shouldEnableLockFeature()) return UI.status('champion-select-lock');

    Mana.emit('championChanged', champion);

    UI.indicator(Mana.providerHandler.getChampionData(champion, this.getRole(), this.gameModeHandler, true), 'champion-select-downloading-data', champion.name);
  }

  onChampionNotPicked() {
    return UI.status('champion-select-pick-a-champion');
  }

  async onChampionLocked(champion) {
    console.log(`[ChampionSelectHandler] Champion locked: ${champion.name}`);

    const res = await UI.indicator(Mana.providerHandler.getChampionData(champion, this.getRole(), this.gameModeHandler, true), 'champion-select-downloading-data', champion.name);

    if (res.championId !== champion.id) UI.status('champion-select-error-invalid-data-status');
    else await this.onDisplayUpdate(champion, res);
  }

  async _handleTick(session) {
    this._timer = session.timer;
    this._myTeam = session.myTeam;
    this._theirTeam = session.theirTeam;

    if (!this._inChampionSelect) {
      this._inChampionSelect = true;
      await this.onChampionSelectStart();
    }
    else if (this.getPlayer().championId === 0) return this.onChampionNotPicked();
    else if (this._lastChampionPicked !== this.getPlayer().championId) {
      this._lastChampionPicked = this.getPlayer().championId;
      return await this.onChampionChange(Mana.gameClient.champions[this.getPlayer().championId]);
    }
    else if (!this._locked && Mana.getStore().get('champion-select-lock') && Mana.gameflow.shouldEnableLockFeature()) {
      if (this._locked = await this.isChampionLocked())
        return await this.onChampionLocked(Mana.gameClient.champions[this.getPlayer().championId]);
    }
  }

  getRole() {
    return this.getPlayer().assignedRole === '' ? null : this.gameModeHandler.getRole(this.getPlayer().assignedRole) || this.getPlayer().assignedRole;
  }

  getPlayer() {
    return this._myTeam.find(x => x.summonerId === Mana.user.getSummonerId());
  }

  async getSession() {
    return await rp({
      method: 'GET',
      uri: Mana.base + 'lol-champ-select/v1/session',
      resolveWithFullResponse: true,
      json: true
    });
  }

  async isChampionLocked() {
    try {
      let x = await rp({
        method: 'GET',
        uri: Mana.base + 'lol-champ-select/v1/current-champion',
        resolveWithFullResponse: true,
        json: false
      });

      if (x.body == 0) return false;
      return true;
    }
    catch(err) {
      if (err.statusCode === 404) return false;
      else throw err;
    }
  }

  async loop() {
    if (!Mana.user) return console.log('[ChampionSelectHandler] Stopped loop since Mana.user doesn\'t exist');
    await this.timeout(1000);

    try {
      const session = await this.getSession();
      await this._handleTick(session.body);

      this.loop();
    }
    catch(err) {
      if (err.statusCode === 404 && this._inChampionSelect) await this.onChampionSelectEnd();
      else if (err.statusCode === 404 && !this._inChampionSelect) this.loop();
      else if (!err.cause || err.cause.code !== 'ECONNREFUSED' && err.cause.code !== 'ECONNRESET' && err.cause.code !== 'EPROTO') throw err;
    }
  }

  async timeout(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  onDisplayUpdatePreDownload(champion) {
    console.log(3, 'ChampionSelectHandler >> Display Update PreDownload');

    if (!this._inChampionSelect || this._lastChampionPicked !== champion.id) return;
    UI.status('champion-select-updating-display', champion.name);

    document.getElementById('buttons').style.display = 'none';

    $('#loadSummonerSpells').disableManualButton(true);

    UI.enableHextechAnimation(champion);
    document.querySelector('button[data-tabid]').click();

    if (Mana.getStore().get('item-sets-enable'))
      UI.indicator(ItemSetHandler.getItemSetsByChampionKey(champion.key), 'item-sets-collecting-champion', champion.name, 'item-sets-deleting')
      .then(d => ItemSetHandler.deleteItemSets(d).then(() => UI.status('common-ready', champion.name)))
      .catch(err => {
        UI.error('item-sets-error-loading');
        console.error(err);
      })
  }

  async onDisplayUpdate(champion, res) {
    console.log(3, 'ChampionSelectHandler >> Display Update');

    if (!this._inChampionSelect) return;
    if (!res || Object.keys(res.roles).length === 0) return;

    this._lastChampionPicked = champion.id;

    const self = this;

    // Sets value and checks if it's not null, if it is then let's stop everything
    if (!(document.getElementById('roles').value = res.roles[this.getRole()] ? this.gameModeHandler.getRole(this.getRole()) : Object.keys(res.roles).filter(x => res.roles[x].perks.length > 0)[0])) {
      Mana.championStorageHandler.remove(champion.id);
      throw this._onCrash(i18n.__('champion-select-error-empty'));
    }

    UI.tray(false);
  }

  async onDataReceived(d) {
    console.log('ChampionSelectHandler >> Received data');
    console.dir(3, d);

    console.log('ChampionSelectHandler >> Loading perk pages');

    for (const [role, data] of Object.entries(d.roles))
      await Mana.championSelectHandler.treatPerkPages(role, data.perks);

    if (Mana.getStore().get('item-sets-enable')) {
      try {
        /* Delete ItemSets before downloading */
        await UI.indicator(Promise.all([].concat(...Object.values(d.roles).map(r => r.itemsets.map(x => x.save())))), 'item-sets-save-status', champion.name);
      }
      catch(err) {
        UI.error('item-sets-error-loading');
        console.error(err);
      }
    }

    UI.status('common-ready');
    Sounds.play('dataLoaded');
  }

  async treatPerkPages(role, perks) {
    if (!document.getElementById('role-' + role)) return console.error(`ChampionSelectHandler >> Role ${role} doesn\'t exist!`);

    document.getElementById('role-' + role).style.display = '';

    for (let perk of perks)
      await UI.sidebar.stash.add(perk);

    document.getElementById('roles').style.display = 'unset';
    document.getElementById('buttons').style.display = 'block';
  }

  onPerkRoleChange(champion, role, data) {
    UI.enableHextechAnimation(champion, (data && data.perks && data.perks[0]) ? data.perks[0].primaryStyleId : 'white');

    $('#loadSummonerSpells').disableManualButton(true);

    if (data.summonerspells.length > 0) this._updateSummonerSpellsDisplay(champion, role, data.summonerspells);
  }

  _updateSummonerSpellsDisplay(champion, role, spells) {
    if (Mana.getStore().get('summoner-spells')) $('#loadSummonerSpells').enableManualButton(() => UI.indicator(Mana.user.updateSummonerSpells(spells), 'summoner-spells-loading', champion.name, role).catch(UI.error), true);
  }

  onShortcutPressedEvent(event, next) {
    if (document.getElementById('roles').style.display === 'none') return;
    console.log(2, `[Shortcuts] Selecting ${next ? 'next' : 'previous'} role..`);

    let i = document.getElementById('roles').childNodes.length, roleIndex = document.getElementById('roles').selectedIndex;
    let newIndex = roleIndex;

    if (next) {
      if (newIndex === i - 1) newIndex = 0;
      else newIndex++;
    }
    else {
      if (newIndex === 0) newIndex = i - 1;
      else newIndex--;
    }

    /* Useless to change role if it's already the one chosen */
    if (newIndex !== roleIndex) {
      document.getElementById('roles').selectedIndex = newIndex;
      document.getElementById('roles').onchange();
    };
  }

  _onCrash(error) {
    this._hasCrashed = true;
    UI.tray(false);

    document.getElementById('home').innerHTML += `<div id="crash"><center><p style="margin-top: 18%;width:95%;color: #c0392b;"><span style="color: #b88d35;">${i18n.__('champion-select-internal-error')}</span><br><br>${error}</p><p class="suboption-name">${i18n.__('settings-restart-app')}</p><button class="btn normal" onclick="ipcRenderer.send('restart')">${i18n.__('settings-restart-app-button')}</button></center></div>`;
    console.error(error);

    return Error(error);
  }

  _recoverCrash() {
    document.getElementById('crash').remove();
  }

  destroyDisplay() {
    UI.status('champion-select-waiting');
    UI.disableHextechAnimation();

    document.getElementById('roles').style.display = document.getElementById('buttons').style.display = 'none';
    Array.from(document.getElementById('roles').childNodes).filter(x => x.nodeName === 'OPTION').forEach(x => x.style.display = 'none');

    $('#loadSummonerSpells').disableManualButton(true);

    if (Mana.getStore().get('enableTrayIcon')) UI.tray();
  }
}

module.exports = ChampionSelectHandler;
