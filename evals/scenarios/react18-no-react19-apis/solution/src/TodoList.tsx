import { useState } from 'react';

type Todo = { id: string; title: string; pending?: boolean };

async function createTodo(title: string): Promise<Todo> {
  const res = await fetch('/api/todos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title }) });
  if (!res.ok) throw new Error('Could not add todo');
  return res.json();
}

export function TodoList({ initial }: { initial: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initial);
  const [title, setTitle] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    const tempId = `tmp-${Date.now()}`;
    setError(null);
    setPending(true);
    setTodos((prev) => [...prev, { id: tempId, title, pending: true }]);
    setTitle('');
    try {
      const created = await createTodo(title);
      setTodos((prev) => prev.map((t) => (t.id === tempId ? created : t)));
    } catch (e) {
      setTodos((prev) => prev.filter((t) => t.id !== tempId));
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <ul>{todos.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <button onClick={add} disabled={pending}>{pending ? 'Adding…' : 'Add'}</button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
