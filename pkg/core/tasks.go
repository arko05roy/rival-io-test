package core

import (
	"encoding/json"
	"fmt"
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

	var task Task
	err = s.pool.QueryRow(r.Context(), `
		INSERT INTO tasks (user_id, title, description, status, priority, due_date)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, user_id, title, description, status, priority, due_date, created_at, updated_at
	`, user.UserID, strings.TrimSpace(req.Title), req.Description, status, priority, dueDate).Scan(
		&task.ID, &task.UserID, &task.Title, &task.Description, &task.Status, &task.Priority,
		&task.DueDate, &task.CreatedAt, &task.UpdatedAt,
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
	offset := (page - 1) * limit

	if status != "" && !validStatuses[status] {
		writeError(w, http.StatusBadRequest, "invalid status filter")
		return
	}
	if sortBy != "" && !validSortFields[sortBy] {
		writeError(w, http.StatusBadRequest, "sort_by must be due_date, priority, or created_at")
		return
	}

	args := []interface{}{}
	where := []string{}
	argIdx := 1

	if user.Role != RoleAdmin {
		where = append(where, fmt.Sprintf("user_id = $%d", argIdx))
		args = append(args, user.UserID)
		argIdx++
	}

	if status != "" {
		where = append(where, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, status)
		argIdx++
	}

	if search != "" {
		where = append(where, fmt.Sprintf("title ILIKE $%d", argIdx))
		args = append(args, "%"+search+"%")
		argIdx++
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	countQuery := "SELECT COUNT(*) FROM tasks " + whereClause
	var total int
	if err := s.pool.QueryRow(r.Context(), countQuery, args...).Scan(&total); err != nil {
		writeError(w, http.StatusInternalServerError, "could not count tasks")
		return
	}

	orderClause := "ORDER BY created_at DESC"
	if sortBy != "" {
		if sortBy == "priority" {
			orderClause = "ORDER BY " + priorityOrderSQL(sortOrder)
		} else {
			dir := "ASC"
			if sortOrder == "desc" {
				dir = "DESC"
			}
			orderClause = fmt.Sprintf("ORDER BY %s %s NULLS LAST", sortBy, dir)
		}
	}

	listQuery := fmt.Sprintf(`
		SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
		FROM tasks %s %s LIMIT $%d OFFSET $%d
	`, whereClause, orderClause, argIdx, argIdx+1)

	listArgs := append(args, limit, offset)
	rows, err := s.pool.Query(r.Context(), listQuery, listArgs...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list tasks")
		return
	}
	defer rows.Close()

	tasks := []Task{}
	for rows.Next() {
		var task Task
		if err := rows.Scan(
			&task.ID, &task.UserID, &task.Title, &task.Description, &task.Status, &task.Priority,
			&task.DueDate, &task.CreatedAt, &task.UpdatedAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, "could not read task")
			return
		}
		tasks = append(tasks, task)
	}

	totalPages := 0
	if total > 0 {
		totalPages = (total + limit - 1) / limit
	}

	writeJSON(w, http.StatusOK, TaskListResponse{
		Tasks:      tasks,
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	})
}

func (s *Server) handleGetTask(w http.ResponseWriter, r *http.Request) {
	user, ok := userFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id := chi.URLParam(r, "id")
	var task Task
	var err error

	if user.Role == RoleAdmin {
		err = s.pool.QueryRow(r.Context(), `
			SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
			FROM tasks WHERE id = $1
		`, id).Scan(
			&task.ID, &task.UserID, &task.Title, &task.Description, &task.Status, &task.Priority,
			&task.DueDate, &task.CreatedAt, &task.UpdatedAt,
		)
	} else {
		err = s.pool.QueryRow(r.Context(), `
			SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
			FROM tasks WHERE id = $1 AND user_id = $2
		`, id, user.UserID).Scan(
			&task.ID, &task.UserID, &task.Title, &task.Description, &task.Status, &task.Priority,
			&task.DueDate, &task.CreatedAt, &task.UpdatedAt,
		)
	}

	if err != nil {
		if strings.Contains(err.Error(), "no rows") {
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

	var existing Task
	var err error
	if user.Role == RoleAdmin {
		err = s.pool.QueryRow(r.Context(), `
			SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
			FROM tasks WHERE id = $1
		`, id).Scan(
			&existing.ID, &existing.UserID, &existing.Title, &existing.Description, &existing.Status, &existing.Priority,
			&existing.DueDate, &existing.CreatedAt, &existing.UpdatedAt,
		)
	} else {
		err = s.pool.QueryRow(r.Context(), `
			SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
			FROM tasks WHERE id = $1 AND user_id = $2
		`, id, user.UserID).Scan(
			&existing.ID, &existing.UserID, &existing.Title, &existing.Description, &existing.Status, &existing.Priority,
			&existing.DueDate, &existing.CreatedAt, &existing.UpdatedAt,
		)
	}
	if err != nil {
		if strings.Contains(err.Error(), "no rows") {
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

	var task Task
	err = s.pool.QueryRow(r.Context(), `
		UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, updated_at = NOW()
		WHERE id = $6
		RETURNING id, user_id, title, description, status, priority, due_date, created_at, updated_at
	`, title, description, status, priority, dueDate, id).Scan(
		&task.ID, &task.UserID, &task.Title, &task.Description, &task.Status, &task.Priority,
		&task.DueDate, &task.CreatedAt, &task.UpdatedAt,
	)
	if err != nil {
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
	var tag interface{ RowsAffected() int64 }
	var err error

	if user.Role == RoleAdmin {
		tag, err = s.pool.Exec(r.Context(), `DELETE FROM tasks WHERE id = $1`, id)
	} else {
		tag, err = s.pool.Exec(r.Context(), `DELETE FROM tasks WHERE id = $1 AND user_id = $2`, id, user.UserID)
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not delete task")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
