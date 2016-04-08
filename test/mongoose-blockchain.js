var config = require('../config/config');
var should = require('should');
var assert = require('assert');
var utils = require('./utils');
var mongoose = require('mongoose');
var BitGoJS = require('bitgo');

var User = require('../examples/models/user');
var seedUserModel = require('../examples/models/seeds/user.js');
var seedAdminModel = require('../examples/models/seeds/admin.js');

before(function() {
  
  var testWalletLabel = config.wallet['label'];
  var testWalletPassword = config.wallet['password'];

  // First ensure that the BitGo Access token is set prior to continuing
  if (!process.env.BITGO_ACCESS_TOKEN) {
    console.log('\n\n** BitGo Access Token not set');
    console.log('** Retrieve your access token from https://www.bitgo.com and set it as an environment variable');
    console.log("** export BITGO_ACCESS_TOKEN='J3Das83k..3laelkwasd'");
    console.log('** Join us on Slack if you continue to experience issues https://slack.bitgo.com\n');
    process.exit(-1);
  };

  mongoose.connect(config.mongoURI['test']);
  // Seed the user model
  return utils.setupTestWallet(testWalletLabel, testWalletPassword)
  .then(function(res) {
    return seedUserModel();
  })
  .then(function(user) {
    user.meta.age.should.be.equal(18);
    user.location.should.be.equal('Palo Alto, CA');
    user.admin.should.be.equal(false);
    user.password.should.be.equal('password');
    user.username.should.be.equal('test_username');
    user.name.should.be.equal('test_name');
   })
   .then(function(res) {
     return seedAdminModel();
   })
  .then(function(admin) {
    admin.meta.age.should.be.equal(21);
    admin.location.should.be.equal('Palo Alto, CA');
    admin.admin.should.be.equal(true);
    admin.password.should.be.equal('password');
    admin.username.should.be.equal('test_username_admin');
    admin.name.should.be.equal('test_name_admin');
   })
   .catch(function(err) {
     throw new Error(err);
   }); 

});

describe('Generic transaction request constructors', function() {

  it('Withdrawal Request - Successfully call and set constructor', function(done) {
    var transaction = new User.transactionRequest({
      type: 'withdrawal', 
      amount: 10,
      sender: {
        username: 'test_username',
        password: 'test_password',
        currency: 'btc'
      },
      recipient: {
        address: '123address321',
        currency: 'btc'
      }
    });
    transaction.type.should.equal('withdrawal');
    transaction.amount.should.equal(10);
    transaction.sender.username.should.equal('test_username');
    transaction.sender.password.should.equal('test_password');
    transaction.sender.currency.should.equal('btc');
    transaction.recipient.address.should.equal('123address321');
    transaction.recipient.currency.should.equal('btc');
    done();
  });

  it('Withrawal Request - Fail on invalid sender username', function(done) {
    try {
      var transaction = new User.transactionRequest({
        type: 'withdrawal',
  	amount: 10,
        sender: {
          username: null,
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          address: '123address321',
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.withdrawal.sender.username);
      done();
    }
  });

  it('Request withdrawal - Fail on invalid sender password', function(done) {
    try {
      var transaction = new User.transactionRequest({
        type: 'withdrawal',
  	amount: 10,
        sender: {
          username: 'test_username',
          password: null,
          currency: 'btc'
        },
        recipient: {
          address: '123address321',
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.withdrawal.sender.password);
      done();
    }
  });

  it('Withdrawal request - Fail on invalid sender currency', function(done) {
    try {
      var transaction = new User.transactionRequest({
        type: 'withdrawal',
  	amount: 10,
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: null
        },
        recipient: {
          address: '123address321',
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.withdrawal.sender.currency);
      done();
    }
  });

  it('Withdrawal request - Fail on invalid recipient address', function(done) {
    try {
      var transaction = new User.transactionRequest({
        type: 'withdrawal',
  	amount: 10,
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          address: null,
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.withdrawal.recipient.address);
      done();
    }
  });

  it('Withdrawal request - Fail on invalid recipient amount', function(done) {
    try {
      var transaction = new User.transactionRequest({
        type: 'withdrawal',
  	amount: null,
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          address: '123address321',
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.withdrawal.amount);
      done();
    }
  });

  it('Withdrawal request - Fail on invalid recipient currency', function(done) {
    try {
      var transaction = new User.transactionRequest({
        type: 'withdrawal',
  	amount: 10,
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          address: '123address321',
          currency: null
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.withdrawal.recipient.currency);
      done();
    }
  });

  it('Request deposit - Successfully call and set constructor', function(done) {
    var transaction = new User.transactionRequest({
      type: 'deposit',
      recipient: {
        username: 'test_username',
        currency: 'btc'
      }
    });

    transaction.recipient.username.should.equal('test_username');
    transaction.recipient.currency.should.equal('btc');
    done();
  });

  it('Deposit request - Fail on invalid deposit username', function(done) {
    try {
      var transaction = new User.transactionRequest({
        type: 'deposit',
        recipient: {
          username: null,
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.deposit.recipient.username);
      done();
    }
  });

  it('Deposit request - Fail on invalid deposit currency', function(done) {
    try {
      var transaction = new User.transactionRequest({
        type: 'deposit',
        recipient: {
          username: 'test_username',
          currency: null
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.deposit.recipient.currency);
      done();
    }
  });

  it('Request transfer - Successfully call and set constructor', function(done) {
    var transaction = new User.transactionRequest({
      type: 'transfer',
      amount: 10,
      sender: {
        username: 'test_username',
        password: 'test_password',
        currency: 'btc'
      },
      recipient: {
        username: 'test_username',
        currency: 'btc'
      }
    });

    transaction.sender.username.should.equal('test_username');
    transaction.sender.password.should.equal('test_password');
    transaction.sender.currency.should.equal('btc');
    transaction.recipient.username.should.equal('test_username');
    transaction.amount.should.equal(10);
    transaction.type.should.equal('transfer');
    transaction.recipient.currency.should.equal('btc');
    done();
  });

  it('Request transfer - Fail on invalid sender username', function(done) {
    try {
      var transaction = new User.transactionRequest({
        type: 'transfer',
        amount: 10,
        sender: {
          username: null,
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          username: 'test_username',
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.transfer.sender.username);
      done();
    }
  });


  it('Request transfer - Fail on invalid sender password', function(done) {
    try {
      var transaction = new User.transactionRequest({
        type: 'transfer',
  	amount: 10,
        sender: {
          username: 'test_username',
          password: null,
          currency: 'btc'
        },
        recipient: {
          username: 'test_username',
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.transfer.sender.password);
      done();
    }
  });

  it('Transfer request - Fail on invalid sender currency', function(done) {
    try {
      var transfer = new User.transactionRequest({
        type: 'transfer',
  	amount: 10,
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: null
        },
        recipient: {
          username: 'test_username',
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.transfer.sender.currency);
      done();
    }
  });

  it('Transfer request - Fail on invalid recipient username', function(done) {
    try {
      var transaction = new User.transactionRequest({
        type: 'transfer',
  	amount: 10,
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          username: null,
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.transfer.recipient.username);
      done();
    }
  });

  it('Transfer request - Fail on invalid recipient amount', function(done) {
    try {
      var transaction = new User.transactionRequest({
        type: 'transfer',
  	amount: null,
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          username: 'test_username',
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.transfer.amount);
      done();
    }
  });

  it('Transfer request - Fail on invalid recipient currency', function(done) {
    try {
      var transaction = new User.transactionRequest({
        type: 'transfer',
  	amount: 10,
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          username: 'test_username',
          currency: null
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.transfer.recipient.currency);
      done();
    }
  });

});


describe('Blockchain testing suite - BitGo', function() {

  it('User schema is populated with BitGo wallet', function() {
    return User.findOne({ username: 'test_username' }).exec()
    .then(function(user) {
      user.bitcoin.walletId.should.be.ok();
    });
  });

  it('User is able to generate a new reusable address', function() {
    var transaction = new User.transactionRequest({
      type: 'deposit',
      recipient: {
        username: 'test_username',
        currency: 'btc'
      }
    });

    return User.deposit(transaction)
    .then(function (address) {
      address.should.be.ok();
    })
    .catch(function(err) {
      return console.log(err);
    });
  });

  it('Fund users wallet', function() {
    var transaction = new User.transactionRequest({
      type: 'deposit',
      recipient: {
        username: 'test_username',
        currency: 'btc'
      }
    });

    return User.deposit(transaction)
    .then(function (address) {
      return utils.sendToAddress(address.address);
    })
    .catch(function(err) {
      return console.log(err);
    });
  });

  if (!!config.wallet.label || !!config.wallet.password) {

    // Let the previous transaction settle
    it('User is able to make a in-network transfer', function() {
      var newTransaction = new User.transactionRequest({
        type: 'transfer',
        amount: 10000,
        sender: {
          username: 'test_username',
          password: 'password',
          currency: 'btc'
        },
        recipient: {
          username: 'test_username_admin',
          currency: 'btc'
        }
      });
  
      return User.transfer(newTransaction)
      .then(function(res) {
        return;
      })
      .catch(function(err) {
        throw new Error(err);
      });
    });

    // Let the previous transaction settle
    it('User is able to make an out-of-network transfer', function() {
      var withdrawalAddress;
      var depositRequest = new User.transactionRequest({
        type: 'withdrawal',
        amount: 1000,
        sender: {
	  username: 'test_username_admin',
          password: 'test_password',
          currency: 'bitcoin'
	},
        recipient: {
	  address: '2NGaWJSgQbHfLPKhQ5xk2tBhGkYBj6NPU3T',
          currency: 'bitcoin'
	}
      });

      return User.deposit(depositRequest)
      .then(function (address) {
        address.should.be.ok();
        withdrawalAddress = address;
      })
      return User.withdrawal()
      .then(function(res) {
        return;
      })
      .catch(function(err) {
        throw new Error(err);
      });
    });

  } else {
    throw new Error('Please set your test wallet parameters in the config/config.js file');
  }

});

after(function() {
  return User.findOne({ username: 'test_username' }).remove().exec()
  .then(function(user) {
    user.result.ok.should.be.equal(1);
    return User.findOne({ username: 'test_username_admin' }).remove().exec()
  })
  .then(function(admin) {
    admin.result.ok.should.be.equal(1);
  })
  .catch(function(err) {
    throw new Error(err);
  });
});
