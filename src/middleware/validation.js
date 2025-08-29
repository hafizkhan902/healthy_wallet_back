const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: errorMessage
      });
    }
    
    next();
  };
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    bio: Joi.string().max(500)
  })
};

// Income validation schemas
const incomeSchemas = {
  create: Joi.object({
    amount: Joi.number().positive().required(),
    source: Joi.string().min(2).max(100).required(),
    category: Joi.string().valid('salary', 'freelance', 'investment', 'business', 'other').required(),
    date: Joi.date().required(),
    description: Joi.string().max(255),
    isRecurring: Joi.boolean().default(false),
    recurringPeriod: Joi.string().valid('weekly', 'monthly', 'yearly').when('isRecurring', {
      is: true,
      then: Joi.required()
    })
  }),
  
  update: Joi.object({
    amount: Joi.number().positive(),
    source: Joi.string().min(2).max(100),
    category: Joi.string().valid('salary', 'freelance', 'investment', 'business', 'other'),
    date: Joi.date(),
    description: Joi.string().max(255),
    isRecurring: Joi.boolean(),
    recurringPeriod: Joi.string().valid('weekly', 'monthly', 'yearly')
  })
};

// Expense validation schemas
const expenseSchemas = {
  create: Joi.object({
    amount: Joi.number().positive().required(),
    category: Joi.string().valid(
      'food', 'transport', 'entertainment', 'bills', 'shopping', 
      'healthcare', 'education', 'travel', 'other'
    ).required(),
    date: Joi.date().required(),
    description: Joi.string().max(255),
    isRecurring: Joi.boolean().default(false),
    recurringPeriod: Joi.string().valid('weekly', 'monthly', 'yearly').when('isRecurring', {
      is: true,
      then: Joi.required()
    })
  }),
  
  update: Joi.object({
    amount: Joi.number().positive(),
    category: Joi.string().valid(
      'food', 'transport', 'entertainment', 'bills', 'shopping', 
      'healthcare', 'education', 'travel', 'other'
    ),
    date: Joi.date(),
    description: Joi.string().max(255),
    isRecurring: Joi.boolean(),
    recurringPeriod: Joi.string().valid('weekly', 'monthly', 'yearly')
  })
};

// Goal validation schemas
const goalSchemas = {
  create: Joi.object({
    title: Joi.string().min(2).max(100).required(),
    targetAmount: Joi.number().positive().required(),
    currentAmount: Joi.number().min(0).default(0),
    category: Joi.string().valid('emergency', 'vacation', 'investment', 'purchase', 'other').required(),
    targetDate: Joi.date().greater('now').required(),
    description: Joi.string().max(500)
  }),
  
  update: Joi.object({
    title: Joi.string().min(2).max(100),
    targetAmount: Joi.number().positive(),
    currentAmount: Joi.number().min(0),
    category: Joi.string().valid('emergency', 'vacation', 'investment', 'purchase', 'other'),
    targetDate: Joi.date().greater('now'),
    description: Joi.string().max(500)
  })
};

// Settings validation schemas
const settingsSchemas = {
  update: Joi.object({
    // App Settings
    theme: Joi.string().valid('light', 'dark'),
    currency: Joi.string().valid(
      // Major World Currencies
      'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
      // Asian Currencies  
      'BDT', 'INR', 'PKR', 'LKR', 'NPR', 'CNY', 'HKD', 'SGD', 'MYR', 'THB', 'IDR', 'PHP', 'VND', 'KRW', 'TWD',
      // Middle Eastern Currencies
      'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'ILS', 'TRY',
      // African Currencies
      'ZAR', 'EGP', 'NGN', 'KES', 'GHS', 'MAD', 'TND',
      // European Currencies (Non-Euro)
      'NOK', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RSD', 'RUB', 'UAH',
      // American Currencies
      'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'BOB', 'PYG',
      // Other Major Currencies
      'RMB', 'XAF', 'XOF', 'XCD', 'XPF'
    ),
    notifications: Joi.boolean(),
    budgetAlerts: Joi.boolean(),
    goalReminders: Joi.boolean(),
    
    // Financial Profile
    financialGoals: Joi.string().max(500),
    riskTolerance: Joi.string().valid('conservative', 'moderate', 'aggressive', 'very-aggressive'),
    investmentExperience: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert'),
    savingsRate: Joi.number().min(0).max(100),
    debtAmount: Joi.number().min(0),
    emergencyFund: Joi.number().min(0),
    retirementAge: Joi.number().min(50).max(100),
    dependents: Joi.number().min(0),
    housingStatus: Joi.string().valid('rent', 'own-mortgage', 'own-outright', 'living-with-family'),
    employmentStatus: Joi.string().valid('employed', 'part-time', 'self-employed', 'freelancer', 'student', 'retired', 'unemployed'),
    
    // Work/Education Settings
    officeDays: Joi.number().min(0).max(7),
    transportOffice: Joi.number().min(0),
    wfhFrequency: Joi.string().valid('never', 'rarely', 'sometimes', 'often', 'always'),
    educationLevel: Joi.string().valid('high-school', 'undergraduate', 'graduate', 'postgraduate', 'vocational'),
    transportSchool: Joi.number().min(0),
    studentType: Joi.string().valid('full-time', 'part-time', 'online', 'evening'),
    
    // Lifestyle Settings
    foodPreference: Joi.string().valid('home-cooked', 'mixed', 'dining-out', 'fast-food', 'organic-healthy', 'budget-conscious'),
    diningFrequency: Joi.string().valid('daily', 'few-times-week', 'weekly', 'bi-weekly', 'monthly', 'rarely'),
    impulsiveBuying: Joi.string().valid('very-low', 'low', 'moderate', 'high', 'very-high'),
    impulsiveSpend: Joi.number().min(0),
    shoppingFrequency: Joi.string().valid('daily', 'few-times-week', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'rarely'),
    entertainmentBudget: Joi.number().min(0),
    fitnessSpend: Joi.number().min(0),
    subscriptions: Joi.number().min(0),
    travelFrequency: Joi.string().valid('monthly', 'quarterly', 'bi-annually', 'annually', 'rarely', 'never'),
    socialSpending: Joi.string().valid('very-low', 'low', 'moderate', 'high', 'very-high')
  }),
  
  migrate: Joi.object({
    localStorageData: Joi.object().required()
  })
};

module.exports = {
  validate,
  userSchemas,
  incomeSchemas,
  expenseSchemas,
  goalSchemas,
  settingsSchemas
};
