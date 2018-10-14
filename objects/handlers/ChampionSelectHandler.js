const rp = require('request-promise-native');

const ItemSetHandler = require('./ItemSetHandler');
const ProviderHandler = new (require('./ProviderHandler'))();

class ChampionSelectHandler {
  constructor() {
    this.gameModeHandlers = {
      CLASSIC: new (require('../gameModesHandlers/CLASSIC'))(this, ProviderHandler),
      ARAM: new (require('../gameModesHandlers/ARAM'))(this, ProviderHandler)
    };

    this.cachedPerks = {};
  }

  async _devDownloadProviderData(champion, pos, mode = 'CLASSIC', cache) {
    return await ProviderHandler.getChampionData(champion, pos, mode, cache);
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

  async getSession() {
    return await rp({
      method: 'GET',
      uri: Mana.base + 'lol-champ-select/v1/session',
      resolveWithFullResponse: true,
      json: true
    });
  }

  async onTickEvent(data) {
    if (!this.inChampionSelect) {
      await this.onFirstTickEvent(data);
      this.inChampionSelect = true;
    }

    this.gameModeHandler.onTickEvent(data);

    if (this._lastChampionId === this.gameModeHandler.getPlayer().championId) return;
    if ((this._lastChampionId = this.gameModeHandler.getPlayer().championId) === 0) return UI.status('champion-select-pick-a-champion');
    UI.status('common-loading');

    const champion = Mana.champions[this.gameModeHandler.getPlayer().championId];

    this.gameModeHandler.onChampionChangeEvent(champion);
    this.onDisplayUpdatePreDownload(champion);

    const res = await UI.indicator(ProviderHandler.getChampionData(champion, this.gameModeHandler.getPosition(), this.gameMode, true), 'champion-select-downloading-data', champion.name);
    this.onDisplayUpdate(champion, res);
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
      await UI.indicator(Promise.all(Object.values(res.roles).map(r => r.itemsets.map(x => x.save()))), 'item-sets-save-status', champion.name);
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
    this.cachedPerks = {};

    ipcRenderer.send('champion-select-out');

    this.gameModeHandler.end();

    Mana.user.getPerksInventory()._pageCount = null;
    Mana.user.getPerksInventory()._perks = null;

    this.destroyDisplay();
  }

  stop() {
    clearInterval(this._checkTimer);
  }
}

module.exports = ChampionSelectHandler;
