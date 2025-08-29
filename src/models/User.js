const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  profilePicture: {
    type: String,
    default: ''
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      goalReminders: {
        type: Boolean,
        default: true
      },
      weeklyReports: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      dataSharing: {
        type: Boolean,
        default: false
      }
    }
  },
  achievements: [{
    achievementId: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['savings', 'goals', 'consistency', 'milestones'],
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    points: {
      type: Number,
      default: 0
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  financialSummary: {
    totalIncome: {
      type: Number,
      default: 0
    },
    totalExpenses: {
      type: Number,
      default: 0
    },
    currentBalance: {
      type: Number,
      default: 0
    },
    savingsRate: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better performance (email index is created automatically by unique: true)
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update financial summary
userSchema.methods.updateFinancialSummary = async function() {
  const Income = require('./Income');
  const Expense = require('./Expense');
  
  const totalIncome = await Income.aggregate([
    { $match: { user: this._id } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const totalExpenses = await Expense.aggregate([
    { $match: { user: this._id } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  this.financialSummary.totalIncome = totalIncome[0]?.total || 0;
  this.financialSummary.totalExpenses = totalExpenses[0]?.total || 0;
  this.financialSummary.currentBalance = this.financialSummary.totalIncome - this.financialSummary.totalExpenses;
  this.financialSummary.savingsRate = this.financialSummary.totalIncome > 0 
    ? ((this.financialSummary.currentBalance / this.financialSummary.totalIncome) * 100).toFixed(2)
    : 0;
  this.financialSummary.lastUpdated = new Date();
  
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
