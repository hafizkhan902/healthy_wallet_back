const UserSettings = require('../models/UserSettings');

// localStorage to MongoDB field mapping
const localStorageMapping = {
  'healthywallet-theme': 'theme',
  'healthywallet-currency': 'currency',
  'healthywallet-notifications': 'notifications',
  'healthywallet-budget-alerts': 'budgetAlerts',
  'healthywallet-goal-reminders': 'goalReminders',
  'healthywallet-financial-goals': 'financialGoals',
  'healthywallet-risk-tolerance': 'riskTolerance',
  'healthywallet-investment-experience': 'investmentExperience',
  'healthywallet-savings-rate': 'savingsRate',
  'healthywallet-debt-amount': 'debtAmount',
  'healthywallet-emergency-fund': 'emergencyFund',
  'healthywallet-retirement-age': 'retirementAge',
  'healthywallet-dependents': 'dependents',
  'healthywallet-housing-status': 'housingStatus',
  'healthywallet-employment-status': 'employmentStatus',
  'healthywallet-office-days': 'officeDays',
  'healthywallet-transport-office': 'transportOffice',
  'healthywallet-wfh-frequency': 'wfhFrequency',
  'healthywallet-education-level': 'educationLevel',
  'healthywallet-transport-school': 'transportSchool',
  'healthywallet-student-type': 'studentType',
  'healthywallet-food-preference': 'foodPreference',
  'healthywallet-dining-frequency': 'diningFrequency',
  'healthywallet-impulsive-buying': 'impulsiveBuying',
  'healthywallet-impulsive-spend': 'impulsiveSpend',
  'healthywallet-shopping-frequency': 'shoppingFrequency',
  'healthywallet-entertainment-budget': 'entertainmentBudget',
  'healthywallet-fitness-spend': 'fitnessSpend',
  'healthywallet-subscriptions': 'subscriptions',
  'healthywallet-travel-frequency': 'travelFrequency',
  'healthywallet-social-spending': 'socialSpending'
};

// Helper function to convert localStorage data to MongoDB format
const convertLocalStorageData = (localStorageData) => {
  const converted = {};
  
  Object.keys(localStorageData).forEach(key => {
    const mongoField = localStorageMapping[key];
    if (mongoField) {
      let value = localStorageData[key];
      
      // Convert string booleans to actual booleans
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      
      // Convert string numbers to actual numbers
      if (!isNaN(value) && value !== '' && typeof value === 'string') {
        value = Number(value);
      }
      
      converted[mongoField] = value;
    }
  });
  
  return converted;
};

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getUserSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    let settings = await UserSettings.findOne({ userId });
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = new UserSettings({ userId });
      await settings.save();
    }
    
    // Remove userId and timestamps from response
    const { userId: _, createdAt, updatedAt, __v, _id, ...settingsData } = settings.toObject();
    
    res.status(200).json({
      success: true,
      data: settingsData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateUserSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    
    // Find existing settings or create new ones
    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      settings = new UserSettings({ userId, ...updateData });
    } else {
      // Update existing settings
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          settings[key] = updateData[key];
        }
      });
    }
    
    await settings.save();
    
    // Remove userId and timestamps from response
    const { userId: _, createdAt, updatedAt, __v, _id, ...settingsData } = settings.toObject();
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settingsData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Migrate localStorage data to MongoDB
// @route   POST /api/settings/migrate
// @access  Private
const migrateLocalStorageData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { localStorageData } = req.body;
    
    if (!localStorageData || typeof localStorageData !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'localStorageData is required and must be an object'
      });
    }
    
    // Convert localStorage format to MongoDB format
    const convertedData = convertLocalStorageData(localStorageData);
    
    if (Object.keys(convertedData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid settings found in localStorage data'
      });
    }
    
    // Find existing settings or create new ones
    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      settings = new UserSettings({ userId, ...convertedData });
    } else {
      // Update existing settings with converted data
      Object.keys(convertedData).forEach(key => {
        if (convertedData[key] !== undefined) {
          settings[key] = convertedData[key];
        }
      });
    }
    
    await settings.save();
    
    // Remove userId and timestamps from response
    const { userId: _, createdAt, updatedAt, __v, _id, ...settingsData } = settings.toObject();
    
    res.status(200).json({
      success: true,
      message: `Successfully migrated ${Object.keys(convertedData).length} settings from localStorage`,
      data: {
        migratedFields: Object.keys(convertedData),
        settings: settingsData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's current currency symbol
// @route   GET /api/settings/currency-symbol
// @access  Private
const getUserCurrencySymbol = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    let settings = await UserSettings.findOne({ userId });
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = new UserSettings({ userId });
      await settings.save();
    }
    
    // Currency symbol mapping
    const currencySymbols = {
      // Major World Currencies
      'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CHF': 'CHF', 'CAD': 'C$', 'AUD': 'A$', 'NZD': 'NZ$',
      // Asian Currencies
      'BDT': '৳', 'INR': '₹', 'PKR': '₨', 'LKR': '₨', 'NPR': '₨', 'CNY': '¥', 'HKD': 'HK$', 'SGD': 'S$', 
      'MYR': 'RM', 'THB': '฿', 'IDR': 'Rp', 'PHP': '₱', 'VND': '₫', 'KRW': '₩', 'TWD': 'NT$',
      // Middle Eastern Currencies
      'AED': 'د.إ', 'SAR': '﷼', 'QAR': '﷼', 'KWD': 'د.ك', 'BHD': '.د.ب', 'OMR': '﷼', 'JOD': 'د.ا', 'ILS': '₪', 'TRY': '₺',
      // African Currencies
      'ZAR': 'R', 'EGP': '£', 'NGN': '₦', 'KES': 'KSh', 'GHS': '¢', 'MAD': 'د.م.', 'TND': 'د.ت',
      // European Currencies (Non-Euro)
      'NOK': 'kr', 'SEK': 'kr', 'DKK': 'kr', 'PLN': 'zł', 'CZK': 'Kč', 'HUF': 'Ft', 'RON': 'lei', 
      'BGN': 'лв', 'HRK': 'kn', 'RSD': 'дин', 'RUB': '₽', 'UAH': '₴',
      // American Currencies
      'MXN': '$', 'BRL': 'R$', 'ARS': '$', 'CLP': '$', 'COP': '$', 'PEN': 'S/', 'UYU': '$U', 'BOB': '$b', 'PYG': 'Gs',
      // Other Major Currencies
      'RMB': '¥', 'XAF': 'FCFA', 'XOF': 'CFA', 'XCD': '$', 'XPF': '₣'
    };
    
    const currentCurrency = settings.currency || 'USD';
    const symbol = currencySymbols[currentCurrency] || '$';
    
    res.status(200).json({
      success: true,
      data: {
        currency: currentCurrency,
        symbol: symbol,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available currencies
// @route   GET /api/settings/currencies
// @access  Public
const getAvailableCurrencies = async (req, res, next) => {
  try {
    const currencies = [
      // Major World Currencies
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
      
      // Asian Currencies
      { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
      { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' },
      { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
      { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
      { code: 'THB', name: 'Thai Baht', symbol: '฿' },
      { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
      { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
      { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
      { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
      { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
      
      // Middle Eastern Currencies
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
      { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
      { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
      { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
      { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب' },
      { code: 'OMR', name: 'Omani Rial', symbol: '﷼' },
      { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا' },
      { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
      { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
      
      // African Currencies
      { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
      { code: 'EGP', name: 'Egyptian Pound', symbol: '£' },
      { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
      { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
      { code: 'GHS', name: 'Ghanaian Cedi', symbol: '¢' },
      { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
      { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت' },
      
      // European Currencies (Non-Euro)
      { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
      { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
      { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
      { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
      { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
      { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
      { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
      { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
      { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
      { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин' },
      { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
      { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
      
      // American Currencies
      { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
      { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
      { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
      { code: 'COP', name: 'Colombian Peso', symbol: '$' },
      { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
      { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U' },
      { code: 'BOB', name: 'Bolivian Boliviano', symbol: '$b' },
      { code: 'PYG', name: 'Paraguayan Guarani', symbol: 'Gs' },
      
      // Other Major Currencies
      { code: 'RMB', name: 'Chinese Renminbi', symbol: '¥' },
      { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
      { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
      { code: 'XCD', name: 'East Caribbean Dollar', symbol: '$' },
      { code: 'XPF', name: 'CFP Franc', symbol: '₣' },
    ];
    
    res.status(200).json({
      success: true,
      data: {
        currencies,
        total: currencies.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserSettings,
  updateUserSettings,
  migrateLocalStorageData,
  getAvailableCurrencies,
  getUserCurrencySymbol
};
