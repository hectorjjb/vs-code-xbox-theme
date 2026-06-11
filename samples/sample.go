// Xbox Live presence client — Go sample
package xboxlive

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type Presence string

const (
	PresenceOnline  Presence = "online"
	PresenceAway    Presence = "away"
	PresenceOffline Presence = "offline"
)

// Player represents a snapshot of an Xbox Live player's public profile.
type Player struct {
	Gamertag   string    `json:"gamertag"`
	Gamerscore int       `json:"gamerscore"`
	Presence   Presence  `json:"presence"`
	LastSeen   time.Time `json:"lastSeen"`
}

func (p Player) IsActive() bool { return p.Presence != PresenceOffline }

// Client is a concurrency-safe Xbox Live API client.
type Client struct {
	http    *http.Client
	baseURL string
	mu      sync.RWMutex
	cache   map[string]Player
}

func NewClient(baseURL string) *Client {
	return &Client{
		http:    &http.Client{Timeout: 5 * time.Second},
		baseURL: baseURL,
		cache:   make(map[string]Player),
	}
}

// FetchPresence returns the player's current presence, caching the result.
func (c *Client) FetchPresence(ctx context.Context, gamertag string) (Player, error) {
	c.mu.RLock()
	if p, ok := c.cache[gamertag]; ok {
		c.mu.RUnlock()
		return p, nil
	}
	c.mu.RUnlock()

	url := fmt.Sprintf("%s/players/%s", c.baseURL, gamertag)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return Player{}, fmt.Errorf("build request: %w", err)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return Player{}, fmt.Errorf("xbox api: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return Player{}, errors.New("xbox api: non-200 response")
	}

	var player Player
	if err := json.NewDecoder(resp.Body).Decode(&player); err != nil {
		return Player{}, fmt.Errorf("decode: %w", err)
	}

	c.mu.Lock()
	c.cache[gamertag] = player
	c.mu.Unlock()
	return player, nil
}
