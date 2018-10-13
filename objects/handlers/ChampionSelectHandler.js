const rp = require('request-promise-native');
const { captureException } = require('@sentry/electron');

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
    if ((this._lastChampionId = this.gameModeHandler.getPlayer().championId) === 0) return UI.status('ChampionSelect', 'champion-select-pick-a-champion');

    const champion = Mana.champions[this.gameModeHandler.getPlayer().championId];

    /* Delete ItemSets before downloading */
    await UI.loading(ItemSetHandler.deleteItemSets(await UI.loading(ItemSetHandler.getItemSetsByChampionKey(champion.key))));

    this.gameModeHandler.onChampionChangeEvent(champion);

    UI.status('ChampionSelect', 'common-loading');

    this.onDisplayUpdatePreDownload(champion);
    const res = await UI.loading(ProviderHandler.getChampionData(champion, this.gameModeHandler.getPosition(), this.gameMode, true));
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
    UI.status('ChampionSelect', 'champion-select-updating-display', champion.name);
    $('button[data-tabid]').eq(0).click();
    $('#positions').unbind().empty().hide();

    UI.enableHextechAnimation(champion);
  }

  onDisplayUpdate(champion, res) {
    UI.status('ChampionSelect', 'champion-select-updating-display', champion.name);
    if (Object.keys(res.roles).length === 0) return console.error(1, i18n.__('providers-error-data'));

    Object.keys(res.roles).forEach(r => {
      if (res.roles[r].perks.length === 0) {
        UI.error('providers-error-runes', champion.name, r);
        delete res.roles[r];
      }
      else $('#positions').append(`<option value="${r}">${UI.stylizeRole(r)}</option>`);
    });

    const self = this;

    $('#positions')
    .change(function() { self.onPerkPositionChange(champion, this.value.toUpperCase(), res.roles[this.value.toUpperCase()]); })
    .val(res.roles[this.gameModeHandler.getPosition()] ? this.gameModeHandler.getPosition() : Object.keys(res.roles)[0])
    .trigger('change').show();

    if (Mana.getStore().get('item-sets-enable')) {
      ItemSetHandler.getItemSetsByChampionKey(champion.key).then(sets => ItemSetHandler.deleteItemSets(sets).then(() => {
        UI.temporaryStatus('ChampionSelect', 'item-sets-save-status', champion.name);
        Object.values(res.roles).forEach(r => r.itemsets.forEach(x => x.save()));
      }));
    }

    $('#loadRunes, #loadSummonerSpells').disableManualButton(true);
    $('#buttons').show();

    UI.tray(false);
  }

  onPerkPositionChange(champion, position, data) {
    UI.enableHextechAnimation(champion, data.perks[0].primaryStyleId);

    this._updatePerksDisplay(data.perks);
    if (data.summonerspells.length > 0) this._updateSummonerSpellsDisplay(data.summonerspells);

    UI.status('ChampionSelect', 'champion-select-loaded', champion.name, position);
  }

  _updatePerksDisplay(perks) {
    if (Mana.getStore().get('perks-automatic-load')) UI.loading(Mana.user.getPerksInventory().updatePerksPages(perks));
    else {
      $('#loadRunes').enableManualButton(() => UI.loading(Mana.user.getPerksInventory().updatePerksPages(perks))
        .catch(err => {
          UI.error(err);
          captureException(err);
        }), true);
    }

    UI.temporaryStatus('ChampionSelect', 'runes-loaded');
  }

  _updateSummonerSpellsDisplay(spells) {
    if (Mana.getStore().get('summoner-spells')) $('#loadSummonerSpells').enableManualButton(() => UI.loading(Mana.user.updateSummonerSpells(spells)).catch(err => { UI.error(err); captureException(err); }), true);
    UI.temporaryStatus('ChampionSelect', 'summoner-spells-loaded');
  }

  destroyDisplay() {
    UI.status('ChampionSelect', 'champion-select-waiting');
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
