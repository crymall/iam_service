import { jest } from '@jest/globals';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

// 1. Mock the database configuration
// We mock the default export of db.js to intercept query calls
const mockQuery = jest.fn();
jest.unstable_mockModule('../config/db.js', () => ({
  default: {
    query: mockQuery,
  },
}));

// 2. Mock Nodemailer to prevent sending real emails
const mockSendMail = jest.fn();
jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: jest.fn().mockReturnValue({
      sendMail: mockSendMail,
    }),
  },
}));

// 3. Mock Users Router to isolate Auth testing
// This prevents errors if the users route has dependencies we haven't mocked
jest.unstable_mockModule('../routes/users.js', () => ({
  default: (req, res, next) => next(),
}));

// 4. Import app and supertest dynamically AFTER mocks are defined
const { default: app } = await import('../app.js');
const request = (await import('supertest')).default;

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
    process.env.EMAIL_USER = 'test@example.com';
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      };

      // Mock 1: Role lookup (SELECT id FROM roles...)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 2 }] });
      
      // Mock 2: User insertion (INSERT INTO users...)
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, username: userData.username, email: userData.email }],
      });

      const res = await request(app).post('/register').send(userData);

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('username', userData.username);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should assign Viewer role to new user', async () => {
      const userData = {
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      };
      const viewerRoleId = 3;

      // Mock 1: Role lookup
      mockQuery.mockResolvedValueOnce({ rows: [{ id: viewerRoleId }] });
      
      // Mock 2: User insertion
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, username: userData.username, email: userData.email }],
      });

      await request(app).post('/register').send(userData);
      
      expect(mockQuery.mock.calls[1][1][3]).toBe(viewerRoleId);
    });

    it('should return 409 if user already exists', async () => {
      // Conditionally suppress console.error only for the expected error
      const originalError = console.error;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation((err, ...args) => {
        if (err && err.code === '23505') return;
        originalError.call(console, err, ...args);
      });

      const userData = {
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      };

      // Mock 1: Role lookup
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 2 }] });
      
      // Mock 2: User insertion failure (Postgres unique violation code 23505)
      const err = new Error('Duplicate');
      err.code = '23505';
      mockQuery.mockRejectedValueOnce(err);

      const res = await request(app).post('/register').send(userData);

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/);

      consoleSpy.mockRestore();
    });
  });

  describe('POST /login', () => {
    it('should login successfully and send 2FA code', async () => {
      const password = faker.internet.password();
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        id: 1,
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password_hash: hashedPassword,
      };

      // Mock 1: Find user by username
      mockQuery.mockResolvedValueOnce({ rows: [user] });
      
      // Mock 2: Insert verification code
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).post('/login').send({
        username: user.username,
        password: password,
      });

      expect(res.status).toBe(200);
      expect(mockSendMail).toHaveBeenCalled();
      expect(res.body.message).toContain('Verification code sent');
    });

    it('should fail with invalid credentials', async () => {
      const password = faker.internet.password();
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        id: 1,
        username: faker.internet.userName(),
        password_hash: hashedPassword,
      };

      // Mock 1: Find user
      mockQuery.mockResolvedValueOnce({ rows: [user] });

      const res = await request(app).post('/login').send({
        username: user.username,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
    });

    it('should login guest user immediately without 2FA', async () => {
      const res = await request(app).post('/login').send({
        username: 'guest',
        password: 'guest',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toEqual({
        username: 'guest',
        role: 'Viewer',
        permissions: ['read:public'],
      });
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('POST /verify-2fa', () => {
    it('should verify code and return JWT token', async () => {
      const userId = 1;
      const code = '123456';

      // Mock 1: Check code validity
      mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ code }] });
      
      // Mock 2: Delete used code
      mockQuery.mockResolvedValueOnce({});
      
      // Mock 3: Get full user details for JWT
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: userId,
          username: 'testuser',
          role: 'Editor',
          permissions: ['read', 'write'],
        }],
      });

      const res = await request(app).post('/verify-2fa').send({ userId, code });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('Editor');
    });

    it('should fail with invalid or expired verification code', async () => {
      // Mock 1: Check code (returns no rows)
      mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const res = await request(app).post('/verify-2fa').send({ userId: 1, code: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid or expired code');
    });
  });
});