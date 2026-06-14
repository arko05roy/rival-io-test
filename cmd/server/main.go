package main

import (
	"log"
	"net/http"
	"os"

	"taskmanager/pkg/core"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("API listening on :%s", port)
	if err := http.ListenAndServe(":"+port, http.HandlerFunc(core.ServeHTTP)); err != nil {
		log.Fatal(err)
	}
}
