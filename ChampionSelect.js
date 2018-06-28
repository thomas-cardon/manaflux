let Timer, MyTeam = [], TheirTeam = [];
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
  if (User.championId !== 0) {
    Mana.status('Loaded runes for ' + Mana.champions[User.championId].name + '...');
    ProviderHandler.getChampionRunePages(Mana.champions[User.championId], User.assignedPosition === "" ? null : User.assignedPosition).then(runes => Mana.user.updateRunePages(runes));
  }
}

function destroyDisplay() {
  Mana.status('Waiting for champion select...');

  Timer = null;
  MyTeam = TheirTeam = [];
}
