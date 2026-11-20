#!/bin/bash
# Shared environment for the hrms-api service.
# Explicit exports (immune to ambient .env chains loaded by bun from parent dirs).
export DATABASE_URL="postgresql://postgres:hrms_pg_2026@127.0.0.1:5432/hrms?schema=public&connection_limit=20&pool_timeout=30"
export JWT_SECRET="7f9c2e1a4d8b6f3a9e0c5d2b7a4f1e8c3d6b9a2f5e8c1d4b7a2f9e6c3d5b8a1f4"
export JWT_EXPIRES_IN="7d"
export PORT=3001
export PG_PORT=5432
export PG_USER=postgres
export PG_PASSWORD=hrms_pg_2026
export PG_DATABASE=hrms
export LC_ALL="${LC_ALL:-C.UTF-8}"
