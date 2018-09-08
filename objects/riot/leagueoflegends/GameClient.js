const rp = require('request-promise-native');

class GameClient {
  constructor() {
  }

  async getSystemBuilds() {
    console.log(Mana.base + 'system/v1/builds');
    return JSON.parse(await rp(Mana.base + 'system/v1/builds'));
  }

  async getSummonerSpells(d = {}) {
    const summonerSpellData = JSON.parse(await rp(Mana.base + 'lol-game-data/assets/v1/summoner-spells.json'));

    for (let spell of summonerSpellData) {
      const x = spell.iconPath.slice(42, -4).replace('_', '');
      let key;

      if (x.startsWith('Summoner')) key = "Summoner" + (x.charAt(8).toUpperCase() + x.slice(9));
      else if ([30, 31, 33, 34, 35, 36, 39].includes(spell.id)) continue;

      d[key] = { id: spell.id, key, name: spell.name, gameModes: spell.gameModes };

      if (spell.id === 14)
        d['SummonerDot'] = d[key];
    }

    return d;
  }

  async getChampionSummary(d = {}) {
    const championSummaryData = JSON.parse(await rp(Mana.base + 'lol-game-data/assets/v1/champion-summary.json'));

    for (let champion of championSummaryData)
      d[champion.id] = { id: champion.id, key: champion.alias, name: champion.name, img: 'http://localhost:3681' + champion.squarePortraitPath };

    return d;
  }

  async getRegionAndLocale() {
    return await rp(Mana.base + 'riotclient/get_region_locale');
  }

  async downloadDDragonRealm() {
    return this.realm = JSON.parse(await rp(`https://ddragon.leagueoflegends.com/realms/${this.region}.json`));
  }

  async getPerks() {
    return await rp(`http://ddragon.leagueoflegends.com/cdn/${this.realm.v}/data/${this.locale || this.realm.l}/runesReforged.json`);
  }

  findPerkByImage(img) {
    for (const style of this.perks)
      for (const slot of style.slots)
        for (const perk of slot.runes)
          if (perk.icon === img) return perk;
  }

  async load() {
    let r = JSON.parse(await this.getRegionAndLocale());

    this.region = r.region.toLowerCase();
    this.locale = r.locale;

    await this.downloadDDragonRealm();
    let x = await this.getSystemBuilds();

    this.branch = x.branch;
    this.fullVersion = x.version;
    this.perks = JSON.parse(await this.getPerks());
  }
 }

module.exports = GameClient;
