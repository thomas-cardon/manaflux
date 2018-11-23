const app = require('../helpers/initializeSpectron')();

const chaiAsPromised = require("chai-as-promised");
const chai = require("chai");

var expect = chai.expect;

chai.should();
chai.use(chaiAsPromised);

const LeaguePlug = require('../objects/leagueplug');

let connector = null;
before(function() {
  return connector = new LeaguePlug();
});

describe('League', function() {
  it('find path', function () {
    return this.path = connector.getPath();
  });

  it('starts', function () {
    return connector.start(this.path);
  });

  it('connects', function () {
    let p = connector.should.emit('connected');
    connector.getConnectionHandler().login();
    return p;
  });

  it('logs in', function () {
    return connector.should.emit('logged-in');
  });
});

after(function () {
   connector.end();
});
