TRUNCATE TABLE users, roles, permissions, role_permissions, verification_codes RESTART IDENTITY CASCADE;

INSERT INTO permissions (slug, description) VALUES
  ('write:users',      'Can view and manage users and roles'),
  ('write:data',    'Can view and edit Midden app data')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roles (name, description) VALUES
  ('Admin',  'Full access to the system'),
  ('Editor', 'Can manage content but not users')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
VALUES 
  ((SELECT id FROM roles WHERE name = 'Admin'), (SELECT id FROM permissions WHERE slug = 'write:users')),
  ((SELECT id FROM roles WHERE name = 'Admin'), (SELECT id FROM permissions WHERE slug = 'write:data')),
  ((SELECT id FROM roles WHERE name = 'Editor'), (SELECT id FROM permissions WHERE slug = 'write:data'))
ON CONFLICT DO NOTHING;