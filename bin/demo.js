#!/usr/bin/env node

var argv = require('yargs').argv;
var User = require('../examples/models/user');
var mongoose = require('mongoose');
var config = require('../config/config.js');
var shapeshift = require('../../shapeshiftjs/src/index.js');

mongoose.connect(config.mongoURI['test']);

if (argv.createuser) {
  if (argv.username && argv.password) {
    var user = new User ({
      username: argv.username,
      password: argv.password
    });    
    return user.save()
    .then(function(res) {
      console.log(res);
      return process.exit(-1);
    })
    .catch(function(err) {
      console.log(err);
      return process.exit(-1);
    }); 
  } else {
    console.log('Please enter a username and password');
    return process.exit(-1);
  };
}

if (argv.deposit) {
  if (argv.username && argv.currency && argv.amount) {
    var transaction = new User.transactionRequest({
      type: 'deposit',
      recipient: {
        username: argv.username,
        currency: argv.currency,
        amount: argv.amount
      }
    });
    return User.deposit(transaction)
    .then(function (address) {
      console.log('Deposit Bitcoin here:' + address.address);
      return process.exit(-1);
    })
    .catch(function(err) {
      console.log(err);
      return process.exit(-1);
    });
  } else {
    console.log('Please also enter a username, currency (ether, bitcoin), and amount');
    return process.exit(-1);
  }
}

if (argv.withdraw) {
  if (argv.username && argv.address && argv.amount && argv.password) {
    var depositRequest = new User.transactionRequest({
      type: 'withdrawal',
      amount: 1000,
      sender: {
    	username: 'mason',
        password: 'password',
        currency: 'bitcoin'
    	},
      recipient: {
    	address: '2NGaWJSgQbHfLPKhQ5xk2tBhGkYBj6NPU3T',
        currency: 'ether'
    	}
    });

    return User.withdrawal(depositRequest)
    .then(function(res) {
      console.log(res);
      return process.exit(-1);
    })
    .catch(function(err) {
      console.log(err);
      return process.exit(-1);    
    });
  } else {
    console.log('Please also enter a username, amount, receiving address, and password');
    return process.exit(-1);      
  }
}

if(argv.postSendAmount) {
  var shapeShiftParams = {
    amount: 0.1,
    withdrawal: '0xd66e645fcb0b971b5ecd7ee3047f61d8eb0dae9b',
    currencyPair: 'btc_eth'
  };
  return shapeshift.postSendAmount(shapeShiftParams)
  .then(function(res) {
    console.log(res);
    return process.exit(-1);
  })
  .catch(function(err) {
    console.log(err);
    return process.exit(-1);
  });
}

if (argv.shift) {
  var params = {
    withdrawal: argv.withdrawal,
    pair: 'eth_btc'
  };
  return shapeshift.postShift(params)
  .then(function(res) {
    console.log(res);
    return process.exit(-1);
  })
  .catch(function(err) {
    console.log(err);
    return process.exit(-1);
  });
}