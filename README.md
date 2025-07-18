# 🚗 VMS - Vehicle Management System

A comprehensive vehicle management solution featuring real-time tracking, AI-powered scheduling, role-based access control, and advanced analytics.

## 📋 Table of Contents
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [User Roles & Hierarchy](#-user-roles--hierarchy)
- [How It Works](#-how-it-works)
- [Quick Start](#-quick-start)
- [AI Features Setup](#-ai-features-setup)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Production Deployment](#-production-deployment)
- [Troubleshooting](#-troubleshooting)

## 🌟 Features

- **Real-Time Vehicle Tracking** - GPS tracking with live status updates and instant notifications
- **AI-Powered Scheduling** - Optimize driver schedules and vehicle assignments using advanced algorithms
- **Role-Based Access Control** - Multi-level security for Admins, Org Managers, Guards, and Drivers
- **Analytics Dashboard** - Comprehensive insights with detailed reports and performance metrics
- **Mobile Responsive** - Access from anywhere with responsive design
- **Real-Time Logs** - Live vehicle entry/exit logs with WebSocket technology
- **AI Features** - Face recognition and license plate recognition using computer vision
- **VIN Decoding** - Automatic vehicle information extraction using NHTSA database
- **Multi-Organization Support** - Hierarchical organization management with isolated data
- **Attendance Tracking** - Automated attendance logging with facial recognition
- **Vehicle Verification** - Combined license plate and driver face verification system

## 🏗️ System Architecture

### Backend (Django REST API)
- **Framework**: Django 5.2.2 with Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT-based authentication with role-specific permissions
- **Real-time**: WebSocket support via Django Channels and Redis
- **AI Features**: Face recognition, OCR, and computer vision capabilities

### Frontend (React)
- **Framework**: React 18 with modern hooks
- **Styling**: CSS3 with responsive design
- **State Management**: React Context and local state
- **Real-time**: WebSocket integration for live updates
- **UI Components**: Custom components with modern design

## 👥 User Roles & Hierarchy

The system follows a hierarchical structure with four main user roles:

### 🔑 Administrator (ADMIN)
**Top-level system access with complete control**

**Can Do:**
- ✅ Create, edit, and delete organizations
- ✅ Create users for any organization (Org Managers, Guards, Drivers)
- ✅ Change passwords for any user
- ✅ View all vehicles across all organizations
- ✅ Assign vehicles to any organization
- ✅ Access system-wide analytics and reports
- ✅ Manage system configuration and settings
- ✅ Register faces for any user (AI features)
- ✅ Scan license plates and verify vehicles
- ✅ View all attendance logs and verifications

**Cannot Do:**
- ❌ Be assigned to a specific organization (system-wide access)

### 👨‍💻 Organization Manager (ORG_MANAGER)
**Organization-specific administrative control**

**Can Do:**
- ✅ Create and manage users within their organization (Guards, Drivers)
- ✅ Change passwords for users in their organization
- ✅ View and manage vehicles assigned to their organization
- ✅ Generate AI-powered schedules for guards and drivers
- ✅ Assign drivers to vehicles within their organization
- ✅ View organization-specific analytics and reports
- ✅ Register faces for users in their organization
- ✅ Scan license plates for organization vehicles
- ✅ View attendance logs for their organization
- ✅ Create and manage shifts for their staff

**Cannot Do:**
- ❌ Access other organizations' data
- ❌ Create other Organization Managers
- ❌ Modify organization settings (only Admin can)
- ❌ Access system-wide analytics

### 👮‍♂️ Security Guard (GUARD)
**Vehicle and driver verification at entry/exit points**

**Can Do:**
- ✅ View driver schedules for their organization
- ✅ Verify driver identity using face recognition
- ✅ Scan and verify license plates
- ✅ Log vehicle entry/exit activities
- ✅ View real-time vehicle verification status
- ✅ Access guard-specific dashboard with daily assignments
- ✅ View their own shift schedule
- ✅ Record attendance logs

**Cannot Do:**
- ❌ Create or modify user accounts
- ❌ Register new faces in the system
- ❌ Generate schedules
- ❌ Assign vehicles to drivers
- ❌ Access other organizations' data
- ❌ View system analytics

### 🚗 Driver (DRIVER)
**Personal schedule and vehicle information access**

**Can Do:**
- ✅ View their personal shift schedule
- ✅ See assigned vehicle details for their shifts
- ✅ View their own attendance history
- ✅ Access basic dashboard with shift information
- ✅ Verify their own identity (face recognition)

**Cannot Do:**
- ❌ View other drivers' schedules
- ❌ Access vehicle management functions
- ❌ Register faces or scan license plates
- ❌ Create or modify any accounts
- ❌ Generate schedules
- ❌ Access analytics or reports

## 🔄 How It Works

### 1. Organization Setup
1. **Admin** creates organizations with details (name, account, website, policies)
2. **Admin** assigns available vehicles to organizations
3. **Admin** creates Organization Manager for each organization

### 2. User Management Workflow
1. **Admin** or **Org Manager** creates users (Guards, Drivers)
2. Users are automatically assigned to the creator's organization
3. **Admin** can create users for any organization
4. **Org Manager** can only create users for their organization

### 3. Vehicle Management Process
1. **Admin** adds vehicles to the system (using VIN decoder)
2. **Admin** assigns vehicles to organizations
3. **Org Manager** assigns vehicles to specific drivers
4. **Org Manager** manages vehicle status and availability

### 4. Scheduling System
1. **Org Manager** generates AI-powered schedules
2. System creates optimized shifts for guards and drivers
3. Guards can view driver schedules for verification
4. Drivers can view their own schedules

### 5. Daily Operations
1. **Guards** verify drivers using face recognition
2. **Guards** scan license plates for vehicle verification
3. System logs all entry/exit activities in real-time
4. **Org Managers** monitor daily operations via dashboard

### 6. AI-Powered Features
1. **Admin/Org Manager** registers driver faces in the system
2. **Guards** use face recognition to verify driver identity
3. **Guards** scan license plates for automatic verification
4. System maintains attendance logs and verification records

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL
- Redis (for real-time features)

### Backend Setup

1. **Clone and navigate to backend**
```bash
git clone <repository-url>
cd backend
```

2. **Create virtual environment**
```bash
python -m venv vms_env
source vms_env/bin/activate  # On Windows: vms_env\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure database**
Update `backend/vms/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'VehicleManagement',
        'USER': 'postgres',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

5. **Run migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser (Admin)**
```bash
python manage.py createsuperuser
```

7. **Start development server**
```bash
python manage.py runserver
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm start
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## 🤖 AI Features Setup

### Install AI Dependencies

**Windows:**
```bash
pip install face-recognition opencv-python Pillow pytesseract numpy dlib
# Download Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki
```

**Linux/Ubuntu:**
```bash
sudo apt-get install tesseract-ocr libtesseract-dev python3-dev cmake
pip install face-recognition opencv-python Pillow pytesseract numpy dlib
```

**macOS:**
```bash
brew install tesseract
pip install face-recognition opencv-python Pillow pytesseract numpy dlib
```

### Configure AI Settings
Update `backend/vms/settings.py`:
```python
AI_SETTINGS = {
    'FACE_RECOGNITION_TOLERANCE': 0.6,
    'MIN_FACE_CONFIDENCE': 70,
    'MIN_PLATE_CONFIDENCE': 60,
    'TESSERACT_PATH': r'C:\Program Files\Tesseract-OCR\tesseract.exe',  # Windows
    # 'TESSERACT_PATH': '/usr/bin/tesseract',  # Linux/macOS
}
```

## 📡 API Documentation

### Authentication
```bash
POST /api/token/              # Login and get JWT token
POST /api/token/refresh/      # Refresh JWT token
```

### Organizations (Admin only)
```bash
GET /api/orgs/               # List all organizations
POST /api/orgs/              # Create organization
GET /api/orgs/{id}/          # Organization details
PUT /api/orgs/{id}/          # Update organization
DELETE /api/orgs/{id}/       # Delete organization
```

### Users (Admin & Org Manager)
```bash
GET /api/users/              # List users (filtered by permissions)
POST /api/users/             # Create user
GET /api/users/{id}/         # User details
PUT /api/users/{id}/         # Update user
DELETE /api/users/{id}/      # Delete user
```

### Vehicles
```bash
GET /api/vehicles/           # List vehicles (filtered by org)
POST /api/vehicles/          # Create vehicle
GET /api/vehicles/{id}/      # Vehicle details
PUT /api/vehicles/{id}/      # Update vehicle
DELETE /api/vehicles/{id}/   # Delete vehicle
```

### Scheduling (Org Manager)
```bash
POST /api/generate-schedules/ # Generate AI-powered schedules
GET /api/shifts/             # View shifts
```

### AI Features
```bash
POST /api/ai/register-face/   # Register face for user (Admin/Org Manager)
POST /api/ai/verify-face/     # Verify face (All users)
POST /api/ai/scan-plate/      # Scan license plate (Admin/Org Manager/Guard)
```

### Dashboards
```bash
GET /api/org-dashboard/       # Organization Manager dashboard
GET /api/guard-dashboard/     # Guard dashboard
GET /api/driver-dashboard/    # Driver dashboard
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
cd backend
python testvms.py
```

This tests:
- Authentication for all user roles
- API endpoint functionality
- Vehicle operations and management
- User creation and management
- Organization management
- Dashboard functionality
- Image upload and AI features

## 🚀 Production Deployment

### Backend Deployment
1. Set `DEBUG = False` in settings.py
2. Configure production database
3. Set up static file serving
4. Use production WSGI server (gunicorn)
5. Configure Redis for production
6. Set up proper CORS origins

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Serve static files via nginx or CDN
3. Update API base URL for production

### Environment Variables
Create `.env` file:
```env
SECRET_KEY=your-production-secret-key
DEBUG=False
DATABASE_URL=postgresql://user:password@localhost:5432/VehicleManagement
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

## 🛠️ Database Schema

### Core Models
- **User** - Authentication with role-based permissions
- **Organization** - Multi-tenant organization management
- **Vehicle** - Vehicle information with VIN decoding
- **Shift** - Scheduling system for guards and drivers
- **VehicleLog** - Entry/exit tracking
- **AttendanceLog** - Automated attendance tracking
- **VehicleVerification** - Combined face and license plate verification
- **AIRecognition** - Face recognition data storage

## 🐛 Troubleshooting

### Common Issues

**Database Connection Errors:**
- Check PostgreSQL service is running
- Verify database credentials in settings.py
- Ensure database exists

**Authentication Issues:**
- Run debug script: `python tests/debug_auth.py`
- Check JWT token expiry settings
- Verify user roles are set correctly

**CORS Errors:**
- Update `CORS_ALLOWED_ORIGINS` in settings.py
- Ensure frontend URL is included

**WebSocket Connection Failed:**
- Start Redis server: `redis-server`
- Check Redis connection settings
- Verify channel layers configuration

**AI Features Not Working:**
- Check Tesseract installation and path
- Verify OpenCV and face-recognition libraries
- Test camera permissions in browser

**Permission Denied Errors:**
- Check user role assignments
- Verify organization assignments for non-admin users
- Review permission classes in views

### Debug Tools

**Test user authentication:**
```bash
cd backend
python tests/debug_auth.py
```

**Check organization manager data:**
```bash
# Access debug endpoint as org manager
GET /api/debug-org-manager/
```

**Verify system health:**
```bash
python testvms.py
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Check the troubleshooting section above
- Review the API documentation
- Run the test suite to identify issues
- Submit issues on the repository

---

**VMS - Smart Vehicle Management Made Simple** 🚗
