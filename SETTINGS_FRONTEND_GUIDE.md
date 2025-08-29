# 🔧 Settings Frontend Implementation Guide

## 📋 Table of Contents
- [API Endpoints Overview](#api-endpoints-overview)
- [Frontend Service Implementation](#frontend-service-implementation)
- [React Components](#react-components)
- [State Management](#state-management)
- [Form Validation](#form-validation)
- [Error Handling](#error-handling)
- [Complete Example](#complete-example)

---

## 🔌 API Endpoints Overview

### Base URL: `http://localhost:2000/api/settings`

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| `GET` | `/settings` | Get user settings | ✅ Yes |
| `PUT` | `/settings` | Update settings | ✅ Yes |
| `POST` | `/settings/migrate` | Migrate localStorage | ✅ Yes |

---

## 🛠️ Frontend Service Implementation

### 1. Settings API Service

```javascript
// services/settingsApi.js
class SettingsAPI {
  constructor() {
    this.baseURL = 'http://localhost:2000/api/settings';
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  // Get authentication headers
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      ...this.headers,
      'Authorization': `Bearer ${token}`
    };
  }

  // GET /api/settings - Fetch user settings
  async getSettings() {
    try {
      const response = await fetch(this.baseURL, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include'  // Important for CORS
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch settings');
      }

      return result.data;
    } catch (error) {
      console.error('Get settings error:', error);
      throw error;
    }
  }

  // PUT /api/settings - Update user settings
  async updateSettings(settingsData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(settingsData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update settings');
      }

      return result.data;
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  }

  // POST /api/settings/migrate - Migrate localStorage to database
  async migrateLocalStorageSettings() {
    try {
      // Collect all healthywallet-* items from localStorage
      const localStorageData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('healthywallet-')) {
          localStorageData[key] = localStorage.getItem(key);
        }
      }

      if (Object.keys(localStorageData).length === 0) {
        console.log('No localStorage settings to migrate');
        return { migratedFields: [], settings: {} };
      }

      const response = await fetch(`${this.baseURL}/migrate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ localStorageData })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to migrate settings');
      }

      // Optionally clear migrated localStorage items
      Object.keys(localStorageData).forEach(key => {
        localStorage.removeItem(key);
      });

      return result.data;
    } catch (error) {
      console.error('Migrate settings error:', error);
      throw error;
    }
  }

  // Batch update multiple settings
  async updateMultipleSettings(settingsUpdates) {
    return this.updateSettings(settingsUpdates);
  }

  // Update single setting
  async updateSingleSetting(key, value) {
    const update = { [key]: value };
    return this.updateSettings(update);
  }
}

// Export singleton instance
export const settingsAPI = new SettingsAPI();
export default settingsAPI;
```

### 2. React Hook for Settings

```javascript
// hooks/useSettings.js
import { useState, useEffect, useCallback } from 'react';
import settingsAPI from '../services/settingsApi';

export const useSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load settings
  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await settingsAPI.getSettings();
      setSettings(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback(async (updates) => {
    setSaving(true);
    setError(null);
    
    try {
      const updatedSettings = await settingsAPI.updateSettings(updates);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      setError(err.message);
      console.error('Failed to update settings:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  // Update single setting
  const updateSetting = useCallback(async (key, value) => {
    return updateSettings({ [key]: value });
  }, [updateSettings]);

  // Migrate localStorage settings
  const migrateSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await settingsAPI.migrateLocalStorageSettings();
      if (result.settings) {
        setSettings(result.settings);
      }
      return result;
    } catch (err) {
      setError(err.message);
      console.error('Failed to migrate settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    saving,
    loadSettings,
    updateSettings,
    updateSetting,
    migrateSettings
  };
};
```

---

## 🎨 React Components

### 1. Settings Page Component

```javascript
// components/Settings.js
import React, { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import AppSettings from './AppSettings';
import FinancialProfile from './FinancialProfile';
import LifestyleSettings from './LifestyleSettings';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const Settings = () => {
  const { 
    settings, 
    loading, 
    error, 
    saving, 
    updateSettings, 
    migrateSettings 
  } = useSettings();
  
  const [activeTab, setActiveTab] = useState('app');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-migrate localStorage settings on first load
  useEffect(() => {
    const shouldMigrate = localStorage.getItem('healthywallet-theme') || 
                         localStorage.getItem('healthywallet-currency');
    
    if (shouldMigrate && settings) {
      console.log('Auto-migrating localStorage settings...');
      migrateSettings().then((result) => {
        if (result.migratedFields.length > 0) {
          console.log(`Migrated ${result.migratedFields.length} settings:`, result.migratedFields);
        }
      }).catch(console.error);
    }
  }, [settings, migrateSettings]);

  const handleSettingsUpdate = async (updates) => {
    try {
      await updateSettings(updates);
      setHasUnsavedChanges(false);
      // Show success message
      console.log('Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleTabChange = (tab) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm('You have unsaved changes. Do you want to leave?');
      if (!confirmLeave) return;
    }
    setActiveTab(tab);
    setHasUnsavedChanges(false);
  };

  if (loading) {
    return <LoadingSpinner message="Loading your settings..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={() => window.location.reload()} />;
  }

  if (!settings) {
    return <div>No settings found</div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        {hasUnsavedChanges && (
          <div className="unsaved-indicator">
            You have unsaved changes
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button 
          className={activeTab === 'app' ? 'tab active' : 'tab'}
          onClick={() => handleTabChange('app')}
        >
          App Settings
        </button>
        <button 
          className={activeTab === 'financial' ? 'tab active' : 'tab'}
          onClick={() => handleTabChange('financial')}
        >
          Financial Profile
        </button>
        <button 
          className={activeTab === 'lifestyle' ? 'tab active' : 'tab'}
          onClick={() => handleTabChange('lifestyle')}
        >
          Lifestyle
        </button>
      </div>

      {/* Tab Content */}
      <div className="settings-content">
        {activeTab === 'app' && (
          <AppSettings 
            settings={settings}
            onUpdate={handleSettingsUpdate}
            saving={saving}
            onMarkUnsaved={() => setHasUnsavedChanges(true)}
          />
        )}
        
        {activeTab === 'financial' && (
          <FinancialProfile 
            settings={settings}
            onUpdate={handleSettingsUpdate}
            saving={saving}
            onMarkUnsaved={() => setHasUnsavedChanges(true)}
          />
        )}
        
        {activeTab === 'lifestyle' && (
          <LifestyleSettings 
            settings={settings}
            onUpdate={handleSettingsUpdate}
            saving={saving}
            onMarkUnsaved={() => setHasUnsavedChanges(true)}
          />
        )}
      </div>
    </div>
  );
};

export default Settings;
```

### 2. App Settings Component

```javascript
// components/AppSettings.js
import React, { useState, useEffect } from 'react';

const AppSettings = ({ settings, onUpdate, saving, onMarkUnsaved }) => {
  const [formData, setFormData] = useState({
    theme: settings.theme || 'light',
    currency: settings.currency || 'USD',
    notifications: settings.notifications !== false,
    budgetAlerts: settings.budgetAlerts !== false,
    goalReminders: settings.goalReminders !== false,
  });

  useEffect(() => {
    setFormData({
      theme: settings.theme || 'light',
      currency: settings.currency || 'USD',
      notifications: settings.notifications !== false,
      budgetAlerts: settings.budgetAlerts !== false,
      goalReminders: settings.goalReminders !== false,
    });
  }, [settings]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    onMarkUnsaved();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdate(formData);
  };

  return (
    <div className="app-settings">
      <h2>App Settings</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Theme Selection */}
        <div className="form-group">
          <label>Theme</label>
          <select 
            value={formData.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        {/* Currency Selection */}
        <div className="form-group">
          <label>Currency</label>
          <select 
            value={formData.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Notification Settings */}
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.notifications}
              onChange={(e) => handleChange('notifications', e.target.checked)}
            />
            Enable Notifications
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.budgetAlerts}
              onChange={(e) => handleChange('budgetAlerts', e.target.checked)}
            />
            Budget Alerts
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.goalReminders}
              onChange={(e) => handleChange('goalReminders', e.target.checked)}
            />
            Goal Reminders
          </label>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default AppSettings;
```

### 3. Financial Profile Component

```javascript
// components/FinancialProfile.js
import React, { useState, useEffect } from 'react';

const FinancialProfile = ({ settings, onUpdate, saving, onMarkUnsaved }) => {
  const [formData, setFormData] = useState({
    financialGoals: settings.financialGoals || '',
    riskTolerance: settings.riskTolerance || 'moderate',
    investmentExperience: settings.investmentExperience || 'beginner',
    savingsRate: settings.savingsRate || 0,
    debtAmount: settings.debtAmount || 0,
    emergencyFund: settings.emergencyFund || 0,
    retirementAge: settings.retirementAge || 65,
    dependents: settings.dependents || 0,
    housingStatus: settings.housingStatus || 'rent',
    employmentStatus: settings.employmentStatus || 'employed',
  });

  useEffect(() => {
    setFormData({
      financialGoals: settings.financialGoals || '',
      riskTolerance: settings.riskTolerance || 'moderate',
      investmentExperience: settings.investmentExperience || 'beginner',
      savingsRate: settings.savingsRate || 0,
      debtAmount: settings.debtAmount || 0,
      emergencyFund: settings.emergencyFund || 0,
      retirementAge: settings.retirementAge || 65,
      dependents: settings.dependents || 0,
      housingStatus: settings.housingStatus || 'rent',
      employmentStatus: settings.employmentStatus || 'employed',
    });
  }, [settings]);

  const handleChange = (key, value) => {
    // Convert numeric strings to numbers
    if (['savingsRate', 'debtAmount', 'emergencyFund', 'retirementAge', 'dependents'].includes(key)) {
      value = parseFloat(value) || 0;
    }
    
    setFormData(prev => ({ ...prev, [key]: value }));
    onMarkUnsaved();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdate(formData);
  };

  return (
    <div className="financial-profile">
      <h2>Financial Profile</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Financial Goals */}
        <div className="form-group">
          <label>Financial Goals</label>
          <textarea 
            value={formData.financialGoals}
            onChange={(e) => handleChange('financialGoals', e.target.value)}
            placeholder="e.g., Emergency fund, House down payment, Retirement..."
            rows={3}
          />
        </div>

        {/* Risk Tolerance */}
        <div className="form-group">
          <label>Risk Tolerance</label>
          <select 
            value={formData.riskTolerance}
            onChange={(e) => handleChange('riskTolerance', e.target.value)}
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
            <option value="very-aggressive">Very Aggressive</option>
          </select>
        </div>

        {/* Investment Experience */}
        <div className="form-group">
          <label>Investment Experience</label>
          <select 
            value={formData.investmentExperience}
            onChange={(e) => handleChange('investmentExperience', e.target.value)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        {/* Savings Rate */}
        <div className="form-group">
          <label>Savings Rate (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.savingsRate}
            onChange={(e) => handleChange('savingsRate', e.target.value)}
          />
        </div>

        {/* Debt Amount */}
        <div className="form-group">
          <label>Total Debt Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.debtAmount}
            onChange={(e) => handleChange('debtAmount', e.target.value)}
          />
        </div>

        {/* Emergency Fund */}
        <div className="form-group">
          <label>Emergency Fund</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.emergencyFund}
            onChange={(e) => handleChange('emergencyFund', e.target.value)}
          />
        </div>

        {/* Retirement Age */}
        <div className="form-group">
          <label>Target Retirement Age</label>
          <input
            type="number"
            min="50"
            max="100"
            value={formData.retirementAge}
            onChange={(e) => handleChange('retirementAge', e.target.value)}
          />
        </div>

        {/* Dependents */}
        <div className="form-group">
          <label>Number of Dependents</label>
          <input
            type="number"
            min="0"
            value={formData.dependents}
            onChange={(e) => handleChange('dependents', e.target.value)}
          />
        </div>

        {/* Housing Status */}
        <div className="form-group">
          <label>Housing Status</label>
          <select 
            value={formData.housingStatus}
            onChange={(e) => handleChange('housingStatus', e.target.value)}
          >
            <option value="rent">Rent</option>
            <option value="own-mortgage">Own with Mortgage</option>
            <option value="own-outright">Own Outright</option>
            <option value="living-with-family">Living with Family</option>
          </select>
        </div>

        {/* Employment Status */}
        <div className="form-group">
          <label>Employment Status</label>
          <select 
            value={formData.employmentStatus}
            onChange={(e) => handleChange('employmentStatus', e.target.value)}
          >
            <option value="employed">Employed</option>
            <option value="part-time">Part-time</option>
            <option value="self-employed">Self-employed</option>
            <option value="freelancer">Freelancer</option>
            <option value="student">Student</option>
            <option value="retired">Retired</option>
            <option value="unemployed">Unemployed</option>
          </select>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default FinancialProfile;
```

---

## 🔄 State Management (Context)

```javascript
// context/SettingsContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import settingsAPI from '../services/settingsApi';

const SettingsContext = createContext();

const settingsReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'UPDATE_SETTING':
      return {
        ...state,
        settings: { ...state.settings, [action.key]: action.value }
      };
    case 'UPDATE_MULTIPLE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
    default:
      return state;
  }
};

export const SettingsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, {
    settings: null,
    loading: false,
    error: null
  });

  const loadSettings = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const settings = await settingsAPI.getSettings();
      dispatch({ type: 'SET_SETTINGS', payload: settings });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const updateSettings = async (updates) => {
    try {
      const updatedSettings = await settingsAPI.updateSettings(updates);
      dispatch({ type: 'UPDATE_MULTIPLE_SETTINGS', payload: updatedSettings });
      return updatedSettings;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateSetting = async (key, value) => {
    try {
      await settingsAPI.updateSingleSetting(key, value);
      dispatch({ type: 'UPDATE_SETTING', key, value });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{
      ...state,
      loadSettings,
      updateSettings,
      updateSetting
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within SettingsProvider');
  }
  return context;
};
```

---

## ✅ Form Validation

```javascript
// utils/settingsValidation.js
export const validateSettings = (settings) => {
  const errors = {};

  // Savings rate validation
  if (settings.savingsRate !== undefined) {
    if (settings.savingsRate < 0 || settings.savingsRate > 100) {
      errors.savingsRate = 'Savings rate must be between 0 and 100';
    }
  }

  // Retirement age validation
  if (settings.retirementAge !== undefined) {
    if (settings.retirementAge < 50 || settings.retirementAge > 100) {
      errors.retirementAge = 'Retirement age must be between 50 and 100';
    }
  }

  // Debt and emergency fund validation
  if (settings.debtAmount !== undefined && settings.debtAmount < 0) {
    errors.debtAmount = 'Debt amount cannot be negative';
  }

  if (settings.emergencyFund !== undefined && settings.emergencyFund < 0) {
    errors.emergencyFund = 'Emergency fund cannot be negative';
  }

  // Dependents validation
  if (settings.dependents !== undefined && settings.dependents < 0) {
    errors.dependents = 'Number of dependents cannot be negative';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

---

## 🚨 Error Handling

```javascript
// components/ErrorBoundary.js
import React from 'react';

class SettingsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Settings error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="settings-error">
          <h2>Something went wrong with settings</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SettingsErrorBoundary;
```

---

## 🎯 Complete Usage Example

```javascript
// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import Settings from './components/Settings';
import SettingsErrorBoundary from './components/SettingsErrorBoundary';

function App() {
  return (
    <SettingsProvider>
      <Router>
        <SettingsErrorBoundary>
          <Routes>
            <Route path="/settings" element={<Settings />} />
            {/* Other routes */}
          </Routes>
        </SettingsErrorBoundary>
      </Router>
    </SettingsProvider>
  );
}

export default App;
```

---

## 🎨 CSS Styles (Optional)

```css
/* styles/settings.css */
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.unsaved-indicator {
  background: #ffeaa7;
  color: #d63031;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
}

.settings-tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 30px;
}

.tab {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.tab.active {
  border-bottom-color: #007bff;
  color: #007bff;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

button[type="submit"] {
  background: #007bff;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button[type="submit"]:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

---

## 🚀 Quick Start Checklist

1. ✅ **Install dependencies**: Ensure `fetch` API support
2. ✅ **Copy API service**: Use `settingsApi.js`
3. ✅ **Add authentication**: Include Bearer token in headers
4. ✅ **Use CORS credentials**: Add `credentials: 'include'`
5. ✅ **Handle errors gracefully**: Implement try-catch blocks
6. ✅ **Add loading states**: Show spinners during API calls
7. ✅ **Validate inputs**: Use client-side validation
8. ✅ **Auto-migrate**: Convert localStorage to database on first load

---

## 📝 API Response Examples

### GET /api/settings Response:
```json
{
  "success": true,
  "data": {
    "theme": "dark",
    "currency": "USD",
    "notifications": true,
    "budgetAlerts": true,
    "goalReminders": true,
    "financialGoals": "Emergency fund, House down payment",
    "riskTolerance": "moderate",
    "investmentExperience": "intermediate",
    "savingsRate": 25.5,
    "debtAmount": 15000,
    "emergencyFund": 10000,
    "retirementAge": 65,
    "dependents": 2,
    "housingStatus": "rent",
    "employmentStatus": "employed"
  }
}
```

### PUT /api/settings Response:
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    // Updated settings object
  }
}
```

### POST /api/settings/migrate Response:
```json
{
  "success": true,
  "message": "Successfully migrated 6 settings from localStorage",
  "data": {
    "migratedFields": ["theme", "currency", "notifications"],
    "settings": {
      // Complete settings object
    }
  }
}
```

---

## 🎯 Integration Tips

1. **Theme Integration**: Use the `theme` setting to switch CSS classes
2. **Currency Display**: Use `currency` setting for formatting numbers
3. **Notification Settings**: Check `notifications`, `budgetAlerts`, `goalReminders` before showing alerts
4. **Personalization**: Use financial profile data for personalized recommendations
5. **Auto-save**: Consider implementing auto-save for better UX

Your settings system is now ready for full frontend integration! 🚀
