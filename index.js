'use strict';
var assert = require('assert');
var Promise = require('bluebird');
var mongoose = require('mongoose');
//var Transaction = require('lib/models/transaction');
var BitGoJS = require('bitgo');
var shapeshift = require('../shapeshiftjs/src/index.js');

var withdrawalError = require('./config/config.js').error.withdrawal;
var depositError = require('./config/config.js').error.deposit;
var transferError = require('./config/config.js').error.transfer;

var blockchain = function(schema, bitgoAccessToken) {

  var bitgo = new BitGoJS.BitGo({ env: 'prod', accessToken: bitgoAccessToken });

  var ethereum = function () {

    /**
     * Send in Bitcoin and have it land as ethereum at a given address
     * 
     * @method sendEther
     * @param { Object } senderWallet - The wallet object of the sender
     * @param { String } password = The wallet password of the sending user
     * @param { Number } amount - The amount to be send to the user in Bitcoin
     * @param { String } etherAddress - The ethereum address that the converted funds will be sent to
     * @returns { Object } The transaction receipt from BitGo
     */
    var sendEther = function (senderWallet, password, amount, etherAddress) {
      return new Promise(function(reject, resolve) {
        if (!senderWallet) {
          reject('Please provide a Bitcoin wallet for withdrawal');
        }

        let shapeShiftParams = {
          amount: parseFloat(amount),
          withdrawal: etherAddress,
   	  currencyPair: 'btc_eth'
        };
        return shapeshift.postSendAmount(shapeShiftParams)
        .then(function(res) {
          return bitcoin.sendAmount(senderWallet, res.deposit, parseInt(depositAmount * 10e8), password);
        })
        .then(function(res) {
          resolve (res);
        })        
        .catch(function(err) {
          reject(err);
	});
      });
    };

    /**
     *  Returns a ethereum desposit address that will take ethereum and deposit it
     *  as Bitcoin in the user wallet
     *
     *  @method getDepositAddress
     *  @param { String } bitcoinAddress - The Bitcoin address to receive the deposit
     *  @returns { Object } An object containing the shapeshift deposit information 
     */
    var getDepositAddress = function(params) {
      return new Promise(function(reject, resolve) {
        if (!params.bitcoinAddress) {
          reject('Please provide an Ethereum address for withdrawal');
        };

        var params = {
          withdrawal: params.bitcoinAddress,
          pair: 'eth_btc'
        };

        return shapeshift.postShift(params)
        .then(function(res) {
          resolve({address: res.deposit});
        })
        .catch(function(err) {
          reject(err);
        });
      });
    };

    return {
      getDepositAddress: getDepositAddress,
      sendEther: sendEther
    };
  }();

  var bitcoin = function () {

    /**
     *  Sends Bitcoin to a bitcoin address
     *
     *  @method sendBitcoin
     *  @param { Object } senderWallet - the BitGo wallet object of the user
     *  @param { String } recipientAddress - the bitcoin address of the recipient
     *  @param { Number } amount - the amount to send in satoshis
     *  @param { String } password - the passphrase that is encrypting the user private key
     *  @returns { Object } the transaction hash of the sent transaction
     */
    var sendBitcoin = function(senderWallet, recipientAddress, amount, password) {
      return new Promise(function (resolve, reject) {
        senderWallet.sendCoins({ address: recipientAddress, amount: amount, walletPassphrase: password, minConfirms: 0 }, function(err, result) {
          if (err) { reject(err) };
          resolve({ transactionId: result });
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
     *  @param { String } walletId - the wallet id of a user wallet
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
     *  @param { String } password - the password to be used to encrypt the user keys
     *  @param { String } label - the label to set for the wallet, this will be the users email or username
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
  schema.statics.deposit = Promise.coroutine(function* (params) {
    var self = this;

    // Get user by username
    let user = yield self.findOne({ username: params.recipient.username }).exec();

    // Get the wallet of the user
    let wallet = yield bitcoin.getWallet(user.bitcoin.walletId);

    // Generate a deposit address for the user
    let address = yield bitcoin.generateAddress(wallet);

    if (params.recipient.currency === 'ether') {
      let etheraddress = yield ethereum.getDepositAddress({ bitcoinAddress: address.address, amountInBitcoin: params.recipient.amount });	
      return etheraddress;
    }

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
  schema.statics.transfer = Promise.coroutine(function* (params) {
    var self = this;

    // Get users by username
    let sendingUser = yield self.findOne({ username: params.sender.username }).exec();
    let receivingUser = yield self.findOne({ username: params.recipient.username }).exec();

    // Generate a new address for the recipient
    let recipientWallet = yield bitcoin.getWallet(receivingUser.bitcoin.walletId);
    let recipientAddress = yield bitcoin.generateAddress(recipientWallet);

    // Send Bitcoin to the recipient address
    let senderWallet = yield bitcoin.getWallet(sendingUser.bitcoin.walletId);
    let receipt = yield bitcoin.sendBitcoin(senderWallet, recipientAddress.address, params.amount, params.sender.password);
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
  schema.statics.withdrawal = Promise.coroutine(function* (params) {
    var self = this;

    // Get user by username
    let sendingUser = yield self.findOne({ username: params.sender.username }).exec();

    // Send Bitcoin to the recipient address
    let senderWallet = yield bitcoin.getWallet(sendingUser.bitcoin.walletId);

    if (params.recipient.currency === 'ether' && params.sender.currency === 'bitcoin') {
      return yield ethereum.sendEther(senderWallet, params.sender.password, params.amount, params.address);	
    } else if (params.recipient.currency === 'bitcoin' && params.sender.currency === 'bitcoin') {
      return yield bitcoin.sendBitcoin(senderWallet, params.recipient.recipientAddress, params.amount, params.sender.password);	
    } else {
      throw new Error('Only withdrawals from Bitcoin are currently supported');
    }

  });

  /**
   * A transaction schema to be used to store transactional information
   * 
   * @method transactionRequest
   * 
   * @param { String } type - The type of transaction to be performed, valid types are ['withdrawal', 'transfer', 'deposit']
   * @param { Number } amount - The amount to be transfered in Satoshis or Wei
   * 
   * if params.type === 'transfer'
   * @param { Object } sender - Information about the sending party
   * @param { String } sender.username - the username of the sending party
   * @param { String } sender.password - the wallet password of the sending party
   * @param { Number } sender.currency - the resting currency on the user, currently only 'bitcoin' is supported
   * @param { Object } recipient - Information about the receiving party
   * @param { String } recipient.username - the username of the recieving party
   * @param { String } recipient.currency - the desired recieving currency, currenctly 'bitcoin' and 'ether' are supported
   *
   * if params.type === 'withdrawal'
   * @param { Object } sender - Information about the sending party
   * @param { String } sender.username - the username of the sending party
   * @param { String } sender.password - the wallet password of the sending party
   * @param { Number } sender.currency - the resting currency on the user, currently only 'bitcoin' is supported
   * @param { Object } recipient - Information about the receiving party
   * @param { String } recipient.address - the bitcoin or ethereum address of the recieving party
   * @param { String } recipient.currency - the desired recieving currency, currenctly 'bitcoin' and 'ether' are supported
   * @returns { Object } withdrawalObject - a transaction object that contains all the information necessary for a withdrawal to execute
   *
   * if params.type === 'deposit'
   * @param { Object } recipient - Information about the receiving party
   * @param { String } recipient.username - the username of the recieving party
   * @param { String } recipient.currency - the desired recieving currency, currenctly 'bitcoin' and 'ether' are supported
   * @returns { Object } depositObject - a transaction object that contains all the information necessary for a deposit to execute
   */

      this.depositObject = {
        recipient: {
          username: params.recipient.username,
          currency: params.recipient.currency,
          amount: params.recipient.amount
        }
      };



  schema.statics.transactionRequest = function(params) {
    // Ensure all parameters have been properly initialized
    if (!params.type) {
      throw new Error('Please provide a valid transaction type: deposit, withdrawal, or transfer');
    };
    if (params.type === 'transfer') {
     
      assert.equal(typeof params.amount, 'number', new Error(transferError.amount));
      assert.equal(typeof params.sender, 'object', new Error(transferError.object));
      assert.equal(typeof params.sender.username, 'string', new Error(transferError.sender.username));
      assert.equal(typeof params.sender.password, 'string', new Error(transferError.sender.password));
      assert.equal(typeof params.sender.currency, 'string', new Error(transferError.sender.currency));
    
      assert.equal(typeof params.recipient, 'object', new Error(transferError.object));
      assert.equal(typeof params.recipient.username, 'string', new Error(transferError.recipient.username));
      assert.equal(typeof params.recipient.currency, 'string', new Error(transferError.recipient.currency));

      this.transferObject = {
        type: params.type,
        amount: params.amount,
        sender: {
          username: params.sender.username,
          password: params.sender.password,
          currency: params.sender.currency        
        },
        recipient: {
          username: params.recipient.username,
          currency: params.recipient.currency
        }
      };
      return this.transferObject;
    };

    if (params.type === 'withdrawal') {
      assert.equal(typeof params.amount, 'number', new Error(withdrawalError.amount));
      assert.equal(typeof params.sender.username, 'string', new Error(withdrawalError.sender.username));
      assert.equal(typeof params.sender.password, 'string', new Error(withdrawalError.sender.password));
      assert.equal(typeof params.sender.currency, 'string', new Error(withdrawalError.sender.currency));
    
      assert.equal(typeof params.recipient, 'object', new Error(withdrawalError.object));
      assert.equal(typeof params.recipient.address, 'string', new Error(withdrawalError.recipient.address));
      assert.equal(typeof params.recipient.currency, 'string', new Error(withdrawalError.recipient.currency));

      this.withdrawalObject = {
        type: params.type,
        amount: params.amount,
        sender: {
          username: params.sender.username,
          password: params.sender.password,
          currency: params.sender.currency        
        },
        recipient: {
          address: params.recipient.address,
          currency: params.recipient.currency
        }
      };
      return this.withdrawalObject;
    };

    if (params.type === 'deposit') {
      assert.equal(typeof params.recipient, 'object', new Error(depositError.object));
      assert.equal(typeof params.recipient.username, 'string', new Error(depositError.recipient.username));
      assert.equal(typeof params.recipient.currency, 'string', new Error(depositError.recipient.currency));	

      this.depositObject = {
	amount: params.recipient.amount,
        recipient: {
          username: params.recipient.username,
          currency: params.recipient.currency,
          amount: params.recipient.amount
        }
      };
      return this.depositObject;
    };
    throw new Error ('There was an error setting your transaction request');
  };

  // Augment the schema to include a bitcoin object
  schema.add({ bitcoin: { walletId: { type: String, default: null }, instant: { type: Boolean, default: null } } });

  schema.pre('save', function(next) {
    let self = this;

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

