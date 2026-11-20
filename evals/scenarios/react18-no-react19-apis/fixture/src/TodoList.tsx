import { useState } from 'react';

type Todo = { id: string; title: string };

async function createTodo(title: string): Promise<Todo> {
  const res = await fetch('/api/todos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title }) });
  if (!res.ok) throw new Error('Could not add todo');
  return res.json();
}

export function TodoList({ initial }: { initial: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initial);
  const [title, setTitle] = useState('');

  async function add() {
    const created = await createTodo(title);
    setTodos([...todos, created]);
    setTitle('');
  }

  return (
    <div>
      <ul>{todos.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <button onClick={add}>Add</button>
    </div>
  );
}
