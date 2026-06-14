package core

import (
	"testing"
	"time"
)

func TestValidateEmail(t *testing.T) {
	tests := []struct {
		email   string
		wantErr bool
	}{
		{"user@example.com", false},
		{"", true},
		{"bad", true},
		{"a@b", true},
	}

	for _, tt := range tests {
		err := validateEmail(tt.email)
		if (err != nil) != tt.wantErr {
			t.Errorf("validateEmail(%q) error = %v, wantErr %v", tt.email, err, tt.wantErr)
		}
	}
}

func TestValidatePassword(t *testing.T) {
	if err := validatePassword("short"); err == nil {
		t.Error("expected error for short password")
	}
	if err := validatePassword("longenough"); err != nil {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestValidateCreateTask(t *testing.T) {
	due := "2026-06-15"
	tests := []struct {
		name    string
		req     CreateTaskRequest
		wantErr bool
	}{
		{"valid minimal", CreateTaskRequest{Title: "Buy milk"}, false},
		{"empty title", CreateTaskRequest{Title: "  "}, true},
		{"bad status", CreateTaskRequest{Title: "x", Status: "done"}, true},
		{"bad priority", CreateTaskRequest{Title: "x", Priority: "urgent"}, true},
		{"valid due date", CreateTaskRequest{Title: "x", DueDate: &due}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateCreateTask(tt.req)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateCreateTask() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestParseDueDate(t *testing.T) {
	iso := "2026-06-15T10:00:00Z"
	tm, err := parseDueDate(&iso)
	if err != nil || tm == nil {
		t.Fatalf("parseDueDate RFC3339: %v", err)
	}

	plain := "2026-06-15"
	tm2, err := parseDueDate(&plain)
	if err != nil || tm2 == nil {
		t.Fatalf("parseDueDate date: %v", err)
	}
	if tm2.Hour() != 0 {
		t.Errorf("expected midnight UTC, got %v", tm2)
	}

	empty := ""
	tm3, err := parseDueDate(&empty)
	if err != nil || tm3 != nil {
		t.Errorf("empty due date should be nil")
	}
}

func TestHashAndCheckPassword(t *testing.T) {
	hash, err := hashPassword("testpassword123")
	if err != nil {
		t.Fatal(err)
	}
	if !checkPassword(hash, "testpassword123") {
		t.Error("password should match")
	}
	if checkPassword(hash, "wrongpassword") {
		t.Error("wrong password should not match")
	}
}

func TestCreateAndParseToken(t *testing.T) {
	user := User{
		ID:    "user-123",
		Email: "test@example.com",
		Role:  RoleUser,
	}
	token, err := createToken(user)
	if err != nil {
		t.Fatal(err)
	}
	claims, err := parseToken(token)
	if err != nil {
		t.Fatal(err)
	}
	if claims.UserID != user.ID || claims.Email != user.Email {
		t.Errorf("claims mismatch: %+v", claims)
	}
	if claims.ExpiresAt.Before(time.Now()) {
		t.Error("token should not be expired")
	}
}

func TestPriorityOrderSQL(t *testing.T) {
	asc := priorityOrderSQL("asc")
	if asc == "" {
		t.Error("expected SQL fragment")
	}
	desc := priorityOrderSQL("DESC")
	if desc == "" {
		t.Error("expected SQL fragment")
	}
}
