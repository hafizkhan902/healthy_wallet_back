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

module.exports = {
  validate,
  userSchemas,
  incomeSchemas,
  expenseSchemas,
  goalSchemas
};
