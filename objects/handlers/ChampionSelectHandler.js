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

  load() {
    const self = this;
    this._checkTimer = setInterval(function() {
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
    await ItemSetHandler.deleteItemSets(await ItemSetHandler.getItemSetsByChampionKey(champion.key));

    this.gameModeHandler.onChampionChangeEvent(champion);

    UI.status('ChampionSelect', 'common-loading');
    const res = await ProviderHandler.getChampionData(champion, this.gameModeHandler.getPosition(), this.gameMode);
    this.updateDisplay(champion, res);
  }

  async onFirstTickEvent(data) {
    ipcRenderer.send('champion-select-in');
    log.dir(3, data);

    this.gameMode = await Mana.user.getGameMode();

    /* Fallback to classic mode when not available */
    this.gameModeHandler = this.gameModeHandlers[this.gameMode] ? this.gameModeHandlers[this.gameMode] : this.gameModeHandlers.CLASSIC;
    this.gameModeHandler.onFirstTickEvent(data);
  }

  updateDisplay(champion, res) {
    UI.status('ChampionSelect', 'champion-updating-display', champion.name);

    $('#positions').unbind().empty().hide();

    ipcRenderer.removeAllListeners('runes-previous');
    ipcRenderer.removeAllListeners('runes-next');

    if (Object.keys(res).length === 0) return log.error(1, i18n.__('providers-error-data'));
    console.dir(res);

    for (let position in res) {
      if (res[position].runes.length === 0) {
        UI.error('providers-error-runes', champion.name, position);
        delete res[position];
      }
      else $('#positions').append(`<option value="${position}">${position === 'ADC' ? 'ADC' : position.charAt(0).toUpperCase() + position.slice(1) }</option>`)
    }

    const onPerkPositionChange = this.onPerkPositionChange;

    $('#positions').change(function() {
      onPerkPositionChange(champion, this.value.toUpperCase(), res[this.value.toUpperCase()].runes);
    });

    if (Mana.getStore().get('itemsets-enable')) {
      ItemSetHandler.getItemSetsByChampionKey(champion.key).then(sets => ItemSetHandler.deleteItemSets(sets).then(() => {
        UI.status('ChampionSelect', 'itemsets-save-status', champion.name);

        for (let position in res)
          for (const set of res[position].itemsets)
            set.save();
      }));
    }

    $('#positions').val(res[this.gameModeHandler.getPosition()] ? this.gameModeHandler.getPosition() : Object.keys(res)[0]).trigger('change').show();
    UI.tray(false);
  }

  onPerkPositionChange(champion, position, perks) {
    $('button#loadRunes, button#loadSummonerSpells').disableManualButton();

    /* Hextech Animation */
    if (Mana.getStore().get('ui-animations-enable'))
      UI.enableHextechAnimation(champion, perks[0].primaryStyleId);

    /* Perks display */
    if (Mana.getStore().get('runes-automatic-load')) Mana.user.getPerksInventory().updatePerksPages(perks);
    else {
      $('button#loadRunes').enableManualButton(() => Mana.user.getPerksInventory().updatePerksPages(perks)
        .catch(err => {
          UI.error(err);
          captureException(err);
        }), true);
    }

    /* Summoner Spells display */
    if (Mana.getStore().get('summoner-spells-button') && data.summonerspells.length > 0)
      $('button#loadSummonerSpells').enableManualButton(() => Mana.user.updateSummonerSpells(data.summonerspells).catch(err => { UI.error(err); captureException(err); }), true);

    UI.status('ChampionSelect', 'runes-loaded', champion.name, position);
  }

  destroyDisplay() {
    UI.status('ChampionSelect', 'champion-select-waiting');
    UI.disableHextechAnimation();

    $('#positions').unbind().empty().hide();
    $('button#loadRunes, button#loadSummonerSpells').disableManualButton();

    ipcRenderer.removeAllListeners('runes-previous');
    ipcRenderer.removeAllListeners('runes-next');

    if (Mana.getStore().get('enableTrayIcon')) UI.tray();
  }

  end() {
    this.inChampionSelect = false;
    this.cachedPerks = {};

    ipcRenderer.send('champion-select-out');
    ipcRenderer.removeAllListeners('runes-previous');
    ipcRenderer.removeAllListeners('runes-next');

    this.gameModeHandler.end();

    Mana.user.getPerksInventory()._pageCount = null;
    Mana.user.getPerksInventory()._perks = null;

    this.destroyDisplay();
    return this;
  }

  stop() {
    clearInterval(this._checkTimer);
  }
}


/* Shortcuts handling
ipcRenderer.on('runes-previous', () => {
  log.log(2, '[Shortcuts] Selecting previous position..');

  const keys = Object.keys(data);
  let i = keys.length, positionIndex = keys.indexOf($('#positions').val());
  let newIndex = positionIndex;

  if (newIndex === 0) newIndex = i - 1;
  else newIndex--;

  /* Useless to change position if it's already the one chosen
  if (newIndex !== positionIndex) $('#positions').val(keys[newIndex]).trigger('change');
});

ipcRenderer.on('runes-next', () => {
  log.log(2, '[Shortcuts] Selecting next position..');

  const keys = Object.keys(data);
  let i = keys.length, positionIndex = keys.indexOf($('#positions').val());
  let newIndex = positionIndex;

  if (newIndex === i - 1) newIndex = 0;
  else newIndex++;

  /* Useless to change position if it's already the one chosen
  if (newIndex !== positionIndex) $('#positions').val(keys[newIndex]).trigger('change');
});*/

module.exports = ChampionSelectHandler;
