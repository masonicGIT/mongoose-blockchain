var config = {};

// mongo uri
config.mongoURI = {
  development: "mongodb://localhost/mongoose-blockchain",
  test: "mongodb://localhost/mongoose-blockchain",
  stage: process.env.MONGOLAB_URI
};

// Set BitGo Test wallet here (OPTIONAL)
config.wallet = {
  label: 'mongoose_blockchain_test',
  password: 'test',
  amount: 50000
};

// List of currently supported currencies - include shortnames
config.currencies = ['bitcoin', 'ether'];

// Set transaction object assertion messages 
config.error = {

  withdrawal: {
    object: "\n\nPlease set your transaction object like so:\nsender: {\n\tusername: 'test_username', \n\tpassword: 'test_password', \n\tcurrency: 'btc'\n\t}\n",
    amount: "\n\nPlease ensure that the requested sending amount is of type string or number",
    sender: {
      username: "\n\nPlease ensure that the sender's username is of type string",
      password: "\n\nPlease ensure that the sender's password is of type string",
      currency: "\n\nPlease ensure that the requested sending currency is of type string or number and is one of the following\n\t" + config.currencies
    },
    recipient: {
      currency: "\n\nPlease ensure that the requested receiving currency is of type string or number and is one of the following\n\t" + config.currencies, 
      address: "\n\nPlease ensure that the requested recieving address is of type string"
    }
  },
  deposit: {
    object: "\n\nPlease set your transaction object like so:\nsender: {\n\tusername: 'test_username', \n\tcurrency: 'btc'\n\t}\n",
    recipient: {
      username: "\n\nPlease ensure that the recipient's username or valid receiving address is set as type string",
      currency: "\n\nPlease ensure that the requested receiving currency is of type string or number and is one of the following\n\t" + config.currencies   
    }
  },
  transfer: {
    amount: "\n\nPlease ensure that the requested sending amount is of type string or number",
    object: "\n\nPlease set your transaction object like so:\nsender: {\n\tusername: 'test_username', \n\tpassword: 'test_password', \n\tcurrency: 'btc'\n\t}\n",
    sender: {
      username: "\n\nPlease ensure that the sender's username is of type string",
      password: "\n\nPlease ensure that the sender's password is of type string",
      currency: "\n\nPlease ensure that the requested sending currency is of type string or number and is one of the following\n\t" + config.currencies
    },
    recipient: {
      username: "\n\nPlease ensure that the recipient's username or valid receiving address is set as type string",
      currency: "\n\nPlease ensure that the requested receiving currency is of type string and is one of the following\n\t" + config.currencies, 
      amount: "\n\nPlease ensure that the requested sending amount is of type number"
    }
  }
}

module.exports = config;
