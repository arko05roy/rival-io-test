package main

import (
	"log"
	"net/http"
	"os"

	handler "taskmanager/api"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("API listening on :%s", port)
	if err := http.ListenAndServe(":"+port, http.HandlerFunc(handler.ServeHTTP)); err != nil {
		log.Fatal(err)
	}
}
