const rp = require('request-promise-native');

async function getVersion(full) {
  return JSON.parse(await rp(Mana.base + 'system/v1/builds'))[full ? 'version' : 'gameBranch'];
}

async function getSummonerSpells(d = {}) {
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

async function getChampionSummary(d = {}) {
  const championSummaryData = JSON.parse(await rp(Mana.base + 'lol-game-data/assets/v1/champion-summary.json'));

  for (let champion of championSummaryData)
    d[champion.id] = { id: champion.id, key: champion.alias, name: champion.name, img: Mana.base.slice(0, -1) + champion.squarePortraitPath };

  return d;
}

module.exports = { getSummonerSpells, getChampionSummary, getVersion };
