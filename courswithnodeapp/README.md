# Course Selling Platform

A full-featured e-commerce platform for selling online courses with UPI payment integration, admin dashboard, coupon system, and rich text content editor.

## 🌐 Live Demo

The application is live at: [https://courseseller-y3vj.onrender.com](https://courseseller-y3vj.onrender.com)

> **Note:** The application is hosted on a free tier of Render, so it may take up to 30 seconds to load on first access as the server spins up from idle.

## 🌟 Features

### User Features
- **Course Catalog**: Browse available courses with detailed descriptions
- **Rich Text Content**: View courses with formatted descriptions, images, and styling
- **Shopping Cart**: Add multiple courses to cart before checkout
- **UPI Payments**: Simple payment process with UPI app integration
- **Coupon System**: Apply discount coupons with real-time price updates
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Transaction History**: View past purchases and payment status

### Admin Features
- **Course Management**: Add, edit, and delete courses
- **Rich Text Editor**: Create beautiful course descriptions with formatting
- **Purchase Tracking**: Monitor and verify customer transactions
- **Coupon Management**: Create and manage discount coupons
- **Analytics Dashboard**: View sales data and course popularity
- **Payment Settings**: Configure UPI payment details and QR codes
- **Admin Authentication**: Secure login system for administrators

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/Omkartechnical2006/courseseller.git
   cd courseseller
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   - User Interface: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin/login

## 💻 Technologies Used

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for data storage
- **Mongoose**: MongoDB object modeling tool
- **Express-session**: Session management for authentication

### Frontend
- **EJS**: Templating engine for rendering views
- **Bootstrap 5**: CSS framework for responsive design
- **Custom Rich Text Editor**: For creating formatted course content
- **JavaScript**: Client-side validation and interactivity

### Payment Integration
- **UPI**: Integration with Indian Unified Payment Interface
- **Dynamic QR Code**: Generates payment QR codes

## 📋 Application Structure

```
course-seller/
│
├── models/               # MongoDB data models
│   ├── Admin.js          # Admin user model
│   ├── Course.js         # Course model
│   ├── Purchase.js       # Purchase/transaction model
│   ├── PaymentSettings.js# UPI payment settings
│   ├── Coupon.js         # Discount coupon model
│   └── Cart.js           # Shopping cart model
│
├── routes/               # Express route controllers
│   ├── admin.js          # Admin dashboard routes
│   ├── admin-auth.js     # Admin authentication
│   ├── user.js           # User-facing course routes
│   └── cart.js           # Shopping cart routes
│
├── middleware/           # Express middleware
│   └── adminAuth.js      # Admin authentication middleware
│
├── views/                # EJS templates
│   ├── admin/            # Admin dashboard views
│   ├── user/             # User-facing pages
│   └── partials/         # Reusable template parts
│
├── public/               # Static assets
│   ├── css/              # Stylesheets
│   └── js/               # Client-side JavaScript
│
├── server.js             # Application entry point
└── package.json          # Project dependencies
```

## 🌱 Key Features Explained

### Rich Text Editor
The platform includes a custom-built rich text editor for course descriptions that supports:
- Text formatting (bold, italic, underline)
- Font sizes and styling
- Lists (ordered and unordered)
- Text alignment
- Link embedding
- Content previews

### Coupon System
The coupon system supports:
- Percentage and fixed amount discounts
- Course-specific coupons
- Usage limits
- Validity periods
- Minimum purchase requirements
- Real-time validation with security measures to prevent reuse

### UPI Payment Processing
The payment system includes:
- Dynamic UPI payment links
- QR code generation
- Transaction ID validation
- Payment status tracking
- Admin verification interface

## 📜 Usage Guidelines

### For Users
1. Browse the available courses on the homepage
2. Click on a course to view details
3. Click "Buy Now" or add to cart
4. Apply a coupon code (if available)
5. Make payment using your UPI app
6. Submit your transaction details
7. Admin will verify your payment and grant access

### For Administrators
1. Log in to the admin dashboard
2. Manage courses (add/edit/delete)
3. Verify pending payments
4. Create and manage coupon codes
5. Update payment settings
6. View sales analytics

## 🔒 Security Features

- **Session Management**: Secure session-based authentication
- **Coupon Validation**: Server-side validation with timestamp checking
- **Transaction Protection**: Prevents duplicate transactions
- **XSS Prevention**: Content sanitization for user inputs
- **Back Button Protection**: Prevents coupon reuse through browser navigation

## 👨‍💻 Development

To run the application in development mode:
```bash
npm run dev
```

## 📞 Contact

For support or inquiries, please contact:
- Email: omkar2006suman@gmail.com
- GitHub: [Omkartechnical2006](https://github.com/Omkartechnical2006)