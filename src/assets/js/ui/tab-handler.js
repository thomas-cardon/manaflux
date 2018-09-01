/* Tab Handler */
$(document).ready(function() {
	$('.tablinks').click(function() {
    navigationId = 0;

		$('.tabcontent').hide();
		$(`.tabcontent[data-tabid=${$(this).data('tabid')}][data-tabn=0]`).show();

		$('.tablinks').removeClass('active');
		$(this).addClass('active');

		/* Navigation Menus */
		if ($(`.tabcontent[data-tabid=${$(this).data('tabid')}][data-tabn=1]`).length) $('#nav-menu').show();
		else $('#nav-menu').hide();

		document.getElementById('selected').style.marginLeft = ($(this).offset().left + ($(this).width() / 2)) + 'px';
	});

	$('button[data-tabid]').eq(0).click();
});
