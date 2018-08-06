const rp = require('request-promise-native');
const EventEmitter = require('events');

const ProviderHandler = new (require('./handlers/ProviderHandler'))();
const ItemSetHandler = require('./handlers/ItemSetHandler');

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
      const data = await ProviderHandler.getChampionData(champion, this.getPosition(), this.gameMode);
      const { runes, itemsets, summonerspells } = data[this.getPosition()] ? data[this.getPosition()] : data[Object.keys(data)[0]];

      if (!runes.length > 0) {
        Mana.status(`Internal Error: Runes are empty`);
        UI.error(`Couldn't get runes for ${champion.name}`);
      }
      else {
        if (Mana.store.get('enableAnimations'))
        UI.enableHextechAnimation(champion.key, runes[0].primaryStyleId);

        if (Mana.store.get('loadRunesAutomatically')) await Mana.user.updateRunePages(runes);
        else $('button#loadRunes').enableManualButton(() => Mana.user.updateRunePages(runes), true);

        Mana.status('Loaded runes for ' + champion.name);
      }

      if (Mana.store.get('enableSummonerSpells') && summonerspells.length > 0)
        $('button#loadSummonerSpells').enableManualButton(() => Mana.user.updateSummonerSpells(summonerspells), true);

      if (Mana.store.get('enableItemSets') && itemsets.length > 0) {
        try {
          let old = await ItemSetHandler.getItemSetsByChampionKey(champion.key);

          for (let itemset of old) {
            itemset = await ItemSetHandler.parse(champion.key, itemset);
            await itemset.delete();
          }

          Mana.status(`Loading ${itemsets.length} sets for ${champion.name}`);
          await Promise.all(itemsets.map(itemset => itemset.save()));
        }
        catch(err) {
          UI.error(err);
        }
      }

      Mana.status('Loaded data for ' + champion.name);
      UI.tray(false);
    }
    catch(err) {
      UI.error(err);
    }
  }

  destroyDisplay() {
    Mana.status('Waiting for champion select');
    UI.disableHextechAnimation();

    $('button#loadRunes').disableManualButton();
    $('button#loadSummonerSpells').disableManualButton();

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
    if (this._checkTimer)
      clearInterval(this._checkTimer);
  }
}

module.exports = ChampionSelect;
