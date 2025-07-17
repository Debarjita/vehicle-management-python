# backend/setup_ai_demo.py - Demo data script
"""
Run this script to set up demo data for AI features testing
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vms.settings')
django.setup()

from django.contrib.auth import get_user_model
from vehicles.models import Organization, Vehicle
import random

User = get_user_model()

def create_demo_data():
    print("🚀 Setting up AI Demo Data...")
    
    # Create demo organization if it doesn't exist
    demo_org, created = Organization.objects.get_or_create(
        name="AI Demo Corp",
        defaults={
            'account': 'DEMO001',
            'website': 'https://aidemo.com',
            'fuelReimbursementPolicy': '1500',
            'speedLimitPolicy': '70 mph'
        }
    )
    if created:
        print("✅ Created demo organization")
    
    # Create demo users for testing
    demo_users = [
        {'username': 'guard_ai', 'role': 'GUARD', 'password': 'demo123'},
        {'username': 'driver_ai', 'role': 'DRIVER', 'password': 'demo123'},
        {'username': 'manager_ai', 'role': 'ORG_MANAGER', 'password': 'demo123'},
    ]
    
    for user_data in demo_users:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'role': user_data['role'],
                'org': demo_org,
                'is_face_registered': False
            }
        )
        if created:
            user.set_password(user_data['password'])
            user.save()
            print(f"✅ Created demo user: {user.username} ({user.role})")
    
    # Create demo vehicles with realistic license plates
    demo_vehicles = [
        {'license_plate': 'ABC123', 'make': 'Toyota', 'model': 'Camry', 'year': 2022},
        {'license_plate': 'XYZ789', 'make': 'Honda', 'model': 'Civic', 'year': 2021},
        {'license_plate': 'DEF456', 'make': 'Ford', 'model': 'Focus', 'year': 2020},
        {'license_plate': 'GHI012', 'make': 'BMW', 'model': 'X3', 'year': 2023},
    ]
    
    for vehicle_data in demo_vehicles:
        vehicle, created = Vehicle.objects.get_or_create(
            license_plate=vehicle_data['license_plate'],
            defaults={
                'vin': f"DEMO{random.randint(100000, 999999)}VIN{random.randint(100, 999)}",
                'make': vehicle_data['make'],
                'model': vehicle_data['model'],
                'year': vehicle_data['year'],
                'mileage': random.randint(10000, 50000),
                'org': demo_org,
                'status': 'AVAILABLE'
            }
        )
        if created:
            print(f"✅ Created demo vehicle: {vehicle.license_plate} - {vehicle.make} {vehicle.model}")
    
    print("\n🎯 Demo Setup Complete!")
    print("=" * 50)
    print("Demo Login Credentials:")
    print("👮 Guard: guard_ai / demo123")
    print("🚗 Driver: driver_ai / demo123") 
    print("👔 Manager: manager_ai / demo123")
    print("=" * 50)
    print("Next Steps:")
    print("1. Install required packages: pip install -r requirements_ai.txt")
    print("2. Install Tesseract OCR on your system")
    print("3. Run migrations: python manage.py migrate")
    print("4. Start the server and test AI features!")

if __name__ == "__main__":
    create_demo_data()