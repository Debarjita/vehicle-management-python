# backend/ai_features/utils.py
import base64
import json
import numpy as np
import cv2
from PIL import Image
import io
import face_recognition
import pytesseract
import re
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class ImageProcessor:
    """Utility class for image processing operations"""
    
    @staticmethod
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
            logger.error(f"Failed to decode base64 image: {str(e)}")
            raise ValueError(f"Invalid image data: {str(e)}")
    
    @staticmethod
    def encode_image_to_base64(image_array):
        """Convert numpy array to base64 string"""
        try:
            image = Image.fromarray(image_array)
            buffer = io.BytesIO()
            image.save(buffer, format='JPEG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            return f"data:image/jpeg;base64,{img_str}"
        except Exception as e:
            logger.error(f"Failed to encode image to base64: {str(e)}")
            return None

class FaceRecognitionProcessor:
    """Face recognition utility class"""
    
    def __init__(self, tolerance=0.6):
        self.tolerance = tolerance
    
    def extract_face_encoding(self, image_array):
        """Extract face encoding from image"""
        try:
            # Convert to RGB if needed
            if len(image_array.shape) == 3 and image_array.shape[2] == 3:
                # Assume BGR, convert to RGB
                rgb_image = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
            else:
                rgb_image = image_array
            
            # Find face locations
            face_locations = face_recognition.face_locations(rgb_image)
            
            if not face_locations:
                raise ValueError("No face detected in image")
            
            if len(face_locations) > 1:
                raise ValueError("Multiple faces detected. Please use image with single face")
            
            # Generate face encodings
            face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
            
            if not face_encodings:
                raise ValueError("Could not generate face encoding")
            
            return {
                'encoding': face_encodings[0],
                'location': face_locations[0],
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Face encoding extraction failed: {str(e)}")
            return {
                'encoding': None,
                'location': None,
                'success': False,
                'error': str(e)
            }
    
    def compare_faces(self, known_encodings, unknown_encoding):
        """Compare unknown face with known faces"""
        try:
            if not known_encodings:
                return {
                    'matches': [],
                    'distances': [],
                    'best_match': None,
                    'confidence': 0
                }
            
            # Perform comparison
            matches = face_recognition.compare_faces(known_encodings, unknown_encoding, tolerance=self.tolerance)
            distances = face_recognition.face_distance(known_encodings, unknown_encoding)
            
            best_match_index = None
            confidence = 0
            
            if any(matches):
                best_match_index = np.argmin(distances)
                if matches[best_match_index]:
                    # Convert distance to confidence percentage
                    confidence = max(0, (1 - distances[best_match_index]) * 100)
            
            return {
                'matches': matches,
                'distances': distances.tolist(),
                'best_match_index': best_match_index,
                'confidence': confidence
            }
            
        except Exception as e:
            logger.error(f"Face comparison failed: {str(e)}")
            return {
                'matches': [],
                'distances': [],
                'best_match_index': None,
                'confidence': 0,
                'error': str(e)
            }

class LicensePlateProcessor:
    """License plate OCR utility class"""
    
    def __init__(self):
        # Configure Tesseract path from settings
        if hasattr(settings, 'AI_SETTINGS') and 'TESSERACT_PATH' in settings.AI_SETTINGS:
            pytesseract.pytesseract.tesseract_cmd = settings.AI_SETTINGS['TESSERACT_PATH']
    
    def preprocess_image(self, image_array):
        """Apply various preprocessing techniques for better OCR"""
        try:
            # Convert to grayscale
            if len(image_array.shape) == 3:
                gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
            else:
                gray = image_array
            
            processed_images = []
            
            # Method 1: Original grayscale
            processed_images.append(('original', gray))
            
            # Method 2: Gaussian blur + adaptive threshold
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            thresh1 = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
            processed_images.append(('adaptive_thresh', thresh1))
            
            # Method 3: OTSU threshold
            _, thresh2 = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            processed_images.append(('otsu_thresh', thresh2))
            
            # Method 4: Morphological operations
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            opening = cv2.morphologyEx(thresh2, cv2.MORPH_OPEN, kernel, iterations=1)
            processed_images.append(('morphological', opening))
            
            # Method 5: Edge detection
            edges = cv2.Canny(gray, 50, 150)
            processed_images.append(('edges', edges))
            
            # Method 6: Contrast enhancement
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            enhanced = clahe.apply(gray)
            processed_images.append(('enhanced', enhanced))
            
            return processed_images
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {str(e)}")
            return [('original', image_array)]
    
    def extract_text(self, image_array):
        """Extract text from license plate image using multiple methods"""
        try:
            processed_images = self.preprocess_image(image_array)
            detected_plates = []
            
            # OCR configurations for license plates
            configs = [
                r'--oem 3 --psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                r'--oem 3 --psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                r'--oem 3 --psm 13',
            ]
            
            for i, (method_name, proc_img) in enumerate(processed_images):
                for j, config in enumerate(configs):
                    try:
                        text = pytesseract.image_to_string(proc_img, config=config).strip().upper()
                        
                        # Clean detected text
                        text = re.sub(r'[^A-Z0-9]', '', text)
                        
                        # Validate license plate format
                        if self.is_valid_license_plate(text):
                            # Calculate confidence based on method and config
                            base_confidence = 95 - (i * 5) - (j * 2)
                            confidence = max(base_confidence, 50)
                            
                            detected_plates.append({
                                'text': text,
                                'confidence': confidence,
                                'method': method_name,
                                'config_index': j
                            })
                            
                    except Exception as e:
                        logger.warning(f"OCR failed for {method_name} with config {j}: {str(e)}")
                        continue
            
            if not detected_plates:
                return {
                    'success': False,
                    'plates': [],
                    'best_result': None,
                    'error': 'No license plate text detected'
                }
            
            # Sort by confidence and return best result
            detected_plates.sort(key=lambda x: x['confidence'], reverse=True)
            best_result = detected_plates[0]
            
            return {
                'success': True,
                'plates': detected_plates,
                'best_result': best_result
            }
            
        except Exception as e:
            logger.error(f"License plate text extraction failed: {str(e)}")
            return {
                'success': False,
                'plates': [],
                'best_result': None,
                'error': str(e)
            }
    
    def is_valid_license_plate(self, text):
        """Validate if text looks like a license plate"""
        if not text:
            return False
        
        # Basic length check
        if len(text) < 3 or len(text) > 10:
            return False
        
        # Must contain at least one letter or number
        if not re.search(r'[A-Z0-9]', text):
            return False
        
        # Common license plate patterns (adjust based on your region)
        patterns = [
            r'^[A-Z]{2,3}[0-9]{3,4}$',  # ABC123, AB1234
            r'^[0-9]{3}[A-Z]{3}$',      # 123ABC  
            r'^[A-Z][0-9]{3}[A-Z]{3}$', # A123ABC
            r'^[A-Z]{3}[0-9]{3}$',      # ABC123
            r'^[0-9]{2}[A-Z]{2}[0-9]{2}$', # 12AB34
            r'^[A-Z0-9]{4,8}$',         # Generic alphanumeric
        ]
        
        for pattern in patterns:
            if re.match(pattern, text):
                return True
        
        return False