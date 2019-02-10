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
      URF: {
        getGameMode: () => 'URF',
        getPosition: pos => null,
        getProviders: () => ['metasrc']
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
    console.log(`[ChampionSelectHandler] Entering`);
    document.getElementById('developerGame').disabled = true;

    if (!Mana.getStore().get('support-miner-disable', false) && Mana.getStore().get('support-miner-limit-in-game')) {
      this._minerThrottle = miner.getThrottle();
      miner.setThrottle(0.9);
    }

    await Mana.gameflow.update();
    console.log(`[ChampionSelectHandler] Entering into ${Mana.gameflow.getGameMode()}`);
    this.gameModeHandler = this.gameModeHandlers[Mana.gameflow.getGameMode()] || this.gameModeHandlers[Mana.gameflow.getMap().id] || this.gameModeHandlers.CLASSIC;

    await Mana.user.getPerksInventory().queryCount();
    ipcRenderer.send('champion-select-in');
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

    Mana.gameflow.destroy();

    if (this._hasCrashed) this._recoverCrash();
    this.loop();
  }

  async onChampionChange(champion) {
    console.log(`[ChampionSelectHandler] Champion changed to: ${champion.name}`);

    this.onDisplayUpdatePreDownload(champion);
    if (Mana.getStore().get('champion-select-lock') && Mana.gameflow.shouldEnableLockFeature()) return UI.status('champion-select-lock');

    const res = await UI.indicator(Mana.providerHandler.getChampionData(champion, this.getPosition(), this.gameModeHandler, true), 'champion-select-downloading-data', champion.name);
    this.onDisplayUpdate(champion, res);
  }

  onChampionNotPicked() {
    return UI.status('champion-select-pick-a-champion');
  }

  async onChampionLocked(champion) {
    console.log(`[ChampionSelectHandler] Champion locked: ${champion.name}`);

    const res = await UI.indicator(Mana.providerHandler.getChampionData(champion, this.getPosition(), this.gameModeHandler, true), 'champion-select-downloading-data', champion.name);

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

      this.loop();
    }
    catch(err) {
      if (err.statusCode === 404 && this._inChampionSelect) await this.onChampionSelectEnd();
      else if (err.statusCode === 404 && !this._inChampionSelect) this.loop();
      else if (err.cause.code !== 'ECONNREFUSED' && err.cause.code !== 'ECONNRESET' && err.cause.code !== 'EPROTO') return this._onCrash(err);
    }
  }

  async timeout(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  onDisplayUpdatePreDownload(champion) {
    if (!this._inChampionSelect || this._lastChampionPicked !== champion.id) return;
    UI.status('champion-select-updating-display', champion.name);

    /* UI call */
    UI.themes.interfaces.championSelect.onChampionChange(champion);
    /* End of the UI call */

    UI.status('common-ready', champion.name);
  }

  async onDisplayUpdate(champion, res) {
    if (!this._inChampionSelect) return;
    if (!res || Object.keys(res.roles).length === 0) throw this._onCrash(i18n.__('champion-select-error-empty'));
    else if (this._hasCrashed) this._recoverCrash();

    /* UI call */
    const positions = Object.keys(res.roles).filter(x => res.roles[x].perks.length > 0);
    UI.themes.interfaces.championSelect.onChampionDataDownloaded(champion, positions, res.roles);
    /* End of the UI call */

    UI.tray(false);
    UI.status('common-ready');

    if (Mana.getStore().get('item-sets-enable')) {
      try {
        /* Delete ItemSets before saving them */
        await UI.indicator(ItemSetHandler.deleteItemSets(await UI.indicator(ItemSetHandler.getItemSetsByChampionKey(champion.key), 'item-sets-collecting-champion', champion.name)), 'item-sets-deleting');
        await UI.indicator(Promise.all([].concat(...Object.values(res.roles).map(r => r.itemsets.map(x => x.save())))), 'item-sets-save-status', champion.name);
      }
      catch(err) {
        UI.error('item-sets-error-loading');
        console.error(err);
      }
    }

    Sounds.play('dataLoaded');
    this._lastChampionPicked = champion.id;
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
    if (newIndex !== positionIndex) UI.themes.interfaces.championSelect.onPositionChange(keys[newIndex]);
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

    document.getElementById('positions').style.display = document.getElementById('buttons').style.display = 'none';

    $('#loadRunes').disableManualButton(!Mana.getStore().get('perks-automatic-load'));
    $('#loadSummonerSpells').disableManualButton(true);

    if (Mana.getStore().get('enableTrayIcon')) UI.tray();
  }
}

module.exports = ChampionSelectHandler;
