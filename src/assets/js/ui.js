var UI = {};

/**
* Shows a status on the UI and logs it into LoggingHandler
* @param {prefix} string - What will be written before the message in the logs
* @param {translationString} string - Allows ManaFlux to show a translated message on the UI and in english in the logs
* @param {parameters} string... - Translation parameters
*/
UI.status = (prefix, ...args) => {
  let x = i18n.__.call(i18n, ...args);
  let y = i18n.__d.call(i18n, ...args);

  $('.status').text(x + '...');
  log.log(2, `[${prefix}] ${y}...`);
};

/**
* Shows an error on the UI and logs it into LoggingHandler
* @param {translationString} string - Allows ManaFlux to show a translated message on the UI and in english in the logs
* @param {parameters} string... - Translation parameters
*/
UI.error = function(...args) {
  $('#warning').show();

  if (args[0] instanceof Error) {
    alertify.notify(args[0].toString(), 'error', 10, () => $('#warning').hide());
    return log.error(1, args[0]);
  }

	let x = i18n.__.call(i18n, ...args);
	let y = i18n.__d.call(i18n, ...args);

	$('#warning').show();
	alertify.notify(args[0] instanceof Error ? args[0].toString() : x, 'error', 10, () => $('#warning').hide());
	return log.error(2, y);
}

UI.success = msg => alertify.notify(msg, 'success', 10);

UI.tray = function(tray = true) {
	if (tray) {
		ipcRenderer.send('win-hide');
		ipcRenderer.send('tray', true);
	}
	else {
		ipcRenderer.send('tray', false);
		ipcRenderer.send('win-show', true);
	}
}


window.onbeforeunload = (e) => UI.tray(false);
ipcRenderer.on('error', (event, data) => UI.error(data));

/* Manual Button Handler */
$.fn.enableManualButton = function(cb, off) {
	if (off) $(this).off();
	$(this).show().click(cb);
	return this;
}

$.fn.disableManualButton = function() {
	$(this).off().hide();
	return this;
}

/* Hextech Animation Handler */
UI.enableHextechAnimation = function(champion, primaryStyleId) {
	$('.championPortrait > #bg').attr('src', 'assets/img/vfx-' + (primaryStyleId ? primaryStyleId : 'white') + '.png');
	$('.championPortrait > #champion')
	.attr('src', champion.img)
	.on('load', () => $(".title").animate({ "margin-top": "55%" }, 700, "linear", () => $('.championPortrait').show()));
}

UI.disableHextechAnimation = () => {
	$('.championPortrait').hide();
	$(".title").animate({ "margin-top": "0%" }, 700, "linear");
}

/* Navigation menus */
let navigationId = 0;
UI.nav = n => {
	const tabcontent = $(`.tabcontent[data-tabid=${$('.tablinks.active').data('tabid')}][data-tabn=${navigationId + n}]`);
	if (tabcontent.length > 0) {
		navigationId += n;

		log.log(2, `[Navigation] Heading to tab #${tabcontent.data('tabid')}, n:${navigationId}`);
		$('.tabcontent').hide();
		tabcontent.show();
	}
	else log.log(2, `[Navigation] Can't navigate to tab #${$('.tablinks.active').data('tabid')}, n:${navigationId + n}`);
}

/* Tab Handler */
$(document).ready(function() {
	$('[data-i18n]').each(function() {
		log.log(2, `[Localization] Loading value: ${$(this).data('i18n')}`);
		$(this).text(i18n.__($(this).data('i18n')));
	});

	$('.tablinks').click(function() {
		$('.tabcontent').hide();
		$(`.tabcontent[data-tabid=${$(this).data('tabid')}][data-tabn=0]`).show();

		$('.tablinks').removeClass('active');
		$(this).addClass('active');

		/* Navigation Menus */
		if ($(`.tabcontent[data-tabid=${$(this).data('tabid')}][data-tabn=1]`).length) $('#nav-menu').show();
		else $('#nav-menu').hide();

		document.getElementById("selected").style.marginLeft = ($(this).offset().left + ($(this).width() / 2)) + 'px';
	});

	$('button[data-tabid="home"]').click();
});

/*
* Settings
*/
Mana.once('settings', store => {
	$('body').css('background', "linear-gradient(to bottom, rgba(125, 185, 232, 0) -1%, rgba(50, 96, 122, 0) 65%, rgba(10, 49, 64, 0.8) 100%), url('./assets/img/" + Mana.store.get('theme') + "')");

  /* input element support */
  $('input[data-settings-key]').change(function() {
    log.log(2, `[Settings] Changing value of ${$(this).data('settings-key')} to: ${this.value}`);
    store.set($(this).data('settings-key'), this.value);
  }).each(function() {
    log.log(2, `[Settings] Loading value of ${$(this).data('settings-key')} to: ${store.get($(this).data('settings-key'))}`);
    $(this).val(store.get($(this).data('settings-key')));
  });

	/* select element support */
	$('select[data-settings-key]').change(function() {
		log.log(2, `[Settings] Changing value of ${$(this).data('settings-key')} to: ${this.value}`);
		store.set($(this).data('settings-key'), this.value);
	}).each(function() {
		log.log(2, `[Settings] Loading value of ${$(this).data('settings-key')} to: ${store.get($(this).data('settings-key'))}`);
		$(this).val(store.get($(this).data('settings-key')));
	});

	/* checkbox element support */
	$(':checkbox[data-settings-key]').each(function() {
		log.log(2, `[Settings] Loading value of ${$(this).data('settings-key')} to: ${store.get($(this).data('settings-key'))}`);
		$(this).prop('checked', store.get($(this).data('settings-key')));

		$(this).prop('id', $(this).data('settings-key'));
		$(this).siblings('label').prop('for', $(this).data('settings-key'));
	}).change(function() {
		log.log(2, `[Settings] Changing value of ${$(this).data('settings-key')} to: ${$(this).is(":checked")}`);
		store.set($(this).data('settings-key'), $(this).is(":checked"));
	});

	/* sortable lists support */
	$(".sortable[data-settings-key]").each(function() {
		$(this).sortable({
			update: function(event, ui) {
				let array = [];
				$(this).children().each(function() {
					array.push($(this).attr('value'));
				});

				store.set($(this).data('settings-key'), array);
				log.log(2, `[Settings] Changing value of #${$(this).data('settings-key')} to: ${array}`);
			}
		});

    const mergeIfMissing = $(this).data('settings-merge-list-if-missing-value') || false;

    const defaultValues = $(this).data('settings-sortable-list-values').split(',');
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
	})
});

$('select[data-settings-key=theme]').change(function() {
	$('body').css('background', "linear-gradient(to bottom, rgba(125, 185, 232, 0) -1%, rgba(50, 96, 122, 0) 65%, rgba(10, 49, 64, 0.8) 100%), url('./assets/img/" + this.value + "')");
})

ipcRenderer.once('update-ready', async (event, data) => {
	log.log(2, '[Update] Available! version: ' + data.version);
	log.dir(3, data);

	$('.tablinks[data-tabid="update"]').show();

	$('#version').text(`Version ${data.version}`);
	$('#size').text(getReadableFileSizeString(data.files[0].size));

	$('#update').one("click", () => ipcRenderer.send('update-install'));
});

function getReadableFileSizeString(fileSizeInBytes) {
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
        fileSizeInBytes = fileSizeInBytes / 1024;
        i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};
