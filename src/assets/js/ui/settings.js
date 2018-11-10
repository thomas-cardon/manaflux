/* input element support */
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

/* sortable lists support */
$(".sortable[data-settings-key]").each(function() {
  const mergeIfMissing = $(this).data('settings-merge-list-if-missing-value') || false, removeIfMissing = $(this).data('settings-remove-if-missing-value') || false;

  const defaultValues = this.dataset.settingsDefault.split(',');
  const values = Mana.getStore().get(this.dataset.settingsKey, defaultValues);

  if (mergeIfMissing) {
    let saveNeeded;
    for (let i = 0; i < defaultValues.length; i++) {
      if (values.indexOf(defaultValues[i]) === -1) {
        values.push(defaultValues[i]);
        saveNeeded = true;
      }
    }

    if (saveNeeded) Mana.getStore().set(this.dataset.settingsKey, values);
  }

  if (removeIfMissing) {
    let saveNeeded;
    for (let i = 0; i < values.length; i++) {
      if (defaultValues.indexOf(values[i]) === -1) {
        values.splice(i, 1);
        saveNeeded = true;
      }
    }

    if (saveNeeded) Mana.getStore().set(this.dataset.settingsKey, values);
  }

  for (let i = 0; i < values.length; i++)
    $(this).append(`<li class="ui-state-default sortable-button" value="${values[i]}">${i18n.__('settings-' + this.dataset.settingsKey + '-' + values[i])}</li>`);

  $(this).css('list-style', 'disc inside').sortable({
    update: function(event, ui) {
      let array = [];
      $(this).children().each(function() {
        array.push($(this).attr('value'));
      });

      Mana.getStore().set(this.dataset.settingsKey, array);
      console.log(2, `[Settings] Changing value of #${this.dataset.settingsKey} to: ${array}`);

      Sounds.play('checkboxClick');
    }
  });
});
