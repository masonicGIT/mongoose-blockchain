var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// Transaction schema
var transactionSchema = new Schema({
  type: { type: String, match: ^(deposit|withdrawal|transfer) },
  amount: { type: Number },
  sender: {
    username: { type: String },
    password: { type: String },
    currency: { type: String, match: ^(bitcoin|ether), required: true }
  },
  recipient: {
    username: { type: String },
    address: { type: String },
    currency: { type: String, match: ^(bitcoin|ether), required: true }
  },
  created_at: { type: Date, default: Date.now }
}

// Create model using schema
var Transaction = mongoose.model('Transaction', transactionSchema);

// Export the user model
module.exports = Transaction;