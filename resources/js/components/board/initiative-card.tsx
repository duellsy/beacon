import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
    AlertTriangle,
    Calendar,
    ExternalLink,
    GitBranch,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Initiative } from '@/types/board';
import type { TeamColor } from '@/types/board';
import { COLOR_STYLES } from '@/types/board';

type InitiativeCardProps = {
    initiative: Initiative;
    teamColor?: TeamColor;
    onOpen: (initiative: Initiative) => void;
    onHover: (id: string | null) => void;
    isHighlighted: boolean;
};

function isOverdue(dateStr: string): boolean {
    const sydneyToday = new Date(
        new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' }),
    );
    const expected = new Date(dateStr);
    return expected <= sydneyToday;
}

export function InitiativeCard({
    initiative,
    teamColor,
    onOpen,
    onHover,
    isHighlighted,
}: InitiativeCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: initiative.id,
            data: { initiative },
        });

    const style = transform
        ? {
              transform: CSS.Translate.toString(transform),
              zIndex: 50,
          }
        : undefined;

    const hasDependencies = initiative.dependencies.length > 0;
    const hasJiraUrl =
        initiative.jira_url !== null && initiative.jira_url !== '';

    const borderColor = !initiative.is_blocked && teamColor
        ? COLOR_STYLES[teamColor].border
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, ...(borderColor ? { borderColor } : {}) }}
            {...listeners}
            {...attributes}
            data-initiative-id={initiative.id}
            className={`group cursor-grab rounded-lg border bg-white p-3 shadow-sm transition-all select-none active:cursor-grabbing dark:bg-neutral-900 ${
                initiative.is_blocked
                    ? 'border-red-400 bg-red-50/50 dark:border-red-500/60 dark:bg-red-950/20'
                    : !borderColor ? 'border-neutral-200 dark:border-neutral-700' : ''
            } ${isDragging ? 'opacity-50' : ''} ${
                isHighlighted
                    ? 'ring-2 ring-blue-400 dark:ring-blue-500'
                    : ''
            }`}
            onMouseEnter={() => onHover(initiative.id)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) => {
                if (
                    (e.target as HTMLElement).closest(
                        '[data-jira-link]',
                    )
                ) {
                    return;
                }
                onOpen(initiative);
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium leading-snug text-neutral-900 dark:text-neutral-100">
                    {initiative.title}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                    {hasDependencies && (
                        <GitBranch className="size-3.5 text-neutral-400" />
                    )}
                    {hasJiraUrl && (
                        <a
                            data-jira-link
                            href={initiative.jira_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-500 hover:text-blue-700"
                        >
                            <ExternalLink className="size-3.5" />
                        </a>
                    )}
                </div>
            </div>

            {initiative.is_blocked && (
                <Badge
                    variant="destructive"
                    className="mt-1.5 gap-1 text-[10px]"
                >
                    <AlertTriangle className="size-3" />
                    Blocked
                </Badge>
            )}

            {initiative.expected_date && (
                <p
                    className={`mt-1.5 flex items-center gap-1 text-xs ${
                        isOverdue(initiative.expected_date)
                            ? 'font-medium text-red-600 dark:text-red-400'
                            : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                >
                    <Calendar className="size-3" />
                    {new Date(initiative.expected_date).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'UTC',
                    })}
                </p>
            )}

            {initiative.engineer_owner && (
                <p className="mt-1.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {initiative.engineer_owner}
                </p>
            )}
        </div>
    );
}
