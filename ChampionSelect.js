let GameMode, MyTeam = [], TheirTeam = [], Last;
let User;

const ProviderHandler = new (require('./ProviderHandler'))();

Mana.on('champselect', async function(d) {
  if (!d && MyTeam.length > 0) return destroyDisplay();
  else if (!d) return;

  GameMode = await Mana.user.getGameMode();

  MyTeam = d.myTeam;
  TheirTeam = d.theirTeam;

  updateDisplay();
});

function updateDisplay() {
  User = MyTeam.find(elem => elem.summonerId === Mana.user.summoner.summonerId);
  if (Last === User.championId) return;

  if ((Last = User.championId) !== 0) {
    ProviderHandler.getChampionData(Mana.champions[User.championId], User.assignedPosition === "" ? null : User.assignedPosition, GameMode).then(data => {
      const { runes, itemsets, summonerspells } = data;

      if (Mana.store.get('enableItemSets'))
        for (let itemset of itemsets)
          itemset.save();

      if (Mana.store.get('loadRunesAutomatically', true))
        Mana.user.updateRunePages(runes);
      else
        $('button#loadRunes').enableManualButton(() => Mana.user.updateRunePages(runes));

      if (Mana.store.get('enableSummonerSpellButton'))
        $('button#loadSummonerSpells').enableManualButton(() => Mana.user.updateSummonerSpells(summonerspells));

      UI.enableHextechAnimation(Mana.champions[User.championId].key, runes[0].primaryStyleId);
      Mana.status('Loaded runes for ' + Mana.champions[User.championId].name + '...');
    }).catch(err => {
      console.error(err);
      UI.error(err);
    });
  }
}

function destroyDisplay() {
  Mana.status('Waiting for champion select...');
  MyTeam = TheirTeam = [];

  UI.disableHextechAnimation();

  if (!Mana.store.get('loadRunesAutomatically', true))
    $('button#loadRunes').disableManualButton();

  if (Mana.store.get('enableSummonerSpellButton', true))
    $('button#loadSummonerSpells').disableManualButton();
}
