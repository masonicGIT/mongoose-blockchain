var config = {};

// mongo uri
config.mongoURI = {
  development: "mongodb://localhost/mongoose-blockchain",
  test: "mongodb://localhost/mongoose-blockchain",
  stage: process.env.MONGOLAB_URI
};

module.exports = config;
