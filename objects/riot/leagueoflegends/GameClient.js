const rp = require('request-promise-native');

class GameClient {
  constructor() {
  }

  async getSystemBuilds() {
    return JSON.parse(await rp(Mana.base + 'system/v1/builds'));
  }

  async querySummonerSpells(d = {}) {
    const summonerSpellData = JSON.parse(await rp(Mana.base + 'lol-game-data/assets/v1/summoner-spells.json'));

    for (let spell of summonerSpellData) {
      const x = spell.iconPath.slice(42, -4).replace('_', '');
      let key;

      if (x.startsWith('Summoner')) key = "Summoner" + (x.charAt(8).toUpperCase() + x.slice(9));
      else if ([30, 31, 33, 34, 35, 36, 39].includes(spell.id)) continue;

      d[key] = { id: spell.id, key, name: spell.name, gameModes: spell.gameModes, path: Mana.assetsProxy.port + spell.iconPath };

      if (spell.id === 14)
        d['SummonerDot'] = d[key];
    }

    return this.summonerSpells = d;
  }

  findSummonerSpellByName(name) {
    return Object.values(Mana.gameClient.summonerSpells).find(spell => spell.name === name);
  }

  async queryChampionSummary(d = {}) {
    const championSummaryData = JSON.parse(await rp(Mana.base + 'lol-game-data/assets/v1/champion-summary.json'));

    for (let champion of championSummaryData)
      d[champion.id] = { id: champion.id, key: champion.alias, name: champion.name, img: 'http://localhost:' + Mana.assetsProxy.port + champion.squarePortraitPath };

    return this.champions = d;
  }

  async getRegionAndLocale() {
    return JSON.parse(await rp(Mana.base + 'riotclient/get_region_locale'));
  }

  async queryPerks() {
    const perksData = JSON.parse(await rp(Mana.base + 'lol-game-data/assets/v1/perks.json')), stylesData = JSON.parse(await rp(Mana.base + 'lol-game-data/assets/v1/perkstyles.json'));

    const perks = {};
    perksData.forEach(x => perks[x.id] = x);

    this.perks = perks;

    this.styles = this.preseason ? stylesData.styles : stylesData;
  }

  findPerkByImage(img) {
    return Object.values(this.perks).find(x => x.iconPath.toLowerCase().includes(img.toLowerCase()));
  }

  findPerkStyleByImage(img) {
    return this.styles.find(x => x.iconPath.toLowerCase().includes(img.toLowerCase()));
  }


  findPerkStyleByPerkId(id) {
    return this.styles.find(x => x.slots.some(y => y.perks.some(z => z === parseInt(id))));
  }

  async load() {
    let r = await this.getRegionAndLocale();

    this.region = r.region.toLowerCase();
    this.locale = r.locale;
    this.language = r.webLanguage;

    let x = await this.getSystemBuilds();

    this.branch = x.branch;
    this.fullVersion = x.version;

    this.preseason = parseFloat(this.fullVersion.slice(0, 4)) >= 8.23;
    await this.queryPerks();

    return this.preseason;
  }
 }

module.exports = GameClient;
