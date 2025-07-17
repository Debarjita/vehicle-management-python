# backend/ai_features/views.py
import json
import base64
import numpy as np
import cv2
from PIL import Image
import io
import face_recognition
import pytesseract
import re
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import FaceEncoding, FaceAttendanceLog, LicensePlateRecord
from vehicles.models import Vehicle
from accounts.permissions import IsGuard

User = get_user_model()

# Configure Tesseract path (adjust as needed)
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def decode_base64_image(base64_string):
    """Convert base64 string to numpy array"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_bytes = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_bytes))
        return np.array(image)
    except Exception as e:
        raise ValueError(f"Invalid image data: {str(e)}")

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_face(request):
    """Register a user's face for recognition"""
    try:
        user_id = request.data.get('user_id', request.user.id)
        image_data = request.data.get('image')
        
        if not image_data:
            return Response({'error': 'No image provided'}, status=400)
        
        # Get target user (admins can register for others)
        if user_id != request.user.id and request.user.role not in ['ADMIN', 'ORG_MANAGER']:
            return Response({'error': 'Permission denied'}, status=403)
        
        target_user = User.objects.get(id=user_id)
        
        # Decode and process image
        image_array = decode_base64_image(image_data)
        rgb_image = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
        
        # Find face encodings
        face_locations = face_recognition.face_locations(rgb_image)
        if not face_locations:
            return Response({'error': 'No face detected in image'}, status=400)
        
        if len(face_locations) > 1:
            return Response({'error': 'Multiple faces detected. Please use image with single face'}, status=400)
        
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        if not face_encodings:
            return Response({'error': 'Could not generate face encoding'}, status=400)
        
        # Save encoding
        encoding_json = json.dumps(face_encodings[0].tolist())
        
        face_data, created = FaceEncoding.objects.get_or_create(
            user=target_user,
            defaults={'encoding_data': encoding_json}
        )
        
        if not created:
            face_data.encoding_data = encoding_json
            face_data.save()
        
        # Update user face registration status
        target_user.is_face_registered = True
        target_user.save()
        
        return Response({
            'message': 'Face registered successfully',
            'user': target_user.username,
            'face_id': face_data.id
        })
        
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_face(request):
    """Verify face for attendance/login"""
    try:
        image_data = request.data.get('image')
        scan_type = request.data.get('scan_type', 'VERIFICATION')
        user_id = request.data.get('user_id')  # Optional - for guard verification
        
        if not image_data:
            return Response({'error': 'No image provided'}, status=400)
        
        # Decode image
        image_array = decode_base64_image(image_data)
        rgb_image = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
        
        # Find faces
        face_locations = face_recognition.face_locations(rgb_image)
        if not face_locations:
            return Response({'error': 'No face detected'}, status=400)
        
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        if not face_encodings:
            return Response({'error': 'Could not process face'}, status=400)
        
        # Compare with registered faces
        if user_id:
            # Specific user verification (for guards)
            try:
                target_user = User.objects.get(id=user_id)
                face_data = FaceEncoding.objects.get(user=target_user, is_active=True)
            except (User.DoesNotExist, FaceEncoding.DoesNotExist):
                return Response({'error': 'User face data not found'}, status=404)
            
            known_encodings = [np.array(json.loads(face_data.encoding_data))]
            known_users = [target_user]
        else:
            # General verification - check against all registered faces
            face_data_list = FaceEncoding.objects.filter(is_active=True).select_related('user')
            if not face_data_list:
                return Response({'error': 'No registered faces found'}, status=404)
            
            known_encodings = []
            known_users = []
            for face_data in face_data_list:
                known_encodings.append(np.array(json.loads(face_data.encoding_data)))
                known_users.append(face_data.user)
        
        # Perform face comparison
        scanned_encoding = face_encodings[0]
        matches = face_recognition.compare_faces(known_encodings, scanned_encoding, tolerance=0.6)
        face_distances = face_recognition.face_distance(known_encodings, scanned_encoding)
        
        if any(matches):
            best_match_index = np.argmin(face_distances)
            if matches[best_match_index]:
                matched_user = known_users[best_match_index]
                confidence = max(0, (1 - face_distances[best_match_index]) * 100)
                
                # Log attendance
                attendance_log = FaceAttendanceLog.objects.create(
                    user=matched_user,
                    scan_type=scan_type,
                    confidence_score=confidence,
                    scanned_image=image_data,
                    verified_by=request.user if request.user != matched_user else None
                )
                
                return Response({
                    'match': True,
                    'user': {
                        'id': matched_user.id,
                        'username': matched_user.username,
                        'role': matched_user.role
                    },
                    'confidence': round(confidence, 2),
                    'log_id': attendance_log.id,
                    'message': f'Face verified for {matched_user.username}'
                })
        
        # No match found
        return Response({
            'match': False,
            'confidence': 0,
            'message': 'Face not recognized'
        }, status=200)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scan_license_plate(request):
    """Scan and recognize license plate from image"""
    try:
        image_data = request.data.get('image')
        entry_type = request.data.get('entry_type', 'ENTRY')
        vehicle_id = request.data.get('vehicle_id')
        
        if not image_data:
            return Response({'error': 'No image provided'}, status=400)
        
        # Decode image
        image_array = decode_base64_image(image_data)
        
        # Preprocess image for better OCR
        gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
        
        # Apply various preprocessing techniques
        processed_images = []
        
        # Original grayscale
        processed_images.append(gray)
        
        # Gaussian blur + threshold
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh1 = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        processed_images.append(thresh1)
        
        # Morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        opening = cv2.morphologyEx(thresh1, cv2.MORPH_OPEN, kernel, iterations=1)
        processed_images.append(opening)
        
        # Edge detection
        edges = cv2.Canny(gray, 50, 150)
        processed_images.append(edges)
        
        # Try OCR on all processed versions
        detected_plates = []
        
        for i, proc_img in enumerate(processed_images):
            try:
                # Configure Tesseract for license plates
                custom_config = r'--oem 3 --psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
                text = pytesseract.image_to_string(proc_img, config=custom_config).strip().upper()
                
                # Clean and validate detected text
                text = re.sub(r'[^A-Z0-9]', '', text)
                
                if len(text) >= 4 and len(text) <= 10:  # Reasonable plate length
                    # Calculate confidence based on preprocessing method
                    confidence = 95 - (i * 10)  # Original gets highest confidence
                    detected_plates.append((text, confidence, proc_img))
                    
            except Exception as e:
                print(f"OCR failed for method {i}: {e}")
                continue
        
        if not detected_plates:
            return Response({
                'detected': False,
                'message': 'Could not detect license plate text'
            }, status=200)
        
        # Get best detection
        best_plate, best_confidence, best_image = max(detected_plates, key=lambda x: x[1])
        
        # Try to match with existing vehicles
        matched_vehicle = None
        if vehicle_id:
            try:
                matched_vehicle = Vehicle.objects.get(id=vehicle_id)
            except Vehicle.DoesNotExist:
                pass
        else:
            # Search by detected plate
            vehicles = Vehicle.objects.filter(license_plate__iexact=best_plate)
            if vehicles.exists():
                matched_vehicle = vehicles.first()
        
        # Save detection record
        detection_record = LicensePlateRecord.objects.create(
            vehicle=matched_vehicle,
            detected_plate=best_plate,
            confidence_score=best_confidence,
            original_image=image_data,
            entry_type=entry_type,
            scanned_by=request.user,
            verified=matched_vehicle is not None
        )
        
        response_data = {
            'detected': True,
            'plate_number': best_plate,
            'confidence': round(best_confidence, 2),
            'record_id': detection_record.id,
            'matched_vehicle': None
        }
        
        if matched_vehicle:
            response_data['matched_vehicle'] = {
                'id': matched_vehicle.id,
                'license_plate': matched_vehicle.license_plate,
                'make': matched_vehicle.make,
                'model': matched_vehicle.model,
                'year': matched_vehicle.year,
                'status': matched_vehicle.status
            }
            response_data['message'] = f'License plate {best_plate} matched to vehicle {matched_vehicle}'
        else:
            response_data['message'] = f'License plate {best_plate} detected but no matching vehicle found'
        
        return Response(response_data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def face_attendance_logs(request):
    """Get face attendance logs"""
    user_id = request.query_params.get('user_id')
    days = int(request.query_params.get('days', 7))
    
    from datetime import datetime, timedelta
    start_date = datetime.now() - timedelta(days=days)
    
    logs = FaceAttendanceLog.objects.filter(timestamp__gte=start_date)
    
    if user_id:
        logs = logs.filter(user_id=user_id)
    
    logs_data = []
    for log in logs:
        logs_data.append({
            'id': log.id,
            'user': log.user.username,
            'scan_type': log.scan_type,
            'confidence': log.confidence_score,
            'timestamp': log.timestamp.isoformat(),
            'verified_by': log.verified_by.username if log.verified_by else None
        })
    
    return Response(logs_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def license_plate_logs(request):
    """Get license plate scan logs"""
    days = int(request.query_params.get('days', 7))
    
    from datetime import datetime, timedelta
    start_date = datetime.now() - timedelta(days=days)
    
    logs = LicensePlateRecord.objects.filter(timestamp__gte=start_date).select_related('vehicle', 'scanned_by')
    
    logs_data = []
    for log in logs:
        logs_data.append({
            'id': log.id,
            'detected_plate': log.detected_plate,
            'confidence': log.confidence_score,
            'entry_type': log.entry_type,
            'verified': log.verified,
            'timestamp': log.timestamp.isoformat(),
            'scanned_by': log.scanned_by.username if log.scanned_by else None,
            'vehicle': {
                'id': log.vehicle.id,
                'license_plate': log.vehicle.license_plate,
                'make': log.vehicle.make,
                'model': log.vehicle.model
            } if log.vehicle else None
        })
    
    return Response(logs_data)