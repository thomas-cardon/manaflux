var UI = {};

UI.error = function(err) {
}

let summonerSpells;

UI.enableSummonerSpells = function(spells) {
	$('#loadSummonerSpells').show();
}

UI.disableSummonerSpells = () => $('#loadSummonerSpells').hide();

UI.enableHextechAnimation = function(championKey, primaryStyleId) {
	$('.championPortrait > #bg').attr('src', 'assets/img/vfx-' + (primaryStyleId === null ? 'white' : primaryStyleId) + '.png');
	$('.championPortrait > #champion')
	.attr('src', 'https://ddragon.leagueoflegends.com/cdn/8.3.1/img/champion/' + championKey + '.png')
	.ready(() => $(".title").animate({ "margin-top": "55%" }, 700, "linear", () => $('.championPortrait').show()));
}

UI.disableHextechAnimation = () => {
	$('.championPortrait').hide();
	$(".title").animate({ "margin-top": "0%" }, 700, "linear");
}

$('#loadSummonerSpells').click(function() {
	Mana.user.updateSummonerSpells(summonerSpells);
});

$(document).ready(function() {
	$('.tablinks').click(function() {
		const content = $(`.tabcontent[data-tabid="${$(this).data('tabid')}"]`);
		document.getElementById("selected").style.marginLeft = (89 + $(this).position().left) + 'px';

		$('.tabcontent').hide();
		content.show();

		$('.tablinks').removeClass('active');
		$(this).addClass('active');
	});
});

ipcRenderer.once('update-ready', async (event, data) => {
	$('.tablinks[data-tabid="update"]').show();

	$('.tabcontent[data-tabid="update"] > #version').text(`Version ${data.version}`);
	$('.tabcontent[data-tabid="update"] > #size').text(getReadableFileSizeString(files[0].size));

	$('.tabcontent[data-tabid="update"] > .textcontainer').text(jQuery(data.releaseNotes).text());

	$('.tabcontent[data-tabid="update"] > #update').one("click", () => ipcRenderer.send('update-install'));
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
