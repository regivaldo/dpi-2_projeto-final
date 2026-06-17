.PHONY: frontend backend init stop

PID_DIR := .make
FRONTEND_PID := $(PID_DIR)/frontend.pid
BACKEND_PID := $(PID_DIR)/backend.pid

frontend:
	cd frontend && npm start

backend:
	cd backend && npm run start:dev

init:
	mkdir -p $(PID_DIR)
	cd frontend && nohup npm start > ../$(PID_DIR)/frontend.log 2>&1 & echo $$! > $(FRONTEND_PID)
	cd backend && nohup npm run start:dev > ../$(PID_DIR)/backend.log 2>&1 & echo $$! > $(BACKEND_PID)

stop:
	@if [ -f $(FRONTEND_PID) ]; then kill $$(cat $(FRONTEND_PID)) 2>/dev/null || true; rm -f $(FRONTEND_PID); fi
	@if [ -f $(BACKEND_PID) ]; then kill $$(cat $(BACKEND_PID)) 2>/dev/null || true; rm -f $(BACKEND_PID); fi