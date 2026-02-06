import type { Team } from '@/types/board';
import { COLOR_STYLES } from '@/types/board';

type MobileTeamTabsProps = {
    teams: Team[];
    selectedTeamId: string;
    onSelect: (teamId: string) => void;
};

export function MobileTeamTabs({ teams, selectedTeamId, onSelect }: MobileTeamTabsProps) {
    const tabs = [
        { id: '__all', label: 'All', color: undefined as string | undefined },
        ...teams.map((t) => ({ id: t.id, label: t.name, color: COLOR_STYLES[t.color].border })),
        { id: 'unassigned', label: 'Unassigned', color: undefined as string | undefined },
    ];

    return (
        <div
            className="flex shrink-0 gap-2 overflow-x-auto border-b px-4 py-2"
            style={{ scrollbarWidth: 'none' }}
        >
            {tabs.map((tab) => {
                const isActive = selectedTeamId === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onSelect(tab.id)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            isActive
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                    >
                        {tab.color && (
                            <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: tab.color }}
                            />
                        )}
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
