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

  onDataDownloaded(data, champion) {
    if (!data) return null;
    data.championId = champion.id;

    for (const [roleName, role] of Object.entries(data.roles)) {
      role.perks = this.onPerkPagesCheck(role.perks, champion, roleName);
      role.itemsets = this.onItemSetsCheck(role.itemsets, champion, roleName);
    }

    return data;
  }

  onDataUpload(d) {
    if (!d) return null;

    console.log('[DataValidator] Copying required properties for Flu.x');
    let data = { ...d };

    data.gameVersion = Mana.gameClient.branch;

    data.version = Mana.version;
    data.region = Mana.gameClient.region;

    for (const [roleName, role] of Object.entries(data.roles)) {
      role.perks.forEach(x => delete x.name);
      role.itemsets = role.itemsets.map(x => x._data ? x.build(false, false) : ItemSetHandler.parse(Mana.gameClient.champions[data.championId].key, x, x.provider).build(false, false));
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

    for (let i = 0; i < array.length; i++) {
      const provider = Mana.providerHandler.getProvider(array[i].provider);
      const page = array[i];

      console.log(3, 'Old page');
      console.dir(3, page);

      console.log(`[DataValidator] Validating perk pages from ${provider.name}, for ${champion.name} - ${role}`);

      page.name = `${page.provider ? provider.getCondensedName() : 'XXX'}${i + 1} ${champion.name} > ${UI.stylizeRole(role)}${page.suffixName ? ' ' + page.suffixName : ''}`;

      page.primaryStyleId = parseInt(page.primaryStyleId || Mana.gameClient.findPerkStyleByPerkId(page.selectedPerkIds[0]).id);
      page.subStyleId = parseInt(page.subStyleId || Mana.gameClient.findPerkStyleByPerkId(page.selectedPerkIds[4]).id);

      page.selectedPerkIds = page.selectedPerkIds.filter(x => !isNaN(x)).map(x => parseInt(x));

      const primaryStyle = Mana.gameClient.styles.find(x => x.id == page.primaryStyleId), subStyle = Mana.gameClient.styles.find(x => x.id == page.subStyleId);

      let rowIndexes = [];
      for (let ii = 0; ii < array[i].selectedPerkIds.length; ii++) {
        const style = ii > 3 ? subStyle : primaryStyle, id = array[i].selectedPerkIds[ii];

        if (ii < 5) {
          if (ii > 3) {
            const availablePerks = [...style.slots.slice(1, 4).map(x => x.perks)];
            let rowIndex = availablePerks.findIndex(x => x.includes(id));

            if (rowIndex === -1 || rowIndexes.includes(rowIndex)) {
              let newPerk;
              while (!newPerk || array[i].selectedPerkIds.includes(newPerk)) {
                rowIndex = [0, 1, 2].filter(x => !rowIndexes.includes(x))[0];
                newPerk = availablePerks[rowIndex][Math.floor(Math.random() * (availablePerks[rowIndex].length - 0 + 1)) + 0];
              }

              console.log(`[DataValidator] Perk #${id} isn\'t supposed to be at the slot ${ii}. Replacing with generic: ${array[i].selectedPerkIds[ii] = newPerk}.`);
            }

            rowIndexes.push(rowIndex);
          }
          else if (!style.slots[ii].perks.includes(id)) {
            const availablePerks = style.slots[ii].perks;

            let newPerk;
            while (!newPerk || array[i].selectedPerkIds.includes(newPerk)) {
              newPerk = availablePerks[Math.floor(Math.random() * (availablePerks.length - 0 + 1)) + 0];
            }

            console.log(`[DataValidator] Perk #${id} isn\'t supposed to be at the slot ${ii}. Replacing with generic: ${array[i].selectedPerkIds[ii] = newPerk}.`);
          }
        }
      }

      this.validatePerkShards(page);

      console.log(3, 'New page');
      console.dir(3, page);
    }

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

  validatePerkShards(page) {
    console.log(`[DataValidator] Perk shards >> validating "${page.name}"`);

    const primaryStyle = Mana.gameClient.styles.find(x => x.id == page.primaryStyleId);

    if (page.selectedPerkIds.length >= 6 && page.selectedPerkIds.length < 9)
      page.selectedPerkIds = page.selectedPerkIds.concat(primaryStyle.defaultPerks.slice(-(9 - page.selectedPerkIds.length)));
    else if (page.selectedPerkIds.length !== 9) console.log(`[DataValidator] Perk shards >> can't validate #${page.id}: perks length isn't 9 or at least above 6`);
    else {
      const defaultShards = primaryStyle.slots.slice(-3).map(x => x.perks);
      let shards = page.selectedPerkIds.slice(-3);

      for (let i = 0; i < shards.length; i++) {
        if (!defaultShards[i].includes(shards[i])) {
          console.log(`[DataValidator] Perk shards >> mod #${shards[i]} can't be included at slot ${i}, replacing with random one`);
          console.log(`[DataValidator] Perk shards >> Selected #${shards[i] = defaultShards[i][Math.floor(Math.random() * defaultShards[i].length)]}`);
        }
      }

      page.selectedPerkIds = page.selectedPerkIds.slice(0, -3).concat(shards);
    }
  }

  _hasDuplicates(array) {
    return array.find((element, index) => (array.indexOf(element) != index));
  }
}

module.exports = DataValidator;
