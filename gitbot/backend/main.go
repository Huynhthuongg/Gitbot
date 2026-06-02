package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// Cấu trúc dữ liệu trả về cho màn hình Diff (Mobile/Desktop đều dùng chung)
type DiffLine struct {
	Type    string `json:"type"`    // "addition", "deletion", "neutral"
	Content string `json:"content"` // Nội dung dòng code
	LineNum int    `json:"line_num"`
}

type FileDiff struct {
	FilePath string     `json:"file_path"`
	Lines    []DiffLine `json:"lines"`
}

func main() {
	// API lấy danh sách code thay đổi (Diff) của Pull Request
	http.HandleFunc("/api/v1/diff", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")

		// Dữ liệu mẫu giả lập từ Git Core Engine trả về
		mockDiff := []FileDiff{
			{
				FilePath: "components/Auth.ts",
				Lines: []DiffLine{
					{Type: "neutral", Content: "package auth", LineNum: 1},
					{Type: "deletion", Content: "- func Login(u string) {", LineNum: 2},
					{Type: "addition", Content: "+ func Login(email string, pass string) {", LineNum: 3},
					{Type: "addition", Content: "+ \t// AI Bot: Đã check bảo mật SQL Injection ở đây", LineNum: 4},
					{Type: "neutral", Content: "\treturn true", LineNum: 5},
				},
			},
		}

		json.NewEncoder(w).Encode(mockDiff)
	})

	fmt.Println("🚀 GitBot Backend đang chạy tại cổng :8080")
	http.ListenAndServe(":8080", nil)
}
