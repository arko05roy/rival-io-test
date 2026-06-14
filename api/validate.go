package handler

import (
	"fmt"
	"strings"
	"time"
)

func validateEmail(email string) error {
	email = strings.TrimSpace(email)
	if email == "" {
		return fmt.Errorf("email is required")
	}
	if !strings.Contains(email, "@") || len(email) < 5 {
		return fmt.Errorf("email must be valid")
	}
	return nil
}

func validatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}
	return nil
}

func validateCreateTask(req CreateTaskRequest) error {
	title := strings.TrimSpace(req.Title)
	if title == "" {
		return fmt.Errorf("title is required")
	}
	if len(title) > 200 {
		return fmt.Errorf("title must be 200 characters or fewer")
	}
	if len(req.Description) > 5000 {
		return fmt.Errorf("description must be 5000 characters or fewer")
	}

	status := req.Status
	if status == "" {
		status = StatusTodo
	}
	if !validStatuses[status] {
		return fmt.Errorf("status must be todo, in_progress, or complete")
	}

	priority := req.Priority
	if priority == "" {
		priority = PriorityMedium
	}
	if !validPriorities[priority] {
		return fmt.Errorf("priority must be low, medium, or high")
	}

	if req.DueDate != nil && *req.DueDate != "" {
		if _, err := time.Parse(time.RFC3339, *req.DueDate); err != nil {
			if _, err2 := time.Parse("2006-01-02", *req.DueDate); err2 != nil {
				return fmt.Errorf("due_date must be ISO 8601 or YYYY-MM-DD")
			}
		}
	}

	return nil
}

func validateUpdateTask(req UpdateTaskRequest) error {
	if req.Title != nil {
		title := strings.TrimSpace(*req.Title)
		if title == "" {
			return fmt.Errorf("title cannot be empty")
		}
		if len(title) > 200 {
			return fmt.Errorf("title must be 200 characters or fewer")
		}
	}
	if req.Description != nil && len(*req.Description) > 5000 {
		return fmt.Errorf("description must be 5000 characters or fewer")
	}
	if req.Status != nil && !validStatuses[*req.Status] {
		return fmt.Errorf("status must be todo, in_progress, or complete")
	}
	if req.Priority != nil && !validPriorities[*req.Priority] {
		return fmt.Errorf("priority must be low, medium, or high")
	}
	if req.DueDate != nil && *req.DueDate != "" {
		if _, err := time.Parse(time.RFC3339, *req.DueDate); err != nil {
			if _, err2 := time.Parse("2006-01-02", *req.DueDate); err2 != nil {
				return fmt.Errorf("due_date must be ISO 8601 or YYYY-MM-DD")
			}
		}
	}
	return nil
}

func parseDueDate(s *string) (*time.Time, error) {
	if s == nil || *s == "" {
		return nil, nil
	}
	if t, err := time.Parse(time.RFC3339, *s); err == nil {
		return &t, nil
	}
	if t, err := time.Parse("2006-01-02", *s); err == nil {
		utc := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
		return &utc, nil
	}
	return nil, fmt.Errorf("invalid due_date")
}
