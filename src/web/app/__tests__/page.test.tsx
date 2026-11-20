/**
 * Tests for the Home page component (app/page.tsx)
 *
 * page.tsx is an async React Server Component. We test it by:
 * 1. Mocking the actions module so getTasks returns controlled data
 * 2. Awaiting the component function (RSC = async function returning JSX)
 * 3. Rendering the returned JSX with @testing-library/react
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the actions module – must come before the component import
jest.mock('../actions', () => ({
  getTasks: jest.fn(),
  createTask: jest.fn(),
  toggleTask: jest.fn(),
}));

import { getTasks } from '../actions';
import Home from '../page';

const mockGetTasks = getTasks as jest.MockedFunction<typeof getTasks>;

// Helper: render an async Server Component
async function renderAsync(Component: () => Promise<React.ReactElement>) {
  const jsx = await Component();
  return render(jsx);
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
describe('Home page – no tasks', () => {
  it('renders the page heading', async () => {
    mockGetTasks.mockResolvedValueOnce([]);
    await renderAsync(Home);
    expect(screen.getByRole('heading', { name: /to-do list/i })).toBeInTheDocument();
  });

  it('renders the add-task form with an input and submit button', async () => {
    mockGetTasks.mockResolvedValueOnce([]);
    await renderAsync(Home);
    expect(screen.getByPlaceholderText(/add a new task/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('shows the empty-state message when there are no tasks', async () => {
    mockGetTasks.mockResolvedValueOnce([]);
    await renderAsync(Home);
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('does not render the completion counter when there are no tasks', async () => {
    mockGetTasks.mockResolvedValueOnce([]);
    await renderAsync(Home);
    expect(screen.queryByText(/completed/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// With tasks
// ---------------------------------------------------------------------------
describe('Home page – with tasks', () => {
  const tasks = [
    { id: 1, title: 'Buy milk', completed: false, created_at: '2024-01-01T00:00:00Z' },
    { id: 2, title: 'Walk dog', completed: true, created_at: '2024-01-02T00:00:00Z' },
    { id: 3, title: 'Read book', completed: false, created_at: '2024-01-03T00:00:00Z' },
  ];

  it('renders each task title', async () => {
    mockGetTasks.mockResolvedValueOnce(tasks);
    await renderAsync(Home);
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.getByText('Walk dog')).toBeInTheDocument();
    expect(screen.getByText('Read book')).toBeInTheDocument();
  });

  it('does not show the empty-state message when tasks exist', async () => {
    mockGetTasks.mockResolvedValueOnce(tasks);
    await renderAsync(Home);
    expect(screen.queryByText(/no tasks yet/i)).not.toBeInTheDocument();
  });

  it('shows the completion counter with correct counts', async () => {
    mockGetTasks.mockResolvedValueOnce(tasks);
    await renderAsync(Home);
    // 1 of 3 completed
    expect(screen.getByText('1 / 3 completed')).toBeInTheDocument();
  });

  it('marks completed tasks with aria-label "Mark incomplete"', async () => {
    mockGetTasks.mockResolvedValueOnce(tasks);
    await renderAsync(Home);
    const completedButtons = screen.getAllByRole('button', { name: /mark incomplete/i });
    expect(completedButtons).toHaveLength(1);
  });

  it('marks incomplete tasks with aria-label "Mark complete"', async () => {
    mockGetTasks.mockResolvedValueOnce(tasks);
    await renderAsync(Home);
    const incompleteButtons = screen.getAllByRole('button', { name: /mark complete/i });
    expect(incompleteButtons).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// All tasks completed
// ---------------------------------------------------------------------------
describe('Home page – all tasks completed', () => {
  const allDone = [
    { id: 1, title: 'Task A', completed: true, created_at: '2024-01-01T00:00:00Z' },
    { id: 2, title: 'Task B', completed: true, created_at: '2024-01-02T00:00:00Z' },
  ];

  it('shows full completion count', async () => {
    mockGetTasks.mockResolvedValueOnce(allDone);
    await renderAsync(Home);
    expect(screen.getByText('2 / 2 completed')).toBeInTheDocument();
  });
});
