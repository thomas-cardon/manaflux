const ItemSetHandler = require('../handlers/ItemSetHandler');

class DataValidator {

  onDataChange(data, providerId) {
    data = { roles: {}, ...data };

    if (!providerId) return;
    Object.values(data.roles).forEach(role => {
      role.perks.forEach(x => {
        if (!x.provider) x.provider = providerId;
      });

      role.itemsets.forEach(x => {
        if (!x.provider) x.provider = x._data.provider = providerId;
      });
    });
  }

  onDataDownloaded(data, championId, gameMode) {
    console.log('[DataValidator] Copying required properties for Flu.x');
    data.championId = championId;

    data.gameMode = gameMode;
    data.gameVersion = Mana.gameClient.branch;

    data.version = Mana.version;
    data.region = Mana.gameClient.region;

    for (const [roleName, role] of Object.entries(data.roles)) {
      this.onPerkPagesCheck(role.perks, championId, roleName);
      this.onItemSetsCheck(role.itemsets, championId, roleName);
    }
  }

  onDataUpload(data) {
    for (const [roleName, role] of Object.entries(data.roles)) {
      role.itemsets = role.itemsets.map(x => x._data ? x : ItemSetHandler.parse(champion.key, x, Mana.providerHandler.getProvider(x.provider).getCondensedName()));

      role.perks.forEach(x => delete x.name);
      role.itemsets.forEach(x => delete x._data.title);
    }
  }

  onPerkPagesCheck(array, championId, role) {
    array = array.filter(x => x.selectedPerkIds && x.selectedPerkIds.length >= 6 && !this._hasDuplicates(x.selectedPerkIds));

    array.forEach((page, index) => { /* Recreates primaryStyleId or subStyleId based on perks if it's missing */
      page.name = `${page.provider ? Mana.providerHandler.getProvider(page.provider).getCondensedName() : 'XXX'}${index + 1} ${Mana.champions[championId].name} > ${UI.stylizeRole(role)}${page.suffixName ? ' ' + page.suffixName : ''}`;

      page.primaryStyleId = page.primaryStyleId || Mana.gameClient.findPerkStyleByPerkId(page.selectedPerkIds[0]).id;
      page.subStyleId = page.subStyleId || Mana.gameClient.findPerkStyleByPerkId(page.selectedPerkIds[4]).id;
    });
  }

  onItemSetsCheck(array, championId, role) {
    array = array.map((x, index) => {
      if (!x._data) x = ItemSetHandler.parse(champion.key, x, Mana.providerHandler.getProvider(x.provider).getCondensedName());
      x._data.title = `${x._data.provider ? Mana.providerHandler.getProvider(x._data.provider).getCondensedName() : 'XXX'}${index + 1} ${Mana.champions[championId].name} > ${UI.stylizeRole(role)}`;

      return x;
    });
  }

  _hasDuplicates(array) {
    return array.find((element, index) => (array.indexOf(element) != index));
  }
}

module.exports = DataValidator;
