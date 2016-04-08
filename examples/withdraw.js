/**
 *  Withdraw.js
 *
 *  An example script for withdrawing from a user account
 *
 */

if (process.argv.length < 8) {
  console.log("\nExample usage:\n\t" + "node withdraw.js " +
    " <username> <password> <originatingCurrency> <landingCurrency> <destinationAddress> <amount>");

  console.log("\nPlease run the script with the following parameters\n");
  console.log("username: mongo username for the user");
  console.log("password: associated password for the user");
  console.log("originatingCurrency: the currency of the originating wallet, currently only supports bitcoin [bitcoin, ether]");
  console.log("landingCurrency: the currency of the recieving wallet [bitcoin, ether]");
  console.log("destinationAddress: the recipients address");
  console.log("amount: the withdrawal amount in Satoshis or Wei");
  process.exit(-1);
}

// Set the process args locally
var username = process.argv[2];
var password = process.argv[3];
var originatingCurrency = process.argv[4];
var landingCurrency = process.argv[5];
var destinationAddress = process.argv[6];
var amount = parseInt(process.argv[7], 10);

var User = require('./models/user.js');

var transaction = new User.transactionRequest({
  type: 'withdrawal',
  amount: 1000,
  sender: {
    username: username,
    password: password, 
    currency: originatingCurrency
  },
  recipient: {
    address: destinationAddress,
    currency: landingCurrency
  }
});

return User.withdrawal(transaction)
.then(function(receipt) {
  return console.log(receipt);
  process.exit(-1);
})
.catch(function(err) {
  console.log(err);
  process.exit(-1);
})