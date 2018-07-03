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

    /*else if (!d) {
      console.log(`Cancelled Fake Champion Select. Disabled Fake Mode.`);
      clearTimeout(taskId);
      return Mana.fakeMode = taskId = false;
    }

    if (Mana.fakeMode && !Timer) {
      console.log(`Fake Mode Enabled. Cancelling Champion Select in ${d.timer.adjustedTimeLeftInPhaseInSec - 2} seconds.`);
      taskId = setTimeout(() => rp({ method: 'POST', uri: Mana.base + 'lol-lobby/v1/lobby/custom/cancel-champ-select' }), d.timer.adjustedTimeLeftInPhase - 2000);
    }*/
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

      const { runes, itemsets, summonerspells } = await ProviderHandler.getChampionData(Mana.champions[this.getCurrentSummoner().championId], this.getCurrentSummoner().assignedPosition === "" ? null : this.getCurrentSummoner().assignedPosition, this.gameMode);

      if (Mana.store.get('enableItemSets'))
      for (let itemset of itemsets)
      itemset.save();

      if (Mana.store.get('loadRunesAutomatically', true)) Mana.user.updateRunePages(runes);
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
    this.inChampionSelect = false;

    this.destroyDisplay();
    this.emit('ended');
  }
}

module.exports = ChampionSelect;
