package core

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

func (s *Server) handleCreateTask(w http.ResponseWriter, r *http.Request) {
	user, ok := userFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if err := validateCreateTask(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	dueDate, err := parseDueDate(req.DueDate)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	status := req.Status
	if status == "" {
		status = StatusTodo
	}
	priority := req.Priority
	if priority == "" {
		priority = PriorityMedium
	}

	task, err := s.createTaskRecord(
		r.Context(),
		user.UserID,
		strings.TrimSpace(req.Title),
		req.Description,
		status,
		priority,
		dueDate,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create task")
		return
	}

	writeJSON(w, http.StatusCreated, task)
}

func (s *Server) handleListTasks(w http.ResponseWriter, r *http.Request) {
	user, ok := userFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	q := r.URL.Query()
	status := q.Get("status")
	search := strings.TrimSpace(q.Get("search"))
	sortBy := q.Get("sort_by")
	sortOrder := strings.ToLower(q.Get("sort_order"))
	if sortOrder != "desc" {
		sortOrder = "asc"
	}

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 10
	}

	if status != "" && !validStatuses[status] {
		writeError(w, http.StatusBadRequest, "invalid status filter")
		return
	}
	if sortBy != "" && !validSortFields[sortBy] {
		writeError(w, http.StatusBadRequest, "sort_by must be due_date, priority, or created_at")
		return
	}

	res, err := s.listTaskRecords(r.Context(), listTasksParams{
		userID:    user.UserID,
		role:      user.Role,
		status:    status,
		search:    search,
		sortBy:    sortBy,
		sortOrder: sortOrder,
		page:      page,
		limit:     limit,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list tasks")
		return
	}

	writeJSON(w, http.StatusOK, res)
}

func (s *Server) handleGetTask(w http.ResponseWriter, r *http.Request) {
	user, ok := userFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id := chi.URLParam(r, "id")
	task, err := s.getTaskRecord(r.Context(), user.UserID, user.Role, id)
	if err != nil {
		if isNotFound(err) {
			writeError(w, http.StatusNotFound, "task not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not fetch task")
		return
	}

	writeJSON(w, http.StatusOK, task)
}

func (s *Server) handleUpdateTask(w http.ResponseWriter, r *http.Request) {
	user, ok := userFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id := chi.URLParam(r, "id")
	var req UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if err := validateUpdateTask(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	existing, err := s.getTaskRecord(r.Context(), user.UserID, user.Role, id)
	if err != nil {
		if isNotFound(err) {
			writeError(w, http.StatusNotFound, "task not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not fetch task")
		return
	}

	title := existing.Title
	if req.Title != nil {
		title = strings.TrimSpace(*req.Title)
	}
	description := existing.Description
	if req.Description != nil {
		description = *req.Description
	}
	status := existing.Status
	if req.Status != nil {
		status = *req.Status
	}
	priority := existing.Priority
	if req.Priority != nil {
		priority = *req.Priority
	}
	dueDate := existing.DueDate
	if req.DueDate != nil {
		dueDate, err = parseDueDate(req.DueDate)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
	}

	task, err := s.updateTaskRecord(r.Context(), id, title, description, status, priority, dueDate)
	if err != nil {
		if isNotFound(err) {
			writeError(w, http.StatusNotFound, "task not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not update task")
		return
	}

	writeJSON(w, http.StatusOK, task)
}

func (s *Server) handleDeleteTask(w http.ResponseWriter, r *http.Request) {
	user, ok := userFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id := chi.URLParam(r, "id")
	if err := s.deleteTaskRecord(r.Context(), user.UserID, user.Role, id); err != nil {
		if isNotFound(err) {
			writeError(w, http.StatusNotFound, "task not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not delete task")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
