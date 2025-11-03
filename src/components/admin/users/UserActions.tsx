// src/components/admin/users/UserActions.tsx
interface UserActionsProps {
  selectedCount: number;
  onActivate: () => void;
  onDeactivate: () => void;
  disabled?: boolean;
}

export default function UserActions({
  selectedCount,
  onActivate,
  onDeactivate,
  disabled = false,
}: UserActionsProps): JSX.Element {
  const isDisabled = selectedCount === 0 || disabled;

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
      <div className="text-sm text-gray-600">
        {selectedCount > 0
          ? `${String(selectedCount)} user${selectedCount > 1 ? 's' : ''} selected`
          : 'No users selected'}
      </div>
      <div className="space-x-4">
        <button
          onClick={onActivate}
          disabled={isDisabled}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Activate Selected
        </button>
        <button
          onClick={onDeactivate}
          disabled={isDisabled}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Deactivate Selected
        </button>
      </div>
    </div>
  );
}
