$(document).ready(() => {
  $('[data-i18n]').each(function() {
    log.log(2, `[Localization] Loading value: ${$(this).data('i18n')}`);
    $(this).text(i18n.__($(this).data('i18n')));
  });
});
