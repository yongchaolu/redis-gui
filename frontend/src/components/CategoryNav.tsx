import {cn} from '../lib/utils';

interface Props {
  categories: string[];
  active: string;
  onSelect: (cat: string) => void;
  counts: Record<string, number>;
}

export function CategoryNav({categories, active, onSelect, counts}: Props) {
  return (
    <nav className="flex flex-col gap-0.5">
      {categories.map((cat) => {
        const isActive = cat === active;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-colors border-l-2",
              isActive
                ? "text-white"
                : "border-transparent hover:text-white"
            )}
            style={isActive
              ? {borderLeftColor: 'var(--color-redis-red)', background: 'var(--color-surface-hover)'}
              : {color: 'var(--color-text-secondary)'}
            }
          >
            <span className="capitalize">{cat}</span>
            <span className="font-mono text-[10px]" style={{color: isActive ? 'var(--color-redis-red)' : 'var(--color-text-secondary)'}}>
              {counts[cat] ?? 0}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
