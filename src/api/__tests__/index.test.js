const request = require('supertest');
const app = require('../index');

// Mock the db module so no real PostgreSQL connection is needed
jest.mock('../db', () => ({
  query: jest.fn(),
}));

const db = require('../db');

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /tasks', () => {
  it('returns an empty array when there are no tasks', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM tasks ORDER BY created_at ASC'
    );
  });

  it('returns a list of tasks', async () => {
    const tasks = [
      { id: 1, title: 'Buy milk', completed: false, created_at: '2024-01-01T00:00:00.000Z' },
      { id: 2, title: 'Walk dog', completed: true, created_at: '2024-01-02T00:00:00.000Z' },
    ];
    db.query.mockResolvedValueOnce({ rows: tasks });

    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(tasks);
  });
});

describe('POST /tasks', () => {
  it('creates a new task and returns 201', async () => {
    const newTask = { id: 3, title: 'Read a book', completed: false, created_at: '2024-01-03T00:00:00.000Z' };
    db.query.mockResolvedValueOnce({ rows: [newTask] });

    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Read a book' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(newTask);
    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
      ['Read a book']
    );
  });

  it('trims whitespace from the title', async () => {
    const newTask = { id: 4, title: 'Exercise', completed: false, created_at: '2024-01-04T00:00:00.000Z' };
    db.query.mockResolvedValueOnce({ rows: [newTask] });

    const res = await request(app)
      .post('/tasks')
      .send({ title: '  Exercise  ' });

    expect(res.status).toBe(201);
    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
      ['Exercise']
    );
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/tasks').send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title is required' });
    expect(db.query).not.toHaveBeenCalled();
  });

  it('returns 400 when title is an empty string', async () => {
    const res = await request(app).post('/tasks').send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title is required' });
  });

  it('returns 400 when title is only whitespace', async () => {
    const res = await request(app).post('/tasks').send({ title: '   ' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title is required' });
  });

  it('returns 400 when title is not a string', async () => {
    const res = await request(app).post('/tasks').send({ title: 123 });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title is required' });
  });
});

describe('PATCH /tasks/:id', () => {
  const existingTask = { id: 1, title: 'Buy milk', completed: false, created_at: '2024-01-01T00:00:00.000Z' };

  it('marks a task as completed', async () => {
    const updatedTask = { ...existingTask, completed: true };
    db.query
      .mockResolvedValueOnce({ rows: [existingTask] })  // SELECT
      .mockResolvedValueOnce({ rows: [updatedTask] });  // UPDATE

    const res = await request(app)
      .patch('/tasks/1')
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedTask);
  });

  it('marks a task as incomplete', async () => {
    const completedTask = { ...existingTask, completed: true };
    const updatedTask = { ...existingTask, completed: false };
    db.query
      .mockResolvedValueOnce({ rows: [completedTask] })
      .mockResolvedValueOnce({ rows: [updatedTask] });

    const res = await request(app)
      .patch('/tasks/1')
      .send({ completed: false });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedTask);
  });

  it('renames a task', async () => {
    const updatedTask = { ...existingTask, title: 'Buy oat milk' };
    db.query
      .mockResolvedValueOnce({ rows: [existingTask] })
      .mockResolvedValueOnce({ rows: [updatedTask] });

    const res = await request(app)
      .patch('/tasks/1')
      .send({ title: 'Buy oat milk' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedTask);
  });

  it('applies partial updates, preserving existing values', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [existingTask] })
      .mockResolvedValueOnce({ rows: [existingTask] });

    // Send PATCH with no body fields — values should be preserved from current
    const res = await request(app).patch('/tasks/1').send({});

    expect(res.status).toBe(200);
    expect(db.query).toHaveBeenLastCalledWith(
      'UPDATE tasks SET completed = $1, title = $2 WHERE id = $3 RETURNING *',
      [false, 'Buy milk', 1]
    );
  });

  it('returns 404 when task does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/tasks/999')
      .send({ completed: true });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});

afterEach(() => {
  jest.clearAllMocks();
});
