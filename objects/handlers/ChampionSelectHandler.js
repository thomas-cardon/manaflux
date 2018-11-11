const rp = require('request-promise-native');
const ItemSetHandler = require('./ItemSetHandler');

class ChampionSelectHandler {
  constructor() {
    this.gameModeHandlers = {
      CLASSIC: {
        getGameMode: () => 'CLASSIC',
        getPosition: pos => {
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
        getPosition: pos => null,
        getProviders: () => ['metasrc', 'lolflavor', 'leagueofgraphs']
      },
      '10': {
        getGameMode: () => 'TWISTED_TREELINE',
        getPosition: pos => null,
        getMap: map => 10,
        getProviders: () => ['metasrc']
      }
    };

    ipcRenderer.on('perks-shortcut', this.onShortcutPressedEvent);
  }

  async onChampionSelectStart() {
    ipcRenderer.send('champion-select-in');
    document.getElementById('developerGame').disabled = true;

    await Mana.user.queryChatDetails();

    console.log(`[ChampionSelectHandler] Entering into ${Mana.user.getGameMode()}`);
    Mana.user.getPerksInventory().getCount();

    /* Fallback to classic mode when not available */
    this.gameModeHandler = this.gameModeHandlers[Mana.user.getGameMode()] ? this.gameModeHandlers[Mana.user.getGameMode()] : this.gameModeHandlers[Mana.user.getMapId()] ? this.gameModeHandlers[Mana.user.getMapId()] : this.gameModeHandlers.CLASSIC;

    if (!Mana.getStore().get('support-miner-disable', true) && Mana.getStore().get('support-miner-limit-in-game')) {
      this._minerThrottle = miner.getThrottle();
      miner.setThrottle(0.9);
    }
  }

  async onChampionSelectEnd() {
    console.log(`[ChampionSelectHandler] Leaving`);
    document.getElementById('developerGame').disabled = false;

    this._inChampionSelect = false;
    this._lastChampionPicked = this._locked = null;

    ipcRenderer.send('champion-select-out');

    Mana.user.getPerksInventory()._pageCount = null;

    this.destroyDisplay();

    Mana.providerHandler.onChampionSelectEnd();

    if (this._minerThrottle) miner.setThrottle(this._minerThrottle);
  }

  async onChampionChange(champion) {
    console.log(`[ChampionSelectHandler] Champion changed to: ${champion.name}`);

    this.onDisplayUpdatePreDownload(champion);
    if (Mana.getStore().get('champion-select-lock')) return UI.status('champion-select-lock');

    const res = await UI.indicator(Mana.providerHandler.getChampionData(champion, this.getPosition(), this.gameModeHandler, true), 'champion-select-downloading-data', champion.name);
    this.onDisplayUpdate(champion, res);
  }

  async onChampionNotPicked() {
    return UI.status('champion-select-pick-a-champion');
  }

  async onChampionLocked(champion) {
    console.log(`[ChampionSelectHandler] Champion locked: ${champion.name}`);
    if (!Mana.getStore().get('champion-select-lock')) return;

    const res = await UI.indicator(Mana.providerHandler.getChampionData(champion, this.getPosition(), this.gameModeHandler, true), 'champion-select-downloading-data', champion.name);
    this.onDisplayUpdate(champion, res);
  }

  async _handleTick(session) {
    this._timer = session.timer;
    this._myTeam = session.myTeam;
    this._theirTeam = session.theirTeam;

    if (!this._inChampionSelect) {
      await this.onChampionSelectStart();
      this._inChampionSelect = true;
    }

    if (this.getPlayer().championId === 0) await this.onChampionNotPicked();
    else if (this._lastChampionPicked !== this.getPlayer().championId) {
      this._lastChampionPicked = this.getPlayer().championId;
      await this.onChampionChange(Mana.champions[this.getPlayer().championId]);
    }
    else if (!this._locked) {
      if (this._locked = await this.isChampionLocked()) {
        await this.onChampionLocked(Mana.champions[this.getPlayer().championId]);
      }
    }
  }

  getPosition() {
    return this.getPlayer().assignedPosition === '' ? null : this.gameModeHandler.getPosition(this.getPlayer().assignedPosition) || this.getPlayer().assignedPosition;
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
    }
    catch(err) {
      if (err.statusCode === 404 && this._inChampionSelect) await this.onChampionSelectEnd();
      else if (err.statusCode !== 404 && err.error.code !== 'ECONNREFUSED' && err.error.code !== 'ECONNRESET') return this._onCrash(UI.error(err));
      else this.loop();
    }

    this.loop();
  }

  async timeout(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  onDisplayUpdatePreDownload(champion) {
    if (!this._inChampionSelect) return;
    UI.status('champion-select-updating-display', champion.name);

    document.getElementById('buttons').style.display = 'none';
    while (document.getElementById('positions').firstChild) {
      document.getElementById('positions').removeChild(document.getElementById('positions').firstChild);
    }

    $('#loadRunes, #loadSummonerSpells').disableManualButton(true);

    UI.enableHextechAnimation(champion);
    document.querySelector('button[data-tabid]').click();

    UI.status('common-ready', champion.name);
  }

  async onDisplayUpdate(champion, res) {
    if (!this._inChampionSelect) return;
    if (!res || Object.keys(res.roles).length === 0) throw this._onCrash(i18n.__('champion-select-error-empty'));

    console.dir(res);

    document.getElementById('positions').innerHTML = '';
    Object.keys(res.roles).filter(x => res.roles[x].perks.length > 0).forEach(r => {
      console.log('[ChampionSelect] Added position:', r);
      document.getElementById('positions').innerHTML += `<option value="${r}">${UI.stylizeRole(r)}</option>`;
    });

    const self = this;

    document.getElementById('positions').onchange = function() {
      console.log('[ChampionSelect] Selected position:', this.value.toUpperCase());
      self.onPerkPositionChange(champion, this.value.toUpperCase(), res.roles[this.value.toUpperCase()]);
    };

    // Sets value and checks if it's not null, if it is then let's stop everything
    if (!(document.getElementById('positions').value = res.roles[this.getPosition()] ? this.gameModeHandler.getPosition(this.getPosition()) : Object.keys(res.roles).filter(x => res.roles[x].perks.length > 0)[0])) {
      Mana.championStorageHandler.remove(champion.id);
      throw this._onCrash(i18n.__('champion-select-error-empty'));
    }

    document.getElementById('positions').onchange();
    document.getElementById('positions').style.display = 'unset';

    document.getElementById('buttons').style.display = 'block';

    UI.tray(false);
    UI.status('common-ready');

    if (Mana.getStore().get('item-sets-enable')) {
      try {
        /* Delete ItemSets before downloading */
        await UI.indicator(ItemSetHandler.deleteItemSets(await UI.indicator(ItemSetHandler.getItemSetsByChampionKey(champion.key), 'item-sets-collecting-champion', champion.name)), 'item-sets-deleting');
        await UI.indicator(Promise.all([].concat(...Object.values(res.roles).map(r => r.itemsets.map(x => x.save())))), 'item-sets-save-status', champion.name);
      }
      catch(err) {
        UI.error('item-sets-error-loading');
        console.error(err);
      }
    }

    Sounds.play('dataLoaded');
  }

  onPerkPositionChange(champion, position, data) {
    UI.enableHextechAnimation(champion, (data && data.perks && data.perks[0]) ? data.perks[0].primaryStyleId : 'white');

    $('#loadRunes, #loadSummonerSpells').disableManualButton(true);

    if (data.perks.length > 0) this._updatePerksDisplay(champion, position, data.perks);
    if (data.summonerspells.length > 0) this._updateSummonerSpellsDisplay(champion, position, data.summonerspells);
  }

  _updatePerksDisplay(champion, position, perks) {
    if (Mana.getStore().get('perks-automatic-load')) UI.indicator(Mana.user.getPerksInventory().updatePerksPages(perks), 'perks-loading', champion.name, position);
    else $('#loadRunes').enableManualButton(() => UI.indicator(Mana.user.getPerksInventory().updatePerksPages(perks), 'perks-loading', champion.name, position).catch(UI.error), true);
  }

  _updateSummonerSpellsDisplay(champion, position, spells) {
    if (Mana.getStore().get('summoner-spells')) $('#loadSummonerSpells').enableManualButton(() => UI.indicator(Mana.user.updateSummonerSpells(spells), 'summoner-spells-loading', champion.name, position).catch(UI.error), true);
  }

  onShortcutPressedEvent(event, next) {
    if (document.getElementById('positions').style.display === 'none') return;
    console.log(2, `[Shortcuts] Selecting ${next ? 'next' : 'previous'} position..`);

    const keys = Array.from(document.getElementById('positions').childNodes).map(x => x.value);
    let i = keys.length, positionIndex = keys.indexOf(document.getElementById('positions').value);
    let newIndex = positionIndex;

    if (next) {
      if (newIndex === i - 1) newIndex = 0;
      else newIndex++;
    }
    else {
      if (newIndex === 0) newIndex = i - 1;
      else newIndex--;
    }

    /* Useless to change position if it's already the one chosen */
    if (newIndex !== positionIndex) {
      document.getElementById('positions').value = keys[newIndex];
      document.getElementById('positions').onchange();
    };
  }

  _onCrash(error) {
    document.getElementById('home').innerHTML += `<div id="crash"><p style="margin-top: 23%;color: #c0392b;">${error}</p><p class="suboption-name">${i18n.__('settings-restart-app')}</p><button class="btn normal" onclick="ipcRenderer.send('restart')">${i18n.__('settings-restart-app-button')}</button></div>`;
    return Error(error);
  }

  _cancelCrash() {
    document.getElementById('crash').remove();
  }

  destroyDisplay() {
    UI.status('champion-select-waiting');
    UI.disableHextechAnimation();

    document.getElementById('positions').style.display = document.getElementById('buttons').style.display = 'none';

    $('#loadRunes').disableManualButton(!Mana.getStore().get('perks-automatic-load'));
    $('#loadSummonerSpells').disableManualButton(true);

    if (Mana.getStore().get('enableTrayIcon')) UI.tray();
  }
}

module.exports = ChampionSelectHandler;
