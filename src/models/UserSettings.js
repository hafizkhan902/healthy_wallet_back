const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // App Settings
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  currency: {
    type: String,
    enum: [
      // Major World Currencies
      'USD', // US Dollar
      'EUR', // Euro
      'GBP', // British Pound
      'JPY', // Japanese Yen
      'CHF', // Swiss Franc
      'CAD', // Canadian Dollar
      'AUD', // Australian Dollar
      'NZD', // New Zealand Dollar
      
      // Asian Currencies
      'BDT', // Bangladeshi Taka
      'INR', // Indian Rupee
      'PKR', // Pakistani Rupee
      'LKR', // Sri Lankan Rupee
      'NPR', // Nepalese Rupee
      'CNY', // Chinese Yuan
      'HKD', // Hong Kong Dollar
      'SGD', // Singapore Dollar
      'MYR', // Malaysian Ringgit
      'THB', // Thai Baht
      'IDR', // Indonesian Rupiah
      'PHP', // Philippine Peso
      'VND', // Vietnamese Dong
      'KRW', // South Korean Won
      'TWD', // Taiwan Dollar
      
      // Middle Eastern Currencies
      'AED', // UAE Dirham
      'SAR', // Saudi Riyal
      'QAR', // Qatari Riyal
      'KWD', // Kuwaiti Dinar
      'BHD', // Bahraini Dinar
      'OMR', // Omani Rial
      'JOD', // Jordanian Dinar
      'ILS', // Israeli Shekel
      'TRY', // Turkish Lira
      
      // African Currencies
      'ZAR', // South African Rand
      'EGP', // Egyptian Pound
      'NGN', // Nigerian Naira
      'KES', // Kenyan Shilling
      'GHS', // Ghanaian Cedi
      'MAD', // Moroccan Dirham
      'TND', // Tunisian Dinar
      
      // European Currencies (Non-Euro)
      'NOK', // Norwegian Krone
      'SEK', // Swedish Krona
      'DKK', // Danish Krone
      'PLN', // Polish Zloty
      'CZK', // Czech Koruna
      'HUF', // Hungarian Forint
      'RON', // Romanian Leu
      'BGN', // Bulgarian Lev
      'HRK', // Croatian Kuna
      'RSD', // Serbian Dinar
      'RUB', // Russian Ruble
      'UAH', // Ukrainian Hryvnia
      
      // American Currencies
      'MXN', // Mexican Peso
      'BRL', // Brazilian Real
      'ARS', // Argentine Peso
      'CLP', // Chilean Peso
      'COP', // Colombian Peso
      'PEN', // Peruvian Sol
      'UYU', // Uruguayan Peso
      'BOB', // Bolivian Boliviano
      'PYG', // Paraguayan Guarani
      
      // Other Major Currencies
      'RMB', // Chinese Renminbi (alternative code)
      'XAF', // Central African CFA Franc
      'XOF', // West African CFA Franc
      'XCD', // East Caribbean Dollar
      'XPF', // CFP Franc
    ],
    default: 'USD'
  },
  notifications: {
    type: Boolean,
    default: true
  },
  budgetAlerts: {
    type: Boolean,
    default: true
  },
  goalReminders: {
    type: Boolean,
    default: true
  },
  
  // Financial Profile
  financialGoals: {
    type: String,
    default: ''
  },
  riskTolerance: {
    type: String,
    enum: ['conservative', 'moderate', 'aggressive', 'very-aggressive'],
    default: 'moderate'
  },
  investmentExperience: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  savingsRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  debtAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  emergencyFund: {
    type: Number,
    min: 0,
    default: 0
  },
  retirementAge: {
    type: Number,
    min: 50,
    max: 100,
    default: 65
  },
  dependents: {
    type: Number,
    min: 0,
    default: 0
  },
  housingStatus: {
    type: String,
    enum: ['rent', 'own-mortgage', 'own-outright', 'living-with-family'],
    default: 'rent'
  },
  employmentStatus: {
    type: String,
    enum: ['employed', 'part-time', 'self-employed', 'freelancer', 'student', 'retired', 'unemployed'],
    default: 'employed'
  },
  
  // Work/Education Settings
  officeDays: {
    type: Number,
    min: 0,
    max: 7,
    default: 5
  },
  transportOffice: {
    type: Number,
    min: 0,
    default: 0
  },
  wfhFrequency: {
    type: String,
    enum: ['never', 'rarely', 'sometimes', 'often', 'always'],
    default: 'sometimes'
  },
  educationLevel: {
    type: String,
    enum: ['high-school', 'undergraduate', 'graduate', 'postgraduate', 'vocational'],
    default: 'high-school'
  },
  transportSchool: {
    type: Number,
    min: 0,
    default: 0
  },
  studentType: {
    type: String,
    enum: ['full-time', 'part-time', 'online', 'evening'],
    default: 'full-time'
  },
  
  // Lifestyle Settings
  foodPreference: {
    type: String,
    enum: ['home-cooked', 'mixed', 'dining-out', 'fast-food', 'organic-healthy', 'budget-conscious'],
    default: 'mixed'
  },
  diningFrequency: {
    type: String,
    enum: ['daily', 'few-times-week', 'weekly', 'bi-weekly', 'monthly', 'rarely'],
    default: 'weekly'
  },
  impulsiveBuying: {
    type: String,
    enum: ['very-low', 'low', 'moderate', 'high', 'very-high'],
    default: 'moderate'
  },
  impulsiveSpend: {
    type: Number,
    min: 0,
    default: 0
  },
  shoppingFrequency: {
    type: String,
    enum: ['daily', 'few-times-week', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'rarely'],
    default: 'monthly'
  },
  entertainmentBudget: {
    type: Number,
    min: 0,
    default: 0
  },
  fitnessSpend: {
    type: Number,
    min: 0,
    default: 0
  },
  subscriptions: {
    type: Number,
    min: 0,
    default: 0
  },
  travelFrequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'bi-annually', 'annually', 'rarely', 'never'],
    default: 'annually'
  },
  socialSpending: {
    type: String,
    enum: ['very-low', 'low', 'moderate', 'high', 'very-high'],
    default: 'moderate'
  }
}, {
  timestamps: true
});

// Index is already created by unique: true in schema definition

module.exports = mongoose.model('UserSettings', userSettingsSchema);
