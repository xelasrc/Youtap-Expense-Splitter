import { useState } from 'react'
import type { Person } from '../settlement'

interface Props {
  people: Person[]
  onAdd: (name: string) => void
  onRemove: (id: string) => void
}

export function PeoplePanel({ people, onAdd, onRemove }: Props) {
  const [name, setName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  return (
    <section className="panel">
      <h2>People</h2>
      <form onSubmit={handleSubmit} className="add-row">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name"
          aria-label="Person's name"
        />
        <button type="submit" disabled={!name.trim()}>Add</button>
      </form>

      {people.length === 0 ? (
        <p className="empty">Add some people to get started.</p>
      ) : (
        <ul className="people-list">
          {people.map(p => (
            <li key={p.id}>
              <span>{p.name}</span>
              <button
                type="button"
                className="remove"
                onClick={() => onRemove(p.id)}
                aria-label={`Remove ${p.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
