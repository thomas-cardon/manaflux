const rp = require('request-promise-native');
const { captureException } = require('@sentry/electron');

const ItemSetHandler = require('./ItemSetHandler');
const ProviderHandler = new (require('./ProviderHandler'))();

class ChampionSelectHandler {
  constructor() {
    this.gameModes = {
      CLASSIC: new (require('../gameModes/CLASSIC'))(this, ProviderHandler)
    }
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

    this.gameModes[this.gameMode].onTickEvent(data);

    if (this._lastChampionId === this.gameModes[this.gameMode].getPlayer().championId) return;
    if ((this._lastChampionId = this.gameModes[this.gameMode].getPlayer().championId) === 0) return UI.status('ChampionSelect', 'champion-select-pick');

    const champion = Mana.champions[this.gameModes[this.gameMode].getPlayer().championId];

    this.gameModes[this.gameMode].onChampionChangeEvent(champion);

    ProviderHandler
    .getChampionData(champion, this.gameModes[this.gameMode].getPosition(), this.gameMode)
    .then(data => this.updateDisplay(champion, data));
  }

  async onFirstTickEvent(data) {
    ipcRenderer.send('champion-select-in');
    log.dir(3, data);

    this.gameMode = await Mana.user.getGameMode();
    this.gameModes[this.gameMode].onFirstTickEvent(data);
  }

  updateDisplay(champion, data) {
    UI.status('ChampionSelect', 'champion-updating-display', champion.name);
    $('#positions').unbind().empty().hide();

    ipcRenderer.removeAllListeners('runes-previous');
    ipcRenderer.removeAllListeners('runes-next');

    if (Object.keys(data).length === 0) return log.error(1, i18n.__('providers-error-data'));
    log.dir(3, data);

    for (const [position, d] of Object.entries(data)) {
      if (d.runes.length === 0) {
        UI.error('providers-error-runes', champion.name, position);
        delete data[position];
      }
      else $('#positions').append(`<option value="${position}">${position === 'ADC' ? 'ADC' : position.charAt(0).toUpperCase() + position.slice(1) }</option>`)
    }

    const onPositionChange = this.onPositionChange;

    $('#positions').change(function() {
      onPositionChange(this.value, data[this.value]);
    });

    let chosenPosition = this.gameModes[this.gameMode].getPosition();
    log.log(3, chosenPosition);

    if (!chosenPosition || !data[this.gameModes[this.gameMode].getPosition()])
     chosenPosition = Object.keys(data)[0];

    $('#positions').val(log.log(3, chosenPosition)).trigger('change').show();
    UI.tray(false);
  }

  async onPositionChange(position, data) {
    console.dir(arguments);
    $('button#loadRunes, button#loadSummonerSpells').disableManualButton();

    /* Perks display */
    if (Mana.store.get('enableAnimations'))
      UI.enableHextechAnimation(champion, data.runes[0].primaryStyleId);
      /* TODO: Change hextech animation according to active rune page change */

    if (Mana.store.get('loadRunesAutomatically')) {
      Mana.user.getPerksInventory().updatePerksPages(data.runes)
      .catch(err => {
        UI.error(err);
        captureException(err);
      });
    }
    else {
      $('button#loadRunes').enableManualButton(() => Mana.user.getPerksInventory().updatePerksPages(data.runes)
        .catch(err => {
          UI.error(err);
          captureException(err);
        }), true);
    }

    UI.status('ChampionSelect', 'runes-loaded', champion.name, position);

    /* Summoner Spells display */
    if (Mana.store.get('enableSummonerSpells') && data.summonerspells.length > 0)
      $('button#loadSummonerSpells').enableManualButton(() => Mana.user.updateSummonerSpells(data.summonerspells).catch(err => { UI.error(err); captureException(err); }), true);

    /* Item Sets display */
    if (Mana.store.get('enableItemSets')) {
      try {
        await ItemSetHandler.deleteItemSets(await ItemSetHandler.getItemSetsByChampionKey(champion.key));
        UI.status('ChampionSelect', 'itemsets-save-status', champion.name);

        for (let position in data)
          for (const set of data.itemsets)
            await set.save();
      }
      catch(err) {
        UI.error(err);
        captureException(err);
      }
    }
  }

  destroyDisplay() {
    UI.status('ChampionSelect', 'champion-select-waiting');
    UI.disableHextechAnimation();

    $('button#loadRunes').disableManualButton();
    $('button#loadSummonerSpells').disableManualButton();

    $('#positions').unbind().empty().hide();

    if (Mana.store.get('enableTrayIcon')) UI.tray();
  }

  end() {
    this.inChampionSelect = false;

    ipcRenderer.send('champion-select-out');
    ipcRenderer.removeAllListeners('runes-previous');
    ipcRenderer.removeAllListeners('runes-next');

    this.gameModes[this.gameMode].end();

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
