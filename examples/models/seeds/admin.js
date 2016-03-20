var User = require('../user');

var seedAdmin = function() {
  var user = new User ({
    name: 'test_name_admin',
    username: 'test_username_admin',
    password: 'password',
    admin: true,
    location: 'Palo Alto, CA',
    meta: {
      age: 21,
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

module.exports = seedAdmin;