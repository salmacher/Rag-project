import redis
import json
from typing import Optional, Any, Dict
from functools import wraps
import hashlib
from config import settings

class RedisService:
    def __init__(self):
        try:
            connection_params = {
                'host': settings.REDIS_HOST,
                'port': settings.REDIS_PORT,
                'db': settings.REDIS_DB,
                'decode_responses': True,
                'socket_timeout': 5,
                'socket_connect_timeout': 5,
            }
            
            if settings.REDIS_PASSWORD:
                connection_params['password'] = settings.REDIS_PASSWORD
            
            self.redis_client = redis.Redis(**connection_params)
            self.redis_client.ping()
        except Exception:
            self.redis_client = None

    def is_connected(self) -> bool:
        return self.redis_client is not None

    def generate_cache_key(self, prefix: str, *args) -> str:
        key_str = ":".join(str(arg) for arg in args)
        key_hash = hashlib.md5(key_str.encode()).hexdigest()
        return f"rag:{prefix}:{key_hash}"

    async def get(self, key: str) -> Optional[Any]:
        if not self.is_connected():
            return None
            
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception:
            return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        if not self.is_connected():
            return False
            
        try:
            ttl = ttl or settings.REDIS_CACHE_TTL
            serialized_value = json.dumps(value)
            self.redis_client.setex(key, ttl, serialized_value)
            return True
        except Exception:
            return False

    async def delete(self, key: str) -> bool:
        if not self.is_connected():
            return False
            
        try:
            return self.redis_client.delete(key) > 0
        except Exception:
            return False

    async def clear_pattern(self, pattern: str) -> int:
        if not self.is_connected():
            return 0
            
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception:
            return 0

    async def get_stats(self) -> Dict:
        if not self.is_connected():
            return {"connected": False}
            
        try:
            info = self.redis_client.info()
            return {
                "connected": True,
                "used_memory": info.get("used_memory_human", "N/A"),
                "keys": info.get("db0", {}).get("keys", 0),
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
            }
        except Exception:
            return {"connected": False}

redis_service = RedisService()

def cache_response(prefix: str, ttl: Optional[int] = None):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not redis_service.is_connected():
                return await func(*args, **kwargs)
            
            cache_key = redis_service.generate_cache_key(prefix, *args, *sorted(kwargs.items()))
            
            cached_result = await redis_service.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            result = await func(*args, **kwargs)
            
            if result is not None:
                await redis_service.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator