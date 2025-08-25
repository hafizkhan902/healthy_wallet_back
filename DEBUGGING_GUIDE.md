# 🐛 HealthyWallet API - Comprehensive Debugging Guide

## 🎯 **Enhanced Logging System - Now Active!**

Your HealthyWallet backend now has **comprehensive request/response debugging** with colored console output, performance monitoring, and detailed error tracking.

---

## 📊 **What's Being Logged**

### **🔍 Every Incoming Request**
```
================================================================================
📥 INCOMING REQUEST [ID: abc123def]
Timestamp: 2025-08-25T17:58:21.056Z
Method: POST
URL: /api/auth/login
IP: ::1
User-Agent: curl/8.7.1
Headers:
{
  "content-type": "application/json",
  "origin": "http://localhost:3000",
  "authorization": "[HIDDEN]"
}
Request Body:
{
  "email": "hkkhan074@gmail.com",
  "password": "[HIDDEN]"
}
================================================================================
```

### **📤 Every Outgoing Response**
```
--------------------------------------------------------------------------------
📤 OUTGOING RESPONSE [ID: abc123def]
Timestamp: 2025-08-25T17:58:21.089Z
Status: 200
Duration: 33ms
Response Headers:
{
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "http://localhost:3000"
}
Response Body:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "68ac91e278ba5b74fc2bd960",
      "name": "Hafiz Khan",
      "email": "hkkhan074@gmail.com"
    },
    "token": "[HIDDEN]"
  }
}
Performance: 🟢 33ms
================================================================================
```

### **❌ Error Logging**
```
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
❌ ERROR OCCURRED [ID: abc123def]
Timestamp: 2025-08-25T17:58:25.123Z
Request: POST /api/auth/login
Error Name: ValidationError
Error Message: Invalid credentials
Status Code: 401
User Context: ID=undefined, Email=undefined
Request Body (at error):
{
  "email": "wrong@email.com",
  "password": "[HIDDEN]"
}
Stack Trace:
    at validateCredentials (/src/controllers/authController.js:45:15)
    at login (/src/controllers/authController.js:52:20)
    ...
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
```

### **🗄️ Database Operations**
```
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
🗄️  MONGOOSE OPERATION
Timestamp: 2025-08-25T17:58:21.067Z
Collection: users
Method: findOne
Query:
{
  "email": "hkkhan074@gmail.com"
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

---

## 🎨 **Color-Coded Console Output**

### **Status Code Colors**
- 🟢 **Green (200-299)**: Success responses
- 🟡 **Yellow (300-399)**: Redirects
- 🔴 **Red (400-499)**: Client errors
- 🟣 **Magenta (500+)**: Server errors

### **HTTP Method Colors**
- 🟢 **Green**: GET requests
- 🔵 **Blue**: POST requests  
- 🟡 **Yellow**: PUT requests
- 🔴 **Red**: DELETE requests
- 🟦 **Cyan**: PATCH requests

### **Performance Indicators**
- 🟢 **Green**: < 500ms (Fast)
- 🟡 **Yellow**: 500ms-1000ms (Moderate)
- 🔴 **Red**: > 1000ms (Slow)

---

## 🔧 **Configuration Options**

### **Environment Variables**
```bash
# .env file
NODE_ENV=development          # Enables full logging
DEBUG_DB=true                # Enables database query logging
RATE_LIMIT_MAX_REQUESTS=100  # Rate limit configuration
```

### **Logging Levels**
```javascript
// Automatic based on environment
// development: Full logging with colors
// test: Minimal logging 
// production: Error logging only (unless DEBUG_DB=true)
```

---

## 🚀 **How to Use for Debugging**

### **1. Start Server with Logging**
```bash
npm run dev
# You'll see:
🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀
HealthyWallet API Server Started!
Port: 2000
Environment: development
Timestamp: 2025-08-25T17:58:11.123Z
Health Check: http://localhost:2000/health
Debug Mode: ENABLED
🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀
```

### **2. Monitor Real-Time Requests**
Every API call will show:
- ✅ **Request ID** for tracking
- ✅ **Complete headers** (sensitive data hidden)
- ✅ **Request/response bodies**
- ✅ **Performance timing**
- ✅ **Database queries triggered**

### **3. Track Performance Issues**
```bash
# Look for these indicators:
🔴 Performance: 🔴 1250ms  # Slow request
🐌 SLOW QUERY DETECTED      # Database performance issue
🟡 Status: 429             # Rate limiting triggered
```

---

## 🔍 **Debugging Common Issues**

### **Frontend Connection Problems**
**Look for:**
```
📥 INCOMING REQUEST [ID: xyz789]
Method: OPTIONS
URL: /api/auth/login
Origin: http://localhost:3000
```
**If missing:** CORS preflight failing

**Look for:**
```
❌ ERROR OCCURRED
Error Message: Not authorized, token failed
```
**If present:** JWT token issues

### **Database Issues**
**Look for:**
```
🗄️  MONGOOSE OPERATION
Collection: users
Method: findOne
Query: { "email": "user@example.com" }
```
**If missing:** Database connection problems

**Look for:**
```
🐌 SLOW QUERY DETECTED
Duration: 150ms
Collection: incomes
```
**If present:** Database performance issues

### **Authentication Problems**
**Look for:**
```
Request Body:
{
  "email": "user@example.com",
  "password": "[HIDDEN]"
}
```
**Check:** Email format, password presence

**Look for:**
```
Response Body:
{
  "success": false,
  "message": "Invalid credentials"
}
```
**Indicates:** Wrong email/password

### **Validation Errors**
**Look for:**
```
❌ ERROR OCCURRED
Error Name: ValidationError
Error Message: "amount" is required
```
**Indicates:** Missing required fields

---

## 📊 **Performance Monitoring**

### **Request Performance**
```bash
# Fast requests (good)
Performance: 🟢 45ms

# Moderate requests (watch)
Performance: 🟡 750ms

# Slow requests (investigate)
Performance: 🔴 1200ms
```

### **Database Performance**
```bash
# Normal queries
🗄️  MONGOOSE OPERATION
Duration: 15ms

# Slow queries (needs optimization)
🐌 SLOW QUERY DETECTED
Duration: 150ms
Collection: expenses
Operation: aggregate
```

### **Memory & Connection Stats**
```bash
# Every 10 minutes in development:
📊 QUERY PERFORMANCE STATS
User.findOne: 45 queries, avg: 12.5ms, max: 89ms, min: 8ms
Income.find: 23 queries, avg: 34.2ms, max: 156ms, min: 15ms
```

---

## 🛠️ **Advanced Debugging**

### **Request Tracing**
Each request gets a unique ID for end-to-end tracking:
```bash
📥 INCOMING REQUEST [ID: abc123def]  # Request starts
🗄️  MONGOOSE OPERATION              # Database query
📤 OUTGOING RESPONSE [ID: abc123def] # Response sent
```

### **Error Context**
Errors include full context:
```bash
❌ ERROR OCCURRED [ID: abc123def]
User Context: ID=68ac91e278ba5b74fc2bd960, Email=hkkhan074@gmail.com
Request Body (at error): { "amount": -100 }  # What caused the error
Stack Trace: ...  # Where it happened
```

### **Security Monitoring**
Sensitive data is automatically hidden:
```bash
Headers: {
  "authorization": "[HIDDEN]",    # JWT tokens hidden
  "cookie": "[HIDDEN]"           # Cookies hidden
}
Request Body: {
  "email": "user@example.com",
  "password": "[HIDDEN]",        # Passwords hidden
  "token": "[HIDDEN]"           # Tokens hidden
}
```

---

## 🎯 **Debugging Workflows**

### **Frontend API Integration Issues**
1. **Check request logging** - Is the request reaching the server?
2. **Check CORS headers** - Are CORS headers present in response?
3. **Check authentication** - Is JWT token being sent correctly?
4. **Check response format** - Is the response in expected format?

### **Database Performance Issues**
1. **Monitor query logs** - Which queries are slow?
2. **Check query patterns** - Are there N+1 queries?
3. **Review indexes** - Are proper indexes in place?
4. **Analyze aggregations** - Are complex aggregations optimized?

### **Authentication & Authorization Issues**
1. **Check token format** - Is JWT token properly formatted?
2. **Check token expiration** - Has the token expired?
3. **Check user context** - Is user properly attached to request?
4. **Check permissions** - Does user have required permissions?

---

## 📋 **Log Analysis Tips**

### **Finding Specific Requests**
```bash
# Search by request ID
grep "abc123def" server.log

# Search by user email
grep "hkkhan074@gmail.com" server.log

# Search by endpoint
grep "/api/income" server.log

# Search by error type
grep "ValidationError" server.log
```

### **Performance Analysis**
```bash
# Find slow requests
grep "🔴.*ms" server.log

# Find database issues
grep "🐌 SLOW QUERY" server.log

# Find error patterns
grep "❌ ERROR OCCURRED" server.log
```

### **Security Monitoring**
```bash
# Find failed login attempts
grep "Invalid credentials" server.log

# Find rate limit hits
grep "Status: 429" server.log

# Find authorization failures
grep "Not authorized" server.log
```

---

## 🎉 **Debugging Success!**

With this comprehensive logging system, you can now:

✅ **Track every request** from start to finish  
✅ **Monitor API performance** in real-time  
✅ **Debug frontend integration** issues instantly  
✅ **Identify database bottlenecks** immediately  
✅ **Trace authentication problems** step-by-step  
✅ **Monitor security events** automatically  
✅ **Analyze error patterns** efficiently  

### **Your API is now fully observable! 🔍**

Every request, response, database query, and error is logged with:
- 🎨 **Color-coded output** for easy reading
- 🔍 **Request tracing** with unique IDs
- 🛡️ **Security-aware** logging (sensitive data hidden)
- ⚡ **Performance monitoring** with timing
- 🗄️ **Database query tracking**
- ❌ **Comprehensive error context**

**Happy debugging! 🐛➡️✅**
