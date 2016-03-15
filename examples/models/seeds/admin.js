var User = require('../user');

var seedAdmin = function() {
  return User.find({})
  .then(function(documents) {
    if (documents.length === 0) {
      var user = new User ({
        name: 'test_user_admin',
        username: 'test_username_admin',
        password: 'password',
        admin: true,
        location: 'Palo Alto, CA',
        meta: {
          age: 21,
          website: 'https://platform.bitgo.com'
        }
      });
    }
  })
  .catch(function(err) {
    throw new Error('/examples/models/seeds/user.js - ' + err);
  });
};

module.exports = seedAdmin;