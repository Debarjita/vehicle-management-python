# api/middleware/rate_limiter.py
from django.core.cache import cache
from django.http import JsonResponse
import time

class RateLimiterMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.window_ms = 1 * 60 * 1000  # 1 minute in milliseconds
        self.max_requests = 5  # limit each IP to 5 requests per minute

    def __call__(self, request):
        # Get the client IP address
        ip = self.get_client_ip(request)
        
        # Create a unique cache key for this IP
        cache_key = f"rate_limit:{ip}"
        
        # Get current request count for this IP
        requests = cache.get(cache_key, [])
        
        # Get current time in milliseconds
        now = int(time.time() * 1000)
        
        # Filter out requests older than the window
        requests = [req_time for req_time in requests if now - req_time < self.window_ms]
        
        # Check if the request limit is exceeded
        if len(requests) >= self.max_requests:
            return JsonResponse({
                'error': 'Too many requests. Please try again after a minute.',
            }, status=429)
        
        # Add current request timestamp to the list and update cache
        requests.append(now)
        cache.set(cache_key, requests, self.window_ms // 1000)  # Convert to seconds for Django cache
        
        # Add rate limit headers to response
        response = self.get_response(request)
        response["RateLimit-Limit"] = str(self.max_requests)
        response["RateLimit-Remaining"] = str(max(0, self.max_requests - len(requests)))
        response["RateLimit-Reset"] = str(self.get_reset_time(requests, now))
        
        return response
    
    def get_client_ip(self, request):
        """Get the client's IP address from request headers or REMOTE_ADDR"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def get_reset_time(self, requests, now):
        """Calculate when the rate limit will reset (in seconds)"""
        if not requests:
            return 0
            
        oldest_request = min(requests)
        reset_time = (oldest_request + self.window_ms - now) // 1000  # Convert to seconds
        return max(0, reset_time)