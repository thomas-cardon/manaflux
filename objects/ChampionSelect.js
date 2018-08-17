const rp = require('request-promise-native');
const EventEmitter = require('events');

const ProviderHandler = new (require('./handlers/ProviderHandler'))();
const ItemSetHandler = require('./handlers/ItemSetHandler');
const { captureException } = require('@sentry/electron');

class ChampionSelect extends EventEmitter {
  constructor() {
    super();
    this.inChampionSelect = false;

    this.on('firstTick', async () => console.log('Entering Champion Select'));
    this.on('ended', () => console.log('Leaving Champion Select'));
    this.on('change', async id => {
      const champion = Mana.champions[id];
      console.log(`Changed champion to: #${id} (${champion.name})`);

      Mana.user.runes = Mana.user.runes || await Mana.user.getRunes();
      Mana.user._pageCount = Mana.user._pageCount || await Mana.user.getPageCount();

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
    return this.myTeam.find(x => x.summonerId === Mana.user.summoner.summonerId);
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
      Mana.status(`Updating display for ${champion.name}`);
      const res = await ProviderHandler.getChampionData(champion, this.getPosition(), this.gameMode);

      $('#positions').unbind().empty().hide();

      ipcRenderer.removeAllListeners('runes-previous');
      ipcRenderer.removeAllListeners('runes-next');

      console.dir(res);

      for (let position in res) {
        if (res[position].runes.length === 0) {
          UI.error(`Couldn't get runes for ${champion.name}, position: ${position}`);
          delete res[position];
        }
        else $('#positions').append(`<option value="${position}">${position === 'ADC' ? 'ADC' : position.charAt(0).toUpperCase() + position.slice(1) }</option>`)
      }

      $('#positions').change(async function() {
        let data = res[this.value];

        $('button#loadRunes, button#loadSummonerSpells').disableManualButton();

        /*
        * Runes display
        */

        if (Mana.store.get('enableAnimations'))
          UI.enableHextechAnimation(champion.key, data.runes[0].primaryStyleId);

        // TODO: Change hextech animation according to active rune page change

        if (Mana.store.get('loadRunesAutomatically')) {
          try {
            await Mana.user.updateRunePages(data.runes);
          }
          catch(err) {
            UI.error(err);
            captureException(err);
          }
        }
        else $('button#loadRunes').enableManualButton(() => Mana.user.updateRunePages(data.runes).catch(err => { UI.error(err); captureException(err); }), true);

        Mana.status(i18n.__('runes-loaded', champion.name, this.value));

        /*
        * Summoner Spells display
        */

        if (Mana.store.get('enableSummonerSpells') && data.summonerspells.length > 0)
          $('button#loadSummonerSpells').enableManualButton(() => Mana.user.updateSummonerSpells(data.summonerspells).catch(err => { UI.error(err); captureException(err); }), true);

        /*
        * Item Sets display
        */

        if (Mana.store.get('enableItemSets') && data.itemsets.length > 0) {
          try {
            let old = await ItemSetHandler.deleteItemSets(await ItemSetHandler.getItemSetsByChampionKey(champion.key));

            Mana.status(`Saving ${data.itemsets.length} ItemSets for ${champion.name} (${this.value})`);

            for (const set of data.itemsets)
              await set.save();
          }
          catch(err) {
            UI.error(err);
            captureException(err);
          }
        }
      });

      ipcRenderer.on('runes-previous', () => {
        console.log('Shortcut: Previous Runes');

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
        console.log('Shortcut: Next Runes');

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
    Mana.status(i18n.__('champion-select-waiting'));
    UI.disableHextechAnimation();

    $('button#loadRunes').disableManualButton();
    $('button#loadSummonerSpells').disableManualButton();

    $('#positions').unbind().empty().hide();

    if (Mana.store.get('enableTrayIcon'))
    UI.tray();
  }

  destroyTimer() {
    if (this._checkTimer) clearInterval(this._checkTimer);
  }

  end() {
    this.inChampionSelect = false;
    ipcRenderer.send('champion-select-out');

    this.destroyDisplay();

    this.timer = this.myTeam = this.theirTeam = this.gameMode = null;
    Mana.user._pageCount = Mana.user.runes = null;

    this.emit('ended');

    return this;
  }

  destroy() {
    clearInterval(this._checkTimer);
  }
}

module.exports = ChampionSelect;
