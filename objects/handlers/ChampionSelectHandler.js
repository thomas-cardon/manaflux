const rp = require('request-promise-native');
const ItemSetHandler = require('./ItemSetHandler');

class ChampionSelectHandler {
  constructor() {
    this.gameModeHandlers = {
      CLASSIC: new (require('../gameModesHandlers/CLASSIC'))(this, Mana.providerHandler),
      ARAM: new (require('../gameModesHandlers/ARAM'))(this, Mana.providerHandler)
    };

    ipcRenderer.on('perks-shortcut', this.onShortcutPressedEvent);
  }

  async getSession() {
    return await rp({
      method: 'GET',
      uri: Mana.base + 'lol-champ-select/v1/session',
      resolveWithFullResponse: true,
      json: true
    });
  }

  isChampionLocked() {
    return new Promise((resolve, reject) => {
      require('https').get({
        host: '127.0.0.1',
        port: Mana.riot.port,
        path: '/lol-champ-select/v1/current-champion',
        headers: { 'Authorization': Mana.riot.authToken },
        rejectUnauthorized: false,
      }, res => {
        if (res.statusCode === 200) resolve(true);
        else if (res.statusCode === 404) resolve(false);
      }).on('error', err => reject(err));
    });
  }

  load() {
    const self = this;
    this._checkTimer = setInterval(function() {
      if (!Mana.user) return;

      self.getSession().then(x => self.onTickEvent(x.body)).catch(err => {
        if (err.statusCode === 404 && self.inChampionSelect) return self.end();
        else if (err.statusCode !== 404) UI.error(err);
      });
    }, 1000);
  }

  async _devDownloadProviderData(champion, pos, mode = 'CLASSIC', cache, providers) {
    return await Mana.providerHandler.getChampionData(champion, pos, this.gameModeHandlers[mode] ? this.gameModeHandlers[mode] : this.gameModeHandlers.CLASSIC, cache, providers);
  }

  async onTickEvent(data) {
    if (!this.inChampionSelect) {
      await this.onFirstTickEvent(data);
      this.inChampionSelect = true;
    }

    this.gameModeHandler.onTickEvent(data);
    this.onChampionSelectTick(data);
  }

  async onChampionSelectTick(data) {
    if (this.gameModeHandler.getPlayer().championId === 0) return UI.status('champion-select-pick-a-champion');

    if (this.lastChampionPicked !== this.gameModeHandler.getPlayer().championId) {
      this.lastChampionPicked = this.gameModeHandler.getPlayer().championId;
      this.hasLoadedData = this.hasLoadedUI = false;
    }

    const champion = Mana.champions[this.gameModeHandler.getPlayer().championId];

    if (!this.hasLoadedUI) this.onDisplayUpdatePreDownload(champion);
    if (!this.hasLoadedData) {
      if (!Mana.getStore().get('champion-select-lock') || Mana.getStore().get('champion-select-lock') && await this.isChampionLocked()) {
        this.hasLoadedData = true;

        const res = await UI.indicator(Mana.providerHandler.getChampionData(champion, this.gameModeHandler.getPosition(), this.gameModeHandler, true), 'champion-select-downloading-data', champion.name);
        if (this.inChampionSelect && champion.id === res.championId) this.onDisplayUpdate(champion, res);
      }
      else return UI.status('champion-select-lock');
    }
  }

  async onFirstTickEvent(data) {
    ipcRenderer.send('champion-select-in');
    this.gameMode = await Mana.user.getGameMode();

    /* Fallback to classic mode when not available */
    this.gameModeHandler = this.gameModeHandlers[this.gameMode] ? this.gameModeHandlers[this.gameMode] : this.gameModeHandlers.CLASSIC;
    this.gameModeHandler.onFirstTickEvent(data);
  }

  onDisplayUpdatePreDownload(champion) {
    this.hasLoadedUI = true;
    UI.status('champion-select-updating-display', champion.name);

    document.getElementById('buttons').style.display = 'none';
    while (document.getElementById('positions').firstChild) {
      document.getElementById('positions').removeChild(document.getElementById('positions').firstChild);
    }

    $('#loadRunes, #loadSummonerSpells').disableManualButton(true);

    UI.enableHextechAnimation(champion);
    document.querySelector('button[data-tabid]').click();

    UI.status('common-ready', champion.name);
  }

  async onDisplayUpdate(champion, res) {
    if (!res || Object.keys(res.roles).length === 0) return UI.error('providers-error-data');

    console.dir(res);
    Object.keys(res.roles).forEach(r => {
      if (res.roles[r].perks.length === 0) UI.error('providers-error-perks', champion.name, r);
      document.getElementById('positions').innerHTML += `<option value="${r}">${UI.stylizeRole(r)}</option>`;
    });

    const self = this;

    document.getElementById('buttons').style.display = 'block';

    document.getElementById('positions').onchange = function() {
      self.onPerkPositionChange(champion, this.value.toUpperCase(), res.roles[this.value.toUpperCase()]);
    };

    document.getElementById('positions').value = res.roles[this.gameModeHandler.getPosition()] ? this.gameModeHandler.getPosition() : Object.keys(res.roles)[0];
    document.getElementById('positions').onchange();
    document.getElementById('positions').style.display = 'unset';

    UI.tray(false);
    UI.status('common-ready');

    if (Mana.getStore().get('item-sets-enable')) {
      try {
        /* Delete ItemSets before downloading */
        await UI.indicator(ItemSetHandler.deleteItemSets(await UI.indicator(ItemSetHandler.getItemSetsByChampionKey(champion.key), 'item-sets-collecting-champion', champion.name)), 'item-sets-deleting');
        await UI.indicator(Promise.all([].concat(...Object.values(res.roles).map(r => r.itemsets.map(x => x.save())))), 'item-sets-save-status', champion.name);
      }
      catch(err) {
        UI.error('item-sets-error-loading');
        console.error(err);
      }
    }

    Sounds.play('dataLoaded');
  }

  onPerkPositionChange(champion, position, data) {
    UI.enableHextechAnimation(champion, (data && data.perks && data.perks[0]) ? data.perks[0].primaryStyleId : 'white');

    $('#loadRunes, #loadSummonerSpells').disableManualButton(true);

    if (data.perks.length > 0) this._updatePerksDisplay(champion, position, data.perks);
    if (data.summonerspells.length > 0) this._updateSummonerSpellsDisplay(champion, position, data.summonerspells);
  }

  _updatePerksDisplay(champion, position, perks) {
    if (Mana.getStore().get('perks-automatic-load')) UI.indicator(Mana.user.getPerksInventory().updatePerksPages(perks), 'perks-loading', champion.name, position);
    else $('#loadRunes').enableManualButton(() => UI.indicator(Mana.user.getPerksInventory().updatePerksPages(perks), 'perks-loading', champion.name, position).catch(UI.error), true);
  }

  _updateSummonerSpellsDisplay(champion, position, spells) {
    if (Mana.getStore().get('summoner-spells')) $('#loadSummonerSpells').enableManualButton(() => UI.indicator(Mana.user.updateSummonerSpells(spells), 'summoner-spells-loading', champion.name, position).catch(UI.error), true);
  }

  onShortcutPressedEvent(event, next) {
    if (document.getElementById('positions').style.display === 'none') return;
    console.log(2, `[Shortcuts] Selecting ${next ? 'next' : 'previous'} position..`);

    const keys = Array.from(document.getElementById('positions').childNodes).map(x => x.value);
    let i = keys.length, positionIndex = keys.indexOf(document.getElementById('positions').value);
    let newIndex = positionIndex;

    if (next) {
      if (newIndex === i - 1) newIndex = 0;
      else newIndex++;
    }
    else {
      if (newIndex === 0) newIndex = i - 1;
      else newIndex--;
    }

    /* Useless to change position if it's already the one chosen */
    if (newIndex !== positionIndex) $('#positions').val(keys[newIndex]).trigger('change');
  }

  destroyDisplay() {
    UI.status('champion-select-waiting');
    UI.disableHextechAnimation();

    document.getElementById('positions').style.display = 'none';
    document.getElementById('buttons').style.display = 'none';

    $('#loadRunes').disableManualButton(!Mana.getStore().get('perks-automatic-load'));
    $('#loadSummonerSpells').disableManualButton(true);

    if (Mana.getStore().get('enableTrayIcon')) UI.tray();
  }

  end() {
    this.inChampionSelect = false;
    this.lastChampionPicked = null;
    this.hasLoadedData = this.hasLoadedUI = false;

    ipcRenderer.send('champion-select-out');

    Mana.user.getPerksInventory()._pageCount = null;
    Mana.user.getPerksInventory()._perks = null;

    this.destroyDisplay();

    Mana.providerHandler.onChampionSelectEnd();
  }

  stop() {
    clearInterval(this._checkTimer);
    ipcRenderer.removeAllListeners('perks-shortcut');
  }
}

module.exports = ChampionSelectHandler;
