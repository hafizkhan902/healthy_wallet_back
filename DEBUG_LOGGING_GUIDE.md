# Debug Logging Guide

## 🔍 **Enable Debug Logging**

Your HealthyWallet Backend now includes comprehensive debug logging for development and troubleshooting.

### **🚀 Quick Start**

#### **Enable Debug Logging:**
```bash
# Set environment variable
export ENABLE_DEBUG_LOGGING=true

# Or add to your .env file
ENABLE_DEBUG_LOGGING=true

# Start the server
npm run dev
```

#### **Disable Debug Logging (Production):**
```bash
# Set environment variable
export ENABLE_DEBUG_LOGGING=false

# Or add to your .env file
ENABLE_DEBUG_LOGGING=false

# Start the server
npm start
```

---

## 📊 **What Gets Logged**

### **🚀 Server Startup**
```
🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀
HealthyWallet API Server Started!
Port: 2000
Environment: development
Timestamp: 2025-08-28T12:00:00.000Z
Health Check: http://localhost:2000/api/health
Debug Mode: ENABLED
🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀
```

### **📥 Incoming Requests**
```
================================================================================
📥 INCOMING REQUEST [ID: a1b2c3d4]
Timestamp: 2025-08-28T12:00:00.000Z
Method: POST
URL: /api/auth/login
IP: ::1
User-Agent: curl/7.68.0
Headers: {
  "host": "localhost:2000",
  "content-type": "application/json",
  "content-length": "58"
}
Request Body: {
  "email": "user@example.com",
  "password": "[REDACTED]"
}
```

### **📤 Outgoing Responses**
```
--------------------------------------------------------------------------------
📤 OUTGOING RESPONSE [ID: a1b2c3d4]
Timestamp: 2025-08-28T12:00:00.150Z
Status: 200
Duration: 150ms
Response Headers: {
  "x-powered-by": "Express",
  "content-type": "application/json; charset=utf-8"
}
Response Body: {
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com"
    },
    "token": "[REDACTED]"
  }
}
Performance: 🐎 150ms
================================================================================
```

### **🗄️ Database Operations**
```
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
🗄️  DATABASE OPERATION
Timestamp: 2025-08-28T12:00:00.100Z
Operation: FINDONE
Collection: users
Query: {
  "email": "user@example.com"
}
Result Count: 1
Duration: ⚡ 25ms
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

### **❌ Error Logging**
```
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
❌ ERROR OCCURRED [ID: a1b2c3d4]
Timestamp: 2025-08-28T12:00:00.200Z
Request: POST /api/auth/login
Error Name: ValidationError
Error Message: Email is required
Stack Trace:
    at validateInput (/app/middleware/validation.js:15:11)
    at Object.<anonymous> (/app/controllers/authController.js:25:5)
    ...
Status Code: 400
User Context: ID=123, Email=user@example.com
Request Body (at error): {
  "password": "[REDACTED]"
}
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
```

---

## 🎯 **Performance Indicators**

### **Response Times:**
- ⚡ **< 100ms** - Excellent
- 🐎 **100-500ms** - Good  
- 🐌 **500ms-1s** - Slow
- 🔥 **> 1s** - Very Slow

### **Database Query Times:**
- ⚡ **< 50ms** - Excellent
- 🐎 **50-200ms** - Good
- 🐌 **200-500ms** - Slow  
- 🔥 **> 500ms** - Very Slow

---

## 🔒 **Security Features**

### **Sensitive Data Protection:**
The logger automatically redacts sensitive information:
- ✅ **Passwords** → `[REDACTED]`
- ✅ **JWT Tokens** → `[REDACTED]`
- ✅ **API Keys** → `[REDACTED]`
- ✅ **Authorization Headers** → `[REDACTED]`

### **Data Truncation:**
- **Headers**: Limited to 300 characters
- **Query Params**: Limited to 200 characters  
- **Request Body**: Limited to 400 characters
- **Response Body**: Limited to 500 characters
- **Error Context**: Limited to 300 characters

---

## 🧪 **Testing Debug Logging**

### **1. Enable Debug Mode:**
```bash
export ENABLE_DEBUG_LOGGING=true
npm run dev
```

### **2. Test API Endpoint:**
```bash
curl -X POST http://localhost:2000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### **3. Check Health Endpoint:**
```bash
curl http://localhost:2000/api/health
```

### **4. Test Error Logging:**
```bash
curl -X POST http://localhost:2000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

---

## 📋 **Environment Variables**

### **Debug Logging Control:**
```env
# Enable/disable debug logging
ENABLE_DEBUG_LOGGING=true          # Enable detailed console logging
ENABLE_REQUEST_LOGGING=true        # Enable request metrics collection
ENABLE_ERROR_LOGGING=true          # Enable error metrics collection
ENABLE_PERFORMANCE_MONITORING=true # Enable performance tracking
```

### **Development vs Production:**
```env
# Development
NODE_ENV=development
ENABLE_DEBUG_LOGGING=true

# Production  
NODE_ENV=production
ENABLE_DEBUG_LOGGING=false
```

---

## 🛠️ **Integration with Monitoring Tools**

Even with console logging disabled, the system still collects metrics for professional monitoring:

### **Request Metrics:**
```javascript
req.responseMetrics = {
  requestId: "a1b2c3d4",
  duration: 150,
  statusCode: 200,
  method: "POST",
  url: "/api/auth/login",
  userAgent: "curl/7.68.0",
  ip: "::1"
}
```

### **Error Information:**
```javascript
req.errorInfo = {
  requestId: "a1b2c3d4",
  error: {
    name: "ValidationError",
    message: "Email is required",
    code: "VALIDATION_FAILED",
    statusCode: 400
  },
  request: { method: "POST", url: "/api/auth/login" },
  user: { id: "123", email: "user@example.com" },
  timestamp: "2025-08-28T12:00:00.000Z"
}
```

---

## 🎯 **Best Practices**

### **Development:**
- ✅ Enable debug logging for troubleshooting
- ✅ Monitor performance indicators
- ✅ Check error stack traces
- ✅ Verify request/response data

### **Production:**
- ✅ Disable debug logging (`ENABLE_DEBUG_LOGGING=false`)
- ✅ Use professional monitoring tools (New Relic, DataDog)
- ✅ Set up log aggregation (ELK Stack, Splunk)
- ✅ Monitor metrics via `req.responseMetrics` and `req.errorInfo`

### **Security:**
- ✅ Never log sensitive data in production
- ✅ Use environment variables for configuration
- ✅ Implement proper log rotation
- ✅ Secure log storage and access

---

## 🚀 **Ready to Debug!**

Your HealthyWallet Backend now provides comprehensive debug logging while maintaining production security and performance. Use `ENABLE_DEBUG_LOGGING=true` for development and debugging, and `ENABLE_DEBUG_LOGGING=false` for production deployments.
