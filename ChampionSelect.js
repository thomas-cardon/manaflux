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
      const { runes, summonerspells } = data;

      Mana.user.updateRunePages(runes);

      UI.enableSummonerSpells(summonerspells);
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

  UI.disableSummonerSpells();
  UI.disableHextechAnimation();
}
