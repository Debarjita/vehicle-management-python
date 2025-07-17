# backend/install_instructions.md
# AI Features Installation Guide

## 1. Install Required Packages

### For Windows:
```bash
# Install Python packages
pip install face-recognition opencv-python Pillow pytesseract numpy dlib

# Install Tesseract OCR
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
# Install to: C:\Program Files\Tesseract-OCR\
```

### For Linux/Ubuntu:
```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install tesseract-ocr libtesseract-dev
sudo apt-get install python3-dev python3-pip
sudo apt-get install libatlas-base-dev
sudo apt-get install cmake

# Install Python packages
pip install face-recognition opencv-python Pillow pytesseract numpy dlib
```

### For macOS:
```bash
# Install Tesseract using Homebrew
brew install tesseract

# Install Python packages
pip install face-recognition opencv-python Pillow pytesseract numpy dlib
```

## 2. Update Django Settings

Add 'ai_features' to INSTALLED_APPS in settings.py:
```python
INSTALLED_APPS = [
    # ... existing apps ...
    'ai_features',
]
```

## 3. Run Migrations

```bash
python manage.py makemigrations ai_features
python manage.py migrate
```

## 4. Set Up Demo Data

```bash
python setup_ai_demo.py
```

## 5. Configure Frontend

Install webcam package for React:
```bash
cd frontend
npm install react-webcam
```

## 6. Test the Features

1. Start Django server: `python manage.py runserver`
2. Start React frontend: `npm start`
3. Login with demo credentials
4. Navigate to AI features sections

## Troubleshooting

### Face Recognition Issues:
- Make sure you have good lighting when capturing photos
- Ensure face is clearly visible and not obscured
- Try different angles if recognition fails

### License Plate Recognition Issues:
- Ensure license plate is clearly visible and well-lit
- Clean the camera lens
- Try different distances from the plate
- Make sure plate text is not blurry

### Performance Issues:
- Face recognition processing can take 2-5 seconds
- OCR processing can take 3-7 seconds
- Consider using a faster computer or GPU for better performance

### Camera Access Issues:
- Grant camera permissions in browser
- Use HTTPS for production (required for camera access)
- Check if other applications are using the camera