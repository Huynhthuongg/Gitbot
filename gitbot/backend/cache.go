package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"
)

type CacheStore struct {
	data map[string]cacheEntry
}

type cacheEntry struct {
	value     interface{}
	expiresAt time.Time
}

var cache = &CacheStore{
	data: make(map[string]cacheEntry),
}

// In production, use redis.NewClient() from github.com/redis/go-redis/v9
// For now, using in-memory cache with TTL

func (c *CacheStore) Set(key string, value interface{}, ttl time.Duration) error {
	c.data[key] = cacheEntry{
		value:     value,
		expiresAt: time.Now().Add(ttl),
	}
	log.Printf("Cache SET: %s (TTL: %v)\n", key, ttl)
	return nil
}

func (c *CacheStore) Get(key string) (interface{}, bool) {
	entry, exists := c.data[key]
	if !exists {
		return nil, false
	}

	if time.Now().After(entry.expiresAt) {
		delete(c.data, key)
		return nil, false
	}

	log.Printf("Cache HIT: %s\n", key)
	return entry.value, true
}

func (c *CacheStore) Delete(key string) error {
	delete(c.data, key)
	log.Printf("Cache DEL: %s\n", key)
	return nil
}

func (c *CacheStore) Invalidate(pattern string) {
	for key := range c.data {
		if matchPattern(key, pattern) {
			delete(c.data, key)
		}
	}
	log.Printf("Cache invalidated for pattern: %s\n", pattern)
}

func matchPattern(key, pattern string) bool {
	if pattern == "*" {
		return true
	}
	if len(pattern) > 0 && pattern[len(pattern)-1] == '*' {
		return len(key) >= len(pattern)-1 && key[:len(pattern)-1] == pattern[:len(pattern)-1]
	}
	return key == pattern
}

// Convenience functions for caching diff data
func cacheKey(prefix string, id string) string {
	return fmt.Sprintf("%s:%s", prefix, id)
}

func CacheDiff(prID string, diff []FileDiff) error {
	data, err := json.Marshal(diff)
	if err != nil {
		return err
	}
	return cache.Set(cacheKey("diff", prID), data, 30*time.Minute)
}

func GetCachedDiff(prID string) ([]FileDiff, bool) {
	data, exists := cache.Get(cacheKey("diff", prID))
	if !exists {
		return nil, false
	}

	jsonData, ok := data.([]byte)
	if !ok {
		return nil, false
	}

	var diff []FileDiff
	if err := json.Unmarshal(jsonData, &diff); err != nil {
		return nil, false
	}

	return diff, true
}

func CacheStats(prID string, stats PRStats) error {
	data, err := json.Marshal(stats)
	if err != nil {
		return err
	}
	return cache.Set(cacheKey("stats", prID), data, 15*time.Minute)
}

func GetCachedStats(prID string) (PRStats, bool) {
	data, exists := cache.Get(cacheKey("stats", prID))
	if !exists {
		return PRStats{}, false
	}

	jsonData, ok := data.([]byte)
	if !ok {
		return PRStats{}, false
	}

	var stats PRStats
	if err := json.Unmarshal(jsonData, &stats); err != nil {
		return PRStats{}, false
	}

	return stats, true
}

func InvalidateUserCache(userID string) {
	cache.Invalidate(fmt.Sprintf("user:%s:*", userID))
}

func InvalidatePRCache(prID string) {
	cache.Invalidate(fmt.Sprintf("*:%s", prID))
}
