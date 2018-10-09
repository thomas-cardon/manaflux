const rp = require('request-promise-native');

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class UGGProvider extends Provider {
  constructor() {
    super('ugg', 'U.GG');
    this.base = 'https://u.gg/';
  }
  async getData(champion, preferredPosition, gameMode) {
    let data = { roles: {} };

    for (let x of ['JUNGLE', 'MIDDLE', 'TOP', 'ADC', 'SUPPORT']) {
      console.log(2, `[ProviderHandler] [U.GG] Gathering data (${x})`);

      try {
        const d = await rp(`${this.base}lol/champions/${champion.key.toLowerCase()}/build/?role=${x.toLowerCase()}`);
        data.roles[x] = this._scrape(d, champion, x, gameMode, `${this.base}lol/champions/${champion.key.toLowerCase()}/build/?role=${x.toLowerCase()}`);
      }
      catch(err) {
        console.error(err);
      }
    }

    return data;
  }

  _scrape(html, champion, position, gameMode, url) {
    const dom = new JSDOM(html, { url, resources: 'usable', runScripts: "dangerously", storageQuota: 999999999 });

    const summonerspells = this.scrapeSummonerSpells(dom.window.document);

    const skillorder = this.scrapeSkillOrder(dom.window.document);
    const itemsets = this.scrapeItemSets(dom.window.document, champion, position.charAt(0) + position.slice(1).toLowerCase(), skillorder);

    const perks = this.scrapePerks(dom.window.document, champion, position.toUpperCase());
    return { perks, summonerspells, itemsets, position };
  }

  /**
   * Scrapes item sets from a U.GG page
   * @param {document} document - The document object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   */
  scrapePerks(doc, champion, position) {
    const page = { name: `UGG ${champion.name} ${position}`, selectedPerkIds: [] };

    doc.querySelectorAll('.perk-active > img').forEach(x => {
      console.log(x.src.slice(53));
      console.dir(Mana.gameClient.findPerkByImage(x.src.slice(53)).id);

      page.selectedPerkIds.push(Mana.gameClient.findPerkByImage(x.src.slice(53)).id);
    });

    doc.querySelectorAll('.path-main > img').forEach(x => page[index === 0 ? 'primaryStyleId' : 'subStyleId'] = parseInt(x.src.slice(-8, -4)));

    return [page];
  }

  /**
   * Scrapes summoner spells from a U.GG page
   * @param {document} document - The document object
   * @param {string} gameMode - A gamemode, from League Client, such as CLASSIC, ARAM, etc.
   */
  scrapeSummonerSpells(doc, gameMode) {
    let summonerspells = [];

    doc.querySelectorAll("img[alt='SummonerSpell']").forEach(x => {
      const summoner = Mana.summonerspells[console.log(3, x.src.slice(x.src.lastIndexOf('/'), -4))];

      if (!summoner) return;
      if (summoner.gameModes.includes(gameMode)) summonerspells.push(summoner.id);

      if (index >= 1 && summonerspells.length === 2) return false;
    });

    return summonerspells;
  }

  /**
   * Scrapes skill order from a U.GG page
   * @param {document} document - The document object
   */
  scrapeSkillOrder(doc, convertSkillOrderToLanguage = this.convertSkillOrderToLanguage, skillorder = '') {
    doc.querySelectorAll('.skill-path > .image-wrapper > .label').forEach(x => skillorder += (skillorder !== '' ? ' => ' : '') + i18n.__('key-' + x.textContent));
    return skillorder;
  }

  /**
   * Scrapes item sets from a U.GG page
   * @param {document} document - The document object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   * @param {object} skillorder
   */
  scrapeItemSets(doc, champion, position, skillorder) {
    console.dir(doc.querySelectorAll('.items > div > img'));

    const items = [].slice.call(doc.querySelectorAll('.items > div > img'));

    console.dir(items);

    let itemset = new ItemSet(champion.key, position, this.id).setTitle(`UGG ${champion.name} - ${position}`);

    let starter = new Block().setName(i18n.__('itemsets-block-starter', skillorder));
    let coreBuild = new Block().setName(i18n.__('itemsets-block-core-build', $('.grid-block.final-items').find('.winrate').text().slice(0, 6), $('.grid-block.final-items').find('.matches').text().split(' ')[0]));
    let options = new Block().setName(i18n.__('itemsets-block-options'));

    /* Starter Block */
    items.slice(0, 2).forEach(x => starter.addItem(x.src.slice(-8, -4)));

    /* Core Build Block */
    items.slice(2, 5).forEach(x => coreBuild.addItem(x.src.slice(-8, -4)));

    /* Options Block */
    items.slice(5).forEach(x => options.addItem(x.src.slice(-8, -4)));

    itemset.addBlock(starter, new Block().setName(`Trinkets`).addItem(2055).addItem(3340).addItem(3341).addItem(3348).addItem(3363));
    itemset.addBlock(coreBuild).addBlock(options);
    itemset.addBlock(new Block().setName(i18n.__('itemsets-block-consumables')).addItem(2003).addItem(2138).addItem(2139).addItem(2140));

    return [itemset];
  }
}

module.exports = UGGProvider;
