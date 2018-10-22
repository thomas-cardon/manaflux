let Sounds = {};

Sounds._dict = {
  buttonClick: 'button-click.ogg',
  checkboxClick: 'checkbox-click.ogg',
  dropdownClick: 'dropdown-click.ogg',
  dropdownSelect: 'dropdown-select.ogg',
  loaded: 'loaded.ogg',
  otherClick: 'other-click.ogg',
  dataLoaded: 'data-loaded.ogg'
};

Sounds.play = function(id) {
  document.getElementById('soundEngineSource').src = 'assets/audio/' + Sounds._dict[id];
  document.getElementById('soundEngine').load();
  document.getElementById('soundEngine').play();
};

Sounds.stop = function() {
  document.getElementById('soundEngine').pause();
};
