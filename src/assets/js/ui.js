var UI = {};

/**
* Shows a status on the UI and logs it into LoggingHandler
* @param {prefix} string - What will be written before the message in the logs
* @param {translationString} string - Allows Manaflux to show a translated message on the UI and in english in the logs
* @param {parameters} string... - Translation parameters
*/
UI.status = (prefix, ...args) => {
  let x = i18n.__.call(i18n, ...args);
  let y = i18n.__d.call(i18n, ...args);

  $('.status').text(x + '...');
  console.log(2, `[${prefix}] ${y}...`);
};

let s, id;
UI.temporaryStatus = (prefix, ...args) => {
  if (id) clearTimeout(id);
  else s = $('.status').text();
  
  UI.status.call(UI, prefix, ...args);

  id = setTimeout(() => {
    $('.status').text(s);
    id = null;
  }, 3000);
}

/**
* Shows an error on the UI and logs it into LoggingHandler
* @param {translationString} string - Allows Manaflux to show a translated message on the UI and in english in the logs
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

function getReadableFileSizeString(fileSizeInBytes) {
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
        fileSizeInBytes = fileSizeInBytes / 1024;
        i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};
