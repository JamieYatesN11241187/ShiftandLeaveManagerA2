# Shift and Leave Manager

A full-stack CRUD application with user authentication, developed using **Node.js**, **React.js**, and **MongoDB**, deployed via **CI/CD** on AWS with **Nginx** and **PM2**.  
Implements leave and shift management features, including request creation, update, approval/rejection, and review.

---

## Project Setup Instructions

### **1. Prerequisites**
- Node.js v22+
- Yarn package manager
- MongoDB (local or cloud instance)
- Git
- AWS EC2 instance with Nginx & PM2 (for deployment)

### **2. Clone the repository**
```bash
git clone https://github.com/JamieYatesN11241187/ShiftandLeaveManager.git
cd ShiftandLeaveManager
```

### **3. Backend Setup**
```bash
cd backend
yarn install
cp .env.example .env   # Update with your MongoDB URI, JWT_SECRET, and PORT
yarn start              # or npm run start (for local testing)
```

### **4. Frontend Setup**
```bash
cd ../frontend
yarn install
yarn start              # Runs the frontend locally
```

### **5. Run Tests**
```bash
cd backend
npm test
```

---

## Public URL
**http://54.252.2.18/** 
---

## Test Login Credentials
Use the following project-specific test account to log in and access the dashboard:

- **Username/Email:** `IFN636@gmail.com`  
- **Password:** `IFN636`

---

## Technologies Used
- **Frontend:** React.js, Axios, Yarn
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **DevOps:** GitHub Actions (CI/CD), PM2, Nginx, AWS EC2
- **Testing:** Mocha, Chai, Sinon
