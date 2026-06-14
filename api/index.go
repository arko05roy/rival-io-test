package handler

import (
	"net/http"

	"taskmanager/pkg/core"
)

// Handler is the Vercel serverless entry point.
func Handler(w http.ResponseWriter, r *http.Request) {
	core.ServeHTTP(w, r)
}
