UI.loadSettings = function(Mana) {
  document.querySelectorAll('input:not([type="checkbox"])[data-settings-key], select[data-settings-key]').forEach(function(el) {
    console.log(2, `[Settings] Loading value of ${el.id = el.dataset.settingsKey} to: ${Mana.getStore().get(el.dataset.settingsKey, el.dataset.settingsDefault)}`);

    if (!Mana.getStore().has(el.dataset.settingsKey) && el.dataset.settingsDefault)
      Mana.getStore().set(el.dataset.settingsKey, el.dataset.settingsDefault);

    el.value = Mana.getStore().get(el.dataset.settingsKey);
    el.addEventListener('input', function() {
      console.log(2, `[Settings] Changing value of ${el.dataset.settingsKey} to: ${el.value}`);
      Mana.getStore().set(el.dataset.settingsKey, el.value);

      Sounds.play('dropdownSelect');
    });
  });

  /* checkbox element support */
  document.querySelectorAll('input[type="checkbox"][data-settings-key]').forEach(function(el) {
    console.log(2, `[Settings] Loading value of ${el.id = el.dataset.settingsKey} to: ${Mana.getStore().get(el.dataset.settingsKey, el.dataset.settingsDefault)}`);

    if (!Mana.getStore().has(el.dataset.settingsKey) && el.dataset.settingsDefault)
      Mana.getStore().set(el.dataset.settingsKey, el.dataset.settingsDefault);

    el.checked = Mana.getStore().get(el.dataset.settingsKey);
    $(el).siblings('label').prop('for', el.dataset.settingsKey);
    el.addEventListener('input', function() {
      console.log(2, `[Settings] Changing value of ${el.dataset.settingsKey} to: ${$(el).is(":checked")}`);
      Mana.getStore().set(el.dataset.settingsKey, el.checked);

      Sounds.play('checkboxClick');
    });
  });
};
