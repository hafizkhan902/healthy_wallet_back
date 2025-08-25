# 🎯 HealthyWallet Goals API - Complete Guide

## 📋 **All Goal Management Endpoints**

Your HealthyWallet backend provides comprehensive goal management with advanced calculations and progress tracking.

---

## 🎯 **Goal Endpoints Overview**

| Method | Endpoint | Purpose | Calculations |
|--------|----------|---------|--------------|
| **GET** | `/api/goals` | Get all user goals | Progress %, remaining amount |
| **POST** | `/api/goals` | Create new goal | Initial setup |
| **GET** | `/api/goals/:id` | Get specific goal | Progress %, days remaining |
| **PUT** | `/api/goals/:id` | Update goal | Recalculate progress |
| **DELETE** | `/api/goals/:id` | Delete goal | - |
| **POST** | `/api/goals/:id/contribute` | Add contribution | Update progress, check completion |
| **PUT** | `/api/goals/:id/status` | Update goal status | Status change tracking |
| **GET** | `/api/goals/summary` | Goals summary | Overall progress, totals by status |
| **GET** | `/api/goals/by-category` | Goals by category | Category breakdown with totals |

---

## 📝 **1. CREATE Goal**

### **Endpoint**
```
POST /api/goals
```

### **Request Data Types**
```typescript
interface CreateGoalRequest {
  title: string;              // Required: Goal title
  description?: string;       // Optional: Goal description
  targetAmount: number;       // Required: Target amount to reach
  currentAmount?: number;     // Optional: Starting amount (default: 0)
  targetDate: string;         // Required: Target completion date (ISO)
  category: string;           // Required: Goal category
  priority?: string;          // Optional: low/medium/high (default: medium)
  isRecurring?: boolean;      // Optional: Is this a recurring goal
}
```

### **Goal Categories**
```javascript
const GOAL_CATEGORIES = [
  'emergency-fund',    // Emergency fund
  'vacation',         // Vacation savings
  'house',           // House/property
  'car',             // Vehicle purchase
  'education',       // Education/courses
  'investment',      // Investment goals
  'debt-payoff',     // Debt repayment
  'retirement',      // Retirement savings
  'other'           // Other goals
];
```

### **Frontend Example**
```javascript
const createGoal = async (goalData) => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch('http://localhost:2000/api/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(goalData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Create goal error:', error);
    throw error;
  }
};

// Usage
const newGoal = {
  title: "Emergency Fund",
  description: "Build 6-month emergency fund",
  targetAmount: 15000,
  currentAmount: 2500,
  targetDate: "2025-12-31T23:59:59.999Z",
  category: "emergency-fund",
  priority: "high"
};

createGoal(newGoal);
```

### **cURL Example**
```bash
curl -X POST http://localhost:2000/api/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Emergency Fund",
    "description": "Build 6-month emergency fund",
    "targetAmount": 15000,
    "currentAmount": 2500,
    "targetDate": "2025-12-31T23:59:59.999Z",
    "category": "emergency-fund",
    "priority": "high"
  }'
```

### **Success Response (201 Created)**
```json
{
  "success": true,
  "message": "Goal created successfully",
  "data": {
    "goal": {
      "_id": "68aca7c24300fdb284847775",
      "user": "68ac91e278ba5b74fc2bd960",
      "title": "Emergency Fund",
      "description": "Build 6-month emergency fund",
      "targetAmount": 15000,
      "currentAmount": 2500,
      "targetDate": "2025-12-31T23:59:59.999Z",
      "category": "emergency-fund",
      "priority": "high",
      "status": "active",
      "progressPercentage": 16.67,
      "remainingAmount": 12500,
      "daysRemaining": 128,
      "contributions": [],
      "milestones": [],
      "createdAt": "2025-08-25T18:30:00.000Z",
      "updatedAt": "2025-08-25T18:30:00.000Z"
    }
  }
}
```

---

## 📋 **2. GET All Goals**

### **Endpoint**
```
GET /api/goals
```

### **Query Parameters**
```typescript
interface GetGoalsQuery {
  page?: number;        // Page number (default: 1)
  limit?: number;       // Items per page (default: 10)
  category?: string;    // Filter by category
  status?: string;      // Filter by status (active/completed/paused/cancelled)
  priority?: string;    // Filter by priority (low/medium/high)
  sort?: string;        // Sort field (default: -createdAt)
}
```

### **Frontend Example**
```javascript
const getGoals = async (filters = {}) => {
  const token = localStorage.getItem('authToken');
  
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  
  const queryString = queryParams.toString();
  const url = `http://localhost:2000/api/goals${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get goals error:', error);
    throw error;
  }
};

// Usage examples
const allGoals = await getGoals();
const activeGoals = await getGoals({ status: 'active' });
const emergencyFunds = await getGoals({ category: 'emergency-fund' });
```

### **Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "_id": "68aca7c24300fdb284847775",
        "title": "Emergency Fund",
        "targetAmount": 15000,
        "currentAmount": 2500,
        "progressPercentage": 16.67,
        "remainingAmount": 12500,
        "daysRemaining": 128,
        "category": "emergency-fund",
        "status": "active",
        "priority": "high",
        "targetDate": "2025-12-31T23:59:59.999Z",
        "createdAt": "2025-08-25T18:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

## 💰 **3. ADD Contribution to Goal**

### **Endpoint**
```
POST /api/goals/:id/contribute
```

### **Request Data**
```typescript
interface ContributionRequest {
  amount: number;         // Required: Contribution amount (positive)
  description?: string;   // Optional: Contribution note
  date?: string;         // Optional: Contribution date (default: now)
}
```

### **Frontend Example**
```javascript
const addContribution = async (goalId, contributionData) => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`http://localhost:2000/api/goals/${goalId}/contribute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(contributionData)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Add contribution error:', error);
    throw error;
  }
};

// Usage
const contribution = {
  amount: 500,
  description: "Monthly emergency fund contribution",
  date: "2025-08-25T00:00:00.000Z"
};

addContribution('68aca7c24300fdb284847775', contribution);
```

### **cURL Example**
```bash
curl -X POST http://localhost:2000/api/goals/68aca7c24300fdb284847775/contribute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 500,
    "description": "Monthly emergency fund contribution"
  }'
```

### **Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Contribution added successfully",
  "data": {
    "goal": {
      "_id": "68aca7c24300fdb284847775",
      "title": "Emergency Fund",
      "targetAmount": 15000,
      "currentAmount": 3000,
      "progressPercentage": 20.00,
      "remainingAmount": 12000,
      "status": "active",
      "contributions": [
        {
          "amount": 500,
          "description": "Monthly emergency fund contribution",
          "date": "2025-08-25T18:35:00.000Z",
          "_id": "68aca8f04300fdb284847776"
        }
      ]
    },
    "contribution": {
      "amount": 500,
      "description": "Monthly emergency fund contribution",
      "date": "2025-08-25T18:35:00.000Z",
      "_id": "68aca8f04300fdb284847776"
    }
  }
}
```

---

## 📊 **4. GET Goals Summary**

### **Endpoint**
```
GET /api/goals/summary
```

### **Frontend Example**
```javascript
const getGoalsSummary = async () => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch('http://localhost:2000/api/goals/summary', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get goals summary error:', error);
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
      "totalGoals": 3,
      "totalTargetAmount": 35000,
      "totalCurrentAmount": 8500,
      "overallProgress": 24.29,
      "byStatus": [
        {
          "_id": "active",
          "count": 2,
          "totalTargetAmount": 25000,
          "totalCurrentAmount": 6000,
          "avgProgress": 24.0
        },
        {
          "_id": "completed",
          "count": 1,
          "totalTargetAmount": 10000,
          "totalCurrentAmount": 10000,
          "avgProgress": 100.0
        }
      ],
      "byCategory": [
        {
          "_id": "emergency-fund",
          "count": 1,
          "totalTargetAmount": 15000,
          "totalCurrentAmount": 3000,
          "avgProgress": 20.0
        },
        {
          "_id": "vacation",
          "count": 1,
          "totalTargetAmount": 5000,
          "totalCurrentAmount": 2000,
          "avgProgress": 40.0
        }
      ]
    }
  }
}
```

---

## 📈 **5. GET Goals by Category**

### **Endpoint**
```
GET /api/goals/by-category
```

### **Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "goalsByCategory": [
      {
        "_id": "emergency-fund",
        "goals": [
          {
            "_id": "68aca7c24300fdb284847775",
            "title": "Emergency Fund",
            "targetAmount": 15000,
            "currentAmount": 3000,
            "progressPercentage": 20.00,
            "status": "active"
          }
        ],
        "totalTargetAmount": 15000,
        "totalCurrentAmount": 3000,
        "count": 1,
        "avgProgress": 20.0
      },
      {
        "_id": "vacation",
        "goals": [
          {
            "_id": "68aca7c24300fdb284847776",
            "title": "Europe Trip",
            "targetAmount": 5000,
            "currentAmount": 2000,
            "progressPercentage": 40.00,
            "status": "active"
          }
        ],
        "totalTargetAmount": 5000,
        "totalCurrentAmount": 2000,
        "count": 1,
        "avgProgress": 40.0
      }
    ]
  }
}
```

---

## 🔄 **6. UPDATE Goal Status**

### **Endpoint**
```
PUT /api/goals/:id/status
```

### **Request Data**
```typescript
interface UpdateStatusRequest {
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  reason?: string;      // Optional: Reason for status change
}
```

### **Frontend Example**
```javascript
const updateGoalStatus = async (goalId, statusData) => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`http://localhost:2000/api/goals/${goalId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(statusData)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Update goal status error:', error);
    throw error;
  }
};

// Usage
updateGoalStatus('68aca7c24300fdb284847775', {
  status: 'completed',
  reason: 'Target amount reached!'
});
```

---

## 🎯 **Complete React Goals Component**

```javascript
import React, { useState, useEffect } from 'react';

const GoalsManager = () => {
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    category: 'emergency-fund',
    priority: 'medium'
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

  // Load goals and summary
  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsResult, summaryResult] = await Promise.all([
        apiCall('/api/goals'),
        apiCall('/api/goals/summary')
      ]);
      
      setGoals(goalsResult.data.goals);
      setSummary(summaryResult.data.summary);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create goal
  const createGoal = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const goalData = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0
      };
      
      const result = await apiCall('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData)
      });

      setGoals([result.data.goal, ...goals]);
      setFormData({
        title: '',
        description: '',
        targetAmount: '',
        currentAmount: '',
        targetDate: '',
        category: 'emergency-fund',
        priority: 'medium'
      });
      
      loadData(); // Refresh summary
    } catch (error) {
      console.error('Create goal error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add contribution
  const addContribution = async (goalId, amount, description) => {
    try {
      const result = await apiCall(`/api/goals/${goalId}/contribute`, {
        method: 'POST',
        body: JSON.stringify({ amount, description })
      });

      // Update goal in list
      setGoals(goals.map(goal => 
        goal._id === goalId ? result.data.goal : goal
      ));
      
      loadData(); // Refresh summary
    } catch (error) {
      console.error('Add contribution error:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="goals-manager">
      <h2>Goal Management</h2>
      
      {/* Goals Summary */}
      {summary && (
        <div className="goals-summary">
          <h3>Goals Summary</h3>
          <div className="summary-stats">
            <div className="stat">
              <h4>Total Goals</h4>
              <p>{summary.totalGoals}</p>
            </div>
            <div className="stat">
              <h4>Total Target</h4>
              <p>${summary.totalTargetAmount.toLocaleString()}</p>
            </div>
            <div className="stat">
              <h4>Current Amount</h4>
              <p>${summary.totalCurrentAmount.toLocaleString()}</p>
            </div>
            <div className="stat">
              <h4>Overall Progress</h4>
              <p>{summary.overallProgress.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Goal Form */}
      <form onSubmit={createGoal} className="create-goal-form">
        <h3>Create New Goal</h3>
        <input
          type="text"
          placeholder="Goal Title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
        <textarea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Target Amount"
          value={formData.targetAmount}
          onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Current Amount (optional)"
          value={formData.currentAmount}
          onChange={(e) => setFormData({...formData, currentAmount: e.target.value})}
        />
        <input
          type="date"
          value={formData.targetDate}
          onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
          required
        />
        <select
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
        >
          <option value="emergency-fund">Emergency Fund</option>
          <option value="vacation">Vacation</option>
          <option value="house">House</option>
          <option value="car">Car</option>
          <option value="education">Education</option>
          <option value="investment">Investment</option>
          <option value="debt-payoff">Debt Payoff</option>
          <option value="retirement">Retirement</option>
          <option value="other">Other</option>
        </select>
        <select
          value={formData.priority}
          onChange={(e) => setFormData({...formData, priority: e.target.value})}
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Goal'}
        </button>
      </form>

      {/* Goals List */}
      <div className="goals-list">
        <h3>Your Goals</h3>
        {loading ? (
          <p>Loading...</p>
        ) : goals.length === 0 ? (
          <p>No goals found. Create your first goal above!</p>
        ) : (
          goals.map(goal => (
            <div key={goal._id} className="goal-item">
              <div className="goal-header">
                <h4>{goal.title}</h4>
                <span className={`status ${goal.status}`}>{goal.status}</span>
              </div>
              <p>{goal.description}</p>
              <div className="goal-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${goal.progressPercentage}%` }}
                  ></div>
                </div>
                <span>{goal.progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="goal-amounts">
                <span>Current: ${goal.currentAmount.toLocaleString()}</span>
                <span>Target: ${goal.targetAmount.toLocaleString()}</span>
                <span>Remaining: ${goal.remainingAmount.toLocaleString()}</span>
              </div>
              <div className="goal-actions">
                <button
                  onClick={() => {
                    const amount = prompt('Contribution amount:');
                    const description = prompt('Description (optional):');
                    if (amount && !isNaN(amount)) {
                      addContribution(goal._id, parseFloat(amount), description);
                    }
                  }}
                >
                  Add Contribution
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GoalsManager;
```

---

## 🎉 **Goals API Complete!**

### **✅ Available Features:**

1. **✅ Complete CRUD Operations** - Create, read, update, delete goals
2. **✅ Contribution Tracking** - Add contributions with automatic progress calculation
3. **✅ Progress Calculations** - Percentage complete, remaining amount, days left
4. **✅ Category Organization** - Group goals by category with summaries
5. **✅ Status Management** - Active, completed, paused, cancelled states
6. **✅ Priority Levels** - Low, medium, high priority classification
7. **✅ Summary Analytics** - Overall progress, totals by status and category
8. **✅ Real-time Updates** - All calculations updated automatically

### **🎯 Key Calculations:**
- **Progress Percentage:** `(currentAmount / targetAmount) × 100`
- **Remaining Amount:** `targetAmount - currentAmount`
- **Days Remaining:** `targetDate - currentDate`
- **Overall Progress:** `(totalCurrentAmount / totalTargetAmount) × 100`

**Your goals API is production-ready with comprehensive tracking and calculations! 🎯📈💰**
