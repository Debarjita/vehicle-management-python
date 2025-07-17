# backend/ai_features/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from vehicles.models import Organization, Vehicle
from .models import FaceEncoding, FaceAttendanceLog, LicensePlateRecord
from .utils import ImageProcessor, FaceRecognitionProcessor, LicensePlateProcessor
import base64
import json
import numpy as np
from unittest.mock import patch, MagicMock
from PIL import Image
import io

User = get_user_model()

class AIFeaturesTestCase(TestCase):
    def setUp(self):
        # Create test organization
        self.org = Organization.objects.create(
            name='Test Org',
            account='TEST001',
            website='https://test.com'
        )
        
        # Create test users
        self.admin_user = User.objects.create_user(
            username='test_admin',
            password='testpass123',
            role='ADMIN',
            org=self.org
        )
        
        self.guard_user = User.objects.create_user(
            username='test_guard',
            password='testpass123',
            role='GUARD',
            org=self.org
        )
        
        self.driver_user = User.objects.create_user(
            username='test_driver',
            password='testpass123',
            role='DRIVER',
            org=self.org
        )
        
        # Create org manager
        self.org_manager = User.objects.create_user(
            username='test_orgmgr',
            password='testpass123',
            role='ORG_MANAGER',
            org=self.org
        )
        
        # Create test vehicle
        self.vehicle = Vehicle.objects.create(
            vin='TEST123456789',
            license_plate='TEST123',
            make='Test',
            model='Vehicle',
            year=2023,
            org=self.org
        )
        
        self.client = APIClient()
        
        # Create a test base64 image
        self.test_image = self.create_test_image_base64()
    
    def create_test_image_base64(self):
        """Create a test base64 encoded image"""
        # Create a simple test image
        image = Image.new('RGB', (100, 100), color='red')
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/jpeg;base64,{img_str}"
    
    def get_auth_headers(self, user):
        """Get authentication headers for user"""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        return {'HTTP_AUTHORIZATION': f'Bearer {refresh.access_token}'}
    
    def test_face_registration_permission(self):
        """Test face registration permissions"""
        # Admin should be able to register faces
        headers = self.get_auth_headers(self.admin_user)
        response = self.client.post('/api/ai/register-face/', {
            'user_id': self.driver_user.id,
            'image': self.test_image
        }, **headers)
        
        # Should not fail due to permissions (will fail due to no face in image)
        self.assertNotEqual(response.status_code, 403)
        
        # Org Manager should be able to register faces
        headers = self.get_auth_headers(self.org_manager)
        response = self.client.post('/api/ai/register-face/', {
            'user_id': self.driver_user.id,
            'image': self.test_image
        }, **headers)
        
        self.assertNotEqual(response.status_code, 403)
        
        # Driver should not be able to register faces for others
        headers = self.get_auth_headers(self.driver_user)
        response = self.client.post('/api/ai/register-face/', {
            'user_id': self.admin_user.id,
            'image': self.test_image
        }, **headers)
        
        self.assertEqual(response.status_code, 403)
        
        # Guard should not be able to register faces
        headers = self.get_auth_headers(self.guard_user)
        response = self.client.post('/api/ai/register-face/', {
            'user_id': self.driver_user.id,
            'image': self.test_image
        }, **headers)
        
        self.assertEqual(response.status_code, 403)
    
    def test_face_verification_access(self):
        """Test face verification access"""
        # All authenticated users should be able to verify faces
        for user in [self.admin_user, self.guard_user, self.driver_user, self.org_manager]:
            headers = self.get_auth_headers(user)
            response = self.client.post('/api/ai/verify-face/', {
                'image': self.test_image
            }, **headers)
            
            # Should not fail due to permissions
            self.assertNotEqual(response.status_code, 403)
    
    def test_license_plate_scanning_permission(self):
        """Test license plate scanning permissions"""
        # Admin should be able to scan plates
        headers = self.get_auth_headers(self.admin_user)
        response = self.client.post('/api/ai/scan-license-plate/', {
            'image': self.test_image,
            'entry_type': 'ENTRY'
        }, **headers)
        
        self.assertNotEqual(response.status_code, 403)
        
        # Org Manager should be able to scan plates
        headers = self.get_auth_headers(self.org_manager)
        response = self.client.post('/api/ai/scan-license-plate/', {
            'image': self.test_image,
            'entry_type': 'ENTRY'
        }, **headers)
        
        self.assertNotEqual(response.status_code, 403)
        
        # Guard should be able to scan plates
        headers = self.get_auth_headers(self.guard_user)
        response = self.client.post('/api/ai/scan-license-plate/', {
            'image': self.test_image,
            'entry_type': 'ENTRY'
        }, **headers)
        
        self.assertNotEqual(response.status_code, 403)
        
        # Driver should not be able to scan plates
        headers = self.get_auth_headers(self.driver_user)
        response = self.client.post('/api/ai/scan-license-plate/', {
            'image': self.test_image,
            'entry_type': 'ENTRY'
        }, **headers)
        
        self.assertEqual(response.status_code, 403)
    
    def test_attendance_logs_access(self):
        """Test attendance logs access"""
        # Create test log
        log = FaceAttendanceLog.objects.create(
            user=self.driver_user,
            scan_type='CHECK_IN',
            confidence_score=95.5,
            scanned_image='test_image'
        )
        
        # All users should be able to view logs
        for user in [self.admin_user, self.guard_user, self.driver_user, self.org_manager]:
            headers = self.get_auth_headers(user)
            response = self.client.get('/api/ai/face-attendance-logs/', **headers)
            self.assertEqual(response.status_code, 200)
            
            # Check response format
            data = response.json()
            self.assertIsInstance(data, list)
            if data:  # If logs exist
                self.assertIn('user', data[0])
                self.assertIn('scan_type', data[0])
                self.assertIn('confidence', data[0])
    
    def test_license_plate_logs_access(self):
        """Test license plate logs access"""
        # Create test log
        log = LicensePlateRecord.objects.create(
            vehicle=self.vehicle,
            detected_plate='TEST123',
            confidence_score=88.5,
            original_image='test_image',
            entry_type='ENTRY',
            scanned_by=self.guard_user
        )
        
        # All users should be able to view logs
        for user in [self.admin_user, self.guard_user, self.driver_user, self.org_manager]:
            headers = self.get_auth_headers(user)
            response = self.client.get('/api/ai/license-plate-logs/', **headers)
            self.assertEqual(response.status_code, 200)
            
            # Check response format
            data = response.json()
            self.assertIsInstance(data, list)
            if data:  # If logs exist
                self.assertIn('detected_plate', data[0])
                self.assertIn('confidence', data[0])
                self.assertIn('entry_type', data[0])
    
    def test_face_registration_validation(self):
        """Test face registration validation"""
        headers = self.get_auth_headers(self.admin_user)
        
        # Test missing image
        response = self.client.post('/api/ai/register-face/', {
            'user_id': self.driver_user.id
        }, **headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())
        
        # Test missing user_id (should default to current user)
        response = self.client.post('/api/ai/register-face/', {
            'image': self.test_image
        }, **headers)
        # Should not fail due to missing user_id
        self.assertNotEqual(response.status_code, 400)
        
        # Test invalid user_id
        response = self.client.post('/api/ai/register-face/', {
            'user_id': 99999,
            'image': self.test_image
        }, **headers)
        self.assertEqual(response.status_code, 404)
    
    def test_face_verification_validation(self):
        """Test face verification validation"""
        headers = self.get_auth_headers(self.driver_user)
        
        # Test missing image
        response = self.client.post('/api/ai/verify-face/', {
            'scan_type': 'CHECK_IN'
        }, **headers)
        self.assertEqual(response.status_code, 400)
        
        # Test invalid scan_type (should still work with default)
        response = self.client.post('/api/ai/verify-face/', {
            'image': self.test_image,
            'scan_type': 'INVALID_TYPE'
        }, **headers)
        self.assertNotEqual(response.status_code, 400)
    
    def test_license_plate_validation(self):
        """Test license plate scanning validation"""
        headers = self.get_auth_headers(self.guard_user)
        
        # Test missing image
        response = self.client.post('/api/ai/scan-license-plate/', {
            'entry_type': 'ENTRY'
        }, **headers)
        self.assertEqual(response.status_code, 400)
        
        # Test invalid entry_type (should default)
        response = self.client.post('/api/ai/scan-license-plate/', {
            'image': self.test_image,
            'entry_type': 'INVALID'
        }, **headers)
        # Should process with invalid entry_type
        self.assertNotEqual(response.status_code, 400)
        
        # Test invalid vehicle_id
        response = self.client.post('/api/ai/scan-license-plate/', {
            'image': self.test_image,
            'entry_type': 'ENTRY',
            'vehicle_id': 99999
        }, **headers)
        # Should still process even with invalid vehicle_id
        self.assertNotEqual(response.status_code, 400)
    
    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access AI endpoints"""
        endpoints = [
            ('/api/ai/register-face/', {'image': self.test_image}),
            ('/api/ai/verify-face/', {'image': self.test_image}),
            ('/api/ai/scan-license-plate/', {'image': self.test_image, 'entry_type': 'ENTRY'}),
        ]
        
        for endpoint, data in endpoints:
            response = self.client.post(endpoint, data)
            self.assertEqual(response.status_code, 401)
        
        # Test GET endpoints
        get_endpoints = [
            '/api/ai/face-attendance-logs/',
            '/api/ai/license-plate-logs/',
        ]
        
        for endpoint in get_endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, 401)

class ImageProcessorTestCase(TestCase):
    """Test the ImageProcessor utility class"""
    
    def setUp(self):
        self.processor = ImageProcessor()
        
        # Create test image
        image = Image.new('RGB', (100, 100), color='blue')
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG')
        self.test_image_bytes = buffer.getvalue()
        self.test_image_b64 = base64.b64encode(self.test_image_bytes).decode()
        self.test_image_data_url = f"data:image/jpeg;base64,{self.test_image_b64}"
    
    def test_decode_base64_image(self):
        """Test base64 image decoding"""
        # Test with data URL
        result = self.processor.decode_base64_image(self.test_image_data_url)
        self.assertIsInstance(result, np.ndarray)
        self.assertEqual(result.shape, (100, 100, 3))
        
        # Test with plain base64
        result = self.processor.decode_base64_image(self.test_image_b64)
        self.assertIsInstance(result, np.ndarray)
        
        # Test invalid base64
        with self.assertRaises(ValueError):
            self.processor.decode_base64_image("invalid_base64")
    
    def test_encode_image_to_base64(self):
        """Test image to base64 encoding"""
        # Create test numpy array
        test_array = np.zeros((50, 50, 3), dtype=np.uint8)
        test_array[:, :] = [255, 0, 0]  # Red image
        
        result = self.processor.encode_image_to_base64(test_array)
        self.assertIsInstance(result, str)
        self.assertTrue(result.startswith('data:image/jpeg;base64,'))
        
        # Test invalid array
        result = self.processor.encode_image_to_base64("invalid")
        self.assertIsNone(result)

class FaceRecognitionProcessorTestCase(TestCase):
    """Test the FaceRecognitionProcessor utility class"""
    
    def setUp(self):
        self.processor = FaceRecognitionProcessor()
    
    @patch('ai_features.utils.face_recognition.face_locations')
    @patch('ai_features.utils.face_recognition.face_encodings')
    def test_extract_face_encoding_success(self, mock_encodings, mock_locations):
        """Test successful face encoding extraction"""
        # Mock successful face detection
        mock_locations.return_value = [(10, 90, 90, 10)]  # (top, right, bottom, left)
        mock_encodings.return_value = [np.random.rand(128)]
        
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        result = self.processor.extract_face_encoding(test_image)
        
        self.assertTrue(result['success'])
        self.assertIsNotNone(result['encoding'])
        self.assertEqual(len(result['encoding']), 128)
        self.assertIsNotNone(result['location'])
    
    @patch('ai_features.utils.face_recognition.face_locations')
    def test_extract_face_encoding_no_face(self, mock_locations):
        """Test face encoding when no face is detected"""
        mock_locations.return_value = []
        
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        result = self.processor.extract_face_encoding(test_image)
        
        self.assertFalse(result['success'])
        self.assertIn('No face detected', result['error'])
    
    @patch('ai_features.utils.face_recognition.face_locations')
    def test_extract_face_encoding_multiple_faces(self, mock_locations):
        """Test face encoding when multiple faces are detected"""
        mock_locations.return_value = [(10, 40, 40, 10), (60, 90, 90, 60)]
        
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        result = self.processor.extract_face_encoding(test_image)
        
        self.assertFalse(result['success'])
        self.assertIn('Multiple faces detected', result['error'])
    
    @patch('ai_features.utils.face_recognition.compare_faces')
    @patch('ai_features.utils.face_recognition.face_distance')
    def test_compare_faces_success(self, mock_distance, mock_compare):
        """Test successful face comparison"""
        mock_compare.return_value = [True, False, True]
        mock_distance.return_value = np.array([0.3, 0.8, 0.4])
        
        known_encodings = [np.random.rand(128) for _ in range(3)]
        unknown_encoding = np.random.rand(128)
        
        result = self.processor.compare_faces(known_encodings, unknown_encoding)
        
        self.assertEqual(result['best_match_index'], 0)  # Lowest distance
        self.assertGreater(result['confidence'], 0)
        self.assertEqual(len(result['matches']), 3)
    
    def test_compare_faces_no_known_encodings(self):
        """Test face comparison with no known encodings"""
        result = self.processor.compare_faces([], np.random.rand(128))
        
        self.assertEqual(result['best_match_index'], None)
        self.assertEqual(result['confidence'], 0)
        self.assertEqual(len(result['matches']), 0)

class LicensePlateProcessorTestCase(TestCase):
    """Test the LicensePlateProcessor utility class"""
    
    def setUp(self):
        self.processor = LicensePlateProcessor()
    
    def test_preprocess_image(self):
        """Test image preprocessing methods"""
        test_image = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        
        processed_images = self.processor.preprocess_image(test_image)
        
        self.assertGreater(len(processed_images), 0)
        self.assertIn('original', [method for method, _ in processed_images])
        self.assertIn('adaptive_thresh', [method for method, _ in processed_images])
        
        # Check that all processed images are valid numpy arrays
        for method, img in processed_images:
            self.assertIsInstance(img, np.ndarray)
            self.assertEqual(len(img.shape), 2)  # Should be grayscale
    
    def test_is_valid_license_plate(self):
        """Test license plate validation"""
        # Valid plates
        valid_plates = ['ABC123', 'XY1234', '123ABC', 'A123BCD', '12AB34']
        for plate in valid_plates:
            self.assertTrue(self.processor.is_valid_license_plate(plate), f"{plate} should be valid")
        
        # Invalid plates
        invalid_plates = ['', 'AB', 'ABCDEFGHIJK', '!!!', 'ab123']
        for plate in invalid_plates:
            self.assertFalse(self.processor.is_valid_license_plate(plate), f"{plate} should be invalid")
    
    @patch('ai_features.utils.pytesseract.image_to_string')
    def test_extract_text_success(self, mock_ocr):
        """Test successful text extraction"""
        mock_ocr.return_value = "ABC123"
        
        test_image = np.zeros((100, 100), dtype=np.uint8)
        result = self.processor.extract_text(test_image)
        
        self.assertTrue(result['success'])
        self.assertEqual(result['best_result']['text'], 'ABC123')
        self.assertGreater(result['best_result']['confidence'], 0)
    
    @patch('ai_features.utils.pytesseract.image_to_string')
    def test_extract_text_no_valid_plate(self, mock_ocr):
        """Test text extraction when no valid plate is found"""
        mock_ocr.return_value = "INVALID_TEXT_!!!"
        
        test_image = np.zeros((100, 100), dtype=np.uint8)
        result = self.processor.extract_text(test_image)
        
        self.assertFalse(result['success'])
        self.assertIn('No license plate text detected', result['error'])

class ModelTestCase(TestCase):
    """Test AI feature models"""
    
    def setUp(self):
        self.org = Organization.objects.create(
            name='Test Org',
            account='TEST001',
            website='https://test.com'
        )
        
        self.user = User.objects.create_user(
            username='test_user',
            password='testpass123',
            role='DRIVER',
            org=self.org
        )
        
        self.vehicle = Vehicle.objects.create(
            vin='TEST123456789',
            license_plate='TEST123',
            make='Test',
            model='Vehicle',
            year=2023,
            org=self.org
        )
    
    def test_face_encoding_model(self):
        """Test FaceEncoding model"""
        face_data = FaceEncoding.objects.create(
            user=self.user,
            encoding_data=json.dumps([1.0, 2.0, 3.0]),
            photo_url='https://example.com/photo.jpg'
        )
        
        self.assertEqual(str(face_data), f"Face data for {self.user.username}")
        self.assertTrue(face_data.is_active)
        self.assertIsNotNone(face_data.created_at)
    
    def test_face_attendance_log_model(self):
        """Test FaceAttendanceLog model"""
        log = FaceAttendanceLog.objects.create(
            user=self.user,
            scan_type='CHECK_IN',
            confidence_score=95.5,
            scanned_image='base64_image_data',
            location='Main Gate'
        )
        
        self.assertIn(self.user.username, str(log))
        self.assertIn('CHECK_IN', str(log))
        self.assertEqual(log.confidence_score, 95.5)
    
    def test_license_plate_record_model(self):
        """Test LicensePlateRecord model"""
        record = LicensePlateRecord.objects.create(
            vehicle=self.vehicle,
            detected_plate='ABC123',
            confidence_score=88.0,
            original_image='base64_image_data',
            entry_type='ENTRY',
            scanned_by=self.user
        )
        
        self.assertIn('ABC123', str(record))
        self.assertIn('ENTRY', str(record))
        self.assertEqual(record.vehicle, self.vehicle)
        self.assertFalse(record.verified)  # Default is False
