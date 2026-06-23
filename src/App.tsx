import { useState, useEffect } from 'react'
import type { Person, Expense } from './settlement'
import { PeoplePanel } from './components/PeoplePanel'
import { ExpensePanel } from './components/ExpensePanel'
import { SummaryPanel } from './components/SummaryPanel'
import './App.css'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function App() {
  const [people, setPeople] = useState<Person[]>(() => load('youtab-people', []))
  const [expenses, setExpenses] = useState<Expense[]>(() => load('youtab-expenses', []))

  useEffect(() => {
    localStorage.setItem('youtab-people', JSON.stringify(people))
  }, [people])

  useEffect(() => {
    localStorage.setItem('youtab-expenses', JSON.stringify(expenses))
  }, [expenses])

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

  function reset() {
    if (!window.confirm('Reset? This will clear all people and expenses.')) return
    setPeople([])
    setExpenses([])
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <h1 className="site-header__title">
            <span className="header-brand">youtab</span>
            <span className="header-sep"> · </span>
            <span className="header-app">Expense Splitter</span>
          </h1>
          <div className="header-actions">
            {(people.length > 0 || expenses.length > 0) && (
              <button type="button" className="btn-reset" onClick={reset}>
                Reset
              </button>
            )}
          <a
            href="https://github.com/xelasrc/Youtap-Expense-Splitter"
            target="_blank"
            rel="noopener noreferrer"
            className="header-github"
            aria-label="View source on GitHub"
          >
            <svg height="22" viewBox="0 0 16 16" width="22" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>
          </div>
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
