package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// Data structures
type DiffLine struct {
	Type    string `json:"type"`
	Content string `json:"content"`
	LineNum int    `json:"line_num"`
}

type FileDiff struct {
	FilePath string     `json:"file_path"`
	Lines    []DiffLine `json:"lines"`
}

type Comment struct {
	ID        string    `json:"id"`
	LineNum   int       `json:"line_num"`
	FilePath  string    `json:"file_path"`
	Author    string    `json:"author"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type PRStats struct {
	FilesChanged int `json:"files_changed"`
	Additions    int `json:"additions"`
	Deletions    int `json:"deletions"`
	Commits      int `json:"commits"`
}

type ApprovalRequest struct {
	PRNumber int    `json:"pr_number"`
	Status   string `json:"status"`
	Feedback string `json:"feedback"`
}

// In-memory storage
var (
	comments       []Comment
	commentsMutex  sync.RWMutex
	approvalStatus map[int]string = make(map[int]string)
)

// Mock data
var mockDiff = []FileDiff{
	{
		FilePath: "components/Auth.tsx",
		Lines: []DiffLine{
			{Type: "neutral", Content: "import React from 'react';", LineNum: 1},
			{Type: "deletion", Content: "- export const Login = () => {", LineNum: 2},
			{Type: "addition", Content: "+ export const Login: React.FC<LoginProps> = ({ onSuccess }) => {", LineNum: 3},
			{Type: "neutral", Content: "  const [email, setEmail] = React.useState('');", LineNum: 4},
			{Type: "addition", Content: "+ const [password, setPassword] = React.useState('');", LineNum: 5},
			{Type: "neutral", Content: "  return (", LineNum: 6},
		},
	},
	{
		FilePath: "hooks/useAuth.ts",
		Lines: []DiffLine{
			{Type: "neutral", Content: "export function useAuth() {", LineNum: 1},
			{Type: "deletion", Content: "- const [user, setUser] = useState(null);", LineNum: 2},
			{Type: "addition", Content: "+ const [user, setUser] = useState<User | null>(null);", LineNum: 3},
			{Type: "addition", Content: "+ const [isLoading, setIsLoading] = useState(false);", LineNum: 4},
			{Type: "neutral", Content: "  return { user, login, logout };", LineNum: 5},
		},
	},
	{
		FilePath: "utils/validation.ts",
		Lines: []DiffLine{
			{Type: "neutral", Content: "export const validateEmail = (email: string) => {", LineNum: 1},
			{Type: "addition", Content: "+ const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;", LineNum: 2},
			{Type: "addition", Content: "+ return emailRegex.test(email);", LineNum: 3},
			{Type: "neutral", Content: "};", LineNum: 4},
		},
	},
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Content-Type", "application/json")
}

// GET /api/v1/diff
func handleGetDiff(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		enableCORS(w)
		w.WriteHeader(http.StatusOK)
		return
	}
	
	enableCORS(w)
	
	prID := r.URL.Query().Get("pr_id")
	if prID == "" {
		prID = "default"
	}
	
	// Try to get from cache
	if cachedDiff, ok := GetCachedDiff(prID); ok {
		json.NewEncoder(w).Encode(cachedDiff)
		return
	}
	
	// Cache the diff
	CacheDiff(prID, mockDiff)
	json.NewEncoder(w).Encode(mockDiff)
}

// GET /api/v1/stats
func handleGetStats(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		enableCORS(w)
		w.WriteHeader(http.StatusOK)
		return
	}
	
	enableCORS(w)
	
	prID := r.URL.Query().Get("pr_id")
	if prID == "" {
		prID = "default"
	}
	
	// Try to get from cache
	if cachedStats, ok := GetCachedStats(prID); ok {
		json.NewEncoder(w).Encode(cachedStats)
		return
	}
	
	stats := PRStats{
		FilesChanged: len(mockDiff),
		Additions:    0,
		Deletions:    0,
		Commits:      3,
	}
	
	for _, file := range mockDiff {
		for _, line := range file.Lines {
			if line.Type == "addition" {
				stats.Additions++
			} else if line.Type == "deletion" {
				stats.Deletions++
			}
		}
	}
	
	// Cache the stats
	CacheStats(prID, stats)
	json.NewEncoder(w).Encode(stats)
}

// GET/POST /api/v1/comments
func handleComments(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		enableCORS(w)
		w.WriteHeader(http.StatusOK)
		return
	}
	
	enableCORS(w)
	
	if r.Method == "GET" {
		commentsMutex.RLock()
		defer commentsMutex.RUnlock()
		
		if len(comments) == 0 {
			json.NewEncoder(w).Encode([]Comment{})
			return
		}
		json.NewEncoder(w).Encode(comments)
	} else if r.Method == "POST" {
		var comment Comment
		if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
		
		comment.ID = fmt.Sprintf("comment_%d", time.Now().UnixNano())
		comment.CreatedAt = time.Now()
		
		commentsMutex.Lock()
		comments = append(comments, comment)
		commentsMutex.Unlock()
		
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(comment)
	}
}

// POST /api/v1/approve
func handleApprove(w http.ResponseWriter, r *http.Request) {
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
	
	var req ApprovalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	
	approvalStatus[req.PRNumber] = req.Status
	
	response := map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("PR #%d marked as %s", req.PRNumber, req.Status),
		"status":  req.Status,
	}
	
	json.NewEncoder(w).Encode(response)
}

// GET /api/v1/files
func handleGetFiles(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		enableCORS(w)
		w.WriteHeader(http.StatusOK)
		return
	}
	
	enableCORS(w)
	
	files := make([]string, len(mockDiff))
	for i, file := range mockDiff {
		files[i] = file.FilePath
	}
	
	json.NewEncoder(w).Encode(files)
}

// GET /health
func handleHealth(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	// Initialize database
	db, err := initDatabase()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v\n", err)
	}
	defer db.Close()

	// API routes
	http.HandleFunc("/api/v1/diff", handleGetDiff)
	http.HandleFunc("/api/v1/stats", handleGetStats)
	http.HandleFunc("/api/v1/comments", handleComments)
	http.HandleFunc("/api/v1/approve", handleApprove)
	http.HandleFunc("/api/v1/files", handleGetFiles)
	http.HandleFunc("/health", handleHealth)

	// Auth routes
	http.HandleFunc("/api/v1/auth/register", func(w http.ResponseWriter, r *http.Request) {
		handleRegister(w, r, db)
	})
	http.HandleFunc("/api/v1/auth/login", func(w http.ResponseWriter, r *http.Request) {
		handleLogin(w, r, db)
	})
	http.HandleFunc("/api/v1/auth/me", func(w http.ResponseWriter, r *http.Request) {
		handleGetMe(w, r, db)
	})

	// Email routes
	http.HandleFunc("/api/v1/email/send", handleSendEmail)

	// Webhook routes
	http.HandleFunc("/api/v1/webhooks/config", handleWebhookConfig)
	http.HandleFunc("/api/v1/webhooks/broadcast", handleBroadcastEvent)

	port := ":8080"
	log.Printf("GitBot Backend starting on %s\n", port)

	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("Server error: %v\n", err)
	}
}
