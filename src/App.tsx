import { useState } from 'react'
import type { Person, Expense } from './settlement'
import { PeoplePanel } from './components/PeoplePanel'
import { ExpensePanel } from './components/ExpensePanel'
import { SummaryPanel } from './components/SummaryPanel'
import './App.css'

function App() {
  const [people, setPeople] = useState<Person[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  function addPerson(name: string) {
    setPeople(prev => [...prev, { id: crypto.randomUUID(), name }])
  }

  function removePerson(id: string) {
    setPeople(prev => prev.filter(p => p.id !== id))
  }

  function addExpense(expense: Omit<Expense, 'id'>) {
    setExpenses(prev => [...prev, { id: crypto.randomUUID(), ...expense }])
  }

  function removeExpense(id: string) {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <h1 className="site-header__title">Expense Splitter</h1>
        </div>
      </header>
      <div className="app">
        <main className="app-main">
          <PeoplePanel people={people} onAdd={addPerson} onRemove={removePerson} />
          <ExpensePanel
            people={people}
            expenses={expenses}
            onAdd={addExpense}
            onRemove={removeExpense}
          />
          <SummaryPanel people={people} expenses={expenses} />
        </main>
      </div>
    </>
  )
}

export default App
