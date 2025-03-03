# api/utils/cache.py
from django.core.cache import cache
import json
import logging

logger = logging.getLogger(__name__)

def cache_data(key, value, timeout=300):
    """
    Store data in cache with a 5-minute expiration
    
    Args:
        key (str): Cache key
        value (any): Value to cache
        timeout (int): Cache expiration time in seconds (default: 300 seconds = 5 minutes)
    """
    try:
        # Convert value to JSON string
        serialized_value = json.dumps(value)
        # Store in cache with timeout
        cache.set(key, serialized_value, timeout)
    except Exception as err:
        logger.error(f"Error caching data: {err}")

def get_from_cache(key):
    """
    Retrieve data from cache
    
    Args:
        key (str): Cache key
        
    Returns:
        The cached value or None if not found/error
    """
    try:
        # Get data from cache
        data = cache.get(key)
        # If data exists, parse it from JSON
        if data:
            return json.loads(data)
        return None
    except Exception as err:
        logger.error(f"Error retrieving from cache: {err}")
        return None