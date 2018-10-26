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
        if (!x._data.provider) x._data.provider = providerId;
      });
    });
  }

  onDataDownloaded(d, champion, gameMode) {
    if (!d) return null;

    console.log('[DataValidator] Copying required properties for Flu.x');
    let data = { ...d };

    data.championId = champion.id;

    data.gameMode = gameMode;
    data.gameVersion = Mana.gameClient.branch;

    data.version = Mana.version;
    data.region = Mana.gameClient.region;

    for (const [roleName, role] of Object.entries(data.roles)) {
      role.perks = this.onPerkPagesCheck(role.perks, champion, roleName);
      role.itemsets = this.onItemSetsCheck(role.itemsets, champion, roleName);
    }

    return data;
  }

  onDataUpload(data) {
    for (const [roleName, role] of Object.entries(data.roles)) {
      role.perks.forEach(x => delete x.name);
      role.itemsets.forEach(x => delete x._data.title);
    }
  }

  onPerkPagesCheck(array, champion, role) {
    array = array.filter(x => x.selectedPerkIds && x.selectedPerkIds.length >= 6 && !this._hasDuplicates(x.selectedPerkIds));

    array.forEach((page, index) => { /* Recreates primaryStyleId or subStyleId based on perks if it's missing */
      page.name = `${page.provider ? Mana.providerHandler.getProvider(page.provider).getCondensedName() : 'XXX'}${index + 1} ${champion.name} > ${UI.stylizeRole(role)}${page.suffixName ? ' ' + page.suffixName : ''}`;

      page.primaryStyleId = page.primaryStyleId || Mana.gameClient.findPerkStyleByPerkId(page.selectedPerkIds[0]).id;
      page.subStyleId = page.subStyleId || Mana.gameClient.findPerkStyleByPerkId(page.selectedPerkIds[4]).id;
    });

    return array;
  }

  onItemSetsCheck(array, champion, role) {
    let indexes = {};

    return array.map((x, index) => {
      if (!x._data) x = ItemSetHandler.parse(champion.key, x, Mana.providerHandler.getProvider(x.provider).getCondensedName());
      indexes[x._data.provider || 'XXX'] = indexes[x._data.provider || 'XXX'] + 1 || 1;

      x._data.title = `${x._data.provider ? Mana.providerHandler.getProvider(x._data.provider).getCondensedName() : 'XXX'}${indexes[x._data.provider || 'XXX']} ${champion.name} > ${UI.stylizeRole(role)}`;
      return x;
    });
  }

  _hasDuplicates(array) {
    return array.find((element, index) => (array.indexOf(element) != index));
  }
}

module.exports = DataValidator;
