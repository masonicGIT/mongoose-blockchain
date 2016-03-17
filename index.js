var BitGoJS = require('bitgo');
var Promise = require('bluebird');

var ACCESS_TOKEN = process.env.ACCESS_TOKEN;
var bitgo = new BitGoJS.BitGo({env: 'test', accessToken: ACCESS_TOKEN});

var authenticate = function() {
  return new Promise(function (resolve, reject) {
    bitgo.session({})
    .then(function(res) {      
      return resolve(res);
    })
    .catch(function(err) {
      return reject(err);
    });
  });
};

var createUserWallet = function(password, label) {    
  return new Promise(function (resolve, reject) {  
    bitgo.wallets().createWalletWithKeychains({"passphrase": password, "label": label}, function(err, res) {
      if (err) reject(err);
      return resolve(res);
    });
  });
};
			   
var blockchain = function(schema) {    

  // Augment the schema to include testField with type String
  schema.add({ bitcoin: { walletId: { type: String, default: null }, instant: { type: Boolean, default: null } } });

  schema.pre('save', function(next) {
    self = this;

    // TODO: Require a password that is encouraged to be hashed client-side

    bitgo.wallets().createWalletWithKeychains({"passphrase": self.password, "label": self.username }, function(err, res) {
      if (err) {
	 throw new Error(err);
      }
      self.bitcoin = { walletId: res.wallet.wallet.id };
      next();
    });
  });
};

module.exports = blockchain;

