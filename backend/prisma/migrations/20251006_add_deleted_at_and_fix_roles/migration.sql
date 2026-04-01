-- Migración para agregar campo deletedAt y corregir roles
-- CrediCheck User Management System
-- Fecha: 2025-10-06

-- Paso 1: Agregar campo deleted_at a la tabla users
ALTER TABLE users ADD COLUMN deleted_at DATETIME;

-- Paso 2: Agregar campo deleted_at a la tabla credit_references  
ALTER TABLE credit_references ADD COLUMN deleted_at DATETIME;

-- Paso 3: Actualizar roles existentes de minúsculas a mayúsculas
-- IMPORTANTE: Esto migrará los datos existentes
UPDATE users SET role = 'ADMIN' WHERE LOWER(role) IN ('admin', 'administrator', 'superadmin');
UPDATE users SET role = 'ANALYST' WHERE LOWER(role) IN ('analyst', 'analista');

-- Paso 4: Establecer valor por defecto para usuarios sin rol definido
UPDATE users SET role = 'ANALYST' WHERE role IS NULL OR role = '';

-- Crear índice para mejorar rendimiento en consultas de soft delete
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_credit_references_deleted_at ON credit_references(deleted_at);