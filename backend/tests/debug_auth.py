# backend/debug_auth.py
# Run this script to debug your authentication issues
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vms.settings')
django.setup()

from accounts.models import User
from vehicles.models import Organization
from django.contrib.auth import authenticate

def debug_users():
    print("=== DEBUGGING USERS ===")
    users = User.objects.all()
    print(f"Total users: {users.count()}")
    
    for user in users:
        print(f"Username: {user.username}")
        print(f"Role: {user.role}")
        print(f"Is Active: {user.is_active}")
        print(f"Is Staff: {user.is_staff}")
        print(f"Is Superuser: {user.is_superuser}")
        print(f"Organization: {user.org}")
        print("---")

def test_authentication():
    print("\n=== TESTING AUTHENTICATION ===")
    # Test with your actual credentials
    username = input("Enter username to test: ")
    password = input("Enter password to test: ")
    
    user = authenticate(username=username, password=password)
    if user:
        print(f"✅ Authentication successful for {user.username}")
        print(f"Role: {user.role}")
        print(f"Organization: {user.org}")
    else:
        print("❌ Authentication failed")

def create_test_users():
    print("\n=== CREATING TEST USERS ===")
    
    # Create test organization
    org, created = Organization.objects.get_or_create(
        name="Test Corp",
        defaults={
            'account': 'test-account',
            'website': 'https://test.com',
            'fuelReimbursementPolicy': '1000',
            'speedLimitPolicy': '60'
        }
    )
    if created:
        print(f"✅ Created organization: {org.name}")
    
    # Create test users
    test_users = [
        {'username': 'admin1', 'password': 'pass123', 'role': 'ADMIN', 'org': None},
        {'username': 'orgmgr1', 'password': 'pass123', 'role': 'ORG_MANAGER', 'org': org},
        {'username': 'guard1', 'password': 'pass123', 'role': 'GUARD', 'org': org},
        {'username': 'driver1', 'password': 'pass123', 'role': 'DRIVER', 'org': org},
    ]
    
    for user_data in test_users:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'role': user_data['role'],
                'org': user_data['org']
            }
        )
        if created:
            user.set_password(user_data['password'])
            user.save()
            print(f"✅ Created user: {user.username} ({user.role})")
        else:
            print(f"User {user.username} already exists")

if __name__ == "__main__":
    debug_users()
    
    choice = input("\nDo you want to create test users? (y/n): ")
    if choice.lower() == 'y':
        create_test_users()
    
    choice = input("\nDo you want to test authentication? (y/n): ")
    if choice.lower() == 'y':
        test_authentication()