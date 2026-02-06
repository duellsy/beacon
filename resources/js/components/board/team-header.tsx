import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Team } from '@/types/board';
import { COLOR_STYLES } from '@/types/board';

type TeamHeaderProps = {
    team: Team | null;
    onEditTeam?: (team: Team) => void;
    sortableId?: string;
};

export function TeamHeader({ team, onEditTeam, sortableId }: TeamHeaderProps) {
    const borderColor = team ? COLOR_STYLES[team.color].border : undefined;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: sortableId ?? 'unassigned',
        disabled: !sortableId,
    });

    const style = {
        ...(borderColor ? { borderColor } : { borderColor: '#e5e5e5' }),
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            className="group/team rounded-lg border bg-white p-3 shadow-sm dark:bg-neutral-900"
            style={style}
        >
            <div className="flex items-start justify-between">
                {team && sortableId && (
                    <button
                        className="mt-0.5 shrink-0 cursor-grab touch-none text-neutral-400 opacity-0 transition-opacity hover:text-neutral-600 group-hover/team:opacity-100 dark:hover:text-neutral-300"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="size-4" />
                    </button>
                )}
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {team ? team.name : 'Unassigned Pool'}
                    </h3>
                    {team && (
                        <div className="mt-1 space-y-0.5">
                            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                <span className="font-medium">
                                    DL:
                                </span>{' '}
                                {team.delivery_lead}
                            </p>
                            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                <span className="font-medium">
                                    PO:
                                </span>{' '}
                                {team.product_owner}
                            </p>
                        </div>
                    )}
                </div>
                {team && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 cursor-pointer opacity-0 transition-opacity group-hover/team:opacity-100"
                        onClick={() => onEditTeam?.(team)}
                    >
                        <Pencil className="size-3.5" />
                    </Button>
                )}
            </div>
        </div>
    );
}
