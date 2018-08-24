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
    if ((this._lastChampionId = this.gameModeHandler.getPlayer().championId) === 0) return UI.status('ChampionSelect', 'champion-select-pick');

    const champion = Mana.champions[this.gameModeHandler.getPlayer().championId];

    /* Delete ItemSets before downloading */
    await ItemSetHandler.deleteItemSets(await ItemSetHandler.getItemSetsByChampionKey(champion.key));

    this.gameModeHandler.onChampionChangeEvent(champion);
    this.updateDisplay(champion, ProviderHandler.createDownloadEventEmitter(champion, this.gameMode, this.gameModeHandler.getPosition()));
  }

  async onFirstTickEvent(data) {
    ipcRenderer.send('champion-select-in');
    log.dir(3, data);

    this.gameMode = await Mana.user.getGameMode();

    /* Try to fallback to classic mode when not available */
    this.gameModeHandler = this.gameModeHandlers[this.gameMode] ? this.gameModeHandlers[this.gameMode] : this.gameModeHandlers.CLASSIC;
    this.gameModeHandler.onFirstTickEvent(data);
  }

  updateDisplay(champion, dl) {
    UI.status('ChampionSelect', 'champion-updating-display', champion.name);

    const onPerkPositionChange = this.onPerkPositionChange, perks = this.cachedPerks;
    let first = false;

    $('#positions').change(function() {
      onPerkPositionChange(champion, this.value, perks[this.value]);
    });

    dl.on('summonerspells', (provider, pos, data) => console.dir(data));
    dl.on('perksPage', (provider, pos, data) => console.dir(data));
    dl.on('itemset', (provider, pos, data) => console.dir(data));

    dl.on('summonerspells', (provider, pos, data) => {
      if (Mana.store.get('enableSummonerSpells'))
        $('button#loadSummonerSpells').enableManualButton(() => Mana.user.updateSummonerSpells(data).catch(err => { UI.error(err); captureException(err); }), true);
    }).on('perksPage', (provider, pos, data) => {
      if (!perks[pos]) {
        perks[pos] = [data];
        $('#positions').append(`<option value="${pos}">${pos === 'ADC' ? 'ADC' : pos.charAt(0).toUpperCase() + pos.slice(1)}</option>`);
      }
      else perks[pos].push(data);

      if (!first) {
        first = true;
        $('#positions').val(log.log(3, pos)).trigger('change').show();
      }
    }).on('itemset', (provider, pos, itemset) => {
      if (!Mana.store.get('enableItemSets')) return;
      itemset.save().catch(err => UI.error(err));
    });

    UI.tray(false);
  }

  onPerkPositionChange(champion, position, perks) {
    console.dir(perks);

    /* Perks display */
    if (Mana.store.get('enableAnimations'))
      UI.enableHextechAnimation(champion, perks[0].primaryStyleId);

    if (Mana.store.get('loadRunesAutomatically')) Mana.user.getPerksInventory().updatePerksPages(perks);
    else {
      $('button#loadRunes').enableManualButton(() => Mana.user.getPerksInventory().updatePerksPages(perks)
        .catch(err => {
          UI.error(err);
          captureException(err);
        }), true);
    }

    UI.status('ChampionSelect', 'runes-loaded', champion.name, position);
  }

  destroyDisplay() {
    UI.status('ChampionSelect', 'champion-select-waiting');
    UI.disableHextechAnimation();

    $('#positions').unbind().empty().hide();
    $('button#loadRunes, button#loadSummonerSpells').disableManualButton();

    ipcRenderer.removeAllListeners('runes-previous');
    ipcRenderer.removeAllListeners('runes-next');

    if (Mana.store.get('enableTrayIcon')) UI.tray();
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
