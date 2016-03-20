var BitGoJS = require('bitgo');
var Promise = require('bluebird');

var ACCESS_TOKEN = process.env.ACCESS_TOKEN;
var bitgo = new BitGoJS.BitGo({env: 'test', accessToken: ACCESS_TOKEN});

var authenticate = function() {
  return new Promise(function (resolve, reject) {
    bitgo.session({})
    .then(function(res) {      
      resolve(res);
    })
    .catch(function(err) {
      reject(err);
    });
  });
};

var bitcoin = function () {

  var sendBitcoin = function(senderWallet, recipientAddress, amount, password) {
    return new Promise(function (resolve, reject) {
      senderWallet.sendCoins({ address: recipientAddress, amount: amount, walletPassphrase: password }, function(err, result) {
        if (err) { reject(err) };
        resolve({ transactionId: result.hash });
      });
    });  
  };

  var generateAddress = function(wallet) {
    return new Promise(function (resolve, reject) {
      wallet.createAddress({ "chain": 0 }, function(err, address) {
        if (err) { reject(err) };
        resolve({ address: address.address }); 
      });
    })
  };

  var getWallet = function(walletId) {
    return new Promise(function (resolve, reject) {
      bitgo.wallets().get({ "id": walletId }, function(err, wallet) {
        if (err) { reject(err) };
        resolve(wallet);
      });
    });
  };

  return {
    getWallet: getWallet,
    generateAddress: generateAddress
  };
}();

var createUserWallet = function(password, label) {    
  return new Promise(function (resolve, reject) {  
    bitgo.wallets().createWalletWithKeychains({"passphrase": password, "label": label}, function(err, res) {
      if (err) { reject(err) };
      resolve(res);
    });
  });
};
			   
var blockchain = function(schema) {    

  schema.statics.deposit = Promise.coroutine(function* (username) {
    "use strict";
    var self = this;
    let user = yield self.findOne({ username: username }).exec();
    let wallet = yield bitcoin.getWallet(user.bitcoin.walletId);
    let address = yield bitcoin.generateAddress(wallet);
    return address;        
  });

  schema.statics.transfer = Promise.coroutine(function* (sender, recipient, amount, password) {
    "use strict";
    var self = this;

    let sendingUser = yield self.findOne({ username: sender }).exec();
    let recievingUser = yield self.findOne({ username: recipient }).exec();

    // Generate a new address for the recipient 
    
    let recipientWallet = yield bitcoin.getWallet(sendingUser.bitcoin.walletId);
    let recipientaddress = yield bitcoin.generateAddress(recipientWallet);

    // Send Bitcoin to the recipient address
  
    let senderWallet = yield bitcoin.getWallet(recipient.bitcoin.walletId);
    let reciept = yield bitcoin.sendBitcoin(recipient.bitcoin.walletId, recipientAddress, amount, password);
    return reciept;
  });

  schema.statics.withdrawal = Promise.coroutine(function* (sender, recipient, amount, password) {
    "use strict";
    var self = this;

    let sendingUser = yield self.findOne({ username: sender }).exec();
    let recievingUser = yield self.findOne({ username: recipient }).exec();

    // Generate a new address for the recipient 
    
    let recipientWallet = yield bitcoin.getWallet(sendingUser.bitcoin.walletId);
    let recipientaddress = yield bitcoin.generateAddress(recipientWallet);

    // Send Bitcoin to the recipient address
  
    let senderWallet = yield bitcoin.getWallet(recipient.bitcoin.walletId);
    let reciept = yield bitcoin.sendBitcoin(recipient.bitcoin.walletId, recipientAddress, amount, password);
    return reciept;
  });


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

