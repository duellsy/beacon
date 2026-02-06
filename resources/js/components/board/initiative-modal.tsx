import { router, useForm } from '@inertiajs/react';
import { ExternalLink, Pencil, Trash2, X } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { useCallback, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import TurndownService from 'turndown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import InitiativeController from '@/actions/App/Http/Controllers/InitiativeController';
import DependencyController from '@/actions/App/Http/Controllers/DependencyController';
import InitiativeLogController from '@/actions/App/Http/Controllers/InitiativeLogController';
import type {
    Initiative,
    InitiativeStatus,
    Project,
    Team,
} from '@/types/board';
import { STATUSES } from '@/types/board';

type InitiativeModalProps = {
    open: boolean;
    onClose: () => void;
    initiative: Initiative | null;
    teams: Team[];
    projects: Project[];
    allInitiatives: Initiative[];
    defaultTeamId?: string | null;
    defaultStatus?: InitiativeStatus | null;
};

export function InitiativeModal({
    open,
    onClose,
    initiative,
    teams,
    projects,
    allInitiatives,
    defaultTeamId,
    defaultStatus,
}: InitiativeModalProps) {
    const isEditing = initiative !== null;

    if (isEditing) {
        return (
            <EditPanel
                open={open}
                onClose={onClose}
                initiative={initiative}
                teams={teams}
                projects={projects}
                allInitiatives={allInitiatives}
            />
        );
    }

    return (
        <CreateDialog
            open={open}
            onClose={onClose}
            teams={teams}
            projects={projects}
            defaultTeamId={defaultTeamId}
            defaultStatus={defaultStatus}
        />
    );
}

// --------------- Create Dialog ---------------

type CreateDialogProps = {
    open: boolean;
    onClose: () => void;
    teams: Team[];
    projects: Project[];
    defaultTeamId?: string | null;
    defaultStatus?: InitiativeStatus | null;
};

function CreateDialog({
    open,
    onClose,
    teams,
    projects,
    defaultTeamId,
    defaultStatus,
}: CreateDialogProps) {
    const form = useForm({
        title: '',
        description: '',
        jira_url: '',
        team_id: '' as string,
        project_id: '' as string,
        status: 'upcoming' as InitiativeStatus,
        engineer_owner: '',
        expected_date: '',
    });

    useEffect(() => {
        if (open) {
            form.setData({
                title: '',
                description: '',
                jira_url: '',
                team_id: defaultTeamId ?? '',
                project_id: '',
                status: defaultStatus ?? 'upcoming',
                engineer_owner: '',
                expected_date: '',
            });
            form.clearErrors();
        }
    }, [open, defaultTeamId, defaultStatus]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        const data = {
            ...form.data,
            team_id: form.data.team_id || null,
            project_id: form.data.project_id || null,
            description: form.data.description || null,
            jira_url: form.data.jira_url || null,
            engineer_owner: form.data.engineer_owner || null,
            expected_date: form.data.expected_date || null,
        };

        router.post(InitiativeController.store.url(), data, {
            onSuccess: () => onClose(),
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Initiative</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormFields
                        form={form}
                        teams={teams}
                        projects={projects}
                    />

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing}
                        >
                            {form.processing ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// --------------- Edit Panel (Sheet) ---------------

type EditPanelProps = {
    open: boolean;
    onClose: () => void;
    initiative: Initiative;
    teams: Team[];
    projects: Project[];
    allInitiatives: Initiative[];
};

function EditPanel({
    open,
    onClose,
    initiative,
    teams,
    projects,
    allInitiatives,
}: EditPanelProps) {
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [addingDep, setAddingDep] = useState(false);
    const [logBody, setLogBody] = useState('');
    const [submittingLog, setSubmittingLog] = useState(false);

    const handleLogPaste = useCallback(
        (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
            const html = e.clipboardData.getData('text/html');
            if (!html) return;

            e.preventDefault();
            const turndown = new TurndownService({
                headingStyle: 'atx',
                bulletListMarker: '-',
            });
            const markdown = turndown.turndown(html);

            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const before = logBody.slice(0, start);
            const after = logBody.slice(end);
            setLogBody(before + markdown + after);
        },
        [logBody],
    );

    const form = useForm({
        title: '',
        description: '',
        jira_url: '',
        team_id: '' as string,
        project_id: '' as string,
        status: 'upcoming' as InitiativeStatus,
        engineer_owner: '',
        expected_date: '',
    });

    useEffect(() => {
        if (open) {
            form.setData({
                title: initiative.title,
                description: initiative.description ?? '',
                jira_url: initiative.jira_url ?? '',
                team_id: initiative.team_id ?? '',
                project_id: initiative.project_id ?? '',
                status: initiative.status,
                engineer_owner: initiative.engineer_owner ?? '',
                expected_date: initiative.expected_date ?? '',
            });
            form.clearErrors();
            setEditing(false);
            setConfirmDelete(false);
            setAddingDep(false);
            setLogBody('');
        }
    }, [open, initiative]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        const data = {
            ...form.data,
            team_id: form.data.team_id || null,
            project_id: form.data.project_id || null,
            description: form.data.description || null,
            jira_url: form.data.jira_url || null,
            engineer_owner: form.data.engineer_owner || null,
            expected_date: form.data.expected_date || null,
        };

        router.put(
            InitiativeController.update.url(initiative.id),
            data,
            {
                onSuccess: () => {
                    setEditing(false);
                },
            },
        );
    };

    const handleDelete = () => {
        router.delete(
            InitiativeController.destroy.url(initiative.id),
            { onSuccess: () => onClose() },
        );
    };

    const handleAddDependency = (depId: string) => {
        router.post(
            DependencyController.store.url(initiative.id),
            { dependency_id: depId },
            {
                preserveScroll: true,
                onSuccess: () => setAddingDep(false),
            },
        );
    };

    const handleRemoveDependency = (depId: string) => {
        router.delete(
            DependencyController.destroy.url({
                initiative: initiative.id,
                dependency: depId,
            }),
            { preserveScroll: true },
        );
    };

    const handleAddLog = () => {
        if (!logBody.trim()) return;
        setSubmittingLog(true);
        router.post(
            InitiativeLogController.store.url(initiative.id),
            { body: logBody },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLogBody('');
                    setSubmittingLog(false);
                },
                onError: () => setSubmittingLog(false),
            },
        );
    };

    const availableDeps = allInitiatives.filter(
        (i) =>
            i.id !== initiative.id &&
            !initiative.dependencies.some((d) => d.id === i.id),
    );

    const getTeamName = (teamId: string | null) => {
        if (!teamId) return 'Unassigned';
        return teams.find((t) => t.id === teamId)?.name ?? 'Unknown';
    };

    const getProjectName = (projectId: string | null) => {
        if (!projectId) return null;
        return projects.find((p) => p.id === projectId)?.name ?? 'Unknown';
    };

    const statusLabel = (status: InitiativeStatus) =>
        STATUSES.find((s) => s.key === status)?.label ?? status;

    const sortedLogs = [...initiative.logs].sort(
        (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
    );

    const formatTimestamp = (dateString: string) =>
        new Date(dateString).toLocaleString('en-AU', {
            timeZone: 'Australia/Sydney',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
        });

    const activitySection = (
        <div className="prose prose-sm dark:prose-invert mt-6 max-w-none space-y-3 border-t pt-4">
            <Label className="text-sm font-semibold">Activity</Label>

            <div className="relative">
                <Textarea
                    value={logBody}
                    onChange={(e) => setLogBody(e.target.value)}
                    onPaste={handleLogPaste}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.metaKey) {
                            e.preventDefault();
                            handleAddLog();
                        }
                    }}
                    placeholder="Add a comment (supports markdown)..."
                    rows={2}
                    className="pb-9"
                />
                <div className="absolute right-2 bottom-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!logBody.trim() || submittingLog}
                        onClick={handleAddLog}
                    >
                        Add
                    </Button>
                </div>
            </div>

            {sortedLogs.length === 0 && (
                <p className="text-muted-foreground text-sm">
                    No activity yet
                </p>
            )}

            <div className="space-y-2">
                {sortedLogs.map((log) =>
                    log.type === 'system' ? (
                        <div
                            key={log.id}
                            className="flex items-start gap-2 py-1"
                        >
                            <div className="text-muted-foreground flex-1 text-xs">
                                {log.body}
                            </div>
                            <span className="text-muted-foreground shrink-0 text-[10px]">
                                {formatTimestamp(log.created_at)}
                            </span>
                        </div>
                    ) : (
                        <div
                            key={log.id}
                            className="rounded-md border px-3 py-2"
                        >
                            <div className="max-w-none text-sm">
                                <Markdown>{log.body}</Markdown>
                            </div>
                            <p className="text-muted-foreground mt-1 text-[10px]">
                                {formatTimestamp(log.created_at)}
                            </p>
                        </div>
                    ),
                )}
            </div>
        </div>
    );

    if (editing) {
        return (
            <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
                <SheetContent
                    side="right"
                    className="!max-w-4xl !w-full flex flex-col p-0"
                >
                    <SheetHeader className="shrink-0 border-b px-6 py-4">
                        <SheetTitle>Edit Initiative</SheetTitle>
                    </SheetHeader>

                    <form
                        onSubmit={handleSubmit}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <div className="flex min-h-0 flex-1">
                            {/* Main column */}
                            <div className="flex flex-1 flex-col overflow-y-auto border-r p-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-title">
                                            Title
                                        </Label>
                                        <Input
                                            id="edit-title"
                                            value={form.data.title}
                                            onChange={(e) =>
                                                form.setData(
                                                    'title',
                                                    e.target.value,
                                                )
                                            }
                                            maxLength={120}
                                            aria-invalid={!!form.errors.title}
                                        />
                                        {form.errors.title && (
                                            <p className="text-destructive text-sm">
                                                {form.errors.title}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-desc">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="edit-desc"
                                            value={form.data.description}
                                            onChange={(e) =>
                                                form.setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            maxLength={5000}
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="flex w-80 shrink-0 flex-col overflow-y-auto p-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={form.data.status}
                                            onValueChange={(v) =>
                                                form.setData(
                                                    'status',
                                                    v as InitiativeStatus,
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STATUSES.map((s) => (
                                                    <SelectItem
                                                        key={s.key}
                                                        value={s.key}
                                                    >
                                                        {s.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Team</Label>
                                        <Select
                                            value={
                                                form.data.team_id ||
                                                '__unassigned'
                                            }
                                            onValueChange={(v) =>
                                                form.setData(
                                                    'team_id',
                                                    v === '__unassigned'
                                                        ? ''
                                                        : v,
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__unassigned">
                                                    Unassigned Pool
                                                </SelectItem>
                                                {teams.map((t) => (
                                                    <SelectItem
                                                        key={t.id}
                                                        value={t.id}
                                                    >
                                                        {t.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Project</Label>
                                        <Select
                                            value={
                                                form.data.project_id ||
                                                '__none'
                                            }
                                            onValueChange={(v) =>
                                                form.setData(
                                                    'project_id',
                                                    v === '__none' ? '' : v,
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none">
                                                    No Project
                                                </SelectItem>
                                                {projects.map((p) => (
                                                    <SelectItem
                                                        key={p.id}
                                                        value={p.id}
                                                    >
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-engineer">
                                            Engineer Owner
                                        </Label>
                                        <Input
                                            id="edit-engineer"
                                            value={form.data.engineer_owner}
                                            onChange={(e) =>
                                                form.setData(
                                                    'engineer_owner',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-expected-date">
                                            Expected Date
                                        </Label>
                                        <Input
                                            id="edit-expected-date"
                                            type="date"
                                            value={form.data.expected_date}
                                            onChange={(e) =>
                                                form.setData(
                                                    'expected_date',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-jira">
                                            Jira URL
                                        </Label>
                                        <Input
                                            id="edit-jira"
                                            type="url"
                                            value={form.data.jira_url}
                                            onChange={(e) =>
                                                form.setData(
                                                    'jira_url',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="https://..."
                                            aria-invalid={
                                                !!form.errors.jira_url
                                            }
                                        />
                                        {form.errors.jira_url && (
                                            <p className="text-destructive text-sm">
                                                {form.errors.jira_url}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Dependencies */}
                                <div className="mt-6 space-y-2 border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold">
                                            Dependencies
                                        </Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setAddingDep(!addingDep)
                                            }
                                        >
                                            {addingDep ? 'Cancel' : 'Add'}
                                        </Button>
                                    </div>

                                    {addingDep && (
                                        <Select
                                            onValueChange={
                                                handleAddDependency
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an initiative..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableDeps.map((dep) => (
                                                    <SelectItem
                                                        key={dep.id}
                                                        value={dep.id}
                                                    >
                                                        {dep.title} (
                                                        {getTeamName(
                                                            dep.team_id,
                                                        )}
                                                        )
                                                    </SelectItem>
                                                ))}
                                                {availableDeps.length ===
                                                    0 && (
                                                    <SelectItem
                                                        value="__none"
                                                        disabled
                                                    >
                                                        No initiatives
                                                        available
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {initiative.dependencies.length === 0 && (
                                        <p className="text-muted-foreground text-sm">
                                            No dependencies
                                        </p>
                                    )}

                                    <div className="space-y-1.5">
                                        {initiative.dependencies.map((dep) => (
                                            <div
                                                key={dep.id}
                                                className="flex items-center justify-between rounded-md border px-3 py-2"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {dep.title}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-muted-foreground text-xs">
                                                            {getTeamName(
                                                                dep.team_id,
                                                            )}
                                                        </span>
                                                        <Badge
                                                            variant={
                                                                dep.status ===
                                                                'done'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                            className="text-[10px]"
                                                        >
                                                            {statusLabel(
                                                                dep.status,
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 shrink-0"
                                                    onClick={() =>
                                                        handleRemoveDependency(
                                                            dep.id,
                                                        )
                                                    }
                                                >
                                                    <X className="size-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Delete */}
                                <div className="mt-6 border-t pt-4">
                                    {!confirmDelete ? (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="w-full"
                                            onClick={() =>
                                                setConfirmDelete(true)
                                            }
                                        >
                                            <Trash2 className="size-3.5" />
                                            Delete Initiative
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-destructive text-sm">
                                                Confirm?
                                            </span>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={handleDelete}
                                            >
                                                Yes, delete
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setConfirmDelete(false)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t px-6 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    form.setData({
                                        title: initiative.title,
                                        description:
                                            initiative.description ?? '',
                                        jira_url: initiative.jira_url ?? '',
                                        team_id: initiative.team_id ?? '',
                                        project_id:
                                            initiative.project_id ?? '',
                                        status: initiative.status,
                                        engineer_owner:
                                            initiative.engineer_owner ?? '',
                                        expected_date:
                                            initiative.expected_date ?? '',
                                    });
                                    form.clearErrors();
                                    setEditing(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing}
                            >
                                {form.processing ? 'Saving...' : 'Save'}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent
                side="right"
                className="!max-w-4xl !w-full flex flex-col p-0"
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>{initiative.title}</SheetTitle>
                </SheetHeader>

                <div className="flex min-h-0 flex-1">
                    {/* Main column */}
                    <div className="flex flex-1 flex-col overflow-y-auto border-r p-6">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                {initiative.title}
                            </h2>
                            <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                                onClick={() => setEditing(true)}
                            >
                                <Pencil className="size-3.5" />
                                Edit
                            </Button>
                        </div>

                        {initiative.description && (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <Markdown>{initiative.description}</Markdown>
                            </div>
                        )}

                        {!initiative.description && (
                            <p className="text-muted-foreground text-sm italic">
                                No description
                            </p>
                        )}

                        {activitySection}
                    </div>

                    {/* Sidebar */}
                    <div className="flex w-80 shrink-0 flex-col overflow-y-auto p-6">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">
                                    Status
                                </Label>
                                <p className="text-sm font-medium">
                                    {statusLabel(initiative.status)}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs">
                                    Team
                                </Label>
                                <p className="text-sm font-medium">
                                    {getTeamName(initiative.team_id)}
                                </p>
                            </div>

                            {getProjectName(initiative.project_id) && (
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">
                                        Project
                                    </Label>
                                    <p className="text-sm font-medium">
                                        {getProjectName(
                                            initiative.project_id,
                                        )}
                                    </p>
                                </div>
                            )}

                            {initiative.engineer_owner && (
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">
                                        Engineer Owner
                                    </Label>
                                    <p className="text-sm font-medium">
                                        {initiative.engineer_owner}
                                    </p>
                                </div>
                            )}

                            {initiative.expected_date && (
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">
                                        Expected Date
                                    </Label>
                                    <p className="text-sm font-medium">
                                        {formatDate(
                                            initiative.expected_date,
                                        )}
                                    </p>
                                </div>
                            )}

                            {initiative.jira_url && (
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">
                                        Jira
                                    </Label>
                                    <a
                                        href={initiative.jira_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        <ExternalLink className="size-3" />
                                        View in Jira
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Dependencies */}
                        <div className="mt-6 space-y-2 border-t pt-4">
                            <Label className="text-sm font-semibold">
                                Dependencies
                            </Label>

                            {initiative.dependencies.length === 0 && (
                                <p className="text-muted-foreground text-sm">
                                    No dependencies
                                </p>
                            )}

                            <div className="space-y-1.5">
                                {initiative.dependencies.map((dep) => (
                                    <div
                                        key={dep.id}
                                        className="rounded-md border px-3 py-2"
                                    >
                                        <p className="truncate text-sm font-medium">
                                            {dep.title}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground text-xs">
                                                {getTeamName(dep.team_id)}
                                            </span>
                                            <Badge
                                                variant={
                                                    dep.status === 'done'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className="text-[10px]"
                                            >
                                                {statusLabel(dep.status)}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="mt-6 space-y-1 border-t pt-4">
                            <Label className="text-sm font-semibold">
                                Details
                            </Label>
                            <p className="text-muted-foreground text-xs">
                                Created:{' '}
                                {new Date(
                                    initiative.created_at,
                                ).toLocaleDateString()}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                Updated:{' '}
                                {new Date(
                                    initiative.updated_at,
                                ).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t px-6 py-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

// --------------- Shared form fields for Create Dialog ---------------

type FormFieldsProps = {
    form: ReturnType<
        typeof useForm<{
            title: string;
            description: string;
            jira_url: string;
            team_id: string;
            project_id: string;
            status: InitiativeStatus;
            engineer_owner: string;
            expected_date: string;
        }>
    >;
    teams: Team[];
    projects: Project[];
};

function FormFields({ form, teams, projects }: FormFieldsProps) {
    return (
        <>
            <div className="space-y-2">
                <Label htmlFor="init-title">Title</Label>
                <Input
                    id="init-title"
                    value={form.data.title}
                    onChange={(e) => form.setData('title', e.target.value)}
                    maxLength={120}
                    aria-invalid={!!form.errors.title}
                />
                {form.errors.title && (
                    <p className="text-destructive text-sm">
                        {form.errors.title}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="init-desc">Description</Label>
                <Textarea
                    id="init-desc"
                    value={form.data.description}
                    onChange={(e) =>
                        form.setData('description', e.target.value)
                    }
                    maxLength={5000}
                    rows={3}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="init-jira">Jira URL</Label>
                <Input
                    id="init-jira"
                    type="url"
                    value={form.data.jira_url}
                    onChange={(e) => form.setData('jira_url', e.target.value)}
                    placeholder="https://..."
                    aria-invalid={!!form.errors.jira_url}
                />
                {form.errors.jira_url && (
                    <p className="text-destructive text-sm">
                        {form.errors.jira_url}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                        value={form.data.status}
                        onValueChange={(v) =>
                            form.setData('status', v as InitiativeStatus)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUSES.map((s) => (
                                <SelectItem key={s.key} value={s.key}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Team</Label>
                    <Select
                        value={form.data.team_id || '__unassigned'}
                        onValueChange={(v) =>
                            form.setData(
                                'team_id',
                                v === '__unassigned' ? '' : v,
                            )
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__unassigned">
                                Unassigned Pool
                            </SelectItem>
                            {teams.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Project</Label>
                <Select
                    value={form.data.project_id || '__none'}
                    onValueChange={(v) =>
                        form.setData('project_id', v === '__none' ? '' : v)
                    }
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none">No Project</SelectItem>
                        {projects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="init-engineer">Engineer Owner</Label>
                <Input
                    id="init-engineer"
                    value={form.data.engineer_owner}
                    onChange={(e) =>
                        form.setData('engineer_owner', e.target.value)
                    }
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="init-expected-date">Expected Date</Label>
                <Input
                    id="init-expected-date"
                    type="date"
                    value={form.data.expected_date}
                    onChange={(e) =>
                        form.setData('expected_date', e.target.value)
                    }
                />
            </div>
        </>
    );
}
