const Store = require('electron-store');

class ManaSettings {
  constructor() {
    this._store = new Store();
  }

  load(store = this._store) {
    /* input element support */
    $('input[data-settings-key]').each(function() {
      log.log(2, `[Settings] Loading value of ${$(this).data('settings-key')} to: ${store.get($(this).data('settings-key'), $(this).data('settings-default-value'))}`);
      $(this).val(store.get($(this).data('settings-key'), $(this).data('settings-default-value'))).trigger('settingsLoaded');
    }).change(function() {
      log.log(2, `[Settings] Changing value of ${$(this).data('settings-key')} to: ${this.value}`);
      store.set($(this).data('settings-key'), this.value);
    });

  	/* select element support */
  	$('select[data-settings-key]').each(function() {
  		log.log(2, `[Settings] Loading value of ${$(this).data('settings-key')} to: ${store.get($(this).data('settings-key'), $(this).data('settings-default-value'))}`);
  		$(this).val(store.get($(this).data('settings-key'), $(this).data('settings-default-value'))).trigger('settingsLoaded');
  	}).change(function() {
  		log.log(2, `[Settings] Changing value of ${$(this).data('settings-key')} to: ${this.value}`);
  		store.set($(this).data('settings-key'), this.value);
  	});

  	/* checkbox element support */
  	$(':checkbox[data-settings-key]').each(function() {
  		log.log(2, `[Settings] Loading value of ${$(this).data('settings-key')} to: ${store.get($(this).data('settings-key'), $(this).data('settings-default-value'))}`);
  		$(this).prop('checked', store.get($(this).data('settings-key'), $(this).data('settings-default-value')));

  		$(this).prop('id', $(this).data('settings-key'));
  		$(this).siblings('label').prop('for', $(this).data('settings-key'));

      $(this).trigger('settingsLoaded');
  	}).change(function() {
  		log.log(2, `[Settings] Changing value of ${$(this).data('settings-key')} to: ${$(this).is(":checked")}`);
  		store.set($(this).data('settings-key'), $(this).is(":checked"));
  	})

  	/* sortable lists support */
  	$(".sortable[data-settings-key]").each(function() {
      const mergeIfMissing = $(this).data('settings-merge-list-if-missing-value') || false;

      const defaultValues = $(this).data('settings-default-value').split(',');
  		const values = store.get($(this).data('settings-key'), defaultValues);

      if (mergeIfMissing) {
        let saveNeeded;
        for (let i = 0; i < defaultValues.length; i++) {
          if (values.indexOf(defaultValues[i]) === -1) {
            values.push(defaultValues[i]);
            saveNeeded = true;
          }
        }

        if (saveNeeded)
          store.set($(this).data('settings-key'), values);
      }

  		for (let i = 0; i < values.length; i++)
  			$(this).append(`<li class="ui-state-default sortable-button" value="${values[i]}">${i18n.__('settings-' + $(this).data('settings-key') + '-' + values[i])}</li>`);

      $(this).css('list-style', 'disc inside').sortable({
        update: function(event, ui) {
          let array = [];
          $(this).children().each(function() {
            array.push($(this).attr('value'));
          });

          store.set($(this).data('settings-key'), array);
          log.log(2, `[Settings] Changing value of #${$(this).data('settings-key')} to: ${array}`);
        }
      });

      $(this).trigger('settingsLoaded');
  	});
  }

  getStore() {
    return this._store;
  }

  stop() {
    $('[data-settings-key]').unbind();
  }
}

module.exports = ManaSettings;
