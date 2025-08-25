# 💰 HealthyWallet Income API - Complete Guide

## Database to Frontend Data Flow for Income Management

### Base URL
```
http://localhost:2000
```

---

## 📊 **Income Data Structure**

### **Database Schema (MongoDB)**
```javascript
// Income Model Structure
{
  _id: ObjectId("..."),           // Auto-generated MongoDB ID
  user: ObjectId("..."),          // Reference to User document
  amount: Number,                 // Income amount (required, min: 0.01)
  source: String,                 // Income source name (required)
  category: String,               // Income category (enum)
  date: Date,                     // Income date (default: current date)
  description: String,            // Optional description
  isRecurring: Boolean,           // Whether it's recurring (default: false)
  recurringFrequency: String,     // Frequency if recurring (monthly, weekly, etc.)
  tags: [String],                 // Optional tags array
  createdAt: Date,               // Auto-generated timestamp
  updatedAt: Date                // Auto-generated timestamp
}
```

### **Income Categories (Enum Values)**
```javascript
const INCOME_CATEGORIES = [
  'salary',           // Regular salary/wages
  'freelance',        // Freelance work
  'business',         // Business income
  'investment',       // Investment returns
  'rental',          // Rental income
  'bonus',           // Bonuses/commissions
  'gift',            // Gifts received
  'refund',          // Refunds
  'other'            // Other sources
];
```

### **Recurring Frequency Options**
```javascript
const RECURRING_FREQUENCIES = [
  'weekly',          // Every week
  'bi-weekly',       // Every 2 weeks
  'monthly',         // Every month
  'quarterly',       // Every 3 months
  'yearly'           // Every year
];
```

---

## 📝 **1. CREATE Income Entry**

### **Endpoint**
```
POST /api/income
```

### **Authentication Required**
```javascript
Headers: {
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

### **Request Data Types**
```typescript
interface CreateIncomeRequest {
  amount: number;              // Required: Positive number (min: 0.01)
  source: string;             // Required: Income source name
  category: string;           // Required: One of the enum values
  date?: string;              // Optional: ISO date string (default: now)
  description?: string;       // Optional: Additional details
  isRecurring?: boolean;      // Optional: Default false
  recurringFrequency?: string; // Optional: Required if isRecurring is true
  tags?: string[];            // Optional: Array of tags
}
```

### **Frontend Example (JavaScript/React)**
```javascript
const createIncome = async (incomeData) => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch('http://localhost:2000/api/income', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(incomeData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    const result = await response.json();
    console.log('✅ Income created:', result);
    return result;

  } catch (error) {
    console.error('❌ Create income error:', error);
    throw error;
  }
};

// Usage Example
const newIncomeData = {
  amount: 5000.00,
  source: "Software Developer Salary",
  category: "salary",
  date: "2025-08-25T00:00:00.000Z",
  description: "Monthly salary from Tech Company",
  isRecurring: true,
  recurringFrequency: "monthly",
  tags: ["primary-job", "tech", "full-time"]
};

createIncome(newIncomeData)
  .then(response => {
    // Handle success
    console.log('Income created successfully!');
  })
  .catch(error => {
    // Handle error
    alert(`Failed to create income: ${error.message}`);
  });
```

### **cURL Request Example**
```bash
curl -X POST http://localhost:2000/api/income \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "amount": 5000.00,
    "source": "Software Developer Salary",
    "category": "salary",
    "date": "2025-08-25T00:00:00.000Z",
    "description": "Monthly salary from Tech Company",
    "isRecurring": true,
    "recurringFrequency": "monthly",
    "tags": ["primary-job", "tech", "full-time"]
  }'
```

### **Success Response (201 Created)**
```json
{
  "success": true,
  "message": "Income entry created successfully",
  "data": {
    "income": {
      "_id": "68ac91e278ba5b74fc2bd961",
      "user": "68ac91e278ba5b74fc2bd960",
      "amount": 5000,
      "source": "Software Developer Salary",
      "category": "salary",
      "date": "2025-08-25T00:00:00.000Z",
      "description": "Monthly salary from Tech Company",
      "isRecurring": true,
      "recurringFrequency": "monthly",
      "tags": ["primary-job", "tech", "full-time"],
      "createdAt": "2025-08-25T16:58:43.546Z",
      "updatedAt": "2025-08-25T16:58:43.546Z"
    }
  }
}
```

### **Database Storage (MongoDB Document)**
```javascript
// How it's actually stored in MongoDB
{
  _id: ObjectId("68ac91e278ba5b74fc2bd961"),
  user: ObjectId("68ac91e278ba5b74fc2bd960"),
  amount: 5000,
  source: "Software Developer Salary",
  category: "salary",
  date: ISODate("2025-08-25T00:00:00.000Z"),
  description: "Monthly salary from Tech Company",
  isRecurring: true,
  recurringFrequency: "monthly",
  tags: ["primary-job", "tech", "full-time"],
  createdAt: ISODate("2025-08-25T16:58:43.546Z"),
  updatedAt: ISODate("2025-08-25T16:58:43.546Z"),
  __v: 0
}
```

### **Validation Error Response (400 Bad Request)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "amount",
      "message": "Amount must be a positive number"
    },
    {
      "field": "category",
      "message": "Category must be one of: salary, freelance, business, investment, rental, bonus, gift, refund, other"
    }
  ]
}
```

---

## 📋 **2. GET All Income Entries**

### **Endpoint**
```
GET /api/income
```

### **Query Parameters**
```typescript
interface GetIncomeQuery {
  page?: number;           // Page number (default: 1)
  limit?: number;          // Items per page (default: 10, max: 100)
  category?: string;       // Filter by category
  startDate?: string;      // Filter from date (ISO string)
  endDate?: string;        // Filter to date (ISO string)
  isRecurring?: boolean;   // Filter by recurring status
  sort?: string;          // Sort field (default: -date)
  search?: string;        // Search in source/description
}
```

### **Frontend Example**
```javascript
const getIncomeEntries = async (filters = {}) => {
  const token = localStorage.getItem('authToken');
  
  // Build query string
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  
  const queryString = queryParams.toString();
  const url = `http://localhost:2000/api/income${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('❌ Get income entries error:', error);
    throw error;
  }
};

// Usage Examples
// Get all income entries
const allIncome = await getIncomeEntries();

// Get salary income only
const salaryIncome = await getIncomeEntries({ category: 'salary' });

// Get income for current month
const currentMonth = await getIncomeEntries({
  startDate: '2025-08-01T00:00:00.000Z',
  endDate: '2025-08-31T23:59:59.999Z'
});

// Get paginated results
const paginatedIncome = await getIncomeEntries({
  page: 2,
  limit: 20,
  sort: '-amount'
});
```

### **cURL Request Examples**
```bash
# Get all income entries
curl -X GET "http://localhost:2000/api/income" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get salary income only
curl -X GET "http://localhost:2000/api/income?category=salary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get income with date range and pagination
curl -X GET "http://localhost:2000/api/income?startDate=2025-08-01&endDate=2025-08-31&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "income": [
      {
        "_id": "68ac91e278ba5b74fc2bd961",
        "user": "68ac91e278ba5b74fc2bd960",
        "amount": 5000,
        "source": "Software Developer Salary",
        "category": "salary",
        "date": "2025-08-25T00:00:00.000Z",
        "description": "Monthly salary from Tech Company",
        "isRecurring": true,
        "recurringFrequency": "monthly",
        "tags": ["primary-job", "tech", "full-time"],
        "createdAt": "2025-08-25T16:58:43.546Z",
        "updatedAt": "2025-08-25T16:58:43.546Z"
      },
      {
        "_id": "68ac91e278ba5b74fc2bd962",
        "user": "68ac91e278ba5b74fc2bd960",
        "amount": 1500,
        "source": "Freelance Web Development",
        "category": "freelance",
        "date": "2025-08-20T00:00:00.000Z",
        "description": "Client project completion",
        "isRecurring": false,
        "tags": ["freelance", "web-dev"],
        "createdAt": "2025-08-20T10:30:15.123Z",
        "updatedAt": "2025-08-20T10:30:15.123Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 2,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "summary": {
      "totalIncome": 6500,
      "averageIncome": 3250,
      "recurringIncome": 5000,
      "oneTimeIncome": 1500
    }
  }
}
```

---

## 🎯 **3. GET Specific Income Entry**

### **Endpoint**
```
GET /api/income/:id
```

### **Frontend Example**
```javascript
const getIncomeById = async (incomeId) => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`http://localhost:2000/api/income/${incomeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('❌ Get income by ID error:', error);
    throw error;
  }
};
```

### **cURL Request**
```bash
curl -X GET "http://localhost:2000/api/income/68ac91e278ba5b74fc2bd961" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "income": {
      "_id": "68ac91e278ba5b74fc2bd961",
      "user": "68ac91e278ba5b74fc2bd960",
      "amount": 5000,
      "source": "Software Developer Salary",
      "category": "salary",
      "date": "2025-08-25T00:00:00.000Z",
      "description": "Monthly salary from Tech Company",
      "isRecurring": true,
      "recurringFrequency": "monthly",
      "tags": ["primary-job", "tech", "full-time"],
      "createdAt": "2025-08-25T16:58:43.546Z",
      "updatedAt": "2025-08-25T16:58:43.546Z"
    }
  }
}
```

---

## ✏️ **4. UPDATE Income Entry**

### **Endpoint**
```
PUT /api/income/:id
```

### **Request Data Types**
```typescript
interface UpdateIncomeRequest {
  amount?: number;             // Optional: Positive number
  source?: string;            // Optional: Income source name
  category?: string;          // Optional: One of the enum values
  date?: string;              // Optional: ISO date string
  description?: string;       // Optional: Additional details
  isRecurring?: boolean;      // Optional: Recurring status
  recurringFrequency?: string; // Optional: Frequency
  tags?: string[];            // Optional: Array of tags
}
```

### **Frontend Example**
```javascript
const updateIncome = async (incomeId, updateData) => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`http://localhost:2000/api/income/${incomeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('❌ Update income error:', error);
    throw error;
  }
};

// Usage
const updateData = {
  amount: 5500,
  description: "Monthly salary with raise from Tech Company"
};

updateIncome('68ac91e278ba5b74fc2bd961', updateData);
```

### **cURL Request**
```bash
curl -X PUT "http://localhost:2000/api/income/68ac91e278ba5b74fc2bd961" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 5500,
    "description": "Monthly salary with raise from Tech Company"
  }'
```

### **Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Income entry updated successfully",
  "data": {
    "income": {
      "_id": "68ac91e278ba5b74fc2bd961",
      "user": "68ac91e278ba5b74fc2bd960",
      "amount": 5500,
      "source": "Software Developer Salary",
      "category": "salary",
      "date": "2025-08-25T00:00:00.000Z",
      "description": "Monthly salary with raise from Tech Company",
      "isRecurring": true,
      "recurringFrequency": "monthly",
      "tags": ["primary-job", "tech", "full-time"],
      "createdAt": "2025-08-25T16:58:43.546Z",
      "updatedAt": "2025-08-25T17:15:22.789Z"
    }
  }
}
```

---

## 🗑️ **5. DELETE Income Entry**

### **Endpoint**
```
DELETE /api/income/:id
```

### **Frontend Example**
```javascript
const deleteIncome = async (incomeId) => {
  const token = localStorage.getItem('authToken');
  
  if (!confirm('Are you sure you want to delete this income entry?')) {
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:2000/api/income/${incomeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('❌ Delete income error:', error);
    throw error;
  }
};
```

### **cURL Request**
```bash
curl -X DELETE "http://localhost:2000/api/income/68ac91e278ba5b74fc2bd961" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Income entry deleted successfully",
  "data": {
    "deletedIncomeId": "68ac91e278ba5b74fc2bd961"
  }
}
```

---

## 📊 **6. GET Income Summary**

### **Endpoint**
```
GET /api/income/summary
```

### **Query Parameters**
```typescript
interface IncomeSummaryQuery {
  startDate?: string;    // Filter from date
  endDate?: string;      // Filter to date
  period?: string;       // 'month', 'year', 'week'
}
```

### **Frontend Example**
```javascript
const getIncomeSummary = async (period = 'month') => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`http://localhost:2000/api/income/summary?period=${period}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('❌ Get income summary error:', error);
    throw error;
  }
};
```

### **Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": 6500,
      "averageIncome": 3250,
      "recurringIncome": 5000,
      "oneTimeIncome": 1500,
      "incomeCount": 2,
      "period": "month",
      "byCategory": [
        {
          "_id": "salary",
          "totalAmount": 5000,
          "count": 1,
          "percentage": 76.92
        },
        {
          "_id": "freelance",
          "totalAmount": 1500,
          "count": 1,
          "percentage": 23.08
        }
      ],
      "growthRate": 15.5,
      "projectedMonthlyIncome": 6500
    }
  }
}
```

---

## 📈 **7. GET Income by Category**

### **Endpoint**
```
GET /api/income/by-category
```

### **Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "incomeByCategory": [
      {
        "_id": "salary",
        "totalAmount": 5000,
        "count": 1,
        "avgAmount": 5000,
        "lastEntry": "2025-08-25T00:00:00.000Z",
        "percentage": 76.92
      },
      {
        "_id": "freelance",
        "totalAmount": 1500,
        "count": 1,
        "avgAmount": 1500,
        "lastEntry": "2025-08-20T00:00:00.000Z",
        "percentage": 23.08
      }
    ],
    "totalIncome": 6500
  }
}
```

---

## 🔄 **8. GET Recurring Income**

### **Endpoint**
```
GET /api/income/recurring
```

### **Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "recurringIncome": [
      {
        "_id": "68ac91e278ba5b74fc2bd961",
        "amount": 5000,
        "source": "Software Developer Salary",
        "category": "salary",
        "recurringFrequency": "monthly",
        "nextDueDate": "2025-09-25T00:00:00.000Z",
        "totalEarned": 5000,
        "description": "Monthly salary from Tech Company"
      }
    ],
    "summary": {
      "totalRecurringIncome": 5000,
      "monthlyProjection": 5000,
      "yearlyProjection": 60000,
      "activeRecurringCount": 1
    }
  }
}
```

---

## 🎯 **Complete React Income Management Component**

```javascript
import React, { useState, useEffect } from 'react';

const IncomeManager = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    category: 'salary',
    description: '',
    isRecurring: false,
    recurringFrequency: ''
  });

  const API_BASE = 'http://localhost:2000';
  const token = localStorage.getItem('authToken');

  // API Helper
  const apiCall = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    return response.json();
  };

  // Load income entries
  const loadIncomes = async () => {
    setLoading(true);
    try {
      const result = await apiCall('/api/income');
      setIncomes(result.data.income);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create income
  const createIncome = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const incomeData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      
      const result = await apiCall('/api/income', {
        method: 'POST',
        body: JSON.stringify(incomeData)
      });

      setIncomes([result.data.income, ...incomes]);
      setFormData({
        amount: '',
        source: '',
        category: 'salary',
        description: '',
        isRecurring: false,
        recurringFrequency: ''
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete income
  const deleteIncome = async (incomeId) => {
    if (!window.confirm('Delete this income entry?')) return;
    
    try {
      await apiCall(`/api/income/${incomeId}`, { method: 'DELETE' });
      setIncomes(incomes.filter(income => income._id !== incomeId));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadIncomes();
  }, []);

  return (
    <div className="income-manager">
      <h2>Income Management</h2>
      
      {error && <div className="error">Error: {error}</div>}
      
      {/* Add Income Form */}
      <form onSubmit={createIncome}>
        <h3>Add New Income</h3>
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={formData.amount}
          onChange={(e) => setFormData({...formData, amount: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Source"
          value={formData.source}
          onChange={(e) => setFormData({...formData, source: e.target.value})}
          required
        />
        <select
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
        >
          <option value="salary">Salary</option>
          <option value="freelance">Freelance</option>
          <option value="business">Business</option>
          <option value="investment">Investment</option>
          <option value="rental">Rental</option>
          <option value="bonus">Bonus</option>
          <option value="gift">Gift</option>
          <option value="refund">Refund</option>
          <option value="other">Other</option>
        </select>
        <textarea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
        <label>
          <input
            type="checkbox"
            checked={formData.isRecurring}
            onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
          />
          Recurring Income
        </label>
        {formData.isRecurring && (
          <select
            value={formData.recurringFrequency}
            onChange={(e) => setFormData({...formData, recurringFrequency: e.target.value})}
            required
          >
            <option value="">Select Frequency</option>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        )}
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Income'}
        </button>
      </form>

      {/* Income List */}
      <div className="income-list">
        <h3>Your Income Entries</h3>
        {loading ? (
          <p>Loading...</p>
        ) : incomes.length === 0 ? (
          <p>No income entries found.</p>
        ) : (
          incomes.map(income => (
            <div key={income._id} className="income-item">
              <h4>${income.amount.toFixed(2)} - {income.source}</h4>
              <p>Category: {income.category}</p>
              <p>Date: {new Date(income.date).toLocaleDateString()}</p>
              {income.description && <p>Description: {income.description}</p>}
              {income.isRecurring && (
                <p>Recurring: {income.recurringFrequency}</p>
              )}
              <button onClick={() => deleteIncome(income._id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IncomeManager;
```

---

## 🔄 **Data Flow Summary**

### **1. Frontend → Backend → Database (CREATE)**
1. **Frontend** collects income data from form
2. **Frontend** sends POST request with JWT token
3. **Backend** validates JWT token (auth middleware)
4. **Backend** validates income data (Joi validation)
5. **Backend** creates income document in MongoDB
6. **Database** stores document with auto-generated fields
7. **Backend** returns created income with all fields
8. **Frontend** updates UI with new income entry

### **2. Database → Backend → Frontend (READ)**
1. **Frontend** requests income data with filters
2. **Backend** validates JWT token
3. **Backend** queries MongoDB with user filter
4. **Database** returns matching documents
5. **Backend** processes data (pagination, summary calculations)
6. **Backend** returns formatted response
7. **Frontend** displays income data in UI

### **3. Database Storage Optimization**
```javascript
// MongoDB indexes for better performance
db.incomes.createIndex({ user: 1, date: -1 })        // User income by date
db.incomes.createIndex({ user: 1, category: 1 })     // User income by category
db.incomes.createIndex({ user: 1, isRecurring: 1 })  // User recurring income
```

**Your HealthyWallet income API is production-ready with complete CRUD operations, validation, and optimized database storage! 🚀**
