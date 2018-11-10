module.exports = function() {
  const mergeIfMissing = this.dataset.settingsMergeListIfMissingValue || false, removeIfMissing = this.dataset.settingsRemoveIfMissingValue || false;

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

  let list = '';
  for (let i = 0; i < values.length; i++)
    list += `<li class="ui-state-default sortable-button" value="${values[i]}">${i18n.__('settings-' + this.dataset.settingsKey + '-' + values[i])}</li>`;

  this.innerHTML = list;

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
}
