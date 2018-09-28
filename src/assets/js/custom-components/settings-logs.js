const { shell, app } = require('electron');

module.exports = {
  click: function() {
    console.log(2, '[UI] Opening logs folder');
    shell.showItemInFolder(app.getPath('logs'));
  }
};
