import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import type { TeamColor } from '@/types/board';
import { COLOR_STYLES } from '@/types/board';

type BoardCellProps = {
    id: string;
    children: ReactNode;
    teamColor?: TeamColor;
    onAddInitiative?: () => void;
    isMobile?: boolean;
};

export function BoardCell({ id, children, teamColor, onAddInitiative, isMobile }: BoardCellProps) {
    const { isOver, setNodeRef } = useDroppable({ id });
    const { resolvedAppearance } = useAppearance();

    const bgColor = teamColor
        ? (resolvedAppearance === 'dark' ? COLOR_STYLES[teamColor].darkBg : COLOR_STYLES[teamColor].bg)
        : undefined;

    return (
        <div
            ref={setNodeRef}
            className={`group/cell min-h-[100px] space-y-2 rounded-lg p-2 transition-colors ${
                isOver
                    ? 'bg-blue-50 dark:bg-blue-950/30'
                    : !bgColor ? 'bg-neutral-50/50 dark:bg-neutral-800/20' : ''
            }`}
            style={!isOver && bgColor ? { backgroundColor: bgColor } : undefined}
        >
            {children}
            {onAddInitiative && (
                <button
                    type="button"
                    onClick={onAddInitiative}
                    className={`flex w-full cursor-pointer items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 py-1.5 text-xs text-neutral-400 transition-all hover:border-neutral-400 hover:text-neutral-500 dark:border-neutral-600 dark:text-neutral-500 dark:hover:border-neutral-500 dark:hover:text-neutral-400 ${isMobile ? '' : 'opacity-0 group-hover/cell:opacity-100'}`}
                >
                    <Plus className="size-3" />
                </button>
            )}
        </div>
    );
}
