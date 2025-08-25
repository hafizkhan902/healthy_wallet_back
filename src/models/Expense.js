const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['food', 'transport', 'entertainment', 'bills', 'shopping', 'healthcare', 'education', 'travel', 'other'],
      message: 'Category must be one of: food, transport, entertainment, bills, shopping, healthcare, education, travel, other'
    }
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  description: {
    type: String,
    maxlength: [255, 'Description cannot exceed 255 characters']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPeriod: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    required: function() {
      return this.isRecurring;
    }
  },
  nextRecurringDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    name: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ isRecurring: 1, nextRecurringDate: 1 });

// Calculate next recurring date before saving
expenseSchema.pre('save', function(next) {
  if (this.isRecurring && this.recurringPeriod && !this.nextRecurringDate) {
    const currentDate = new Date(this.date);
    
    switch (this.recurringPeriod) {
      case 'weekly':
        this.nextRecurringDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
        break;
      case 'monthly':
        this.nextRecurringDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
        break;
      case 'yearly':
        this.nextRecurringDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
        break;
    }
  }
  next();
});

// Static method to get expense summary for a user
expenseSchema.statics.getExpenseSummary = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ];

  return await this.aggregate(pipeline);
};

// Static method to get monthly expense trend
expenseSchema.statics.getMonthlyTrend = async function(userId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const pipeline = [
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ];

  return await this.aggregate(pipeline);
};

// Static method to get top spending categories
expenseSchema.statics.getTopCategories = async function(userId, limit = 5) {
  const pipeline = [
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        lastExpense: { $max: '$date' }
      }
    },
    {
      $sort: { totalAmount: -1 }
    },
    {
      $limit: limit
    }
  ];

  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('Expense', expenseSchema);
