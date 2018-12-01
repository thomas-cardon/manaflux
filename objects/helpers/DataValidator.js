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

  onDataDownloaded(d, champion) {
    if (!d) return null;

    console.log('[DataValidator] Copying required properties for Flu.x');
    let data = { ...d };

    data.championId = champion.id;
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
      role.itemsets = role.itemsets.map(x => x._data ? x.build(false, false) : ItemSetHandler.parse(Mana.champions[data.championId].key, x, x.provider).build(false, false));
    }
  }

  onDataStore(data) {
    delete data.gameVersion;

    delete data.version;
    delete data.region;
  }

  /*
  * Ensure every rune is at its slot, that styles are the good ones, creates page names, etc.
  */
  onPerkPagesCheck(array, champion, role, preseason) {
    array = array.filter(x => x.selectedPerkIds && x.selectedPerkIds.length >= 6);
    console.dir(array);

    if (Mana.preseason)
    UI.success(i18n.__('preseason-perks'));

    array.forEach((page, index) => {
      const provider = Mana.providerHandler.getProvider(page.provider);
      console.log(3, 'Old page');
      console.dir(3, page);

      console.log(`[DataValidator] Validating perk pages from ${provider.name}, for ${champion.name} - ${role}`);

      page.name = `${page.provider ? provider.getCondensedName() : 'XXX'}${index + 1} ${champion.name} > ${UI.stylizeRole(role)}${page.suffixName ? ' ' + page.suffixName : ''}`;

      page.primaryStyleId = parseInt(page.primaryStyleId || Mana.gameClient.findPerkStyleByPerkId(page.selectedPerkIds[0]).id);
      page.subStyleId = parseInt(page.subStyleId || Mana.gameClient.findPerkStyleByPerkId(page.selectedPerkIds[4]).id);

      page.selectedPerkIds = page.selectedPerkIds.filter(x => !isNaN(x)).map(x => parseInt(x));

      const primaryStyle = Mana.gameClient.styles.find(x => x.id == page.primaryStyleId);
      const subStyle = Mana.gameClient.styles.find(x => x.id == page.subStyleId);

      if (page.selectedPerkIds.length === 6 && Mana.preseason) {
        console.log('[DataValidator] Looks like it\'s preseason and it\'s time to fix missing things...');
        page.selectedPerkIds = page.selectedPerkIds.concat(primaryStyle.defaultPerks.slice(-3));
      }

      page.selectedPerkIds.forEach((id, index) => {
        console.log(`index: ${index} for id ${id}`);

        if (index > 5 && !primaryStyle.defaultStatModsPerSubStyle.find(x => x.id == page.subStyleId).perks.includes(id)) {
          console.log(`[DataValidator] Perk mod #${id} isn\'t supposed to be at the slot ${index}. Replacing with generic: ${id = primaryStyle.defaultStatModsPerSubStyle.find(x => x.id == page.subStyleId).perks[index % 6]}.`);
        }
      });

      console.log(3, 'New page');
      console.dir(3, page);
    });

    return array;
  }

  onItemSetsCheck(array, champion, role) {
    let indexes = {};

    return array.map((x, index) => {
      x = ItemSetHandler.parse(champion.key, x, x.provider);
      indexes[x._data.provider || 'XXX'] = indexes[x._data.provider || 'XXX'] + 1 || 1;

      x._data.title = `${x._data.provider ? Mana.providerHandler.getProvider(x._data.provider).getCondensedName() : 'XXX'}${indexes[x._data.provider || 'XXX']} ${champion.name} > ${UI.stylizeRole(role)}`;
      return x;
    }).filter((set, pos, arr) => !arr.some((x, xpos) => x._data.blocks.map(i => i.id) === set._data.blocks.map(i => i.id) && pos !== xpos));
  }

  _hasDuplicates(array) {
    return array.find((element, index) => (array.indexOf(element) != index));
  }
}

module.exports = DataValidator;
