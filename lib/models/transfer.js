var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// Transfer schema
var transferSchema = new Schema({
  type: { type: String, default: 'transfer', required: true },
  amount: { type: Number },
  sender: {
    username: { type: String },
    password: { type: String },
    currency: { type: String, match: ^(bitcoin|ether), required: true }
  },
  recipient: {
    username: { type: String },
    currency: { type: String, match: ^(bitcoin|ether), required: true }
  },
  created_at: { type: Date, default: Date.now }
}

// Create model using schema
var Transfer = mongoose.model('Transfer', transferSchema);

// Export the user model
module.exports = Transfer;