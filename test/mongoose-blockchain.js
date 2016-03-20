var config = require('../config/config');
var should = require('should');
var mongoose = require('mongoose');

var User = require('../examples/models/user');
var seedUserModel = require('../examples/models/seeds/user.js');
var seedAdminModel = require('../examples/models/seeds/admin.js');

before(function() {
  mongoose.connect(config.mongoURI['test']);

  // Seed the user model
  return seedUserModel()
  .then(function(user) {
    user.meta.age.should.be.equal(18);
    user.location.should.be.equal('Palo Alto, CA');
    user.admin.should.be.equal(false);
    user.password.should.be.equal('password');
    user.username.should.be.equal('test_username');
    user.name.should.be.equal('test_name');
   })

});

describe('Blockchain testing suite - BitGo', function() {

  it('User schema is populated with BitGo wallet', function() {
    return User.findOne({username: 'test_username'}).exec()
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
});

after(function() {
  return User.findOne({username: 'test_username'}).remove().exec()
  .then(function(user) {
    user.result.ok.should.be.equal(1);
  })
  .catch(function(err) {
    throw new Error(err);	     
  });
});
