/*
* Should slowly replace DataValidator
* Those functions ensure Manaflux parses correct data
*/
const DamageControl = {
  Perks: {
    verify: function(page) {},
    equals: function(a, b) {},
    concat: function(a, b) {
      return a.concat(b.filter(x => DamageControl.Perks.filter(a, x)));
    },
    filter: function(arr, page) {
      if (arr.find(x => x.selectedPerkIds === page.selectedPerkIds)) return false;
      if (arr.find(x => x.name === page.name)) page.name += 'D';

      return true;
    }
  }
};

module.exports = DamageControl;
