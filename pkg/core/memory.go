package core

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"
)

type memStore struct {
	mu     sync.RWMutex
	users  map[string]User
	byMail map[string]string
	tasks  map[string]Task
}

func newMemStore() *memStore {
	return &memStore{
		users:  make(map[string]User),
		byMail: make(map[string]string),
		tasks:  make(map[string]Task),
	}
}

func newMemID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func (m *memStore) createUser(email, hash string) (User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, ok := m.byMail[email]; ok {
		return User{}, fmt.Errorf("duplicate")
	}

	user := User{
		ID:           newMemID(),
		Email:        email,
		PasswordHash: hash,
		Role:         RoleUser,
		CreatedAt:    time.Now().UTC(),
	}
	m.users[user.ID] = user
	m.byMail[email] = user.ID
	return user, nil
}

func (m *memStore) findUserByEmail(email string) (User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	id, ok := m.byMail[email]
	if !ok {
		return User{}, fmt.Errorf("not found")
	}
	return m.users[id], nil
}

func (m *memStore) createTask(userID, title, description, status, priority string, dueDate *time.Time) (Task, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now().UTC()
	task := Task{
		ID:          newMemID(),
		UserID:      userID,
		Title:       title,
		Description: description,
		Status:      status,
		Priority:    priority,
		DueDate:     dueDate,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	m.tasks[task.ID] = task
	return task, nil
}

type listTasksParams struct {
	userID    string
	role      string
	status    string
	search    string
	sortBy    string
	sortOrder string
	page      int
	limit     int
}

func (m *memStore) listTasks(p listTasksParams) (TaskListResponse, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	matched := make([]Task, 0, len(m.tasks))
	for _, task := range m.tasks {
		if p.role != RoleAdmin && task.UserID != p.userID {
			continue
		}
		if p.status != "" && task.Status != p.status {
			continue
		}
		if p.search != "" && !strings.Contains(strings.ToLower(task.Title), strings.ToLower(p.search)) {
			continue
		}
		matched = append(matched, task)
	}

	sortMemTasks(matched, p.sortBy, p.sortOrder)

	total := len(matched)
	offset := (p.page - 1) * p.limit
	if offset > total {
		offset = total
	}
	end := offset + p.limit
	if end > total {
		end = total
	}

	pageTasks := matched[offset:end]
	totalPages := 0
	if total > 0 {
		totalPages = (total + p.limit - 1) / p.limit
	}

	return TaskListResponse{
		Tasks:      pageTasks,
		Page:       p.page,
		Limit:      p.limit,
		Total:      total,
		TotalPages: totalPages,
	}, nil
}

func sortMemTasks(tasks []Task, sortBy, sortOrder string) {
	desc := strings.ToLower(sortOrder) == "desc"

	sort.Slice(tasks, func(i, j int) bool {
		a, b := tasks[i], tasks[j]
		switch sortBy {
		case "due_date":
			return compareTimePtr(a.DueDate, b.DueDate, desc)
		case "priority":
			return comparePriority(a.Priority, b.Priority, desc)
		default:
			return compareTime(a.CreatedAt, b.CreatedAt, desc)
		}
	})
}

func priorityRank(p string) int {
	switch p {
	case PriorityHigh:
		return 1
	case PriorityMedium:
		return 2
	case PriorityLow:
		return 3
	default:
		return 4
	}
}

func comparePriority(a, b string, desc bool) bool {
	ra, rb := priorityRank(a), priorityRank(b)
	if ra == rb {
		return false
	}
	if desc {
		return ra > rb
	}
	return ra < rb
}

func compareTime(a, b time.Time, desc bool) bool {
	if desc {
		return a.After(b)
	}
	return a.Before(b)
}

func compareTimePtr(a, b *time.Time, desc bool) bool {
	switch {
	case a == nil && b == nil:
		return false
	case a == nil:
		return false
	case b == nil:
		return true
	default:
		return compareTime(*a, *b, desc)
	}
}

func (m *memStore) getTask(userID, role, id string) (Task, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	task, ok := m.tasks[id]
	if !ok || (role != RoleAdmin && task.UserID != userID) {
		return Task{}, fmt.Errorf("not found")
	}
	return task, nil
}

func (m *memStore) updateTask(id string, title, description, status, priority string, dueDate *time.Time) (Task, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	task, ok := m.tasks[id]
	if !ok {
		return Task{}, fmt.Errorf("not found")
	}

	task.Title = title
	task.Description = description
	task.Status = status
	task.Priority = priority
	task.DueDate = dueDate
	task.UpdatedAt = time.Now().UTC()
	m.tasks[id] = task
	return task, nil
}

func (m *memStore) deleteTask(userID, role, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	task, ok := m.tasks[id]
	if !ok || (role != RoleAdmin && task.UserID != userID) {
		return fmt.Errorf("not found")
	}
	delete(m.tasks, id)
	return nil
}
