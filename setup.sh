#!/bin/bash

echo "=========================================="
echo "Coffee Nursery Certificate Management System"
echo "Setup Script"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL v8.0+ first."
    exit 1
fi

echo "✅ MySQL is installed"

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
fi

echo "Installing backend dependencies..."
npm install

echo "✅ Backend setup complete"
cd ..

# Setup Web Admin
echo ""
echo "📦 Setting up Web Admin..."
cd web_admin

echo "Installing web admin dependencies..."
npm install

echo "✅ Web Admin setup complete"
cd ..

# Setup Flutter (optional)
echo ""
echo "📦 Checking Flutter..."
if command -v flutter &> /dev/null; then
    echo "✅ Flutter version: $(flutter --version | head -1)"
    cd flutter_app
    echo "Installing Flutter dependencies..."
    flutter pub get
    echo "✅ Flutter setup complete"
    cd ..
else
    echo "⚠️ Flutter is not installed. Skipping Flutter setup."
    echo "   Install Flutter to use the mobile app: https://flutter.dev/docs/get-started/install"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure the database:"
echo "   - Create a MySQL database named 'cncms'"
echo "   - Update backend/.env with your database credentials"
echo "   - Run: mysql -u root -p < backend/database/schema.sql"
echo ""
echo "2. Start the backend server:"
echo "   cd backend && npm run dev"
echo ""
echo "3. Start the web admin:"
echo "   cd web_admin && npm start"
echo ""
echo "4. (Optional) Run the Flutter app:"
echo "   cd flutter_app && flutter run"
echo ""
echo "For more details, see README.md"
echo ""
