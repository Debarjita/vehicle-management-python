// frontend/src/test-frontend.js
// Copy and paste this in your browser console to test frontend functionality

class VMSFrontendTester {
    constructor() {
        this.baseURL = 'http://localhost:8000/api';
        this.results = {};
        this.testCredentials = {
            admin: { username: 'admin_test', password: 'test123' },
            orgmgr: { username: 'orgmgr_test', password: 'test123' },
            guard: { username: 'guard_test', password: 'test123' },
            driver: { username: 'driver_test', password: 'test123' }
        };
    }

    log(testName, success, message = '') {
        const status = success ? '✅ PASS' : '❌ FAIL';
        this.results[testName] = { success, message };
        console.log(`${status} ${testName}: ${message}`);
    }

    async testLogin(role) {
        try {
            const credentials = this.testCredentials[role];
            const response = await fetch(`${this.baseURL}/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.access && data.role) {
                    localStorage.setItem('accessToken', data.access);
                    localStorage.setItem('userRole', data.role);
                    this.log(`Login ${role.toUpperCase()}`, true, `Role: ${data.role}`);
                    return data.access;
                } else {
                    this.log(`Login ${role.toUpperCase()}`, false, 'Missing token or role');
                    return null;
                }
            } else {
                this.log(`Login ${role.toUpperCase()}`, false, `HTTP ${response.status}`);
                return null;
            }
        } catch (error) {
            this.log(`Login ${role.toUpperCase()}`, false, error.message);
            return null;
        }
    }

    async testEndpoint(name, url, method = 'GET', data = null) {
        try {
            const token = localStorage.getItem('accessToken');
            const options = {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            if (data && method !== 'GET') {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.baseURL}${url}`, options);
            
            if (response.ok) {
                const responseData = await response.json();
                this.log(name, true, `HTTP ${response.status}`);
                return responseData;
            } else {
                const errorText = await response.text();
                this.log(name, false, `HTTP ${response.status} - ${errorText.substring(0, 100)}`);
                return null;
            }
        } catch (error) {
            this.log(name, false, error.message);
            return null;
        }
    }

    async testVehicleOperations() {
        console.log('\n🚗 Testing Vehicle Operations...');

        // Test VIN decode
        await this.testEndpoint('VIN Decode', '/decode-vin/1HGBH41JXMN109186/');

        // Test add vehicle
        const vehicleData = {
            vin: '1HGBH41JXMN109888',
            make: 'Honda',
            model: 'Civic',
            year: 2020,
            license_plate: 'TEST456'
        };
        await this.testEndpoint('Add Vehicle', '/add-vehicle/', 'POST', vehicleData);

        // Test vehicle list
        await this.testEndpoint('Vehicle List', '/vehicles/');

        // Test available vehicles
        await this.testEndpoint('Available Vehicles', '/available/');
    }

    async testUserOperations() {
        console.log('\n👥 Testing User Operations...');

        // Test user list
        await this.testEndpoint('User List', '/users/');

        // Test create user
        const userData = {
            username: `testuser_${Date.now()}`,
            password: 'test123',
            role: 'DRIVER',
            org: 1
        };
        await this.testEndpoint('Create User', '/create-user/', 'POST', userData);
    }

    async testOrganizationOperations() {
        console.log('\n🏢 Testing Organization Operations...');

        // Test organization list
        await this.testEndpoint('Organization List', '/orgs-list/');

        // Test create organization
        const orgData = {
            name: `Test Org Frontend ${Date.now()}`,
            account: 'test-frontend',
            website: 'https://frontend-test.com',
            fuelReimbursementPolicy: '2000'
        };
        await this.testEndpoint('Create Organization', '/orgs/', 'POST', orgData);
    }

    async testDashboards() {
        console.log('\n📊 Testing Dashboards...');

        const dashboards = {
            'ORG_MANAGER': '/org-dashboard/',
            'GUARD': '/guard-dashboard/',
            'DRIVER': '/driver-dashboard/'
        };

        for (const [role, endpoint] of Object.entries(dashboards)) {
            // Login with specific role
            const token = await this.testLogin(role.toLowerCase().replace('_', ''));
            if (token) {
                await this.testEndpoint(`${role} Dashboard`, endpoint);
            }
        }
    }

    async testImageUpload() {
        console.log('\n📷 Testing Image Upload...');

        // Create a simple test image (1x1 pixel PNG)
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        
        await this.testEndpoint('Image Upload', '/upload-image/', 'POST', {
            image_base64: testImage
        });
    }

    async testComponentFunctionality() {
        console.log('\n⚙️ Testing Component Functionality...');

        // Test if components can load without errors
        try {
            // Simulate component data fetching
            const componentsToTest = [
                { name: 'VehicleList', endpoint: '/vehicles/' },
                { name: 'UserList', endpoint: '/users/' },
                { name: 'OrgTree', endpoint: '/orgs-list/' },
                { name: 'VehiclePool', endpoint: '/available/' }
            ];

            for (const component of componentsToTest) {
                await this.testEndpoint(`Component: ${component.name}`, component.endpoint);
            }
        } catch (error) {
            this.log('Component Functionality', false, error.message);
        }
    }

    generateSummaryReport() {
        console.log('\n' + '='.repeat(50));
        console.log('📋 FRONTEND TEST SUMMARY');
        console.log('='.repeat(50));

        const total = Object.keys(this.results).length;
        const passed = Object.values(this.results).filter(r => r.success).length;
        const failed = total - passed;

        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Success Rate: ${((passed/total)*100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            for (const [name, result] of Object.entries(this.results)) {
                if (!result.success) {
                    console.log(`   • ${name}: ${result.message}`);
                }
            }
        }

        console.log('\n🎯 RECOMMENDATIONS:');
        if (failed === 0) {
            console.log('   • All frontend tests passed! Components are working correctly.');
        } else {
            console.log('   • Check Django server is running and endpoints are accessible');
            console.log('   • Verify CORS configuration allows frontend requests');
            console.log('   • Check browser network tab for detailed error messages');
            console.log('   • Ensure authentication tokens are valid');
        }

        return { total, passed, failed };
    }

    async runAllTests() {
        console.log('🚀 Starting VMS Frontend Test Suite');
        console.log('='.repeat(50));

        // Start with admin login
        await this.testLogin('admin');

        // Run all test categories
        await this.testVehicleOperations();
        await this.testUserOperations();
        await this.testOrganizationOperations();
        await this.testImageUpload();
        await this.testComponentFunctionality();
        await this.testDashboards();

        // Generate final report
        return this.generateSummaryReport();
    }

    // Quick test specific endpoints
    async quickTest() {
        console.log('⚡ Running Quick Frontend Test...');
        
        const token = await this.testLogin('admin');
        if (!token) {
            console.log('❌ Cannot proceed without valid authentication');
            return;
        }

        const quickTests = [
            { name: 'Orgs List', endpoint: '/orgs-list/' },
            { name: 'Users List', endpoint: '/users/' },
            { name: 'Vehicles List', endpoint: '/vehicles/' },
            { name: 'Available Vehicles', endpoint: '/available/' }
        ];

        for (const test of quickTests) {
            await this.testEndpoint(test.name, test.endpoint);
        }

        this.generateSummaryReport();
    }
}

// Create global instance
window.vmsFrontendTester = new VMSFrontendTester();

// Usage instructions
console.log(`
VMS Frontend Tester loaded! 

Usage:
• vmsFrontendTester.runAllTests() - Run complete test suite
• vmsFrontendTester.quickTest() - Run basic endpoint tests
• vmsFrontendTester.testLogin('admin') - Test specific role login
• vmsFrontendTester.testEndpoint('Test Name', '/endpoint/') - Test specific endpoint

Example:
vmsFrontendTester.runAllTests().then(results => {
    console.log('Tests completed:', results);
});
`);

// Auto-run quick test
console.log('Running quick test automatically...');
vmsFrontendTester.quickTest();