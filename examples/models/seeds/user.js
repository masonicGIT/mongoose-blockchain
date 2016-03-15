var User = require('../user');

var seedUser = function() {
  return User.find({})
  .then(function(documents) {
    if (documents.length === 0) {
      var user = new User ({
        name: 'test_name',
        username: 'test_username',
        password: 'password',
        admin: false,
        location: 'Palo Alto, CA',
        meta: {
          age: 18,
          website: 'https://platform.bitgo.com'
        }
      });
    }
  })
  .catch(function(err) {
    throw new Error('/examples/models/seeds/user.js - ' + err);
  });
};

module.exports = seedUser;