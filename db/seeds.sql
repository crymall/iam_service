-- TRUNCATE TABLE users, roles, permissions, role_permissions, verification_codes RESTART IDENTITY CASCADE;

INSERT INTO permissions (slug, description) VALUES
  ('read:users',       'Can view user profiles'),
  ('write:users',      'Can manage users and roles'),
  ('read:canteen',     'Can view Canteen recipes'),
  ('write:canteen',    'Can edit Canteen recipes')
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