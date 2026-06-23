import { useState } from 'react'
import type { Person } from './settlement'
import { PeoplePanel } from './components/PeoplePanel'
import './App.css'

function App() {
  const [people, setPeople] = useState<Person[]>([])

  function addPerson(name: string) {
    setPeople(prev => [...prev, { id: crypto.randomUUID(), name }])
  }

  function removePerson(id: string) {
    setPeople(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Expense Splitter</h1>
      </header>
      <main className="app-main">
        <PeoplePanel people={people} onAdd={addPerson} onRemove={removePerson} />
      </main>
    </div>
  )
}

export default App
