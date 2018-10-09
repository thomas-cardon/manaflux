const rp = require('request-promise-native');
const EventEmitter = require('events');

const ProviderHandler = new (require('./handlers/ProviderHandler'))();
const ItemSetHandler = require('./handlers/ItemSetHandler');
const { captureException } = require('@sentry/electron');

class ChampionSelect extends EventEmitter {
  constructor() {
    super();
    this.inChampionSelect = false;

    this.on('firstTick', async () => console.log(2, '[ChampionSelect] Entering'));
    this.on('ended', () => console.log(2, '[ChampionSelect] Leaving'));
    this.on('change', async id => {
      const champion = Mana.champions[id];
      log.log(2, `[ChampionSelect] Changed champion to: #${id} (${champion.name})`);

      this.updateDisplay(champion);
    });
  }

  load() {
    let self = this;
    this._checkTimer = setInterval(async function() {
      try {
        const session = await self.getSession();
        self.tick(session.body);
      }
      catch(err) {
        if (err.statusCode === 404) return self.tick();
        UI.error(err);
      }
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

  getCurrentSummoner() {
    return this.myTeam.find(x => x.summonerId === Mana.user.getSummonerId());
  }

  getPosition() {
    switch(this.getCurrentSummoner().assignedPosition) {
      case 'UTILITY':
        return 'SUPPORT';
      case 'BOTTOM':
        return 'ADC';
      default:
        return this.getCurrentSummoner().assignedPosition;
    }
  }

  async tick(data) {
    this.emit('tick');

    if (!data && this.inChampionSelect) this.end();
    else if (data) {
      if (!this.inChampionSelect) {
        this.inChampionSelect = true;
        ipcRenderer.send('champion-select-in');
        this.gameMode = await Mana.user.getGameMode();
        this.emit('firstTick');
      }

      this.timer = data.timer;
      this.myTeam = data.myTeam;
      this.theirTeam = data.theirTeam;

      this.emit('championSelect');

      if (this._lastChampionId === this.getCurrentSummoner().championId) return;
      if ((this._lastChampionId = this.getCurrentSummoner().championId) === 0) return;

      this.emit('change', this.getCurrentSummoner().championId);
    }
  }

  async updateDisplay(champion) {
    try {
      UI.status('ChampionSelect', 'champion-updating-display', champion.name);
      const res = await ProviderHandler.getChampionData(champion, this.getPosition(), this.gameMode);

      $('#positions').unbind().empty().hide();

      ipcRenderer.removeAllListeners('runes-previous');
      ipcRenderer.removeAllListeners('runes-next');

      if (Object.keys(res).length === 0) return console.error(1, i18n.__('providers-error-data'));
      console.dir(res);

      for (let position in res) {
        if (res[position].runes.length === 0) {
          UI.error('providers-error-runes', champion.name, position);
          delete res[position];
        }
        else $('#positions').append(`<option value="${position}">${position === 'ADC' ? 'ADC' : position.charAt(0).toUpperCase() + position.slice(1) }</option>`)
      }

      $('#positions').change(async function() {
        let data = res[this.value];
        console.dir(data);

        $('button#loadRunes, button#loadSummonerSpells').disableManualButton();

        /*
        * Runes display
        */

        if (Mana.getStore().get('enableAnimations'))
          UI.enableHextechAnimation(champion, data.runes[0].primaryStyleId);

        // TODO: Change hextech animation according to active rune page change

        if (Mana.getStore().get('loadRunesAutomatically')) {
          try {
            await Mana.user.getPerksInventory().updatePerksPages(data.runes);
          }
          catch(err) {
            UI.error(err);
            captureException(err);
          }
        }
        else $('button#loadRunes').enableManualButton(() => Mana.user.getPerksInventory().updatePerksPages(data.runes).catch(err => { UI.error(err); captureException(err); }), true);
        UI.status('ChampionSelect', 'runes-loaded', champion.name, this.value);

        /*
        * Summoner Spells display
        */

        if (Mana.getStore().get('enableSummonerSpells') && data.summonerspells.length > 0)
          $('button#loadSummonerSpells').enableManualButton(() => Mana.user.updateSummonerSpells(data.summonerspells).catch(err => { UI.error(err); captureException(err); }), true);
      });

      /*
      * Item Sets display
      */
      if (Mana.getStore().get('enableItemSets')) {
        try {
          let old = await ItemSetHandler.deleteItemSets(await ItemSetHandler.getItemSetsByChampionKey(champion.key));
          UI.status('ChampionSelect', 'itemsets-save-status', champion.name);

          for (let position in res)
            for (const set of res[position].itemsets)
              await set.save();
        }
        catch(err) {
          UI.error(err);
          captureException(err);
        }
      }

      /*
      * Shortcuts handling
      */
      ipcRenderer.on('runes-previous', () => {
        console.log('[Shortcuts] Selecting previous position..');

        const keys = Object.keys(res);
        let i = keys.length, positionIndex = keys.indexOf($('#positions').val());
        let newIndex = positionIndex;

        if (newIndex === 0) newIndex = i - 1;
        else newIndex--;

        // Useless to reload runes again if it's the same runes..
        if (newIndex === positionIndex) return;

        $('#positions').val(keys[newIndex]).trigger('change');
      });

      ipcRenderer.on('runes-next', () => {
        console.log('[Shortcuts] Selecting next position..');

        const keys = Object.keys(res);
        let i = keys.length, positionIndex = keys.indexOf($('#positions').val());
        let newIndex = positionIndex;

        if (newIndex === i - 1) newIndex = 0;
        else newIndex++;

        // Useless to reload runes again if it's the same runes..
        if (newIndex === positionIndex) return;

        $('#positions').val(keys[newIndex]).trigger('change');
      });

      $('#positions').val(res[this.getPosition()] ? this.getPosition() : Object.keys(res)[0]).trigger('change').show();
      UI.tray(false);
    }
    catch(err) {
      UI.error(err);
      captureException(err);
    }
  }

  destroyDisplay() {
    UI.status('ChampionSelect', 'champion-select-waiting');
    UI.disableHextechAnimation();

    $('button#loadRunes').disableManualButton();
    $('button#loadSummonerSpells').disableManualButton();

    $('#positions').unbind().empty().hide();

    if (Mana.getStore().get('enableTrayIcon')) UI.tray();
  }

  destroyTimer() {
    if (this._checkTimer) clearInterval(this._checkTimer);
  }

  end() {
    this.inChampionSelect = false;

    ipcRenderer.send('champion-select-out');
    ipcRenderer.removeAllListeners('runes-previous');
    ipcRenderer.removeAllListeners('runes-next');

    this.destroyDisplay();

    this.timer = this.myTeam = this.theirTeam = this.gameMode = null;

    Mana.user.getPerksInventory()._perks = null;
    Mana.user.getPerksInventory()._pageCount = null;

    this.emit('ended');

    return this;
  }

  destroy() {
    clearInterval(this._checkTimer);
  }
}

module.exports = ChampionSelect;
