# api/middleware/validate_vin.py
from django.http import JsonResponse
import re

def validate_vin_middleware(get_response):
    def middleware(request):
        # Check if the URL contains 'vin' as a URL parameter
        path_parts = request.path.split('/')
        if 'vin' in path_parts:
            # Find the position of 'vin' and get the next part as the VIN value
            vin_index = path_parts.index('vin')
            if len(path_parts) > vin_index + 1:
                vin = path_parts[vin_index + 1]
                # Validate VIN format
                if not re.match(r'^[a-zA-Z0-9]{17}$', vin):
                    return JsonResponse({'message': 'Invalid VIN format'}, status=400)
        
        return get_response(request)
    
    return middleware