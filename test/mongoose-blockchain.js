var config = require('../config/config');
var should = require('should');
var mongoose = require('mongoose');
var utils = require('./utils');
var BitGoJS = require('bitgo');

var User = require('../examples/models/user');
var seedUserModel = require('../examples/models/seeds/user.js');
var seedAdminModel = require('../examples/models/seeds/admin.js');

before(function() {

  var testWalletLabel = config.wallet['label'];
  var testWalletPassword = config.wallet['password'];

  // First ensure that the BitGo Access token is set prior to continuing
  if (!process.env.BITGO_ACCESS_TOKEN) {
    console.log('\n\n** BitGo Access Token not set');
    console.log('** Retrieve your access token from https://www.bitgo.com and set it as an environment variable');
    console.log("** export BITGO_ACCESS_TOKEN='J3Das83k..3laelkwasd'");
    console.log('** Join us on Slack if you continue to experience issues https://slack.bitgo.com\n');
    process.exit(-1);
  };

  mongoose.connect(config.mongoURI['test']);

  // Seed the user model
  return utils.setupTestWallet(testWalletLabel, testWalletPassword)
  .then(function(res) {
    return seedUserModel();
  })
  .then(function(user) {
    user.meta.age.should.be.equal(18);
    user.location.should.be.equal('Palo Alto, CA');
    user.admin.should.be.equal(false);
    user.password.should.be.equal('password');
    user.username.should.be.equal('test_username');
    user.name.should.be.equal('test_name');
   })
   .then(function(res) {
     return seedAdminModel();
   })
  .then(function(admin) {
    admin.meta.age.should.be.equal(21);
    admin.location.should.be.equal('Palo Alto, CA');
    admin.admin.should.be.equal(true);
    admin.password.should.be.equal('password');
    admin.username.should.be.equal('test_username_admin');
    admin.name.should.be.equal('test_name_admin');
   })
   .catch(function(err) {
     throw new Error(err);
   });

});

describe('Blockchain testing suite - BitGo', function() {

  it('User schema is populated with BitGo wallet', function() {
    return User.findOne({ username: 'test_username' }).exec()
    .then(function(user) {
      user.bitcoin.walletId.should.be.ok();
    });
  });

  it('User is able to generate a new reusable address', function() {
    return User.deposit('test_username')
    .then(function (address) {
      address.should.be.ok();
    })
    .catch(function(err) {
      return console.log(err);
    });
  });

  it('Fund users wallet', function() {
    return User.deposit('test_username')
    .then(function (address) {
      return utils.sendToAddress(address.address);
    })
    .catch(function(err) {
      return console.log(err);
    });
  });

  if (!!config.wallet.label || !!config.wallet.password) {

    // Let the previous transaction settle
    it('User is able to make a in-network transfer', function() {
      return User.transfer('test_username', 'test_username_admin', 10000, 'password')
      .then(function(res) {
        return;
      })
      .catch(function(err) {
        throw new Error(err);
      });
    });

    // Let the previous transaction settle
    it('User is able to make an out-of-network transfer', function() {
      var withdrawalAddress;
      return User.deposit('test_username')
      .then(function (address) {
        address.should.be.ok();
        withdrawalAddress = address;
      })
      return User.withdrawal('test_username', withdrawalAddress, 10000, 'password')
      .then(function(res) {
        return;
      })
      .catch(function(err) {
        throw new Error(err);
      });
    });

  } else {
    throw new Error('Please set your test wallet parameters in the config/config.js file');
  }

});

after(function() {
  return User.findOne({ username: 'test_username' }).remove().exec()
  .then(function(user) {
    user.result.ok.should.be.equal(1);
    return User.findOne({ username: 'test_username_admin' }).remove().exec()
  })
  .then(function(admin) {
    admin.result.ok.should.be.equal(1);
  })
  .catch(function(err) {
    throw new Error(err);
  });
});
