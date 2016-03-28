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

module.exports = config;
