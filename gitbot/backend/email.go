package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

type EmailNotification struct {
	To        string
	Subject   string
	Body      string
	HTMLBody  string
	Timestamp time.Time
}

type EmailRequest struct {
	Email   string `json:"email"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

// In production, use SendGrid, AWS SES, or similar email service
// For now, logging to console and storing in database

var emailQueue []EmailNotification

func SendEmail(to, subject, body string) error {
	notification := EmailNotification{
		To:        to,
		Subject:   subject,
		Body:      body,
		HTMLBody:  generateHTMLEmail(subject, body),
		Timestamp: time.Now(),
	}

	emailQueue = append(emailQueue, notification)
	log.Printf("Email queued for %s: %s\n", to, subject)

	// In production, implement actual email sending here
	// Example with SendGrid:
	// from := "noreply@gitbot.io"
	// m := mail.NewV3Mail()
	// m.SetFrom(mail.NewEmail("GitBot", from))
	// m.Subject = subject
	// p := mail.NewPersonalization()
	// p.AddTos(mail.NewEmail("", to))
	// p.SetDynamicTemplateData(data)
	// m.AddPersonalizations(p)

	return nil
}

func generateHTMLEmail(subject, body string) string {
	return fmt.Sprintf(`
	<html>
		<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
			<div style="background: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
				<div style="border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px;">
					<h1 style="margin: 0; color: #0f172a; font-size: 24px;">%s</h1>
				</div>
				<div style="color: #333; line-height: 1.6; font-size: 14px;">
					%s
				</div>
				<div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
					<p>This is an automated email from GitBot. Please do not reply to this email.</p>
					<p>Copyright © 2026 GitBot. All rights reserved.</p>
				</div>
			</div>
		</body>
	</html>
	`, subject, body)
}

func handleSendEmail(w http.ResponseWriter, r *http.Request) {
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

	var req EmailRequest
	if err := r.ParseForm(); err == nil {
		req.Email = r.FormValue("email")
		req.Subject = r.FormValue("subject")
		req.Body = r.FormValue("body")
	} else {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
	}

	if req.Email == "" || req.Subject == "" || req.Body == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Email, subject, and body are required",
		})
		return
	}

	if err := SendEmail(req.Email, req.Subject, req.Body); err != nil {
		log.Printf("Error sending email: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to send email",
		})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"success": "true",
		"message": "Email sent successfully",
	})
}

// Send notification emails based on events
func SendApprovalNotification(email, username, prTitle string, approved bool) error {
	subject := fmt.Sprintf("PR Review: %s", prTitle)
	status := "approved"
	if !approved {
		status = "requested changes"
	}

	body := fmt.Sprintf(`
	<h2>Your PR has been %s</h2>
	<p>Hi %s,</p>
	<p>Your pull request "<strong>%s</strong>" has been <strong>%s</strong>.</p>
	<p><a href="http://localhost:3000" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px;">View Review</a></p>
	<p>Thank you for using GitBot!</p>
	`, status, username, prTitle, status)

	return SendEmail(email, subject, body)
}

func SendCommentNotification(email, username, fileName string) error {
	subject := fmt.Sprintf("New comment on %s", fileName)
	body := fmt.Sprintf(`
	<h2>You have a new comment</h2>
	<p>Hi %s,</p>
	<p><strong>%s</strong> commented on <code>%s</code>.</p>
	<p><a href="http://localhost:3000" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px;">View Comment</a></p>
	`, username, username, fileName)

	return SendEmail(email, subject, body)
}

func SendWelcomeEmail(email, username string) error {
	subject := "Welcome to GitBot"
	body := fmt.Sprintf(`
	<h2>Welcome to GitBot</h2>
	<p>Hi %s,</p>
	<p>Welcome to GitBot, your AI-powered code review assistant!</p>
	<p>You can now:</p>
	<ul>
		<li>Review pull requests efficiently</li>
		<li>Add inline comments and feedback</li>
		<li>Track approval status</li>
		<li>Get notifications on code changes</li>
	</ul>
	<p><a href="http://localhost:3000" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px;">Get Started</a></p>
	<p>Happy reviewing!</p>
	`, username)

	return SendEmail(email, subject, body)
}

func GetEmailQueue() []EmailNotification {
	return emailQueue
}

func ClearEmailQueue() {
	emailQueue = []EmailNotification{}
}
