import { formatExpenseCategory, type Expense } from '@/lib/expenses'
import { createExpense } from '@/app/dashboard/properties/actions'
import { ExpenseForm } from '@/components/expense-form'
import { DeleteExpenseForm } from '@/components/delete-expense-form'

export function ExpensesSection({
  propertyId,
  expenses,
  total,
}: {
  propertyId: string
  expenses: Expense[]
  total: number
}) {
  const createExpenseForProperty = createExpense.bind(null, propertyId)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Total:{' '}
        <span className="font-medium text-zinc-950 dark:text-zinc-50">
          ${total.toLocaleString()}
        </span>
      </p>

      {expenses.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No expenses logged yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-start justify-between gap-3 py-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    ${expense.amount.toLocaleString()}
                  </span>
                  <span className="inline-flex w-fit rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {formatExpenseCategory(expense.category)}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
        <summary className="w-fit cursor-pointer text-sm font-medium text-zinc-700 underline dark:text-zinc-300">
          Add expense
        </summary>
        <ExpenseForm action={createExpenseForProperty} />
      </details>
    </div>
  )
}
