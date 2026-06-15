package core

import (
	"context"
	"fmt"
	"strings"
	"time"
)

func (s *Server) createUser(ctx context.Context, email, hash string) (User, error) {
	if s.pool != nil {
		var user User
		err := s.pool.QueryRow(ctx, `
			INSERT INTO users (email, password_hash, role)
			VALUES ($1, $2, $3)
			RETURNING id, email, role, created_at
		`, email, hash, RoleUser).Scan(&user.ID, &user.Email, &user.Role, &user.CreatedAt)
		return user, err
	}
	return s.mem.createUser(email, hash)
}

func (s *Server) findUserByEmail(ctx context.Context, email string) (User, error) {
	if s.pool != nil {
		var user User
		err := s.pool.QueryRow(ctx, `
			SELECT id, email, password_hash, role, created_at
			FROM users WHERE email = $1
		`, email).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt)
		return user, err
	}
	return s.mem.findUserByEmail(email)
}

func (s *Server) createTaskRecord(ctx context.Context, userID, title, description, status, priority string, dueDate *time.Time) (Task, error) {
	if s.pool != nil {
		var task Task
		err := s.pool.QueryRow(ctx, `
			INSERT INTO tasks (user_id, title, description, status, priority, due_date)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id, user_id, title, description, status, priority, due_date, created_at, updated_at
		`, userID, title, description, status, priority, dueDate).Scan(
			&task.ID, &task.UserID, &task.Title, &task.Description, &task.Status, &task.Priority,
			&task.DueDate, &task.CreatedAt, &task.UpdatedAt,
		)
		return task, err
	}
	return s.mem.createTask(userID, title, description, status, priority, dueDate)
}

func (s *Server) listTaskRecords(ctx context.Context, p listTasksParams) (TaskListResponse, error) {
	if s.pool != nil {
		return s.listTasksDB(ctx, p)
	}
	return s.mem.listTasks(p)
}

func (s *Server) getTaskRecord(ctx context.Context, userID, role, id string) (Task, error) {
	if s.pool != nil {
		var task Task
		var err error
		if role == RoleAdmin {
			err = s.pool.QueryRow(ctx, `
				SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
				FROM tasks WHERE id = $1
			`, id).Scan(
				&task.ID, &task.UserID, &task.Title, &task.Description, &task.Status, &task.Priority,
				&task.DueDate, &task.CreatedAt, &task.UpdatedAt,
			)
		} else {
			err = s.pool.QueryRow(ctx, `
				SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
				FROM tasks WHERE id = $1 AND user_id = $2
			`, id, userID).Scan(
				&task.ID, &task.UserID, &task.Title, &task.Description, &task.Status, &task.Priority,
				&task.DueDate, &task.CreatedAt, &task.UpdatedAt,
			)
		}
		return task, err
	}
	return s.mem.getTask(userID, role, id)
}

func (s *Server) updateTaskRecord(ctx context.Context, id, title, description, status, priority string, dueDate *time.Time) (Task, error) {
	if s.pool != nil {
		var task Task
		err := s.pool.QueryRow(ctx, `
			UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, updated_at = NOW()
			WHERE id = $6
			RETURNING id, user_id, title, description, status, priority, due_date, created_at, updated_at
		`, title, description, status, priority, dueDate, id).Scan(
			&task.ID, &task.UserID, &task.Title, &task.Description, &task.Status, &task.Priority,
			&task.DueDate, &task.CreatedAt, &task.UpdatedAt,
		)
		return task, err
	}
	return s.mem.updateTask(id, title, description, status, priority, dueDate)
}

func (s *Server) deleteTaskRecord(ctx context.Context, userID, role, id string) error {
	if s.pool != nil {
		var tag interface{ RowsAffected() int64 }
		var err error
		if role == RoleAdmin {
			tag, err = s.pool.Exec(ctx, `DELETE FROM tasks WHERE id = $1`, id)
		} else {
			tag, err = s.pool.Exec(ctx, `DELETE FROM tasks WHERE id = $1 AND user_id = $2`, id, userID)
		}
		if err != nil {
			return err
		}
		if tag.RowsAffected() == 0 {
			return fmt.Errorf("not found")
		}
		return nil
	}
	return s.mem.deleteTask(userID, role, id)
}

func (s *Server) listTasksDB(ctx context.Context, p listTasksParams) (TaskListResponse, error) {
	args := []interface{}{}
	where := []string{}
	argIdx := 1

	if p.role != RoleAdmin {
		where = append(where, fmt.Sprintf("user_id = $%d", argIdx))
		args = append(args, p.userID)
		argIdx++
	}

	if p.status != "" {
		where = append(where, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, p.status)
		argIdx++
	}

	if p.search != "" {
		where = append(where, fmt.Sprintf("title ILIKE $%d", argIdx))
		args = append(args, "%"+p.search+"%")
		argIdx++
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	countQuery := "SELECT COUNT(*) FROM tasks " + whereClause
	var total int
	if err := s.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return TaskListResponse{}, err
	}

	orderClause := "ORDER BY created_at DESC"
	if p.sortBy != "" {
		if p.sortBy == "priority" {
			orderClause = "ORDER BY " + priorityOrderSQL(p.sortOrder)
		} else {
			dir := "ASC"
			if p.sortOrder == "desc" {
				dir = "DESC"
			}
			orderClause = fmt.Sprintf("ORDER BY %s %s NULLS LAST", p.sortBy, dir)
		}
	}

	listQuery := fmt.Sprintf(`
		SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
		FROM tasks %s %s LIMIT $%d OFFSET $%d
	`, whereClause, orderClause, argIdx, argIdx+1)

	listArgs := append(args, p.limit, (p.page-1)*p.limit)
	rows, err := s.pool.Query(ctx, listQuery, listArgs...)
	if err != nil {
		return TaskListResponse{}, err
	}
	defer rows.Close()

	tasks := []Task{}
	for rows.Next() {
		var task Task
		if err := rows.Scan(
			&task.ID, &task.UserID, &task.Title, &task.Description, &task.Status, &task.Priority,
			&task.DueDate, &task.CreatedAt, &task.UpdatedAt,
		); err != nil {
			return TaskListResponse{}, err
		}
		tasks = append(tasks, task)
	}

	totalPages := 0
	if total > 0 {
		totalPages = (total + p.limit - 1) / p.limit
	}

	return TaskListResponse{
		Tasks:      tasks,
		Page:       p.page,
		Limit:      p.limit,
		Total:      total,
		TotalPages: totalPages,
	}, nil
}

func isNotFound(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "no rows") || strings.Contains(msg, "not found")
}
