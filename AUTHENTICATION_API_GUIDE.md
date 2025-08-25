# 🔐 HealthyWallet Authentication API Guide

## Frontend to Backend Data Flow Documentation

### Base URL
```
http://localhost:2000
```

---

## 📝 **User Registration**

### **Endpoint**
```
POST /api/auth/register
```

### **Request Headers**
```javascript
{
  "Content-Type": "application/json",
  "Origin": "http://localhost:3000" // For CORS
}
```

### **Request Body Data Types**
```typescript
interface RegisterRequest {
  name: string;        // Required: Full name (min 2 chars)
  email: string;       // Required: Valid email format
  password: string;    // Required: Min 6 characters
}
```

### **Frontend Example (JavaScript/React)**
```javascript
const registerUser = async (userData) => {
  try {
    const response = await fetch('http://localhost:2000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for CORS
      body: JSON.stringify({
        name: userData.name,      // string
        email: userData.email,    // string
        password: userData.password // string
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      // Store token in localStorage or state management
      localStorage.setItem('authToken', result.data.token);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

// Usage
const newUser = {
  name: "Hafiz Khan",
  email: "hkkhan074@gmail.com", 
  password: "@Gmail.com920"
};

registerUser(newUser)
  .then(response => console.log('User registered:', response))
  .catch(error => console.error('Error:', error));
```

### **cURL Request Example**
```bash
curl -X POST http://localhost:2000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "name": "Hafiz Khan",
    "email": "hkkhan074@gmail.com",
    "password": "@Gmail.com920"
  }'
```

### **Success Response (201 Created)**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "68ac91e278ba5b74fc2bd960",
      "name": "Hafiz Khan",
      "email": "hkkhan074@gmail.com",
      "createdAt": "2025-08-25T16:40:02.999Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YWM5MWUyNzhiYTViNzRmYzJiZDk2MCIsImlhdCI6MTc1NjE0MDAwMywiZXhwIjoxNzU2MjI2NDAzfQ.G-MYGtXwCGOvdmFK6nAvyPeO7mvfo1QY7Rxe9Ygeogw"
  }
}
```

### **Error Response (400 Bad Request)**
```json
{
  "success": false,
  "message": "User already exists with this email"
}
```

### **Validation Error Response (400 Bad Request)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email"
    },
    {
      "field": "password", 
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

---

## 🔑 **User Login**

### **Endpoint**
```
POST /api/auth/login
```

### **Request Headers**
```javascript
{
  "Content-Type": "application/json",
  "Origin": "http://localhost:3000" // For CORS
}
```

### **Request Body Data Types**
```typescript
interface LoginRequest {
  email: string;       // Required: Valid email format
  password: string;    // Required: User's password
}
```

### **Frontend Example (JavaScript/React)**
```javascript
const loginUser = async (credentials) => {
  try {
    const response = await fetch('http://localhost:2000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for CORS and cookies
      body: JSON.stringify({
        email: credentials.email,       // string
        password: credentials.password  // string
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      // Store token for future requests
      localStorage.setItem('authToken', result.data.token);
      // Store user data
      localStorage.setItem('userData', JSON.stringify(result.data.user));
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// Usage
const loginCredentials = {
  email: "hkkhan074@gmail.com",
  password: "@Gmail.com920"
};

loginUser(loginCredentials)
  .then(response => {
    console.log('Login successful:', response);
    // Redirect to dashboard or update UI state
  })
  .catch(error => {
    console.error('Login error:', error);
    // Show error message to user
  });
```

### **cURL Request Example**
```bash
curl -X POST http://localhost:2000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "email": "hkkhan074@gmail.com",
    "password": "@Gmail.com920"
  }'
```

### **Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "68ac91e278ba5b74fc2bd960",
      "name": "Hafiz Khan",
      "email": "hkkhan074@gmail.com",
      "lastLogin": "2025-08-25T16:40:15.040Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YWM5MWUyNzhiYTViNzRmYzJiZDk2MCIsImlhdCI6MTc1NjE0MDAxNSwiZXhwIjoxNzU2MjI2NDE1fQ.tDsdeaUUVD-yGwWuprUHHIuEU_lXattC6mMuaU4zfMY"
  }
}
```

### **Error Response (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### **Validation Error Response (400 Bad Request)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password is required"
    }
  ]
}
```

---

## 🛡️ **Using Authentication Token**

### **Making Authenticated Requests**

After successful login, use the JWT token for protected endpoints:

```javascript
const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`http://localhost:2000${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // JWT token
      ...options.headers
    },
    credentials: 'include'
  });

  return response.json();
};

// Example: Get user profile
const getUserProfile = async () => {
  try {
    const profile = await makeAuthenticatedRequest('/api/users/profile');
    console.log('User profile:', profile);
  } catch (error) {
    console.error('Failed to get profile:', error);
  }
};
```

### **cURL with Authentication**
```bash
# Get user profile (protected endpoint)
curl -X GET http://localhost:2000/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

---

## 📊 **Complete React Authentication Hook Example**

```javascript
import { useState, useEffect, createContext, useContext } from 'react';

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:2000';

  // Register function
  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (response.ok) {
        setToken(result.data.token);
        setUser(result.data.user);
        localStorage.setItem('authToken', result.data.token);
        localStorage.setItem('userData', JSON.stringify(result.data.user));
        return { success: true, data: result };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      const result = await response.json();

      if (response.ok) {
        setToken(result.data.token);
        setUser(result.data.user);
        localStorage.setItem('authToken', result.data.token);
        localStorage.setItem('userData', JSON.stringify(result.data.user));
        return { success: true, data: result };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers
      },
      credentials: 'include'
    });

    const result = await response.json();

    if (response.status === 401) {
      logout(); // Token expired or invalid
      throw new Error('Authentication required');
    }

    return result;
  };

  // Load user on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, [token]);

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    apiCall,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Usage in components
const LoginForm = () => {
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    
    if (result.success) {
      // Redirect to dashboard
      console.log('Login successful!');
    } else {
      // Show error message
      console.error('Login failed:', result.error);
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
    </form>
  );
};
```

---

## 🔄 **Data Flow Summary**

### **Registration Flow**
1. **Frontend** → Collects user data (name, email, password)
2. **Frontend** → Validates data locally (optional)
3. **Frontend** → Sends POST request to `/api/auth/register`
4. **Backend** → Validates data with Joi schemas
5. **Backend** → Checks if email already exists
6. **Backend** → Hashes password with bcrypt
7. **Backend** → Creates user in MongoDB
8. **Backend** → Generates JWT token
9. **Backend** → Returns user data + token
10. **Frontend** → Stores token and user data
11. **Frontend** → Redirects to dashboard

### **Login Flow**
1. **Frontend** → Collects credentials (email, password)
2. **Frontend** → Sends POST request to `/api/auth/login`
3. **Backend** → Validates input with Joi schemas
4. **Backend** → Finds user by email
5. **Backend** → Compares password with bcrypt
6. **Backend** → Updates lastLogin timestamp
7. **Backend** → Generates new JWT token
8. **Backend** → Returns user data + token
9. **Frontend** → Stores token and user data
10. **Frontend** → Redirects to dashboard

---

## 🚨 **Error Handling Best Practices**

```javascript
const handleApiError = (error, response) => {
  // Network errors
  if (!response) {
    return 'Network error. Please check your connection.';
  }

  // Server errors
  switch (response.status) {
    case 400:
      return error.message || 'Invalid request data';
    case 401:
      return 'Invalid credentials';
    case 409:
      return 'User already exists with this email';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return 'An unexpected error occurred';
  }
};
```

---

## ✅ **Testing Your Implementation**

### **Test Registration**
```bash
curl -X POST http://localhost:2000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### **Test Login**
```bash
curl -X POST http://localhost:2000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### **Test Protected Endpoint**
```bash
curl -X GET http://localhost:2000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 🎯 **Key Points to Remember**

1. **Always include `credentials: 'include'`** in fetch requests for CORS
2. **Store JWT tokens securely** (consider httpOnly cookies for production)
3. **Handle token expiration** by checking 401 responses
4. **Validate data on both frontend and backend**
5. **Use HTTPS in production** for secure token transmission
6. **Implement proper error handling** for better UX
7. **Clear tokens on logout** to prevent unauthorized access

**Your HealthyWallet backend is ready for seamless frontend integration! 🚀**
