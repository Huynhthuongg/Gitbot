package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
)

type WebhookEvent struct {
	Type      string      `json:"type"`
	Title     string      `json:"title"`
	Message   string      `json:"message"`
	User      string      `json:"user"`
	Timestamp string      `json:"timestamp"`
	Extra     interface{} `json:"extra,omitempty"`
}

type SlackMessage struct {
	Text        string       `json:"text"`
	Attachments []Attachment `json:"attachments,omitempty"`
}

type Attachment struct {
	Color  string  `json:"color"`
	Title  string  `json:"title"`
	Text   string  `json:"text"`
	Fields []Field `json:"fields,omitempty"`
}

type Field struct {
	Title string `json:"title"`
	Value string `json:"value"`
	Short bool   `json:"short"`
}

type DiscordMessage struct {
	Username  string        `json:"username,omitempty"`
	AvatarURL string        `json:"avatar_url,omitempty"`
	Content   string        `json:"content"`
	Embeds    []DiscordEmbed `json:"embeds,omitempty"`
}

type DiscordEmbed struct {
	Title       string            `json:"title"`
	Description string            `json:"description"`
	Color       int               `json:"color"`
	Fields      []DiscordField    `json:"fields,omitempty"`
	Footer      DiscordEmbedFooter `json:"footer,omitempty"`
}

type DiscordField struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Inline bool   `json:"inline"`
}

type DiscordEmbedFooter struct {
	Text string `json:"text"`
}

type WebhookConfig struct {
	SlackWebhookURL   string
	DiscordWebhookURL string
}

var webhookConfig = WebhookConfig{
	SlackWebhookURL:   "", // Set from environment or config
	DiscordWebhookURL: "", // Set from environment or config
}

func SendSlackNotification(event WebhookEvent) error {
	if webhookConfig.SlackWebhookURL == "" {
		log.Println("Slack webhook URL not configured")
		return nil
	}

	color := "#3b82f6" // Blue
	if strings.Contains(event.Type, "approved") {
		color = "#10b981" // Green
	} else if strings.Contains(event.Type, "rejected") {
		color = "#ef4444" // Red
	}

	message := SlackMessage{
		Text: fmt.Sprintf("*%s*", event.Title),
		Attachments: []Attachment{
			{
				Color: color,
				Title: event.Title,
				Text:  event.Message,
				Fields: []Field{
					{
						Title: "User",
						Value: event.User,
						Short: true,
					},
					{
						Title: "Event Type",
						Value: event.Type,
						Short: true,
					},
					{
						Title: "Time",
						Value: event.Timestamp,
						Short: true,
					},
				},
			},
		},
	}

	payload, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal Slack message: %w", err)
	}

	resp, err := http.Post(webhookConfig.SlackWebhookURL, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return fmt.Errorf("failed to send Slack notification: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Slack API returned status %d: %s", resp.StatusCode, string(body))
	}

	log.Printf("Slack notification sent: %s\n", event.Title)
	return nil
}

func SendDiscordNotification(event WebhookEvent) error {
	if webhookConfig.DiscordWebhookURL == "" {
		log.Println("Discord webhook URL not configured")
		return nil
	}

	color := 3447003 // Blue
	if strings.Contains(event.Type, "approved") {
		color = 3066993 // Green
	} else if strings.Contains(event.Type, "rejected") {
		color = 15158332 // Red
	}

	message := DiscordMessage{
		Username:  "GitBot",
		AvatarURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=GitBot",
		Content:   fmt.Sprintf("**%s**", event.Title),
		Embeds: []DiscordEmbed{
			{
				Title:       event.Title,
				Description: event.Message,
				Color:       color,
				Fields: []DiscordField{
					{
						Name:   "User",
						Value:  event.User,
						Inline: true,
					},
					{
						Name:   "Event Type",
						Value:  event.Type,
						Inline: true,
					},
					{
						Name:   "Time",
						Value:  event.Timestamp,
						Inline: false,
					},
				},
				Footer: DiscordEmbedFooter{
					Text: "GitBot Code Review",
				},
			},
		},
	}

	payload, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal Discord message: %w", err)
	}

	resp, err := http.Post(webhookConfig.DiscordWebhookURL, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return fmt.Errorf("failed to send Discord notification: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Discord API returned status %d: %s", resp.StatusCode, string(body))
	}

	log.Printf("Discord notification sent: %s\n", event.Title)
	return nil
}

func BroadcastEvent(event WebhookEvent) error {
	// Send to both Slack and Discord
	if err := SendSlackNotification(event); err != nil {
		log.Printf("Slack notification error: %v\n", err)
	}

	if err := SendDiscordNotification(event); err != nil {
		log.Printf("Discord notification error: %v\n", err)
	}

	return nil
}

func handleWebhookConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		enableCORS(w)
		w.WriteHeader(http.StatusOK)
		return
	}

	enableCORS(w)

	switch r.Method {
	case "GET":
		// Return current webhook config (without revealing full URLs)
		config := map[string]interface{}{
			"slack_configured":   webhookConfig.SlackWebhookURL != "",
			"discord_configured": webhookConfig.DiscordWebhookURL != "",
		}
		json.NewEncoder(w).Encode(config)

	case "POST":
		var req map[string]string
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		if slack, ok := req["slack_webhook"]; ok && slack != "" {
			webhookConfig.SlackWebhookURL = slack
			log.Println("Slack webhook configured")
		}

		if discord, ok := req["discord_webhook"]; ok && discord != "" {
			webhookConfig.DiscordWebhookURL = discord
			log.Println("Discord webhook configured")
		}

		json.NewEncoder(w).Encode(map[string]string{
			"success": "true",
			"message": "Webhooks configured",
		})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleBroadcastEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		enableCORS(w)
		w.WriteHeader(http.StatusOK)
		return
	}

	enableCORS(w)

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var event WebhookEvent
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if event.Title == "" || event.Message == "" {
		http.Error(w, "Title and message are required", http.StatusBadRequest)
		return
	}

	if err := BroadcastEvent(event); err != nil {
		log.Printf("Error broadcasting event: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to broadcast event",
		})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"success": "true",
		"message": "Event broadcasted to Slack and Discord",
	})
}
