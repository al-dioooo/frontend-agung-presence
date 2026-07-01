type AppPageProps = {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "wide" | "full";
};

const pageSizeClass = {
  default: "lg:max-w-6xl",
  wide: "lg:max-w-7xl",
  full: "lg:max-w-none",
};

export function AppPage({
  children,
  className = "",
  size = "default",
}: AppPageProps) {
  return (
    <div
      className={`mx-auto w-full px-5 pt-6 md:px-8 lg:px-10 lg:py-8 ${pageSizeClass[size]} ${className}`}
    >
      {children}
    </div>
  );
}

type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between ${className}`}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase text-primary-600">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-bold text-foreground md:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-taupe-500">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

type ContentGridProps = {
  children: React.ReactNode;
  className?: string;
  columns?: "two" | "main-aside" | "three";
};

const gridClass = {
  two: "lg:grid-cols-2",
  "main-aside": "lg:grid-cols-[minmax(0,1fr)_360px]",
  three: "lg:grid-cols-3",
};

export function ContentGrid({
  children,
  className = "",
  columns = "two",
}: ContentGridProps) {
  return (
    <div className={`grid grid-cols-1 gap-4 md:gap-5 ${gridClass[columns]} ${className}`}>
      {children}
    </div>
  );
}

type StickyActionPanelProps = {
  children: React.ReactNode;
  className?: string;
};

export function StickyActionPanel({
  children,
  className = "",
}: StickyActionPanelProps) {
  return (
    <div
      className={`sticky bottom-4 z-10 mt-auto rounded-2xl bg-white p-3 ring-1 ring-taupe-200 shadow-sm lg:top-8 lg:bottom-auto lg:mt-0 ${className}`}
    >
      {children}
    </div>
  );
}
