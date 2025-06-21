# backend/quick_test.py
# Quick test for the specific failing features

import django
import os
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vms.settings')
django.setup()

from django.contrib.auth import get_user_model
from vehicles.models import Vehicle, Organization

User = get_user_model()

def test_specific_issues():
    base_url = "http://localhost:8000/api"
    
    print("🚀 Testing Specific VMS Issues")
    print("=" * 50)
    
    # Get admin token
    try:
        response = requests.post(f"{base_url}/token/", {
            'username': 'admin_test',
            'password': 'test123'
        })
        
        if response.status_code == 200:
            token = response.json()['access']
            headers = {"Authorization": f"Bearer {token}"}
            print("✅ Admin login successful")
        else:
            print("❌ Admin login failed")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Test 1: VIN Decode with a working VIN
    print("\n1. Testing VIN Decode...")
    working_vins = [
        "TEST",  # Our test VIN
        "1HGBH41JXMN109186",  # Honda Civic
        "WVWZZZ1JZ3W386752",  # VW
        "1G1ZT53836F109149"   # Chevy
    ]
    
    for vin in working_vins:
        try:
            response = requests.get(f"{base_url}/decode-vin/{vin}/", headers=headers)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ VIN {vin}: {data.get('make', 'Unknown')} {data.get('model', 'Unknown')} {data.get('year', 'Unknown')}")
                break
            else:
                print(f"❌ VIN {vin} failed: {response.status_code}")
        except Exception as e:
            print(f"❌ VIN {vin} error: {e}")
    
    # Test 2: User Creation
    print("\n2. Testing User Creation...")
    try:
        user_data = {
            "username": f"quicktest_user",
            "password": "test123",
            "role": "DRIVER",
            "org": 1  # Assuming test org exists
        }
        
        response = requests.post(f"{base_url}/create-user/", 
                               json=user_data, 
                               headers=headers)
        
        if response.status_code in [200, 201]:
            print("✅ User creation successful")
        else:
            print(f"❌ User creation failed: {response.status_code} - {response.text[:200]}")
    except Exception as e:
        print(f"❌ User creation error: {e}")
    
    # Test 3: Organization Creation  
    print("\n3. Testing Organization Creation...")
    try:
        org_data = {
            "name": f"Quick Test Org",
            "account": "quick-test",
            "website": "https://quicktest.com",
            "fuelReimbursementPolicy": "1000"
        }
        
        response = requests.post(f"{base_url}/orgs/", 
                               json=org_data, 
                               headers=headers)
        
        if response.status_code in [200, 201]:
            print("✅ Organization creation successful")
        else:
            print(f"❌ Organization creation failed: {response.status_code} - {response.text[:200]}")
    except Exception as e:
        print(f"❌ Organization creation error: {e}")
    
    # Test 4: Vehicle Claiming
    print("\n4. Testing Vehicle Claiming...")
    try:
        # Get available vehicles
        response = requests.get(f"{base_url}/available/", headers=headers)
        if response.status_code == 200:
            vehicles = response.json()
            if vehicles:
                # Try to claim first vehicle
                claim_data = {
                    "vehicle_ids": [vehicles[0]['id']],
                    "org_id": 1  # Admin claiming for org 1
                }
                
                response = requests.post(f"{base_url}/claim/", 
                                       json=claim_data, 
                                       headers=headers)
                
                if response.status_code == 200:
                    print("✅ Vehicle claiming successful")
                else:
                    print(f"❌ Vehicle claiming failed: {response.status_code} - {response.text[:200]}")
            else:
                print("ℹ️  No available vehicles to claim")
        else:
            print(f"❌ Failed to get available vehicles: {response.status_code}")
    except Exception as e:
        print(f"❌ Vehicle claiming error: {e}")
    
    # Test 5: Dashboard Access
    print("\n5. Testing Dashboard Access...")
    dashboards = {
        "Admin Dashboard": "/vehicles/",
        "Org Dashboard": "/org-dashboard/", 
        "Guard Dashboard": "/guard-dashboard/",
        "Driver Dashboard": "/driver-dashboard/"
    }
    
    for name, endpoint in dashboards.items():
        try:
            response = requests.get(f"{base_url}{endpoint}", headers=headers)
            if response.status_code == 200:
                print(f"✅ {name} accessible")
            else:
                print(f"❌ {name} failed: {response.status_code}")
        except Exception as e:
            print(f"❌ {name} error: {e}")

if __name__ == "__main__":
    test_specific_issues()