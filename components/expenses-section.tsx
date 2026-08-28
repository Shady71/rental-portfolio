import { formatExpenseCategory, isUpcoming, type Expense } from '@/lib/expenses'
import { formatCurrency, type CurrencyCode } from '@/lib/currency'
import { createExpense } from '@/app/dashboard/properties/actions'
import { ExpenseForm } from '@/components/expense-form'
import { DeleteExpenseForm } from '@/components/delete-expense-form'

export function ExpensesSection({
  propertyId,
  expenses,
  total,
  currency,
}: {
  propertyId: string
  expenses: Expense[]
  total: number
  currency: CurrencyCode
}) {
  const createExpenseForProperty = createExpense.bind(null, propertyId)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted ">
        Total:{' '}
        <span className="font-medium text-heading ">
          {formatCurrency(total, currency)}
        </span>
      </p>

      {expenses.length === 0 ? (
        <p className="text-sm text-muted ">No expenses logged yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-edge ">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-start justify-between gap-3 py-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-heading ">
                    {formatCurrency(expense.amount, currency)}
                  </span>
                  <span className="inline-flex w-fit rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-body">
                    {formatExpenseCategory(expense.category)}
                  </span>
                  {isUpcoming(expense.incurred_on) && (
                    <span className="inline-flex w-fit rounded-full bg-info-bg px-2 py-0.5 text-xs font-medium text-info-text">
                      Upcoming
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted ">
                  {new Date(expense.incurred_on).toLocaleDateString()}
                  {expense.note ? ` · ${expense.note}` : ''}
                </p>
              </div>
              <DeleteExpenseForm expenseId={expense.id} propertyId={propertyId} />
            </li>
          ))}
        </ul>
      )}

      <details>
        <summary className="w-fit cursor-pointer text-sm font-medium text-body underline ">
          Add expense
        </summary>
        <ExpenseForm action={createExpenseForProperty} />
      </details>
    </div>
  )
}
