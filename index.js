var assert = require('assert');
var Promise = require('bluebird');
var BitGoJS = require('bitgo');

var withdrawalError = require('./config/config.js').error.withdrawal;
var depositError = require('./config/config.js').error.deposit;
var transferError = require('./config/config.js').error.transfer;

var blockchain = function(schema, bitgoAccessToken) {

  var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: bitgoAccessToken });

  var bitcoin = function () {

    /**
     *  Sends Bitcoin to a bitcoin address
     *
     *  @method sendBitcoin
     *  @param { Object } the BitGo wallet object of the user
     *  @param { String } the bitcoin address of the recipient
     *  @param { Number } the amount to send in satoshis
     *  @param { String } the passphrase that is encrypting the user private key
     *  @returns { Object } the transaction hash of the sent transaction
     */
    var sendBitcoin = function(senderWallet, recipientAddress, amount, password) {
      return new Promise(function (resolve, reject) {
        senderWallet.sendCoins({ address: recipientAddress, amount: amount, walletPassphrase: password, minConfirms: 0 }, function(err, result) {
          if (err) { reject(err) };
          resolve({ transactionId: result.hash });
        });
      });
    };

    /**
     *  Generate a reusable Bitcoin HD address from a users wallet
     *
     *  @method generateAddress
     *  @param { Object } the BitGo wallet object of a user
     *  @returns { Object } the generated address from the wallet
     */
    var generateAddress = function(wallet) {
      return new Promise(function (resolve, reject) {
        wallet.createAddress({ "chain": 0 }, function(err, address) {
          if (err) { reject(err) };
          resolve({ address: address.address });
        });
      })
    };

    /**
     *  Get the Bitcoin wallet object of a user
     *
     *  @method getWallet
     *  @param { String } the wallet id of a user wallet
     *  @returns { Object } the wallet associated with the wallet id
     */
    var getWallet = function(walletId) {
      return new Promise(function (resolve, reject) {
        bitgo.wallets().get({ "id": walletId }, function(err, wallet) {
          if (err) { reject(err) };
          resolve(wallet);
        });
      });
    };

    /**
     *  Create a new BitGo wallet for a user
     *
     *  @method createUserWallet
     *  @param { String } the password to be used to encrypt the user keys
     *  @param { String } the label to set for the wallet, this will be the users email or username
     *  @returns { Object } the users wallet object
     */
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

  /**
   * Statics
   */

  /**
   * Provides a generated address for a user that can be used to deposit currency to a user wallet
   *
   * @method deposit
   * @param { String } a username or email of the user
   * @returns { Object } a newly generated deposit address for the user
   */
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

  /**
   * Transfers currency from one user to another
   *
   * @method transfer
   * @param { String } a username or email of the sender
   * @param { String } a username or email of the recipient
   * @param { String } the amount to be transferred
   * @param { String } the password of the senders wallet
   * @returns { Object } a transaction id for the transaction
   */
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

  /**
   * Withdraws an amount to an out of network address
   *
   * @method withdrawal
   * @param { String } a username or email of the sender
   * @param { String } an address of for the recipient
   * @param { String } the amount to be transferred
   * @param { String } the password of the senders wallet
   * @returns { Object } a transaction id for the transaction
   */
  schema.statics.withdrawal = Promise.coroutine(function* (sender, recipient, amount, password) {
    "use strict";
    var self = this;
    console.dir(sender, recipient, amount, password);
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

  schema.statics.requestWithdrawal = function(params) {
    // Ensure all parameters have been properly initialized
    assert.equal(typeof params.sender, 'object', new Error(withdrawalError.object));
    assert.equal(typeof params.sender.username, 'string', new Error(withdrawalError.sender.username));
    assert.equal(typeof params.sender.password, 'string', new Error(withdrawalError.sender.password));
    assert.equal(typeof params.sender.currency, 'string', new Error(withdrawalError.sender.currency));
  
    assert.equal(typeof params.recipient, 'object', new Error(withdrawalError.object));
    assert.equal(typeof params.recipient.address, 'string', new Error(withdrawalError.recipient.address));
    assert.equal(typeof params.recipient.amount, 'number', new Error(withdrawalError.recipient.amount));
    assert.equal(typeof params.recipient.currency, 'string', new Error(withdrawalError.recipient.currency));
  
    this.withdrawalObject = {
      sender: {
        username: params.sender.username,
        password: params.sender.password,
        currency: params.sender.currency        
      },
      recipient: {
        address: params.recipient.address,
        amount: params.recipient.amount,
        currency: params.recipient.currency
      }
    }
    return this.withdrawalObject;
  
  };

  schema.statics.requestDeposit = function(params) {
    // Ensure all parameters have been properly initialized
    assert.equal(typeof params.recipient, 'object', new Error(depositError.object));
    assert.equal(typeof params.recipient.username, 'string', new Error(depositError.recipient.username));
    assert.equal(typeof params.recipient.currency, 'string', new Error(depositError.recipient.currency));

    this.depositObject = {
      recipient: {
        username: params.recipient.username,
        currency: params.recipient.currency
      }
    }
    return this.depositObject;
  };
  
  schema.statics.requestTransfer = function(params) {
    // Ensure all parameters have been properly initialized
    assert.equal(typeof params.sender, 'object', new Error(transferError.object));
    assert.equal(typeof params.sender.username, 'string', new Error(transferError.sender.username));
    assert.equal(typeof params.sender.password, 'string', new Error(transferError.sender.password));
    assert.equal(typeof params.sender.currency, 'string', new Error(transferError.sender.currency));
   
    assert.equal(typeof params.recipient, 'object', new Error(transferError.object));
    assert.equal(typeof params.recipient.username, 'string', new Error(transferError.recipient.username));
    assert.equal(typeof params.recipient.amount, 'number', new Error(transferError.recipient.amount));
    assert.equal(typeof params.recipient.currency, 'string', new Error(transferError.recipient.currency));
    
    this.transferObject = {
      sender: {
        username: params.sender.username,
        password: params.sender.password,
        currency: params.sender.currency        
      },
      recipient: {
        username: params.recipient.username,
        amount: params.recipient.amount,
        currency: params.recipient.currency
      },
      withdraw: withdraw(),
      confirm: function() {
	  return this.withdrawal(this.sender.username, this.recipient.username, this.recipient.amount, this.sender.password);
      }
    }
    return this.transferObject;
  };    

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

