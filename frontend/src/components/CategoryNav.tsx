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
            className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-colors ${
              isActive
                ? 'border-l-2 border-redis bg-panel2 text-white'
                : 'border-l-2 border-transparent text-mute hover:bg-panel2/50 hover:text-ink'
            }`}
          >
            <span className="capitalize">{cat}</span>
            <span className={`font-mono text-[10px] ${isActive ? 'text-redis' : 'text-mute'}`}>
              {counts[cat] ?? 0}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
