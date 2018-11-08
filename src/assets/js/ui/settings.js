/* input element support */
$('input[type!="checkbox"][data-settings-key], select[data-settings-key]').each(function() {
  console.log(2, `[Settings] Loading value of ${this.id = $(this).data('settings-key')} to: ${Mana.getStore().get($(this).data('settings-key'), $(this).data('settings-default'))}`);

  if (!Mana.getStore().get($(this).data('settings-key')) && $(this).data('settings-default'))
    Mana.getStore().set($(this).data('settings-key'), $(this).data('settings-default'));

  this.value = Mana.getStore().get($(this).data('settings-key'));
}).change(function() {
  console.log(2, `[Settings] Changing value of ${$(this).data('settings-key')} to: ${this.value}`);
  Mana.getStore().set($(this).data('settings-key'), this.value);

  Sounds.play('dropdownSelect');
});

/* checkbox element support */
$('input[type="checkbox"]').each(function() {
  console.log(2, `[Settings] Loading value of ${this.id = $(this).data('settings-key')} to: ${Mana.getStore().get($(this).data('settings-key'), $(this).data('settings-default'))}`);

  if (!Mana.getStore().get($(this).data('settings-key')) && $(this).data('settings-default'))
    Mana.getStore().set($(this).data('settings-key'), $(this).data('settings-default'));

  this.checked = Mana.getStore().get($(this).data('settings-key'));
  $(this).siblings('label').prop('for', $(this).data('settings-key'));
}).change(function() {
  console.log(2, `[Settings] Changing value of ${$(this).data('settings-key')} to: ${$(this).is(":checked")}`);
  Mana.getStore().set($(this).data('settings-key'), this.checked);

  Sounds.play('checkboxClick');
});

/* sortable lists support */
$(".sortable[data-settings-key]").each(function() {
  const mergeIfMissing = $(this).data('settings-merge-list-if-missing-value') || false, removeIfMissing = $(this).data('settings-remove-if-missing-value') || false;

  const defaultValues = $(this).data('settings-default').split(',');
  const values = Mana.getStore().get($(this).data('settings-key'), defaultValues);

  if (mergeIfMissing) {
    let saveNeeded;
    for (let i = 0; i < defaultValues.length; i++) {
      if (values.indexOf(defaultValues[i]) === -1) {
        values.push(defaultValues[i]);
        saveNeeded = true;
      }
    }

    if (saveNeeded) Mana.getStore().set($(this).data('settings-key'), values);
  }

  if (removeIfMissing) {
    let saveNeeded;
    for (let i = 0; i < values.length; i++) {
      if (defaultValues.indexOf(values[i]) === -1) {
        values.splice(i, 1);
        saveNeeded = true;
      }
    }

    if (saveNeeded) Mana.getStore().set($(this).data('settings-key'), values);
  }

  for (let i = 0; i < values.length; i++)
    $(this).append(`<li class="ui-state-default sortable-button" value="${values[i]}">${i18n.__('settings-' + $(this).data('settings-key') + '-' + values[i])}</li>`);

  $(this).css('list-style', 'disc inside').sortable({
    update: function(event, ui) {
      let array = [];
      $(this).children().each(function() {
        array.push($(this).attr('value'));
      });

      Mana.getStore().set($(this).data('settings-key'), array);
      console.log(2, `[Settings] Changing value of #${$(this).data('settings-key')} to: ${array}`);

      Sounds.play('checkboxClick');
    }
  });
});
