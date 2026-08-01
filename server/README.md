# CRM Backend API

A scalable and secure **Customer Relationship Management (CRM)** backend built with **Node.js, Express.js, and MongoDB**. This RESTful API powers a modern CRM platform by managing customer relationships, sales processes, products, orders, payments, and business activities.

The system also includes an **AI-powered CRM Assistant** that helps users retrieve CRM data through natural language queries, providing quick access to business information and improving productivity.

---

## 🚀 Features

### 🔐 Authentication & Authorization

* User Registration & Login
* JWT-based Authentication
* Protected API Routes
* Password Encryption using bcrypt

### 👥 Lead Management

* Create, Update, Delete Leads
* Lead Status Tracking
* Search & Filter Leads
* Lead Assignment

### 🏢 Company Management

* Manage Company Information
* Company Profiles
* Associate Leads with Companies

### 📦 Product Management

* Create and Manage Products
* Product Pricing
* Product Details
* Product Search

### 💰 Sales Management

* Create Sales Records
* Track Sales Performance
* Revenue Monitoring
* Sales History

### 🛒 Order Management

* Create Customer Orders
* Update Order Status
* Track Order Details
* Associate Orders with Customers and Products

### 💳 Payment Management

* Record Customer Payments
* Track Payment Status
* Payment History
* Generate Payment Records

### 📝 Activity Management

* Calls
* Meetings
* Tasks
* Notes
* Emails
* Activity Timeline

### 🤖 AI CRM Assistant

* AI-powered chatbot integration
* Understands natural language questions
* Retrieves CRM information
* Answers questions about leads, companies, products, orders, and sales
* Assists users with CRM navigation
* Provides quick business insights

### ⚙️ Additional Features

* RESTful API
* Search, Filter & Pagination
* Centralized Error Handling
* Environment-based Configuration
* Modular Project Architecture
* Secure API Design

---

## 🛠️ Tech Stack

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Authentication

* JWT
* bcrypt

### AI Integration

* Google Gemini API

### Other Tools

* dotenv
* CORS
* Nodemon

---

## 📁 Project Structure

```text id="ggc31t"
crm-backend/
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── uploads/
│   ├── app.js
│   └── server.js
│
├── .env
├── package.json
├── package-lock.json
└── README.md
```

---

## ⚙️ Installation

```bash id="18c9n4"
git clone https://github.com/your-username/crm-backend.git
cd crm-backend
npm install
```

Create a `.env` file.

```env id="9ivj87"
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

Run the application.

```bash id="1xgsnt"
npm run dev
```

---

## 📡 API Modules

* Authentication
* Users
* Leads
* Companies
* Products
* Orders
* Payments
* Sales
* Activities
* AI Chatbot

---

## 🔒 Security

* JWT Authentication
* Password Hashing
* Protected Routes
* Environment Variables
* Centralized Error Handling

---

## 📌 Future Enhancements

* Role-Based Access Control (RBAC)
* Inventory Management
* Invoice Generation
* Email Notifications
* Report & Analytics Dashboard
* File Upload Support
* Audit Logs
* WebSocket Notifications
* Multi-language Support

---

## 🤝 Contributing

Contributions are welcome. Feel free to fork the repository, create a feature branch, and submit a pull request.

---

