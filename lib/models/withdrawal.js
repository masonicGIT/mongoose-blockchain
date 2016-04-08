var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// Withdrawal schema
var withdrawalSchema = new Schema({
  type: { type: String, default: 'withdrawal',
  amount: { type: Number },
  sender: {
    username: { type: String },
    password: { type: String },
    currency: { type: String, match: ^(bitcoin|ether), required: true }
  },
  recipient: {
    address: { type: String, required: true },
    currency: { type: String, match: ^(bitcoin|ether), required: true }
  },
  created_at: { type: Date, default: Date.now }
}

// Create model using schema
var Transaction = mongoose.model('Transaction', transactionSchema);

// Export the user model
module.exports = Transaction;