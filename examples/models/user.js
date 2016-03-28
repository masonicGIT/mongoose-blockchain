var mongoose = require('mongoose');
var blockchain = require('./../../index');

var Schema = mongoose.Schema;

// Create user schema
var userSchema = new Schema({
  name: { type: String },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  admin: Boolean,
  location: { type: String, default: '' },
  meta: {
    age: { type: Number, default: '' },
    website: { type: String, default: '' }
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

userSchema.plugin(blockchain, process.env.BITGO_ACCESS_TOKEN);

// Create model using schema
var User = mongoose.model('User', userSchema);

// Export the user model
module.exports = User;