var BitGoJS = require('bitgo');
var Promise = require('bluebird');
var _ = require('lodash');

var config = require('../config/config');

var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.BITGO_ACCESS_TOKEN });

function createWallet(label, password) {
  return new Promise(function(resolve, reject) {
    bitgo.wallets().createWalletWithKeychains({ "label": label, "passphrase": password }, function(err, result) {
      console.log(err + result);
      if (err) { reject(err) };
      reject('Send testnet Bitcoin to the following wallet to continue: ' + result.wallet.wallet.id);
    });
  });
};

function getTestWallet(walletId) {
  var walletId = walletId.replace(/"/g, "");
  return new Promise(function(resolve, reject) {
    bitgo.wallets().get({"type": "bitcoin", "id": walletId}, function callback(err, wallet) {
      if (err) { reject(err) };
      if (wallet.balance() === 0) {
        reject('Send testnet Bitcoin to the following wallet to continue: ' + wallet.id());
      }
      resolve(wallet);
    });
  });
};

function sendCoinsGetHash(wallet, destinationAddress, amount) {
  return new Promise(function(resolve, reject) {
    wallet.sendCoins({ address: destinationAddress, amount: amount || config.wallet.amount, walletPassphrase: config.wallet.password }, function(err, result) {
      if (err) { reject(err) };
      console.log(result);
      return resolve(result.hash);
    });
  })
};

function createAddress(wallet) {
  return new Promise(function(resolve, reject) {
    wallet.createAddress({ "chain": 0 }, function callback(err, address) {
      if (err) { reject(err) };
      resolve(address);
    });
  });
};

exports.setupTestWallet = function(label, password) {
  return new Promise(function(resolve, reject) {
    bitgo.wallets().list({limit: 5000}, function callback(err, wallets) {
      if (err) { reject(err) };
      // handle error, do something with wallets

      for (id in wallets.wallets) {

        // see if the wallet label matches the config label
        var walletLabel = wallets.wallets[id].wallet.label;
        var walletId = wallets.wallets[id].wallet.id;

        walletId = JSON.stringify(walletId, null, 4);

        // if there is already a designated wallet then continue
        if (walletLabel === label) {
          var wallet;

          // get the whole wallet to check the balance
          return getTestWallet(walletId)
          .then(function(res) {
            wallet = res;
            return createAddress(res);
          })
          .then(function(res) {
            return sendCoinsGetHash(wallet, res.address, 40000);
          })
          .then(function(res) {
            return resolve(res);
          })
          .catch(function(err) {
            return reject(err);
          });
        }
      }

      // If there is no designated wallet then create one and prompt the user to feed it Bitcoin
      return createWallet(label, password)
      .then(function(res) {
        return resolve(res);
      })
      .catch(function(err) {
        return reject(err);
      });
    });
  });
};

exports.sendToAddress = function(address) {
  return new Promise(function(resolve, reject) {
    bitgo.wallets().list({limit: 5000}, function callback(err, wallets) {
      if (err) { reject(err) };
      // handle error, do something with wallets
      var walletArray = wallets.wallets; 
      var testWallet = _.filter(walletArray, { wallet: { label: config.wallet.label } });
      var testWalletId = testWallet[0].wallet.id;
      return getTestWallet(testWalletId)
      .then(function(res) {
        wallet = res;
        return sendCoinsGetHash(wallet, address);
      })
      .then(function(res) {
        return resolve(res);
      })
      .catch(function(err) {
        return reject(err);
      });
 
    });
  });
};
