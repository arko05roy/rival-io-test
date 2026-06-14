package core

import (
	"context"
	"net/http"
	"strings"
	"sync"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Server struct {
	pool *pgxpool.Pool
}

var (
	serverOnce sync.Once
	serverInst *Server
	serverErr  error
)

func getServer() (*Server, error) {
	serverOnce.Do(func() {
		ctx := context.Background()
		pool, err := connectDB(ctx)
		if err != nil {
			serverErr = err
			return
		}
		if err := migrate(ctx, pool); err != nil {
			serverErr = err
			return
		}
		serverInst = &Server{pool: pool}
	})
	return serverInst, serverErr
}

func (s *Server) Router() http.Handler {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	r.Post("/auth/signup", s.handleSignup)
	r.Post("/auth/login", s.handleLogin)

	r.Route("/tasks", func(r chi.Router) {
		r.Use(s.authMiddleware)
		r.Post("/", s.handleCreateTask)
		r.Get("/", s.handleListTasks)
		r.Get("/{id}", s.handleGetTask)
		r.Patch("/{id}", s.handleUpdateTask)
		r.Delete("/{id}", s.handleDeleteTask)
	})

	return r
}

// ServeHTTP strips the /api prefix and dispatches to the chi router.
func ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s, err := getServer()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database unavailable")
		return
	}

	path := r.URL.Path
	if strings.HasPrefix(path, "/api") {
		r.URL.Path = strings.TrimPrefix(path, "/api")
		if r.URL.Path == "" {
			r.URL.Path = "/"
		}
	}

	s.Router().ServeHTTP(w, r)
}
