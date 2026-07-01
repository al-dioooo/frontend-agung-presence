type DesktopFormPanelProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  panelClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  railClassName?: string;
};

export function DesktopFormPanel({
  title,
  description,
  children,
  actions,
  className = "",
  panelClassName = "",
  contentClassName = "",
  footerClassName = "",
  railClassName = "",
}: DesktopFormPanelProps) {
  return (
    <div
      data-desktop-form-layout
      className={`lg:grid lg:grid-cols-[minmax(220px,0.34fr)_minmax(0,1fr)] lg:items-start lg:gap-8 ${className}`}
    >
      <aside
        data-desktop-form-rail
        className={`hidden min-w-0 pt-2 lg:block ${railClassName}`}
      >
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-taupe-500">
          {description}
        </p>
      </aside>

      <section
        data-desktop-form-panel
        className={`min-w-0 lg:overflow-hidden lg:rounded-2xl lg:bg-white lg:ring-1 lg:ring-taupe-200 lg:shadow-sm ${panelClassName}`}
      >
        <div className={`space-y-4 lg:p-5 ${contentClassName}`}>{children}</div>
        {actions && (
          <div
            data-desktop-form-actions
            className={`hidden border-t border-taupe-200 bg-white p-5 lg:block ${footerClassName}`}
          >
            {actions}
          </div>
        )}
      </section>
    </div>
  );
}
