var BitGoJS = require('bitgo');
var Promise = require('bluebird');

var blockchain = function(schema, bitgoAccessToken) {

var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: bitgoAccessToken });

  var bitcoin = function () {

    /**
     *  Sends Bitcoin to a bitcoin address
     *
     *  @method sendBitcoin
     *  @param
    var sendBitcoin = function(senderWallet, recipientAddress, amount, password) {
      return new Promise(function (resolve, reject) {
        senderWallet.sendCoins({ address: recipientAddress, amount: amount, walletPassphrase: password, minConfirms: 0 }, function(err, result) {
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


    var createUserWallet = function(password, label) {
      return new Promise(function (resolve, reject) {
        bitgo.wallets().createWalletWithKeychains({"passphrase": password, "label": label}, function(err, res) {
          if (err) { reject(err) };
          resolve(res);
        });
      });
    };

    return {
      getWallet: getWallet,
      generateAddress: generateAddress,
      sendBitcoin: sendBitcoin
    };
  }();

  schema.statics.deposit = Promise.coroutine(function* (username) {
    "use strict";
    var self = this;

    // Get user by username
    let user = yield self.findOne({ username: username }).exec();

    // Get the wallet of the user
    let wallet = yield bitcoin.getWallet(user.bitcoin.walletId);

    // Generate a deposit address for the user
    let address = yield bitcoin.generateAddress(wallet);
    return address;
  });

  schema.statics.transfer = Promise.coroutine(function* (sender, recipient, amount, password) {
    "use strict";
    var self = this;

    // Get users by username
    let sendingUser = yield self.findOne({ username: sender }).exec();
    let receivingUser = yield self.findOne({ username: recipient }).exec();

    // Generate a new address for the recipient
    let recipientWallet = yield bitcoin.getWallet(receivingUser.bitcoin.walletId);
    let recipientAddress = yield bitcoin.generateAddress(recipientWallet);

    // Send Bitcoin to the recipient address
    let senderWallet = yield bitcoin.getWallet(sendingUser.bitcoin.walletId);
    let receipt = yield bitcoin.sendBitcoin(senderWallet, recipientAddress.address, amount, password);
    return receipt;
  });

  schema.statics.withdrawal = Promise.coroutine(function* (sender, recipient, amount, password) {
    "use strict";
    var self = this;

    // Get users by username
    let sendingUser = yield self.findOne({ username: sender }).exec();
    let receivingUser = yield self.findOne({ username: recipient }).exec();

    // Generate a new address for the recipient
    let recipientWallet = yield bitcoin.getWallet(receivingUser.bitcoin.walletId);
    let recipientaddress = yield bitcoin.generateAddress(recipientWallet);

    // Send Bitcoin to the recipient address
    let senderWallet = yield bitcoin.getWallet(recipient.bitcoin.walletId);
    let receipt = yield bitcoin.sendBitcoin(senderWallet, recipientAddress, amount, password);
    return receipt;
  });


  // Augment the schema to include a bitcoin object
  schema.add({ bitcoin: { walletId: { type: String, default: null }, instant: { type: Boolean, default: null } } });

  schema.pre('save', function(next) {
    self = this;

    // TODO: Require a password that is encouraged to be hashed client-side

    bitgo.wallets().createWalletWithKeychains({"passphrase": self.password, "label": self.username }, function(err, res) {
      if (err && err.message === 'unauthorized') {
        console.log('\n\n** BitGo Access Token not set');
        console.log('** Retreive your access token from https://www.bitgo.com and set it as an environment variable');
        console.log("** export BITGO_ACCESS_TOKEN='J3Das83k..3laelkwasd'");
        console.log('** Join us on Slack if you continue to experience issues https://slack.bitgo.com');
        throw new Error(err);
      }
      self.bitcoin = { walletId: res.wallet.wallet.id };
      next();
    });
  });
};

module.exports = blockchain;

