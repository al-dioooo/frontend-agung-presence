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
        <SearchIcon className="size-[18px] text-taupe-400" />
      </div>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full bg-taupe-100 pl-10 pr-4 text-sm text-foreground placeholder:text-taupe-400 outline-none transition-colors focus:bg-taupe-200/60"
      />
    </div>
  );
}
