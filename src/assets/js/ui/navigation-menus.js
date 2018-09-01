/* Navigation menus */
let navigationId = 0;
UI.nav = n => {
	const tabcontent = $(`.tabcontent[data-tabid=${$('.tab.active').data('tabid')}][data-tabn=${navigationId + n}]`);
	if (tabcontent.length > 0) {
		navigationId += n;

		log.log(2, `[Navigation] Heading to tab #${tabcontent.data('tabid')}, n:${navigationId}`);
		$('.tabcontent').hide();
		tabcontent.show();
	}
	else log.log(2, `[Navigation] Can't navigate to tab #${$('.tab.active').data('tabid')}, n:${navigationId + n}`);
}
