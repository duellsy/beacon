import { Pencil, Users } from 'lucide-react';
import Markdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import type { Team } from '@/types/board';
import { COLOR_STYLES } from '@/types/board';

type TeamDetailSheetProps = {
    open: boolean;
    onClose: () => void;
    team: Team | null;
    onEditTeam: (team: Team) => void;
};

export function TeamDetailSheet({ open, onClose, team, onEditTeam }: TeamDetailSheetProps) {
    if (!team) {
        return null;
    }

    const colorStyle = COLOR_STYLES[team.color];

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <div className="flex items-center gap-3">
                        <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: colorStyle.border }}
                        />
                        <SheetTitle className="flex-1">{team.name}</SheetTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0"
                            onClick={() => onEditTeam(team)}
                        >
                            <Pencil className="size-3.5" />
                        </Button>
                    </div>
                </SheetHeader>

                <div className="space-y-6 px-4 pb-6">
                    {team.description && (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <Markdown>{team.description}</Markdown>
                        </div>
                    )}

                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <Users className="size-4 text-neutral-500" />
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                Members ({team.members.length})
                            </h3>
                        </div>

                        {team.members.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No members yet</p>
                        ) : (
                            <div className="space-y-2">
                                {team.members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-3 rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800"
                                    >
                                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                                            {member.name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                {member.name}
                                            </p>
                                            {member.role && (
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    {member.role}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
