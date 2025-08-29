# 🔧 Settings API Migration Function Fix

## 🚨 **Error Analysis:**
```
settingsAPI.migrateLocalStorageSettings is not a function
```

**Root Cause:** The `migrateLocalStorageSettings` function is not properly exported or imported.

---

## ✅ **Solution 1: Fixed Settings API Service**

### **Complete `settingsApi.js` file:**
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
        credentials: 'include'
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

  // GET /api/settings/currency-symbol - Get current currency symbol
  async getCurrencySymbol() {
    try {
      const response = await fetch(`${this.baseURL}/currency-symbol`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get currency symbol');
      }

      return result.data;
    } catch (error) {
      console.error('Get currency symbol error:', error);
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
const settingsAPI = new SettingsAPI();
export default settingsAPI;

// Named export for convenience
export { settingsAPI };
```

---

## ✅ **Solution 2: Fixed useSettings Hook**

### **Updated `useSettings.js`:**
```javascript
// hooks/useSettings.js
import { useState, useEffect, useCallback } from 'react';
import settingsAPI from '../services/settingsApi'; // Default import
// OR
// import { settingsAPI } from '../services/settingsApi'; // Named import

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

  // Migrate localStorage settings - FIXED VERSION
  const migrateSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if function exists
      if (typeof settingsAPI.migrateLocalStorageSettings !== 'function') {
        console.error('migrateLocalStorageSettings function not found on settingsAPI');
        throw new Error('Migration function not available');
      }

      const result = await settingsAPI.migrateLocalStorageSettings();
      if (result.settings) {
        setSettings(result.settings);
      }
      return result;
    } catch (err) {
      setError(err.message);
      console.error('⚠️ Migration failed, keeping localStorage:', err);
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

## ✅ **Solution 3: Debug Steps**

### **Step 1: Verify Import/Export**
Add this to your component to debug:
```javascript
// In your component
import settingsAPI from '../services/settingsApi';

console.log('settingsAPI object:', settingsAPI);
console.log('Available methods:', Object.getOwnPropertyNames(settingsAPI));
console.log('migrateLocalStorageSettings exists:', typeof settingsAPI.migrateLocalStorageSettings);
```

### **Step 2: Alternative Import Pattern**
If the default export doesn't work, try:
```javascript
// Instead of default import
import settingsAPI from '../services/settingsApi';

// Try named import
import { settingsAPI } from '../services/settingsApi';

// Or import the class and instantiate
import { SettingsAPI } from '../services/settingsApi';
const settingsAPI = new SettingsAPI();
```

### **Step 3: Fallback Migration Function**
Add this fallback in your hook:
```javascript
// Fallback migration function
const migrateSettingsManually = useCallback(async () => {
  try {
    // Collect localStorage data
    const localStorageData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('healthywallet-')) {
        localStorageData[key] = localStorage.getItem(key);
      }
    }

    if (Object.keys(localStorageData).length === 0) {
      return { migratedFields: [], settings: {} };
    }

    // Manual API call
    const token = localStorage.getItem('authToken');
    const response = await fetch('http://localhost:2000/api/settings/migrate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ localStorageData })
    });

    const result = await response.json();
    
    if (result.success) {
      // Clear localStorage
      Object.keys(localStorageData).forEach(key => {
        localStorage.removeItem(key);
      });
      
      if (result.data.settings) {
        setSettings(result.data.settings);
      }
      return result.data;
    }
    
    throw new Error(result.message || 'Migration failed');
  } catch (error) {
    console.error('Manual migration failed:', error);
    throw error;
  }
}, []);

// Use fallback if main function fails
const migrateSettings = useCallback(async () => {
  try {
    if (typeof settingsAPI.migrateLocalStorageSettings === 'function') {
      return await settingsAPI.migrateLocalStorageSettings();
    } else {
      console.warn('Using fallback migration');
      return await migrateSettingsManually();
    }
  } catch (error) {
    console.error('⚠️ Migration failed:', error);
    throw error;
  }
}, [migrateSettingsManually]);
```

---

## 🔧 **Quick Fix Commands**

### **1. Check your current settingsApi.js file:**
```bash
# Make sure the function is exported
grep -n "migrateLocalStorageSettings" src/services/settingsApi.js
```

### **2. Verify the export statement:**
```bash
# Check the end of your settingsApi.js file
tail -10 src/services/settingsApi.js
```

### **3. Test the API endpoint directly:**
```bash
# Test the backend endpoint
curl -X POST http://localhost:2000/api/settings/migrate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"localStorageData":{"healthywallet-theme":"dark"}}'
```

---

## 🎯 **Most Likely Fixes**

1. **Export Issue**: Make sure you have `export default settingsAPI;` at the end
2. **Import Issue**: Use `import settingsAPI from '../services/settingsApi';`
3. **Function Missing**: Copy the complete `migrateLocalStorageSettings` function
4. **Path Issue**: Verify the import path is correct

**Try the complete `settingsApi.js` code above - it should resolve the issue!** ✅
