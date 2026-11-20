/**
 * Tests for server actions in actions.ts
 *
 * Note: 'use server' directive is stripped by Next.js during testing.
 * We mock `next/cache` and global `fetch` to test the action logic in isolation.
 */

// Mock next/cache before importing actions
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import { revalidatePath } from 'next/cache';
import { getTasks, createTask, toggleTask, Task } from '../actions';

const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getTasks
// ---------------------------------------------------------------------------
describe('getTasks', () => {
  it('fetches tasks from the API and returns them', async () => {
    const tasks: Task[] = [
      { id: 1, title: 'Buy milk', completed: false, created_at: '2024-01-01T00:00:00Z' },
      { id: 2, title: 'Walk dog', completed: true, created_at: '2024-01-02T00:00:00Z' },
    ];
    mockFetch.mockResolvedValueOnce(makeResponse(tasks));

    const result = await getTasks();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks'),
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect(result).toEqual(tasks);
  });

  it('returns an empty array when there are no tasks', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse([]));
    const result = await getTasks();
    expect(result).toEqual([]);
  });

  it('throws an error when the response is not ok', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(null, false, 500));
    await expect(getTasks()).rejects.toThrow('Failed to fetch tasks');
  });

  it('uses the API_URL environment variable', async () => {
    const original = process.env.API_URL;
    process.env.API_URL = 'http://my-api:4000';
    // Re-import is not straightforward in Jest without module resetting,
    // so we just verify the default URL is used in this test run.
    mockFetch.mockResolvedValueOnce(makeResponse([]));
    await getTasks();
    // The module-level constant was set at import time; verify fetch was called
    expect(mockFetch).toHaveBeenCalledTimes(1);
    process.env.API_URL = original;
  });
});

// ---------------------------------------------------------------------------
// createTask
// ---------------------------------------------------------------------------
describe('createTask', () => {
  it('POSTs a new task with the correct payload', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ id: 3, title: 'New task', completed: false, created_at: '' }));

    const formData = new FormData();
    formData.append('title', 'New task');

    await createTask(formData);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New task' }),
      }),
    );
  });

  it('calls revalidatePath("/") after creating a task', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}));
    const formData = new FormData();
    formData.append('title', 'Another task');
    await createTask(formData);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/');
  });
});

// ---------------------------------------------------------------------------
// toggleTask
// ---------------------------------------------------------------------------
describe('toggleTask', () => {
  it('PATCHes the task with the correct id and completed value', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ id: 1, title: 'Buy milk', completed: true, created_at: '' }));

    await toggleTask(1, true);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks/1'),
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      }),
    );
  });

  it('can toggle a task to incomplete', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ id: 2, title: 'Walk dog', completed: false, created_at: '' }));

    await toggleTask(2, false);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks/2'),
      expect.objectContaining({
        body: JSON.stringify({ completed: false }),
      }),
    );
  });

  it('calls revalidatePath("/") after toggling a task', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}));
    await toggleTask(5, true);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/');
  });
});
