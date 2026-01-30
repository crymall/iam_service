TRUNCATE TABLE users, roles, permissions, role_permissions, documents RESTART IDENTITY CASCADE;

INSERT INTO permissions (slug, description) VALUES
  ('read:documents',   'Can view documents'),           -- ID: 1
  ('write:documents',  'Can create/edit documents'),    -- ID: 2
  ('delete:documents', 'Can delete documents'),         -- ID: 3
  ('read:users',       'Can view user profiles'),       -- ID: 4
  ('write:users',      'Can manage users and roles');   -- ID: 5

INSERT INTO roles (name, description) VALUES
  ('Admin',  'Full access to the system'),              -- ID: 1
  ('Editor', 'Can manage content but not users'),       -- ID: 2
  ('Viewer', 'Read-only access');                       -- ID: 3

INSERT INTO role_permissions (role_id, permission_id)
VALUES 
  ((SELECT id FROM roles WHERE name = 'Admin'), (SELECT id FROM permissions WHERE slug = 'read:documents')),
  ((SELECT id FROM roles WHERE name = 'Admin'), (SELECT id FROM permissions WHERE slug = 'write:documents')),
  ((SELECT id FROM roles WHERE name = 'Admin'), (SELECT id FROM permissions WHERE slug = 'delete:documents')),
  ((SELECT id FROM roles WHERE name = 'Admin'), (SELECT id FROM permissions WHERE slug = 'read:users')),
  ((SELECT id FROM roles WHERE name = 'Admin'), (SELECT id FROM permissions WHERE slug = 'write:users')),

  ((SELECT id FROM roles WHERE name = 'Editor'), (SELECT id FROM permissions WHERE slug = 'read:documents')),
  ((SELECT id FROM roles WHERE name = 'Editor'), (SELECT id FROM permissions WHERE slug = 'write:documents')),

  ((SELECT id FROM roles WHERE name = 'Viewer'), (SELECT id FROM permissions WHERE slug = 'read:documents'));

-- Note: The password_hash below matches the string 'password123'
INSERT INTO users (username, password_hash, role_id) VALUES 
  ('alice_admin',  '$2b$10$xKzbxFgP3TVU4PgPZ5.lYuzURSTrFAuv4Ea1J68We3b2s0zR/PtcS', (SELECT id FROM roles WHERE name = 'Admin')),
  ('bob_editor',   '$2b$10$xKzbxFgP3TVU4PgPZ5.lYuzURSTrFAuv4Ea1J68We3b2s0zR/PtcS', (SELECT id FROM roles WHERE name = 'Editor')),
  ('charlie_view', '$2b$10$xKzbxFgP3TVU4PgPZ5.lYuzURSTrFAuv4Ea1J68We3b2s0zR/PtcS', (SELECT id FROM roles WHERE name = 'Viewer'));

INSERT INTO documents (title, content) VALUES
  ('Project Alpha Blueprint', 'Confidential: The initial schematics for the Alpha device.'),
  ('Q4 Financial Report', 'Revenue is up 20%. Expenses are down 5%. Bonus pool approved.'),
  ('Employee Salaries 2025', 'RESTRICTED ACCESS: List of all employee compensation packages.'),
  ('Lunch Menu', 'Monday: Pizza. Tuesday: Tacos. Wednesday: Salad.');