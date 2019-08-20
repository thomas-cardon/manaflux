let timer = 0;

module.exports = {
  load: function(Mana) {
    $('#runesInventory').sortable({
      update: function( event, ui ) {
        console.dir(arguments);
      }
    });
  },
  userConnected: function(e) {
    trigger(true);
    timer = 5000;
  },
  userDisconnected: function(e) {
    timer = -1;
  },
  inChampionSelect: function(e) {
    timer = 500;
  },
  outChampionSelect: function(e) {
    timer = 5000;
  }
};

function trigger(now) {
  if (timer < 0) return;

  setTimeout(() => {
    Mana.user.getPerksInventory().queryPerks().then(perks => {
      $('#runesInventory').children().remove();

      for (let perk of perks)
        $('#runesInventory').append(`<li class="ui-state-default sortable-button ui-sortable-handle" id="runes-${perk.id}">${perk.name}</li>`);
      $('#runesInventory').sortable('refresh');
      trigger();
    });
  }, now ? 0 : timer);
}
