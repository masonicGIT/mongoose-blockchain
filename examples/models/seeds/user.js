var User = require('../user');

var seedUser = function() {
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
  return user.save()
  .then(function(res) {
    return res;
  })
  .catch(function(err) {
    return err;
  });
};

module.exports = seedUser;