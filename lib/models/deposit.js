var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// Deposit schema
var depositSchema = new Schema({
  type: { type: String, default: 'deposit' },
  amount: { type: Number },
  recipient: {
    username: { type: String, required: true },
    currency: { type: String, match: ^(bitcoin|ether), required: true }
  },
  created_at: { type: Date, default: Date.now }
}

// Create model using schema
var Deposit = mongoose.model('Deposit', depositSchema);

// Export the user model
module.exports = Deposit;