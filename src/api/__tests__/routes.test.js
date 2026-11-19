'use strict';

const request = require('supertest');

// Mock the db module before requiring the app
jest.mock('../db');
const db = require('../db');

const app = require('../index');

// Helper to set up the mock return value for db.query
const mockQuery = (rows) => {
  db.query.mockResolvedValueOnce({ rows });
};

afterEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /health
// ---------------------------------------------------------------------------
describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

// ---------------------------------------------------------------------------
// GET /tasks
// ---------------------------------------------------------------------------
describe('GET /tasks', () => {
  it('returns 200 with an array of tasks', async () => {
    const tasks = [
      { id: 1, title: 'Buy milk', completed: false, created_at: '2024-01-01' },
      { id: 2, title: 'Walk dog', completed: true,  created_at: '2024-01-02' },
    ];
    mockQuery(tasks);

    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(tasks);
    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM tasks ORDER BY created_at ASC'
    );
  });

  it('returns an empty array when there are no tasks', async () => {
    mockQuery([]);

    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// POST /tasks
// ---------------------------------------------------------------------------
describe('POST /tasks', () => {
  it('creates a task and returns 201 with the new task', async () => {
    const newTask = { id: 3, title: 'Read book', completed: false, created_at: '2024-01-03' };
    mockQuery([newTask]);

    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Read book' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body).toEqual(newTask);
    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
      ['Read book']
    );
  });

  it('trims whitespace from the title before inserting', async () => {
    const newTask = { id: 4, title: 'Trimmed', completed: false, created_at: '2024-01-04' };
    mockQuery([newTask]);

    const res = await request(app)
      .post('/tasks')
      .send({ title: '  Trimmed  ' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
      ['Trimmed']
    );
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({})
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title is required' });
    expect(db.query).not.toHaveBeenCalled();
  });

  it('returns 400 when title is an empty string', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: '' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title is required' });
  });

  it('returns 400 when title is only whitespace', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: '   ' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title is required' });
  });

  it('returns 400 when title is not a string', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 42 })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title is required' });
  });
});

// ---------------------------------------------------------------------------
// PATCH /tasks/:id
// ---------------------------------------------------------------------------
describe('PATCH /tasks/:id', () => {
  it('returns 404 when the task does not exist', async () => {
    mockQuery([]); // SELECT returns nothing

    const res = await request(app)
      .patch('/tasks/99')
      .send({ completed: true })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('marks a task as completed', async () => {
    const existing = { id: 1, title: 'Buy milk', completed: false, created_at: '2024-01-01' };
    const updated  = { ...existing, completed: true };

    mockQuery([existing]); // SELECT
    mockQuery([updated]);  // UPDATE

    const res = await request(app)
      .patch('/tasks/1')
      .send({ completed: true })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      'UPDATE tasks SET completed = $1, title = $2 WHERE id = $3 RETURNING *',
      [true, 'Buy milk', 1]
    );
  });

  it('renames a task', async () => {
    const existing = { id: 1, title: 'Buy milk', completed: false, created_at: '2024-01-01' };
    const updated  = { ...existing, title: 'Buy oat milk' };

    mockQuery([existing]);
    mockQuery([updated]);

    const res = await request(app)
      .patch('/tasks/1')
      .send({ title: 'Buy oat milk' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      'UPDATE tasks SET completed = $1, title = $2 WHERE id = $3 RETURNING *',
      [false, 'Buy oat milk', 1]
    );
  });

  it('trims whitespace from the new title', async () => {
    const existing = { id: 1, title: 'Buy milk', completed: false, created_at: '2024-01-01' };
    const updated  = { ...existing, title: 'Buy oat milk' };

    mockQuery([existing]);
    mockQuery([updated]);

    const res = await request(app)
      .patch('/tasks/1')
      .send({ title: '  Buy oat milk  ' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      'UPDATE tasks SET completed = $1, title = $2 WHERE id = $3 RETURNING *',
      [false, 'Buy oat milk', 1]
    );
  });

  it('keeps existing values when no fields are provided', async () => {
    const existing = { id: 1, title: 'Buy milk', completed: false, created_at: '2024-01-01' };

    mockQuery([existing]);
    mockQuery([existing]);

    const res = await request(app)
      .patch('/tasks/1')
      .send({})
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      'UPDATE tasks SET completed = $1, title = $2 WHERE id = $3 RETURNING *',
      [false, 'Buy milk', 1]
    );
  });
});
