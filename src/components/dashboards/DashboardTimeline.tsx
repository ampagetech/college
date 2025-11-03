// C:\DevWeb\jewel-univ-apply\src\components\dashboard\DashboardTimeline.tsx
export type Transaction = {
    transaction_type: string;
    transaction_date: string;
    description: string;
  };
  
  interface DashboardTimelineProps {
    initialTransactions: Transaction[];
  }
  
  export default function DashboardTimeline({ initialTransactions }: DashboardTimelineProps) {
    return (
      <div>
        <h3 className="text-xl font-semibold text-gray-800">Recent Transactions</h3>
        <ul className="mt-4 space-y-2">
          {initialTransactions.map((transaction, index) => (
            <li key={index} className="p-4 bg-white rounded-lg shadow-sm">
              <p><strong>{transaction.transaction_type}</strong></p>
              <p>{transaction.description}</p>
              <p className="text-sm text-gray-500">{new Date(transaction.transaction_date).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }