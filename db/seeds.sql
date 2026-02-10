-- TRUNCATE TABLE users, roles, permissions, role_permissions, verification_codes RESTART IDENTITY CASCADE;

INSERT INTO permissions (slug, description) VALUES
  ('read:users',       'Can view user profiles'),
  ('write:users',      'Can manage users and roles')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roles (name, description) VALUES
  ('Admin',  'Full access to the system'),
  ('Editor', 'Can manage content but not users'),
  ('Viewer', 'Read-only access')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
VALUES 
  ((SELECT id FROM roles WHERE name = 'Admin'), (SELECT id FROM permissions WHERE slug = 'read:users')),
  ((SELECT id FROM roles WHERE name = 'Admin'), (SELECT id FROM permissions WHERE slug = 'write:users'))
ON CONFLICT DO NOTHING;

INSERT INTO users (username, email, password_hash, role_id) VALUES 
  ('alice_admin',  'reed.gaines+alice@gmail.com',   '$2b$10$xKzbxFgP3TVU4PgPZ5.lYuzURSTrFAuv4Ea1J68We3b2s0zR/PtcS', (SELECT id FROM roles WHERE name = 'Admin')),
  ('bob_editor',   'reed.gaines+bob@gmail.com',     '$2b$10$xKzbxFgP3TVU4PgPZ5.lYuzURSTrFAuv4Ea1J68We3b2s0zR/PtcS', (SELECT id FROM roles WHERE name = 'Editor')),
  ('charlie_view', 'reed.gaines+charlie@gmail.com', '$2b$10$xKzbxFgP3TVU4PgPZ5.lYuzURSTrFAuv4Ea1J68We3b2s0zR/PtcS', (SELECT id FROM roles WHERE name = 'Viewer'))
ON CONFLICT (username) DO NOTHING;