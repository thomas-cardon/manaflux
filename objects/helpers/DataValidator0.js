const ItemSetHandler = require('../handlers/ItemSetHandler');

class DataValidator {
  validatePackage(champion, data) {
    if (!data) throw UI.error('validation-error-empty');

    console.log('[DataValidator] Copying required properties for Flu.x');

    data.championId = champion.id;
    data.gameVersion = Mana.gameClient.branch;

    data.version = Mana.version;
    data.region = Mana.gameClient.region;

    if (Object.keys(data.roles).length === 0) throw UI.error('validation-error-empty');

    for (let role in data.roles) {
      try {
        data.roles[role].perks = this.validatePerks(data.roles[role].perks, champion, role);
      }
      catch(err) {
        delete data.roles[role];
      }

      data.roles[role].itemsets = this.validateItemSets(data.roles[role].itemsets, champion, role);
    }

    return data;
  }

  validatePerks(array, champion, role) {
    array = array.filter(x => x.selectedPerkIds && x.selectedPerkIds.length >= 6 && !this._hasDuplicates(x.selectedPerkIds));

    if (array.length > 0) {
      for (let i = 0; i < array.length; i++) {
        array[i].name = `${array[i].provider ? Mana.providerHandler.getProvider(array[i].provider).getCondensedName() : 'XXX'}${index + 1} ${champion.name} > ${UI.stylizeRole(role)}${array[i].suffixName ? ' ' + array[i].suffixName : ''}`;

        array[i].primaryStyleId = array[i].primaryStyleId || Mana.gameClient.findPerkStyleByPerkId(array[i].selectedPerkIds[0]).id;
        array[i].subStyleId = array[i].subStyleId || Mana.gameClient.findPerkStyleByPerkId(array[i].selectedPerkIds[4]).id;
      }

      return array;
    }
    else throw Error('INVALID_PERKS_ARRAY');
  }

  validateItemSets(array, champion, role) {
    let indexes = {};

    return array.map((x, index) => {
      if (!x._data) x = ItemSetHandler.parse(champion.key, x, x.provider);
      indexes[x._data.provider || 'XXX'] = indexes[x._data.provider || 'XXX'] + 1 || 1;

      x._data.title = `${x._data.provider ? Mana.providerHandler.getProvider(x._data.provider).getCondensedName() : 'XXX'}${indexes[x._data.provider || 'XXX']} ${champion.name} > ${UI.stylizeRole(role)}`;
      return x;
    }).filter((set, pos, arr) => !arr.some((x, xpos) => x._data.blocks.map(i => i.id) === set._data.blocks.map(i => i.id) && pos !== xpos));
  }

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

  onDataUpload(data) {
    for (const [roleName, role] of Object.entries(data.roles)) {
      role.perks.forEach(x => delete x.name);
      role.itemsets = role.itemsets.map(x => x._data ? x.build(false, false) : ItemSetHandler.parse(Mana.champions[data.championId].key, x, x.provider).build(false, false));
    }
  }

  onDataStore(data) {
    delete data.championId;
    delete data.gameVersion;

    delete data.version;
    delete data.region;
  }

  _hasDuplicates(array) {
    return array.find((element, index) => (array.indexOf(element) != index));
  }
}

module.exports = DataValidator;
