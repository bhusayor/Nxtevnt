import { forwardRef, type InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onClear?: () => void;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, placeholder = "Search", ...props }, ref) => (
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-text-tertiary" />
      <input
        ref={ref}
        type="search"
        value={value}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-[var(--radius-md)] border border-border-default bg-surface pr-9 pl-10 text-sm text-text-primary transition-[border-color,box-shadow] placeholder:text-text-disabled hover:border-border-strong focus:border-brand-primary focus:outline-none focus:ring-[3px] focus:ring-brand-primary/12 disabled:cursor-not-allowed disabled:bg-background-subtle",
          className,
        )}
        {...props}
      />
      {onClear && value ? (
        <button type="button" onClick={onClear} aria-label="Clear search" className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-[var(--radius-xs)] text-text-tertiary hover:bg-background-subtle hover:text-text-primary">
          <X aria-hidden="true" className="size-3.5" />
        </button>
      ) : null}
    </div>
  ),
);

SearchInput.displayName = "SearchInput";
