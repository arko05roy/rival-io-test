package handler

import "net/http"

// Handler is the Vercel serverless entry point.
func Handler(w http.ResponseWriter, r *http.Request) {
	ServeHTTP(w, r)
}
