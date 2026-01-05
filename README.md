# FoodBuddy Backend API

A complete backend API for the FoodBuddy food delivery application.

## 🚀 Features

- **Authentication**: User registration, login with JWT tokens
- **Restaurant Management**: CRUD operations for restaurants
- **Menu Management**: CRUD operations for menu items
- **Order Management**: Complete order lifecycle management
- **User Management**: Profile and address management
- **File Uploads**: Image upload for restaurants and menu items
- **Validation**: Comprehensive input validation
- **Error Handling**: Proper error responses and logging

## 🛠️ Tech Stack

- **Node.js** with TypeScript
- **Express.js** for REST API
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Express Validator** for input validation

## 📋 Setup Instructions

### Prerequisites
- Node.js 20+
- MongoDB (installed and running)
- npm or yarn

### MongoDB Setup

**Option 1: Install MongoDB locally**
```bash
# Windows
# Download and install MongoDB Community Server from https://www.mongodb.com/try/download/community

# macOS (with Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu/Debian)
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Option 2: Use MongoDB Atlas (Cloud)**
1. Create a free account at https://www.mongodb.com/atlas
2. Create a new cluster
3. Get your connection string
4. Update `.env` file with your Atlas connection string

**Option 3: Use Docker**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Installation

1. **Clone and install dependencies**:
```bash
cd foodbuddy-backend
npm install
```

2. **Environment setup**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database setup**:
```bash
# Make sure MongoDB is running on localhost:27017
# or update MONGODB_URI in .env
```

4. **Seed the database**:
```bash
npm run build
npx ts-node src/utils/seed.ts
```

5. **Start the server**:
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🗄️ Database Schema

### Users
- Authentication with JWT tokens
- Role-based access (user/admin)
- Profile management
- Address management

### Restaurants
- Restaurant information and details
- Operating hours
- Contact information
- Image uploads

### Menu Items
- Item details and pricing
- Categories and availability
- Customization options
- Nutritional information

### Orders
- Complete order lifecycle
- Payment processing
- Delivery tracking
- Reviews and ratings

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get restaurant by ID
- `POST /api/restaurants` - Create restaurant (admin)
- `PUT /api/restaurants/:id` - Update restaurant (admin)
- `DELETE /api/restaurants/:id` - Delete restaurant (admin)

### Menu Items
- `GET /api/menu-items/restaurant/:restaurantId` - Get menu items by restaurant
- `GET /api/menu-items/:id` - Get menu item by ID
- `POST /api/menu-items` - Create menu item (admin)
- `PUT /api/menu-items/:id` - Update menu item (admin)
- `DELETE /api/menu-items/:id` - Delete menu item (admin)
- `PATCH /api/menu-items/:id/toggle-availability` - Toggle availability (admin)

### Orders
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status
- `PATCH /api/orders/:id/cancel` - Cancel order
- `PATCH /api/orders/:id/review` - Add review to order

### Users
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/addresses` - Add address
- `PUT /api/users/addresses/:addressId` - Update address
- `DELETE /api/users/addresses/:addressId` - Delete address

## 🔐 Default Credentials

After seeding the database:

**Admin User:**
- Email: `admin@foodbuddy.com`
- Password: `admin123`

**Regular User:**
- Email: `john@example.com`
- Password: `user123`

## 📁 File Structure

```
src/
├── models/          # Database models
├── routes/          # API routes
├── middleware/       # Custom middleware
├── utils/           # Utility functions
└── index.ts         # Server entry point

uploads/              # Uploaded files
├── restaurants/      # Restaurant images
└── menu-items/       # Menu item images
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run in development mode
npm run dev
```

## 🚀 Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb://your-connection-string
JWT_SECRET=your-super-secret-jwt-key
```

### Build for Production
```bash
npm run build
npm start
```

## 📝 Development Notes

- All routes are prefixed with `/api`
- Authentication required for protected routes
- File uploads limited to 5MB
- Comprehensive error handling
- Request logging and validation

## 🔗 Related Projects

- **FoodBuddy Mobile App**: React Native frontend
- **FoodBuddy Admin Panel**: React admin interface

## 📄 License

MIT License - see LICENSE file for details
