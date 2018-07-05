const rp = require('request-promise-native');
const EventEmitter = require('events');
const ProviderHandler = new (require('./ProviderHandler'))();

class ChampionSelect extends EventEmitter {
  constructor() {
    super();
    this.inChampionSelect = false;

    this.on('firstTick', () => console.log('Entering Champion Select'));
    this.on('ended', () => console.log('Leaving Champion Select'));
    this.on('championChange', (id) => console.log(`Changed champion to: #${id} (${Mana.champions[id].name})`));
  }

  load() {
    let self = this;
    this._tries = 0;
    this._checkTimer = setInterval(async function() {
      try {
        const session = await self.getSession();
        self.tick(session.body);
        this._tries = 0;
      }
      catch(err) {
        if (err.statusCode === 404) return self.tick();
        if (this._tries === 3) return location.reload();

        this._tries++;
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
      case 'TOP':
        return 'top';
      case 'MIDDLE':
        return 'middle';
      case 'JUNGLE':
        return 'jungle';
      case 'UTILITY':
        return 'support';
      case 'BOTTOM':
        return 'adc';
      default:
        return null;
    }
  }

  async tick(data) {
    this.emit('tick');

    if (!data && this.inChampionSelect) this.destroy();
    else if (data) {
      if (!this.inChampionSelect) {
        this.inChampionSelect = true;
        this.gameMode = await Mana.user.getGameMode();
        this.emit('firstTick');
      }

      this.timer = data.timer;
      this.myTeam = data.myTeam;
      this.theirTeam = data.theirTeam;

      this.emit('championSelect');

      if (this._lastChampionId === this.getCurrentSummoner().championId) return;
      if ((this._lastChampionId = this.getCurrentSummoner().championId) === 0) return;

      this.emit('championChange', this.getCurrentSummoner().championId);

      await this.updateDisplay();
    }
  }

  async updateDisplay() {
    try {
      Mana.status('Updating display');
      const { runes, itemsets, summonerspells } = await ProviderHandler.getChampionData(Mana.champions[this.getCurrentSummoner().championId], this.getPosition(), this.gameMode);

      console.dir(runes);
      console.dir(itemsets);
      console.dir(summonerspells);

      if (Mana.store.get('enableItemSets')) {
        for (let itemset of itemsets)
          itemset.save();
      }

      if (Mana.store.get('loadRunesAutomatically')) Mana.user.updateRunePages(runes);
      else $('button#loadRunes').enableManualButton(() => Mana.user.updateRunePages(runes), true);

      if (Mana.store.get('enableSummonerSpellButton'))
      $('button#loadSummonerSpells').enableManualButton(() => Mana.user.updateSummonerSpells(summonerspells), true);

      UI.enableHextechAnimation(Mana.champions[this.getCurrentSummoner().championId].key, runes[0].primaryStyleId);
      Mana.status('Loaded runes for ' + Mana.champions[this.getCurrentSummoner().championId].name + '...');

      UI.tray(false);
    }
    catch(err) {
      UI.error(err);
    }
  }

  destroyDisplay() {
    Mana.status('Waiting for champion select...');
    UI.disableHextechAnimation();

    $('button#loadRunes').disableManualButton();
    $('button#loadSummonerSpells').disableManualButton();

    if (Mana.store.get('enableTrayIcon'))
    UI.tray();
  }

  destroyTimer() {
    if (this._checkTimer) clearInterval(this._checkTimer);
  }

  destroy() {
    this.timer = this.myTeam = this.theirTeam = this.gameMode = null;
    Mana.user._pageCount = null;

    this.inChampionSelect = false;

    this.destroyDisplay();
    this.emit('ended');

    return this;
  }

  end() {
    if (this._checkTimer)
    clearInterval(this._checkTimer);
  }
}

module.exports = ChampionSelect;
