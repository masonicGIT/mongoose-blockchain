var config = require('../config/config');
var should = require('should');
var assert = require('assert');
var utils = require('./utils');
var BitGoJS = require('bitgo');

var User = require('../examples/models/user');

describe('Generic transaction request constructors', function() {

  it('Request withdrawal - Successfully call and set constructor', function(done) {
    var withdrawal = new User.requestWithdrawal({
      sender: {
        username: 'test_username',
        password: 'test_password',
        currency: 'btc'
      },
      recipient: {
        address: '123address321',
	amount: 10,
        currency: 'btc'
      }
    });
    withdrawal.sender.username.should.equal('test_username');
    withdrawal.sender.password.should.equal('test_password');
    withdrawal.sender.currency.should.equal('btc');
    withdrawal.recipient.address.should.equal('123address321');
    withdrawal.recipient.amount.should.equal(10);
    withdrawal.recipient.currency.should.equal('btc');
    done();
  });

  it('Request withdrawal - Fail on invalid sender username', function(done) {
    try {
      var withdrawal = new User.requestWithdrawal({
        sender: {
          username: 10,
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          address: '123address321',
  	  amount: 10,
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.withdrawal.sender.username)
      done();
    }
  });

  it('Request withdrawal - Fail on invalid sender password', function(done) {
    try {
      var withdrawal = new User.requestWithdrawal({
        sender: {
          username: 'test_username',
          password: null,
          currency: 'btc'
        },
        recipient: {
          address: '123address321',
  	  amount: 10,
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.withdrawal.sender.password)
      done();
    }
  });

  it('Request withdrawal - Fail on invalid sender currency', function(done) {
    try {
      var withdrawal = new User.requestWithdrawal({
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: null
        },
        recipient: {
          address: '123address321',
  	  amount: 10,
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.withdrawal.sender.currency)
      done();
    }
  });

  it('Request withdrawal - Fail on invalid recipient address', function(done) {
    try {
      var withdrawal = new User.requestWithdrawal({
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          address: null,
  	  amount: 10,
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.withdrawal.recipient.address)
      done();
    }
  });

  it('Request withdrawal - Fail on invalid recipient amount', function(done) {
    try {
      var withdrawal = new User.requestWithdrawal({
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          address: '123address321',
  	  amount: null,
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.withdrawal.recipient.amount)
      done();
    }
  });

  it('Request withdrawal - Fail on invalid recipient currency', function(done) {
    try {
      var withdrawal = new User.requestWithdrawal({
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          address: '123address321',
  	  amount: 10,
          currency: null
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.withdrawal.recipient.currency)
      done();
    }
  });

  it('Request deposit - Successfully call and set constructor', function(done) {
    var deposit = new User.requestDeposit({
      recipient: {
        username: 'test_username',
        currency: 'btc'
      }
    });

    deposit.recipient.username.should.equal('test_username');
    deposit.recipient.currency.should.equal('btc');
    done();
  });

  it('Request deposit - Fail on invalid deposit username', function(done) {
    try {
      var deposit = new User.requestDeposit({
        recipient: {
          username: null,
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.deposit.recipient.username)
      done();
    }
  });

  it('Request deposit - Fail on invalid deposit currency', function(done) {
    try {
      var deposit = new User.requestDeposit({
        recipient: {
          username: 'test_username',
          currency: null
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.deposit.recipient.currency)
      done();
    }
  });

  it('Request transfer - Successfully call and set constructor', function(done) {
    var transfer = new User.requestTransfer({
      sender: {
        username: 'test_username',
        password: 'test_password',
        currency: 'btc'
      },
      recipient: {
        username: 'test_username',
	amount: 10,
        currency: 'btc'
      }
    });

    transfer.sender.username.should.equal('test_username');
    transfer.sender.password.should.equal('test_password');
    transfer.sender.currency.should.equal('btc');
    transfer.recipient.username.should.equal('test_username');
    transfer.recipient.amount.should.equal(10);
    transfer.recipient.currency.should.equal('btc');
    done();
  });

  it('Request transfer - Fail on invalid sender username', function(done) {
    try {
      var transfer = new User.requestTransfer({
        sender: {
          username: null,
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          username: 'test_username',
  	  amount: 10,
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.transfer.sender.username)
      done();
    }
  });


  it('Request transfer - Fail on invalid sender password', function(done) {
    try {
      var transfer = new User.requestTransfer({
        sender: {
          username: 'test_username',
          password: null,
          currency: 'btc'
        },
        recipient: {
          username: 'test_username',
  	  amount: 10,
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.transfer.sender.password)
      done();
    }
  });

  it('Request transfer - Fail on invalid sender currency', function(done) {
    try {
      var transfer = new User.requestTransfer({
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: null
        },
        recipient: {
          username: 'test_username',
  	  amount: 10,
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.transfer.sender.currency)
      done();
    }
  });

  it('Request transfer - Fail on invalid recipient username', function(done) {
    try {
      var transfer = new User.requestTransfer({
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          username: null,
  	  amount: 10,
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.transfer.recipient.username)
      done();
    }
  });

  it('Request transfer - Fail on invalid recipient amount', function(done) {
    try {
      var transfer = new User.requestTransfer({
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          username: 'test_username',
  	  amount: null,
          currency: 'btc'
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.transfer.recipient.amount)
      done();
    }
  });

  it('Request transfer - Fail on invalid recipient currency', function(done) {
    try {
      var transfer = new User.requestTransfer({
        sender: {
          username: 'test_username',
          password: 'test_password',
          currency: 'btc'
        },
        recipient: {
          username: 'test_username',
  	  amount: 10,
          currency: null
        }
      });
    } catch (e) {
      var errorMessage = String(e['message']);
      errorMessage.should.containEql(config.error.transfer.recipient.currency)
      done();
    }
  });

  it('Request transfer - Successfully call and set constructor', function(done) {
    var transfer = new User.requestTransfer({
      sender: {
        username: 'test_username',
        password: 'test_password',
        currency: 'btc'
      },
      recipient: {
        username: 'test_username',
	amount: 10,
        currency: 'btc'
      }
    });

    console.dir(transfer.confirm());
    done();
  });

});
