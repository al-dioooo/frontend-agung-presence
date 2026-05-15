import { SearchIcon } from "@/components/icons/outline";

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
      <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
        <SearchIcon className="size-[18px] text-muted" />
      </div>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-elegant pl-10"
      />
    </div>
  );
}
