-- Adiciona o role 'raiz' ao enum role_usuario.
-- Usado exclusivamente pelos admins do sistema (Helio e Hugo) — não aparece no seletor de roles.
ALTER TYPE role_usuario ADD VALUE IF NOT EXISTS 'raiz';
