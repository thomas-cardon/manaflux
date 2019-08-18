const rp = require('request-promise-native');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

/*
* This provider uses an internal private API directly from U.GG. It can (and probably will) change without warning.
*/
class UGGProvider extends Provider {
  constructor() {
    super('ugg', 'U.GG');

    // These variables can't change without warning. See here https://gist.github.com/paolostyle/fe8ce06313d3e53c134a24762b9e519c
    this.dataVersion = '1.2';
    this.apiVersion = '1.1';

    this.lolVersion = '9_16';
    this.overviewVersion = '1.2.6';

    this.u = {
      positions: {
        JUNGLE: 1,
        SUPPORT: 2,
        ADC: 3,
        TOP: 4,
        MIDDLE: 5
      },
      positionsReversed: {
        1: 'JUNGLE',
        2: 'SUPPORT',
        3: 'ADC',
        4: 'TOP',
        5: 'MIDDLE'
      },
      tiers: {
        challenger: 1,
        master: 2,
        diamond: 3,
        platinum: 4,
        gold: 5,
        silver: 6,
        bronze: 7,
        overall: 8,
        platPlus: 10,
        diaPlus: 11
      },
      servers: {
        na: 1,
        euw: 2,
        kr: 3,
        eune: 4,
        br: 5,
        las: 6,
        lan: 7,
        oce: 8,
        ru: 9,
        tr: 10,
        jp: 11,
        world: 12
      },
      stats: {
        perks: 0,
        summonerspells: 1,
        skillorder: 4,
        shards: 8
      },
      skillorder: {
        games: 0,
        won: 1,
        order: 2,
        minimized: 3
      },
      summonerspells: {
        games: 0,
        won: 1,
        spells: 2
      },
      perks: {
        games: 0,
        won: 1,
        mainPerk: 2,
        subPerk: 3,
        stats: 4
      },
      shards: {
        games: 0,
        won: 1,
        stats: 2
      }
    };
  }

  async request(gameMode, champion, position) {
    const data = await rp({ uri: `https://stats2.u.gg/lol/${this.apiVersion}/overview/${this.lolVersion}/ranked_solo_5x5/${champion.id}/${this.overviewVersion}.json`, json: true });
    const d = this.scrape(data);

    return { roles: d };
  }

  formatToUGGVersion(ver = Mana.gameClient.version) {
    return ver.split('.').splice(0, 2).join('_');
  }

  /**
  * Scrapes perks from a U.GG page
  * @param {object} x - The data object
  */
  scrapePerks(x) {
    let page = {};

    const perksData = x[this.u.stats.perks];
    const shardsData = x[this.u.stats.shards][this.u.shards.stats].map(str => parseInt(str));

    page.primaryStyleId = perksData[this.u.perks.mainPerk];
    page.subStyleId = perksData[this.u.perks.subPerk];
    page.selectedPerkIds = perksData[this.u.perks.stats].concat(shardsData);

    return page;
  }

  /**
  * Scrapes summoner spells from a U.GG page
  * @param {object} x - The data object
  */
  scrapeSummonerSpells(x) {
    return x[this.u.stats.summonerspells][this.u.summonerspells.spells];
  }

  /**
  * Scrapes skill order from a U.GG page
  * @param {object} x - The data object
  */
  scrapeSkillOrder(x) {
    return x[this.u.stats.skillorder][this.u.skillorder.minimized].split('').map(this._ensureSkillOrderCharacters).join(' => ');
  }

  scrape(data) {
    const d = { TOP: { perks: [{}], itemsets: [], meta: {} }, JUNGLE: { perks: [{}], itemsets: [], meta: {} }, MIDDLE: { perks: [{}], itemsets: [], meta: {} }, ADC: { perks: [{}], itemsets: [], meta: {} }, SUPPORT: { perks: [{}], itemsets: [], meta: {} } };

    for (let i = 1; i <= 5; i++) {
      let x = data[this.u.servers.world][this.u.tiers.platPlus][i][0];

      d[this.u.positionsReversed[i]].perks[0] = this.scrapePerks(x);
      d[this.u.positionsReversed[i]].summonerspells = this.scrapeSummonerSpells(x);

      d[this.u.positionsReversed[i]].meta.skillorder = this.scrapeSkillOrder(x);
      d[this.u.positionsReversed[i]].meta.games = x[this.u.stats.perks][this.u.perks.games];
    }

    return d;
  }

  getCondensedName() {
    return 'UGG';
  }
}

module.exports = UGGProvider;
