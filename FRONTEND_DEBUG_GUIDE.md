# 🐛 Frontend API Debug Guide - HealthyWallet

## ❌ **Error Analysis**

Your error message:
```
"Making API Request: {method: 'POST', url: 'http://localhost:2000/api/auth/login', headers: {…}}
❌ API Request Error: "
```

This suggests your frontend is making the request but encountering an error. Let's debug step by step.

---

## ✅ **Backend Status: WORKING**

**✅ Backend Server:** Running on port 2000  
**✅ Health Check:** `http://localhost:2000/health` - Working  
**✅ Login Endpoint:** `http://localhost:2000/api/auth/login` - Working  
**✅ CORS:** Properly configured for `http://localhost:3000`  

---

## 🔍 **Common Frontend Issues & Solutions**

### **1. Missing `credentials: 'include'`**

❌ **Wrong:**
```javascript
fetch('http://localhost:2000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data)
});
```

✅ **Correct:**
```javascript
fetch('http://localhost:2000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // ← ADD THIS!
  body: JSON.stringify(data)
});
```

### **2. Incorrect Error Handling**

❌ **Wrong:**
```javascript
try {
  const response = await fetch(url, options);
  const data = await response.json();
  return data;
} catch (error) {
  console.log('❌ API Request Error:', error.message);
}
```

✅ **Correct:**
```javascript
try {
  const response = await fetch(url, options);
  
  // Check if response is ok
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('❌ API Request Error:', error.message);
  throw error;
}
```

### **3. Network/CORS Issues**

Check browser console for these specific errors:
- `CORS policy: No 'Access-Control-Allow-Origin' header`
- `Failed to fetch`
- `Network request failed`

---

## 🛠️ **Debug Your Frontend Code**

### **Step 1: Check Your API Function**

Replace your current API call with this tested version:

```javascript
// api.js or wherever you make API calls
const API_BASE_URL = 'http://localhost:2000';

const loginUser = async (credentials) => {
  console.log('🚀 Making login request with:', credentials);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important!
      body: JSON.stringify(credentials)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Server error:', errorData);
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Login successful:', data);
    return data;

  } catch (error) {
    console.error('❌ Login error:', error);
    
    // Check if it's a network error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Cannot connect to server. Is the backend running?');
    }
    
    throw error;
  }
};

// Usage
const handleLogin = async (email, password) => {
  try {
    const result = await loginUser({ email, password });
    // Handle success
    localStorage.setItem('authToken', result.data.token);
    // Redirect or update UI
  } catch (error) {
    // Handle error
    alert(`Login failed: ${error.message}`);
  }
};
```

### **Step 2: Test with Browser Console**

Open your browser console and test directly:

```javascript
// Paste this in browser console
fetch('http://localhost:2000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'hkkhan074@gmail.com',
    password: '@Gmail.com920'
  })
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response data:', data);
})
.catch(error => {
  console.error('Error:', error);
});
```

### **Step 3: Check Network Tab**

1. Open **Developer Tools** (F12)
2. Go to **Network** tab
3. Try your login
4. Look for the login request
5. Check:
   - **Status Code** (should be 200)
   - **Response Headers** (should include CORS headers)
   - **Response Body** (should be JSON with success: true)

---

## 🔧 **Common Frontend Fixes**

### **Fix 1: Update Your API Configuration**

```javascript
// api.js
const API_CONFIG = {
  baseURL: 'http://localhost:2000',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
};

const apiCall = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  const config = {
    ...API_CONFIG,
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...options.headers
    }
  };

  console.log('🚀 Making API Request:', { method: config.method, url, headers: config.headers });

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API Response:', data);
    return data;

  } catch (error) {
    console.error('❌ API Request Error:', error.message);
    throw error;
  }
};

// Login function
export const login = (credentials) => {
  return apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
};
```

### **Fix 2: React Hook Example**

```javascript
import { useState } from 'react';

const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:2000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const data = await response.json();
      
      // Store token
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      return data;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};

// In your component
const LoginForm = () => {
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await login(formData.email, formData.password);
      // Success - redirect or update UI
      console.log('Login successful!');
    } catch (error) {
      // Error is already set in the hook
      console.error('Login failed:', error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div style={{color: 'red'}}>Error: {error}</div>}
    </form>
  );
};
```

---

## 🚨 **Emergency Test**

If nothing works, try this minimal test in a new HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>API Test</title>
</head>
<body>
    <h1>HealthyWallet API Test</h1>
    <button onclick="testLogin()">Test Login</button>
    <div id="result"></div>

    <script>
        async function testLogin() {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = 'Testing...';

            try {
                const response = await fetch('http://localhost:2000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        email: 'hkkhan074@gmail.com',
                        password: '@Gmail.com920'
                    })
                });

                console.log('Response:', response);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message);
                }

                const data = await response.json();
                resultDiv.innerHTML = `<pre>SUCCESS: ${JSON.stringify(data, null, 2)}</pre>`;

            } catch (error) {
                resultDiv.innerHTML = `<pre style="color: red;">ERROR: ${error.message}</pre>`;
                console.error('Error:', error);
            }
        }
    </script>
</body>
</html>
```

---

## 📋 **Debugging Checklist**

- [ ] **Backend running?** Check `http://localhost:2000/health`
- [ ] **Frontend on port 3000?** CORS is configured for this port
- [ ] **`credentials: 'include'` added?** Required for CORS
- [ ] **Content-Type header correct?** Must be `application/json`
- [ ] **Request body is valid JSON?** Use `JSON.stringify()`
- [ ] **Error handling correct?** Check `response.ok` before parsing
- [ ] **Network tab shows request?** Check browser dev tools
- [ ] **Console shows any CORS errors?** Look for red error messages

---

## 🎯 **Most Likely Fix**

Based on your error, the most common issue is **missing `credentials: 'include'`**. Add this to your fetch request:

```javascript
// Add this line to your fetch request
credentials: 'include'
```

**Your backend is working perfectly. The issue is in the frontend API call configuration! 🚀**
