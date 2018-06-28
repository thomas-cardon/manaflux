let Timer, MyTeam = [], TheirTeam = [], Last;
let User;

const ProviderHandler = new (require('./ProviderHandler'))();

Mana.on('champselect', function(d) {
  if (!d && Timer) return destroyDisplay();
  else if (!d) return;

  if (Timer && Timer.id)
  clearInterval(Timer.id);

  Timer = d.timer;
  MyTeam = d.myTeam;
  TheirTeam = d.theirTeam;

  updateDisplay();
});

function updateDisplay() {
  User = MyTeam.find(elem => elem.summonerId === Mana.user.summoner.summonerId);
  if (Last === User.championId) return;

  if ((Last = User.championId) !== 0) {
    ProviderHandler.getChampionRunePages(Mana.champions[User.championId], User.assignedPosition === "" ? null : User.assignedPosition).then(runes => {
      console.dir(runes);
      Mana.user.updateRunePages(runes);
      Mana.status('Loaded runes for ' + Mana.champions[User.championId].name + '...');
    });
  }
}

function destroyDisplay() {
  Mana.status('Waiting for champion select...');

  Timer = null;
  MyTeam = TheirTeam = [];
}
