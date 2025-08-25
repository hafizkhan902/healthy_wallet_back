const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [0.01, 'Target amount must be greater than 0']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['emergency', 'vacation', 'investment', 'purchase', 'other'],
      message: 'Category must be one of: emergency, vacation, investment, purchase, other'
    }
  },
  targetDate: {
    type: Date,
    required: [true, 'Target date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Target date must be in the future'
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  milestones: [{
    amount: {
      type: Number,
      required: true
    },
    description: String,
    achievedAt: Date,
    isAchieved: {
      type: Boolean,
      default: false
    }
  }],
  contributions: [{
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Contribution must be greater than 0']
    },
    date: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String,
      enum: ['manual', 'automatic', 'bonus'],
      default: 'manual'
    },
    note: String
  }],
  autoContribution: {
    enabled: {
      type: Boolean,
      default: false
    },
    amount: Number,
    frequency: {
      type: String,
      enum: ['weekly', 'monthly'],
      default: 'monthly'
    },
    nextContribution: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ user: 1, targetDate: 1 });
goalSchema.index({ status: 1, targetDate: 1 });

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  return this.targetAmount > 0 ? Math.min((this.currentAmount / this.targetAmount) * 100, 100) : 0;
});

// Virtual for remaining amount
goalSchema.virtual('remainingAmount').get(function() {
  return Math.max(this.targetAmount - this.currentAmount, 0);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const target = new Date(this.targetDate);
  const timeDiff = target.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Ensure virtuals are included in JSON output
goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

// Update goal status based on current amount
goalSchema.pre('save', function(next) {
  if (this.currentAmount >= this.targetAmount && this.status === 'active') {
    this.status = 'completed';
  }
  
  // Check and update milestone achievements
  this.milestones.forEach(milestone => {
    if (!milestone.isAchieved && this.currentAmount >= milestone.amount) {
      milestone.isAchieved = true;
      milestone.achievedAt = new Date();
    }
  });
  
  next();
});

// Instance method to add contribution
goalSchema.methods.addContribution = function(amount, source = 'manual', note = '') {
  this.contributions.push({
    amount,
    source,
    note,
    date: new Date()
  });
  
  this.currentAmount += amount;
  return this.save();
};

// Static method to get goals summary for a user
goalSchema.statics.getGoalsSummary = async function(userId) {
  const pipeline = [
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalTargetAmount: { $sum: '$targetAmount' },
        totalCurrentAmount: { $sum: '$currentAmount' }
      }
    }
  ];

  return await this.aggregate(pipeline);
};

// Static method to get goals by category
goalSchema.statics.getGoalsByCategory = async function(userId) {
  const pipeline = [
    {
      $match: {
        user: new new mongoose.Types.ObjectId(userId),
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalTargetAmount: { $sum: '$targetAmount' },
        totalCurrentAmount: { $sum: '$currentAmount' },
        avgProgress: { $avg: { $multiply: [{ $divide: ['$currentAmount', '$targetAmount'] }, 100] } }
      }
    },
    {
      $sort: { totalTargetAmount: -1 }
    }
  ];

  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('Goal', goalSchema);
