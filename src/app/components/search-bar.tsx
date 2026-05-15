type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder = "Search",
  id = "search",
}: SearchBarProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <svg
          className="size-4 text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </div>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:bg-white transition-colors"
      />
    </div>
  );
}
