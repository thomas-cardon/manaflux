const rp = require('request-promise-native');

const ItemSetHandler = require('./ItemSetHandler');
const ProviderHandler = new (require('./ProviderHandler'))();

class ChampionSelectHandler {
  constructor() {
    this.gameModeHandlers = {
      CLASSIC: new (require('../gameModesHandlers/CLASSIC'))(this, ProviderHandler),
      ARAM: new (require('../gameModesHandlers/ARAM'))(this, ProviderHandler)
    };

    ipcRenderer.on('perks-shortcut', this.onShortcutPressedEvent);
  }

  async getSession() {
    return await rp({
      method: 'GET',
      uri: Mana.base + 'lol-champ-select/v1/session',
      resolveWithFullResponse: true,
      json: true
    });
  }

  load() {
    const self = this;
    this._checkTimer = setInterval(function() {
      if (!Mana.user) return;

      self.getSession().then(x => self.onTickEvent(x.body)).catch(err => {
        if (err.statusCode === 404) {
          if (self.inChampionSelect) return self.end();
        }
        else UI.error(err);
      });
    }, 1000);
  }

  async _devDownloadProviderData(champion, pos, mode = 'CLASSIC', cache) {
    return await ProviderHandler.getChampionData(champion, pos, mode, cache);
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
    if (newIndex !== positionIndex) $('#positions').val(keys[newIndex]).trigger('change');
  }

  async onTickEvent(data) {
    if (!this.inChampionSelect) {
      await this.onFirstTickEvent(data);
      this.inChampionSelect = true;
    }

    this.gameModeHandler.onTickEvent(data);

    if (Mana.getStore().get('champion-select-waiting-finalization-phase')) this._finalizationTick(data);
    else this._normalTick(data);
  }

  async _normalTick(data) {
    if (this._lastChampionId === this.gameModeHandler.getPlayer().championId) return;
    if ((this._lastChampionId = this.gameModeHandler.getPlayer().championId) === 0) return UI.status('champion-select-pick-a-champion');
    this.hasLoadedUI = false;

    const champion = Mana.champions[this.gameModeHandler.getPlayer().championId];

    UI.status('common-loading');
    this.gameModeHandler.onChampionChangeEvent(champion);
    this.onDisplayUpdatePreDownload(champion);

    const res = await UI.indicator(ProviderHandler.getChampionData(champion, this.gameModeHandler.getPosition(), this.gameMode, true), 'champion-select-downloading-data', champion.name);
    if (res.championId === champion.id) this.onDisplayUpdate(champion, res);
    else console.log(`[ProviderHandler] ${Mana.champions[res.championId].name}'s data is not shown because champion picked has changed`);
  }

  async _finalizationTick(data) {
    if (this._lastChampionId === this.gameModeHandler.getPlayer().championId) return;
    if (data.timer.phase !== "FINALIZATION" && !this.inFinalizationPhase) return;
    if ((this._lastChampionId = this.gameModeHandler.getPlayer().championId) === 0) return UI.status('champion-select-pick-a-champion');

    if (this.inFinalizationPhase) return;

    const champion = Mana.champions[this.gameModeHandler.getPlayer().championId];

    if (!this.hasLoadedUI) {
      this.hasLoadedUI = true;

      UI.status('common-loading');
      this.gameModeHandler.onChampionChangeEvent(champion);
      this.onDisplayUpdatePreDownload(champion);
    }

    if (data.timer.phase !== "FINALIZATION") return UI.status('champion-select-waiting-finalization-phase');
    this.inFinalizationPhase = true;

    const res = await UI.indicator(ProviderHandler.getChampionData(champion, this.gameModeHandler.getPosition(), this.gameModeHandler, true), 'champion-select-downloading-data', champion.name);
    if (res.championId === champion.id) this.onDisplayUpdate(champion, res);
    else console.log(`[ProviderHandler] ${Mana.champions[res.championId].name}'s data is not shown because champion picked has changed`);
  }

  async onFirstTickEvent(data) {
    ipcRenderer.send('champion-select-in');
    this.gameMode = await Mana.user.getGameMode();

    /* Fallback to classic mode when not available */
    this.gameModeHandler = this.gameModeHandlers[this.gameMode] ? this.gameModeHandlers[this.gameMode] : this.gameModeHandlers.CLASSIC;
    this.gameModeHandler.onFirstTickEvent(data);
  }

  onDisplayUpdatePreDownload(champion) {
    UI.status('champion-select-updating-display', champion.name);

    $('#positions').unbind().empty().hide();
    $('#loadRunes, #loadSummonerSpells').disableManualButton(true);

    UI.enableHextechAnimation(champion);
    $('button[data-tabid]').eq(0).click();

    UI.status('common-ready', champion.name);
  }

  async onDisplayUpdate(champion, res) {
    if (Object.keys(res.roles).length === 0) return console.error(i18n.__('providers-error-data'));

    Object.keys(res.roles).forEach(r => {
      if (res.roles[r].perks.length === 0) {
        UI.error('providers-error-perks', champion.name, r);
        delete res.roles[r];
      }
      else $('#positions').append(`<option value="${r}">${UI.stylizeRole(r)}</option>`);
    });

    const self = this;

    $('#buttons').show();
    $('#positions')
    .change(function() { self.onPerkPositionChange(champion, this.value.toUpperCase(), res.roles[this.value.toUpperCase()]); })
    .val(res.roles[this.gameModeHandler.getPosition()] ? this.gameModeHandler.getPosition() : Object.keys(res.roles)[0])
    .trigger('change').show();

    UI.tray(false);
    UI.status('common-ready');

    if (Mana.getStore().get('item-sets-enable')) {
      /* Delete ItemSets before downloading */
      await UI.indicator(ItemSetHandler.deleteItemSets(await UI.indicator(ItemSetHandler.getItemSetsByChampionKey(champion.key), 'item-sets-collecting-champion', champion.name)), 'item-sets-deleting');
      await UI.indicator(Promise.all([].concat(...Object.values(res.roles).map(r => r.itemsets)).map(x => x._data ? x.save() : ItemSetHandler.parse(champion.key, x, 'UNK_' + Math.floor(Math.random() * 100)).save())), 'item-sets-save-status', champion.name);
    }
  }

  onPerkPositionChange(champion, position, data) {
    UI.enableHextechAnimation(champion, data.perks[0].primaryStyleId);

    this._updatePerksDisplay(champion, position, data.perks);
    if (data.summonerspells.length > 0) this._updateSummonerSpellsDisplay(champion, position, data.summonerspells);
  }

  _updatePerksDisplay(champion, position, perks) {
    if (Mana.getStore().get('perks-automatic-load')) UI.indicator(Mana.user.getPerksInventory().updatePerksPages(perks), 'perks-loading', champion.name, position);
    else $('#loadRunes').enableManualButton(() => UI.indicator(Mana.user.getPerksInventory().updatePerksPages(perks), 'perks-loading', champion.name, position).catch(UI.error), true);
  }

  _updateSummonerSpellsDisplay(champion, position, spells) {
    if (Mana.getStore().get('summoner-spells')) $('#loadSummonerSpells').enableManualButton(() => UI.indicator(Mana.user.updateSummonerSpells(spells), 'summoner-spells-loading', champion.name, position).catch(UI.error), true);
  }

  destroyDisplay() {
    UI.status('champion-select-waiting');
    UI.disableHextechAnimation();

    $('#positions').unbind().empty().hide();
    $('#buttons').hide();

    $('#loadRunes').disableManualButton(!Mana.getStore().get('perks-automatic-load'));
    $('#loadSummonerSpells').disableManualButton(true);

    if (Mana.getStore().get('enableTrayIcon')) UI.tray();
  }

  end() {
    this.inChampionSelect = false;
    this.inFinalizationPhase = false;

    ipcRenderer.send('champion-select-out');

    this.gameModeHandler.end();

    Mana.user.getPerksInventory()._pageCount = null;
    Mana.user.getPerksInventory()._perks = null;

    this.destroyDisplay();

    ProviderHandler.onChampionSelectEnd();
  }

  stop() {
    clearInterval(this._checkTimer);
    ipcRenderer.removeAllListeners('perks-shortcut');
  }
}

module.exports = ChampionSelectHandler;
