# backend/test_vms_comprehensive.py
# Run this to test all VMS functionality automatically

import django
import os
import requests
import json
import time
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vms.settings')
django.setup()

from django.contrib.auth import get_user_model
from vehicles.models import Vehicle, Organization
from django.db import transaction

User = get_user_model()

class VMSTestSuite:
    def __init__(self):
        self.base_url = "http://localhost:8000/api"
        self.tokens = {}
        self.test_results = {}
        
    def log_test(self, test_name, success, message=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results[test_name] = {"success": success, "message": message}
        print(f"{status} {test_name}: {message}")
        
    def setup_test_data(self):
        """Create test users and organizations"""
        print("\n🔧 Setting up test data...")
        
        try:
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
            
            # Create test users
            test_users = [
                {'username': 'admin_test', 'password': 'test123', 'role': 'ADMIN', 'org': None},
                {'username': 'orgmgr_test', 'password': 'test123', 'role': 'ORG_MANAGER', 'org': org},
                {'username': 'guard_test', 'password': 'test123', 'role': 'GUARD', 'org': org},
                {'username': 'driver_test', 'password': 'test123', 'role': 'DRIVER', 'org': org},
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
                    
            self.log_test("Setup Test Data", True, "Test users and organization created")
            
        except Exception as e:
            self.log_test("Setup Test Data", False, str(e))
    
    def test_authentication(self):
        """Test login for all user roles"""
        print("\n🔐 Testing Authentication...")
        
        test_users = [
            {'username': 'admin_test', 'password': 'test123', 'role': 'ADMIN'},
            {'username': 'orgmgr_test', 'password': 'test123', 'role': 'ORG_MANAGER'},
            {'username': 'guard_test', 'password': 'test123', 'role': 'GUARD'},
            {'username': 'driver_test', 'password': 'test123', 'role': 'DRIVER'},
        ]
        
        for user in test_users:
            try:
                response = requests.post(f"{self.base_url}/token/", {
                    'username': user['username'],
                    'password': user['password']
                })
                
                if response.status_code == 200:
                    data = response.json()
                    if 'access' in data and 'role' in data:
                        self.tokens[user['role']] = data['access']
                        self.log_test(f"Login {user['role']}", True, f"Token received, role: {data['role']}")
                    else:
                        self.log_test(f"Login {user['role']}", False, "Missing access token or role")
                else:
                    self.log_test(f"Login {user['role']}", False, f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Login {user['role']}", False, str(e))
    
    def test_api_endpoints(self):
        """Test all API endpoints"""
        print("\n🌐 Testing API Endpoints...")
        
        # Test endpoints that should work
        test_cases = [
            # Basic endpoints
            {"method": "GET", "url": "/orgs-list/", "role": "ADMIN", "name": "Get Organizations List"},
            {"method": "GET", "url": "/users/", "role": "ADMIN", "name": "Get Users List"},
            {"method": "GET", "url": "/available/", "role": "ADMIN", "name": "Get Available Vehicles"},
            {"method": "GET", "url": "/vehicles/", "role": "ADMIN", "name": "Get All Vehicles"},
            
            # VIN decode test
            {"method": "GET", "url": "/decode-vin/1HGBH41JXMN109186/", "role": "ADMIN", "name": "VIN Decode Test"},
            
            # Dashboard endpoints
            {"method": "GET", "url": "/org-dashboard/", "role": "ORG_MANAGER", "name": "Org Manager Dashboard"},
            {"method": "GET", "url": "/guard-dashboard/", "role": "GUARD", "name": "Guard Dashboard"},
            {"method": "GET", "url": "/driver-dashboard/", "role": "DRIVER", "name": "Driver Dashboard"},
            
            # Organization specific endpoints
            {"method": "GET", "url": "/my-org-users/", "role": "ORG_MANAGER", "name": "Get My Org Users"},
            {"method": "GET", "url": "/my-org-vehicles/", "role": "ORG_MANAGER", "name": "Get My Org Vehicles"},
        ]
        
        for test in test_cases:
            try:
                if test["role"] not in self.tokens:
                    self.log_test(test["name"], False, f"No token for role {test['role']}")
                    continue
                    
                headers = {"Authorization": f"Bearer {self.tokens[test['role']]}"}
                
                if test["method"] == "GET":
                    response = requests.get(f"{self.base_url}{test['url']}", headers=headers)
                elif test["method"] == "POST":
                    response = requests.post(f"{self.base_url}{test['url']}", headers=headers, json=test.get("data", {}))
                
                if response.status_code in [200, 201]:
                    self.log_test(test["name"], True, f"HTTP {response.status_code}")
                else:
                    self.log_test(test["name"], False, f"HTTP {response.status_code} - {response.text[:100]}")
                    
            except Exception as e:
                self.log_test(test["name"], False, str(e))
    
    def test_vehicle_operations(self):
        """Test vehicle-related operations"""
        print("\n🚗 Testing Vehicle Operations...")
        
        if "ADMIN" not in self.tokens:
            self.log_test("Vehicle Operations", False, "No admin token available")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['ADMIN']}"}
        
        # Test VIN decode
        try:
            response = requests.get(f"{self.base_url}/decode-vin/1HGBH41JXMN109186/", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if 'make' in data and 'model' in data:
                    self.log_test("VIN Decode", True, f"Decoded: {data['make']} {data['model']}")
                else:
                    self.log_test("VIN Decode", False, "Missing make/model in response")
            else:
                self.log_test("VIN Decode", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("VIN Decode", False, str(e))
        
        # Test add vehicle
        try:
            vehicle_data = {
                "vin": "1HGBH41JXMN109999",  # Test VIN
                "make": "Honda",
                "model": "Civic", 
                "year": 2020,
                "license_plate": "TEST123",
                "org": "Test Corp"
            }
            
            response = requests.post(f"{self.base_url}/add-vehicle/", headers=headers, json=vehicle_data)
            if response.status_code in [200, 201]:
                self.log_test("Add Vehicle", True, "Vehicle created successfully")
            else:
                self.log_test("Add Vehicle", False, f"HTTP {response.status_code} - {response.text[:100]}")
        except Exception as e:
            self.log_test("Add Vehicle", False, str(e))
    
    def test_user_operations(self):
        """Test user management operations"""
        print("\n👥 Testing User Operations...")
        
        if "ADMIN" not in self.tokens:
            self.log_test("User Operations", False, "No admin token available")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['ADMIN']}"}
        
        # Test create user
        try:
            user_data = {
                "username": f"testuser_{int(time.time())}",
                "password": "testpass123",
                "role": "DRIVER",
                "org": 1  # Assuming test org has ID 1
            }
            
            response = requests.post(f"{self.base_url}/create-user/", headers=headers, json=user_data)
            if response.status_code in [200, 201]:
                self.log_test("Create User", True, "User created successfully")
            else:
                self.log_test("Create User", False, f"HTTP {response.status_code} - {response.text[:100]}")
        except Exception as e:
            self.log_test("Create User", False, str(e))
        
        # Test list users
        try:
            response = requests.get(f"{self.base_url}/users/", headers=headers)
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list):
                    self.log_test("List Users", True, f"Found {len(users)} users")
                else:
                    self.log_test("List Users", False, "Response is not a list")
            else:
                self.log_test("List Users", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("List Users", False, str(e))
    
    def test_organization_operations(self):
        """Test organization operations"""
        print("\n🏢 Testing Organization Operations...")
        
        if "ADMIN" not in self.tokens:
            self.log_test("Organization Operations", False, "No admin token available")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['ADMIN']}"}
        
        # Test list organizations
        try:
            response = requests.get(f"{self.base_url}/orgs-list/", headers=headers)
            if response.status_code == 200:
                orgs = response.json()
                if isinstance(orgs, list):
                    self.log_test("List Organizations", True, f"Found {len(orgs)} organizations")
                else:
                    self.log_test("List Organizations", False, "Response is not a list")
            else:
                self.log_test("List Organizations", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("List Organizations", False, str(e))
        
        # Test create organization
        try:
            org_data = {
                "name": f"Test Org {int(time.time())}",
                "account": "test-account-new",
                "website": "https://testorg.com",
                "fuelReimbursementPolicy": "1500",
                "speedLimitPolicy": "65"
            }
            
            response = requests.post(f"{self.base_url}/orgs/", headers=headers, json=org_data)
            if response.status_code in [200, 201]:
                self.log_test("Create Organization", True, "Organization created successfully")
            else:
                self.log_test("Create Organization", False, f"HTTP {response.status_code} - {response.text[:100]}")
        except Exception as e:
            self.log_test("Create Organization", False, str(e))
    
    def test_dashboard_functionality(self):
        """Test dashboard-specific functionality"""
        print("\n📊 Testing Dashboard Functionality...")
        
        # Test each role's dashboard
        role_dashboards = {
            "ORG_MANAGER": "/org-dashboard/",
            "GUARD": "/guard-dashboard/", 
            "DRIVER": "/driver-dashboard/"
        }
        
        for role, endpoint in role_dashboards.items():
            if role not in self.tokens:
                self.log_test(f"{role} Dashboard", False, f"No token for {role}")
                continue
                
            try:
                headers = {"Authorization": f"Bearer {self.tokens[role]}"}
                response = requests.get(f"{self.base_url}{endpoint}", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(f"{role} Dashboard", True, f"Dashboard loaded with data: {list(data.keys())}")
                else:
                    self.log_test(f"{role} Dashboard", False, f"HTTP {response.status_code}")
            except Exception as e:
                self.log_test(f"{role} Dashboard", False, str(e))
    
    def test_image_upload(self):
        """Test image upload functionality"""
        print("\n📷 Testing Image Upload...")
        
        if "ADMIN" not in self.tokens:
            self.log_test("Image Upload", False, "No admin token available")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['ADMIN']}"}
        
        # Create a simple test image (base64 encoded 1x1 pixel PNG)
        test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        
        try:
            response = requests.post(f"{self.base_url}/upload-image/", 
                                   headers=headers, 
                                   json={"image_base64": test_image_base64})
            
            if response.status_code == 200:
                data = response.json()
                if 'recognized_text' in data:
                    self.log_test("Image Upload", True, "Image processed successfully")
                else:
                    self.log_test("Image Upload", False, "Missing recognized_text in response")
            else:
                self.log_test("Image Upload", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Image Upload", False, str(e))
    
    def run_all_tests(self):
        """Run the complete test suite"""
        print("🚀 Starting VMS Comprehensive Test Suite")
        print("=" * 50)
        
        start_time = datetime.now()
        
        # Run all tests
        self.setup_test_data()
        self.test_authentication()
        self.test_api_endpoints()
        self.test_vehicle_operations()
        self.test_user_operations()
        self.test_organization_operations()
        self.test_dashboard_functionality()
        self.test_image_upload()
        
        # Generate summary
        end_time = datetime.now()
        duration = end_time - start_time
        
        print("\n" + "=" * 50)
        print("📋 TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⏱️  Duration: {duration.total_seconds():.2f} seconds")
        print(f"📊 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for test_name, result in self.test_results.items():
                if not result['success']:
                    print(f"   • {test_name}: {result['message']}")
        
        print("\n🎯 RECOMMENDATIONS:")
        if failed_tests == 0:
            print("   • All tests passed! Your VMS system is working correctly.")
        else:
            print("   • Fix the failed endpoints by checking URL configurations")
            print("   • Verify Django server is running on localhost:8000")
            print("   • Check database migrations are applied")
            print("   • Ensure all required views are implemented")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    # Run the test suite
    test_suite = VMSTestSuite()
    passed, failed = test_suite.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if failed == 0 else 1)