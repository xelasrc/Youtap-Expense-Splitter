import { useState } from 'react'
import type { Person, Expense } from '../settlement'
import { computeSettlements } from '../settlement'
import { formatCents } from '../money'

interface Props {
  people: Person[]
  expenses: Expense[]
}

export function SummaryPanel({ people, expenses }: Props) {
  const [copied, setCopied] = useState(false)

  if (people.length === 0 || expenses.length === 0) {
    return (
      <section className="panel">
        <h2>Summary</h2>
        <p className="empty">
          {people.length === 0
            ? 'Add people and expenses to see the summary.'
            : 'Add some expenses to see the summary.'}
        </p>
      </section>
    )
  }

  const { balances, settlements } = computeSettlements(people, expenses)
  const nameById = new Map(people.map(p => [p.id, p.name]))
  const allSquare = settlements.length === 0

  function copySettlements() {
    const text = allSquare
      ? 'Everyone is square — nothing to pay!'
      : settlements
          .map(s => `${nameById.get(s.from)} pays ${nameById.get(s.to)} ${formatCents(s.amountCents)}`)
          .join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section className="panel">
      <h2>Summary</h2>

      <div className="summary-section">
        <ul className="balance-list">
          {balances.map(b => {
            const sign = b.amountCents > 0 ? 'positive' : b.amountCents < 0 ? 'negative' : 'zero'
            const label =
              b.amountCents > 0
                ? `is owed ${formatCents(b.amountCents)}`
                : b.amountCents < 0
                  ? `owes ${formatCents(-b.amountCents)}`
                  : 'is settled up'
            return (
              <li key={b.personId} className={`balance-row balance-${sign}`}>
                <span className="balance-name">{nameById.get(b.personId)}</span>
                <span className="balance-amount">{label}</span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="summary-section">
        <div className="summary-section-header">
          <h3>Settle up</h3>
          <button type="button" className="btn-copy" onClick={copySettlements}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        {allSquare ? (
          <p className="all-square">Everyone is square — nothing to pay!</p>
        ) : (
          <ul className="settlement-list">
            {settlements.map((s, i) => (
              <li key={i} className="settlement-row">
                <span className="settlement-names">
                  <strong>{nameById.get(s.from)}</strong>
                  <span className="arrow"> → </span>
                  <strong>{nameById.get(s.to)}</strong>
                </span>
                <span className="settlement-amount">{formatCents(s.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
