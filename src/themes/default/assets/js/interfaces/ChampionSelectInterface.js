class ChampionSelectInterface {

  onChampionSelectStart() {

  }

  onChampionNotPicked() {
    return UI.status('champion-select-pick-a-champion');
  }

  onChampionChange(champion) {
    document.getElementById('buttons').style.display = 'none';
    while (document.getElementById('positions').firstChild) {
      document.getElementById('positions').removeChild(document.getElementById('positions').firstChild);
    }

    $('#loadRunes, #loadSummonerSpells').disableManualButton(true);

    UI.enableHextechAnimation(champion);
  }

  onChampionDataDownloaded(champion, positions, data, self = this) {
    let positionsHTML = '';
    positions.forEach(r => {
      console.log('[ChampionSelect] Added position:', r);
      positionsHTML += `<option value="${r}">${UI.stylizeRole(r)}</option>`;
    });

    document.getElementById('positions').innerHTML = positionsHTML;
    document.getElementById('positions').onchange = function() {
      self.onPositionChange(champion, this.value.toUpperCase(), data[this.value.toUpperCase()]);
    };

    /*
    // Sets value and checks if it's not null, if it is then let's stop everything
    if (!(document.getElementById('positions').value = res.roles[this.getPosition()] ? this.gameModeHandler.getPosition(this.getPosition()) : Object.keys(res.roles).filter(x => res.roles[x].perks.length > 0)[0])) {
      Mana.championStorageHandler.remove(champion.id);
      //throw UI.themes.interfaces.crashes.onCrash(i18n.__('champion-select-error-empty'));
    }*/

    document.getElementById('positions').onchange();

    document.getElementById('positions').style.display = 'unset';
    document.getElementById('buttons').style.display = 'block';
  }

  onPositionChange(position) {
    console.log('Champion Select >> Position changed:', position);

    document.getElementById('positions').value = position;
    document.getElementById('positions').onchange();
  }

  onChampionSelectEnd() {

  }
}

module.exports = new ChampionSelectInterface();
