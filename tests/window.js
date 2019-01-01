const app = require('../helpers/initializeSpectron')();

const chaiAsPromised = require("chai-as-promised");
const chai = require("chai");

var expect = chai.expect;

chai.should();
chai.use(chaiAsPromised);

before(function() {
  this.timeout(20000);

  chaiAsPromised.transferPromiseness = app.transferPromiseness;
  return app.start();
});

describe('Window', function() {
  it('opened', function () {
    return app.client.waitUntilWindowLoaded().getWindowCount().should.eventually.have.at.least(1);
  });

  it('title', function () {
    return app.browserWindow.getTitle().should.eventually.equal('Manaflux');
  });
});

after(function () {
   if (app && app.isRunning()) return app.stop();
});
