let navigationId = 0;

module.exports = {
  click: function() {
    const n = $(this).data('n');

    const tabcontent = $(`.tabcontent[data-tabid=${$('.tab.active').data('tabid')}][data-tabn=${navigationId + n}]`);
  	if (tabcontent.length > 0) {
  		navigationId += n;

  		console.log(2, `[Navigation] Heading to tab #${tabcontent.data('tabid')}, n:${navigationId}`);
  		$('.tabcontent').hide();
  		tabcontent.show();
  	}
  	else console.log(2, `[Navigation] Can't navigate to tab #${$('.tab.active').data('tabid')}, n:${navigationId + n}`);
  }
};

$('.tabcontent').on('show', function(event) {
  $('a[data-n="1"]').children()[$(`.tabcontent[data-tabid=${$(this).data('tabid')}][data-tabn=${navigationId + 1}]`).length > 0 ? 'removeClass' : 'addClass']('arrow-disabled');
  $('a[data-n="-1"]').children()[$(`.tabcontent[data-tabid=${$(this).data('tabid')}][data-tabn=${navigationId - 1}]`).length > 0 ? 'removeClass' : 'addClass']('arrow-disabled');
});
