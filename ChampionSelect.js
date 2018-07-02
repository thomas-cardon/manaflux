let Timer, GameMode, MyTeam = [], TheirTeam = [], Last;
let User;

const rp = require('request-promise-native');
const ProviderHandler = new (require('./ProviderHandler'))();

let taskId;

Mana.on('champselect', async function(d) {
  if (!d && MyTeam.length > 0) return destroyDisplay();
  else if (!d && !taskId) return;
  else if (!d) {
    console.log(`Cancelled Fake Champion Select. Disabled Fake Mode.`);
    clearTimeout(taskId);
    return Mana.fakeMode = taskId = false;
  }

  GameMode = await Mana.user.getGameMode();

  MyTeam = d.myTeam;
  TheirTeam = d.theirTeam;

  if (Mana.fakeMode && !Timer) {
    console.log(`Fake Mode Enabled. Cancelling Champion Select in ${d.timer.adjustedTimeLeftInPhaseInSec - 2} seconds.`);
    taskId = setTimeout(() => rp({ method: 'POST', uri: Mana.base + 'lol-lobby/v1/lobby/custom/cancel-champ-select' }), d.timer.adjustedTimeLeftInPhase - 2000);
  }

  Timer = d.timer;

  updateDisplay();
});

function updateDisplay() {
  User = MyTeam.find(elem => elem.summonerId === Mana.user.summoner.summonerId);
  if (Last === User.championId) return;
  if ((Last = User.championId) === 0) return;

  if (Mana.store.get('enableTrayIcon')) UI.show();

  ProviderHandler.getChampionData(Mana.champions[User.championId], User.assignedPosition === "" ? null : User.assignedPosition, GameMode).then(data => {
    console.dir(data);
    const { runes, itemsets, summonerspells } = data;

    if (Mana.store.get('enableItemSets'))
      for (let itemset of itemsets)
        itemset.save();

    if (Mana.store.get('loadRunesAutomatically', true)) Mana.user.updateRunePages(runes);
    else $('button#loadRunes').enableManualButton(() => Mana.user.updateRunePages(runes));

    if (Mana.store.get('enableSummonerSpellButton'))
      $('button#loadSummonerSpells').enableManualButton(() => Mana.user.updateSummonerSpells(summonerspells));

    UI.enableHextechAnimation(Mana.champions[User.championId].key, runes[0].primaryStyleId);
    Mana.status('Loaded runes for ' + Mana.champions[User.championId].name + '...');
  }).catch(err => {
    console.error(err);
    UI.error(err);
  });
}

function destroyDisplay() {
  Mana.status('Waiting for champion select...');
  MyTeam = TheirTeam = [];

  UI.disableHextechAnimation();

  if (!Mana.store.get('loadRunesAutomatically', true))
    $('button#loadRunes').disableManualButton();

  if (Mana.store.get('enableSummonerSpellButton', true))
    $('button#loadSummonerSpells').disableManualButton();

  if (Mana.store.get('enableTrayIcon'))
    UI.tray();
}
