const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class LeagueofGraphsProvider extends Provider {
  constructor() {
    super('leagueofgraphs', 'League of Graphs');

    this.base = 'https://www.leagueofgraphs.com/champions';
  }

  async getData(champion, preferredPosition, gameMode) {
    let data = { roles: {} };
    let roles = gameMode === 'ARAM' ? ['ARAM'] : ['JUNGLE', 'MIDDLE', 'TOP', 'ADC', 'SUPPORT'];

    if (gameMode !== 'ARAM' && preferredPosition)
    roles = roles.sort((a, b) => b === preferredPosition)

    /* This is a variable that doesn't change between roles */
    let matchups = await rp({ uri: `${this.base}/counters/${champion.key}`.toLowerCase(), transform: body => cheerio.load(body) });

    for (let x of roles) {
      console.log(2, `[ProviderHandler] [League of Graphs] Gathering data (${x})`);

      try {
        data.roles[x] = await this._scrape(champion, x, gameMode, matchups);
      }
      catch(err) {
        console.log(`[ProviderHandler] [League of Graphs] Something happened while gathering data (${x})`);
        console.error(err);
      }
    }

    return data;
  }

  async _scrape(champion, position, gameMode, matchups) {
    const data = await rp({ uri: `${this.base}/overview/${champion.key}${position ? '/' + position : ''}/${gameMode === 'ARAM' ? 'aram' : ''}`.toLowerCase(), transform: body => cheerio.load(body) });

    const perks = this.scrapePerks(data, position);

    const itemsets = Mana.getStore().get('item-sets-enable') ? this.scrapeItemSets(data, champion, position, this.scrapeSkillOrder(data)) : [];
    const summonerspells = Mana.getStore().get('summoner-spells') ? this.scrapeSummonerSpells(data, champion) : [];

    let statistics = {};
    if (Mana.getStore().get('statistics')) {
      let stats = await rp({ uri: `${this.base}/stats/${champion.key}${position ? '/' + position : ''}/${gameMode === 'ARAM' ? 'aram' : ''}`.toLowerCase(), transform: body => cheerio.load(body) });
      statistics = this.scrapeStatistics(stats, matchups);
    }

    return { perks, itemsets, summonerspells, statistics, gameMode };
  }

  /**
  * Scrapes perks from a League of Graphs page
  * @param {cheerio} $ - The cheerio object
  */
  scrapePerks($, role) {
    let page = { selectedPerkIds: [] };

    $('.perksTableOverview').find('tr').each(function(i, elem) {
      let images = $(this).find('img[src^="//cdn.leagueofgraphs.com/img/perks/"]').toArray().filter(x => $(x.parentNode).css('opacity') != 0.2);

      if (i === 0 || i === 5)
      page[i === 0 ? 'primaryStyleId' : 'subStyleId'] = images[0].attribs.src.slice(-8, -4);
      else if (images.length > 0) page.selectedPerkIds.push(images[0].attribs.src.slice(-8, -4));
    });

    return [page];
  }

  /**
  * Scrapes summoner spells from a League of Graphs page
  * @param {cheerio} $ - The cheerio object
  */
  scrapeSummonerSpells($) {
    if (Mana.gameClient.locale !== 'en_GB' && Mana.gameClient.locale !== 'en_US') {
      console.log(2, `[ProviderHandler] [League of Graphs] Summoner spells are not supported because you're not using the english language in League`);
      return [];
    }

    return $('h3:contains(Summoner Spells)').parent().find('img').toArray().filter(x => Object.values(Mana.gameClient.summonerSpells).find(z => z.name === x.attribs.alt)).map(x => Object.values(Mana.gameClient.summonerSpells).find(z => z.name === x.attribs.alt).id);
  }

  /**
  * Scrapes skill order from a League of Graphs page
  * @param {cheerio} $ - The cheerio object
  */
  scrapeSkillOrder($) {
    return $('h3:contains(Skill Orders)').parent().find('.championSpellLetter').toArray().map(x => i18n.__('key-' + $(x).text().trim())).join(' => ');
  }

  /**
  * Scrapes item sets from a League of Graphs page
  * @param {cheerio} $ - The cheerio object
  * @param {object} champion - A champion object, from Mana.gameClient.champions
  * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
  * @param {object} skillorder
  */
  scrapeItemSets($, champion, position, skillorder) {
    let itemset = new ItemSet(champion.key, position, this.id).setTitle(`LOG ${champion.name} - ${position}`);
    let blocks = [
      new Block().setType({ i18n: 'item-sets-block-starter-skill-order', arguments: [skillorder] }),
      new Block().setType({
        i18n: 'item-sets-block-core-build-wr',
        arguments: [$('#mainContent > div > div:nth-child(1) > a:nth-child(3) > div > div.row.margin-bottom > div.medium-13.columns').children('.figures').text().trim().split('%').map(x => x.replace(/[^0-9.]/g, ""))[1]]
      }),
      new Block().setType({ i18n: 'item-sets-block-endgame' }),
      new Block().setType({ i18n: 'item-sets-block-boots' })
    ];

    /* Starter items */
    $('#mainContent > div > div:nth-child(1) > a:nth-child(3) > div').children().find('img').toArray().map(x => $(x).attr('class').trim().slice(-7, -3)).forEach(x => blocks[0].addItem(x));
    /* Core items */
    $('#mainContent > div > div:nth-child(1) > a:nth-child(3) > div > div.row.margin-bottom > div.medium-13.columns').children().find('img').toArray().map(x => parseInt($(x).attr('class').trim().slice(-7, -3))).forEach(x => blocks[1].addItem(x));
    /* Boots */
    $('#mainContent > div > div:nth-child(1) > a:nth-child(3) > div > div:nth-child(2) > div.medium-11.columns').children().find('img').toArray().map(x => parseInt($(x).attr('class').trim().slice(-7, -3))).forEach(x => blocks[2].addItem(x));
    /* End game items */
    $('#mainContent > div > div:nth-child(1) > a:nth-child(3) > div > div:nth-child(2) > div.medium-13.columns').children().find('img').toArray().map(x => parseInt($(x).attr('class').trim().slice(-7, -3))).forEach(x => blocks[3].addItem(x));

    itemset.addBlocks(...blocks);
    return [itemset];
  }

  /**
  * Scrapes statistics from a League of Graphs page
  * @param {cheerio} $ - The cheerio object
  */
  scrapeStatistics($s, $m, convertLOGPosition = this.convertLOGPosition) {
    let data = { stats: { roles: {} }, matchups: { counters: {}, synergy: {} } };

    /* Stats */
    $s('#mainContent > .row').eq(0).children().each(function(index) {
      let statsVar;

      switch(index) {
        case 0:
        statsVar = 'playrate';
        break;
        case 1:
        statsVar = 'winrate';
        break;
        case 2:
        statsVar = 'banrate';
        break;
        case 3:
        statsVar = 'mainrate';
        break;
      }

      data.stats[statsVar] = { avg: $s(this).find('.pie-chart').text().trim() };
    });


    $s('#mainContent > div:nth-child(2) > div:nth-child(2)').find('table').find('tr').slice(1).each(function(index) {
      data.stats.roles[convertLOGPosition($s(this).children().eq(0).text().trim()).toUpperCase()] = {
        playrate: { avg: $s(this).children().eq(1).text().trim().slice(0, 5) },
        winrate: { avg: $s(this).children().eq(2).text().trim().slice(0, 5) }
      };
    });

    const kda = $s('#mainContent > div:nth-child(2) > div:nth-child(2) > div.box.box-padding.number-only-chart.text-center > div.number').text().trim().replace(/(\r\n\t|\n|\r\t| )/gm,'').split('/');

    data.stats.k = { avg: kda[0] };
    data.stats.d = { avg: kda[1] };
    data.stats.a = { avg: kda[2] };

    /* Matchups */
    $m('.box.box-padding').each(function(index) {
      let type;
      switch(index) {
        case 0:
        type = 'synergy';
        break;
        default:
        type = 'counters';
        break;
      }

      $m(this).find('tr > td > a').parent().parent().each(function(index) {
        if (!$m(this).find('a').length === 0)
        return;

        let championKey = $m(this).find('a')[0].attribs.href.slice($m(this).find('a')[0].attribs.href.lastIndexOf('/') + 1);
        let championId = Object.values(Mana.gameClient.champions).find(x => x.key.toLowerCase() === championKey);

        if (!championId)
          return;
        else championId = championId.id;

        let position = convertLOGPosition($m(this).find('i').text()).toUpperCase();
        let percentage = parseFloat($m(this).find('.percentage').eq(0).text());

        console.dir(parseFloat(data.stats.winrate.avg));

        data.matchups[type][championId] = { wr: ((parseFloat(data.stats.winrate.avg) || 50) + percentage).toPrecision(4), position };
      });
    });

    return data;
  }

  convertLOGPosition(pos) {
    if (!pos) return;

    switch(pos.toLowerCase()) {
      case 'jungler':
      return 'jungle';
      case 'mid':
      return 'middle';
      case 'ad carry':
      return 'adc';
      default:
      return pos.toLowerCase();
    }
  }

  getCondensedName() {
    return 'LOG';
  }
}

module.exports = LeagueofGraphsProvider;
