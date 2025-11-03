import SubjectDropdown from "@/components/common/SubjectDropdown";

export default function SchemeWordCloudFilters({
  filters,
  onFilterChange,
  onShowClick,
}: {
  filters: {
    level: string;
    term: string;
    subject: string;
  };
  onFilterChange: (filters: { level: string; term: string; subject: string; }) => void;
  onShowClick: () => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {/* Level Dropdown */}
      <select
        value={filters.level}
        onChange={(e) => onFilterChange({ ...filters, level: e.target.value })}
        className="p-2 border rounded w-full bg-white dark:bg-gray-800 max-w-[140px]"
      >
        <option value="">Level</option>
        {["SS-3", "SS-2", "SS-1", "JS-3", "JS-2", "JS-1"].map(level => (
          <option key={level} value={level}>{level}</option>
        ))}
      </select>
      
      {/* Term Dropdown */}
      <select
        value={filters.term}
        onChange={(e) => onFilterChange({ ...filters, term: e.target.value })}
        className="p-2 border rounded w-full bg-white dark:bg-gray-800 max-w-[110px]"
      >
        <option value="">Term</option>
        <option value="All Terms">All Terms</option>
        {["1st Term", "2nd Term", "3rd Term"].map(term => (
          <option key={term} value={term}>{term}</option>
        ))}
      </select>

      {/* Subject Dropdown - Using only the subject label as the value */}
      <div className="lg:col-span-2">
        <SubjectDropdown
          value={filters.subject}
          onSubjectChange={(id, name) =>
            onFilterChange({ ...filters, subject: name })
          }
        />
      </div>

      {/* Display Button */}
      <button
        onClick={onShowClick}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded whitespace-nowrap"
      >
        Display
      </button>
    </div>
  );
}