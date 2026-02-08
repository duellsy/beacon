import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Clock, Layers, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import board from '@/routes/board';
import TodoController from '@/actions/App/Http/Controllers/TodoController';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { BoardSummary, TeamColor } from '@/types/board';
import { COLOR_STYLES, RAG_STATUSES } from '@/types/board';

type DashboardStats = {
    total: number;
    inProgress: number;
    upcoming: number;
    done: number;
};

type StatusCounts = {
    in_progress: number;
    upcoming: number;
    done: number;
};

type InitiativeSummary = {
    id: string;
    title: string;
    rag_status?: string | null;
};

type RagCounts = {
    red: number;
    amber: number;
    green: number;
};

type DashboardTeam = {
    id: string;
    name: string;
    color: TeamColor;
    counts: StatusCounts;
    rag: RagCounts;
    inProgressInitiatives: InitiativeSummary[];
};

type UnassignedData = {
    counts: StatusCounts;
    inProgressInitiatives: InitiativeSummary[];
};

type ActivityItem = {
    id: string;
    body: string;
    type: 'user' | 'system';
    initiative_title: string | null;
    initiative_id: string;
    created_at: string;
};

type DashboardTodo = {
    id: string;
    initiative_id: string;
    body: string;
    deadline: string;
    is_complete: boolean;
    source: string;
    initiative_title: string | null;
    team_name: string | null;
    board_id: string | null;
};

type DashboardProps = {
    stats: DashboardStats;
    teams: DashboardTeam[];
    unassigned: UnassignedData;
    recentActivity: ActivityItem[];
    todos: DashboardTodo[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

function formatTimestamp(dateString: string) {
    return new Date(dateString).toLocaleString('en-AU', {
        timeZone: 'Australia/Sydney',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function TeamCard({ team }: { team: DashboardTeam }) {
    const colorStyle = COLOR_STYLES[team.color] ?? COLOR_STYLES.slate;
    const totalCount =
        team.counts.in_progress + team.counts.upcoming + team.counts.done;

    return (
        <div
            className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
            style={{ borderLeftWidth: '4px', borderLeftColor: colorStyle.border }}
        >
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {team.name}
                </h3>
                <span className="text-muted-foreground text-xs">
                    {totalCount} total
                </span>
            </div>

            <div className="mt-2 flex gap-2">
                {team.counts.in_progress > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        <Loader2 className="size-3" />
                        {team.counts.in_progress}
                    </span>
                )}
                {team.counts.upcoming > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        <Clock className="size-3" />
                        {team.counts.upcoming}
                    </span>
                )}
                {team.counts.done > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300">
                        <CheckCircle2 className="size-3" />
                        {team.counts.done}
                    </span>
                )}
            </div>

            {(team.rag.red > 0 || team.rag.amber > 0 || team.rag.green > 0) && (
                <div className="mt-2 flex gap-2">
                    {team.rag.red > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                            <span className="size-2 rounded-full bg-red-500" />
                            {team.rag.red}
                        </span>
                    )}
                    {team.rag.amber > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                            <span className="size-2 rounded-full bg-amber-500" />
                            {team.rag.amber}
                        </span>
                    )}
                    {team.rag.green > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                            <span className="size-2 rounded-full bg-green-500" />
                            {team.rag.green}
                        </span>
                    )}
                </div>
            )}

            {team.counts.in_progress === 0 && totalCount > 0 && (
                <div className="mt-3 flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <AlertCircle className="size-3.5 shrink-0" />
                    Nothing in progress
                </div>
            )}

            {team.inProgressInitiatives.length > 0 && (
                <ul className="mt-3 space-y-1">
                    {team.inProgressInitiatives.map((initiative) => {
                        const ragColor = initiative.rag_status
                            ? RAG_STATUSES.find((r) => r.key === initiative.rag_status)?.color
                            : undefined;
                        return (
                            <li
                                key={initiative.id}
                                className="flex items-center gap-1.5 truncate text-sm text-neutral-700 dark:text-neutral-300"
                            >
                                {ragColor && (
                                    <span
                                        className="size-2 shrink-0 rounded-full"
                                        style={{ backgroundColor: ragColor }}
                                    />
                                )}
                                <span className="truncate">{initiative.title}</span>
                            </li>
                        );
                    })}
                </ul>
            )}

            {team.counts.upcoming > 0 &&
                team.inProgressInitiatives.length > 0 && (
                    <p className="text-muted-foreground mt-2 text-xs">
                        +{team.counts.upcoming} upcoming
                    </p>
                )}
        </div>
    );
}

function UnassignedCard({ data }: { data: UnassignedData }) {
    const totalCount =
        data.counts.in_progress + data.counts.upcoming + data.counts.done;

    if (totalCount === 0) {
        return null;
    }

    return (
        <div
            className="rounded-xl border border-neutral-200 border-l-4 border-l-neutral-400 p-4 dark:border-neutral-800 dark:border-l-neutral-500"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Unassigned
                </h3>
                <span className="text-muted-foreground text-xs">
                    {totalCount} total
                </span>
            </div>

            <div className="mt-2 flex gap-2">
                {data.counts.in_progress > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        <Loader2 className="size-3" />
                        {data.counts.in_progress}
                    </span>
                )}
                {data.counts.upcoming > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        <Clock className="size-3" />
                        {data.counts.upcoming}
                    </span>
                )}
                {data.counts.done > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300">
                        <CheckCircle2 className="size-3" />
                        {data.counts.done}
                    </span>
                )}
            </div>

            {data.inProgressInitiatives.length > 0 && (
                <ul className="mt-3 space-y-1">
                    {data.inProgressInitiatives.map((initiative) => (
                        <li
                            key={initiative.id}
                            className="truncate text-sm text-neutral-700 dark:text-neutral-300"
                        >
                            {initiative.title}
                        </li>
                    ))}
                </ul>
            )}

            {data.counts.upcoming > 0 &&
                data.inProgressInitiatives.length > 0 && (
                    <p className="text-muted-foreground mt-2 text-xs">
                        +{data.counts.upcoming} upcoming
                    </p>
                )}
        </div>
    );
}

function getDeadlineBadge(deadline: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(deadline + 'T00:00:00');
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) {
        return { label: `${Math.abs(diff)}d overdue`, className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' };
    }
    if (diff <= 2) {
        return { label: diff === 0 ? 'Today' : `${diff}d`, className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' };
    }
    return { label: `${diff}d`, className: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' };
}

function TodosSection({ todos }: { todos: DashboardTodo[] }) {
    const [showAdd, setShowAdd] = useState(false);
    const [newBody, setNewBody] = useState('');
    const [newDeadline, setNewDeadline] = useState('');
    const [newInitiativeId, setNewInitiativeId] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editBody, setEditBody] = useState('');
    const [editDeadline, setEditDeadline] = useState('');

    const handleToggle = (todo: DashboardTodo) => {
        router.patch(
            TodoController.toggle.url({ initiative: todo.initiative_id, todo: todo.id }),
            {},
            { preserveScroll: true },
        );
    };

    const handleDelete = (todo: DashboardTodo) => {
        router.delete(
            TodoController.destroy.url({ initiative: todo.initiative_id, todo: todo.id }),
            { preserveScroll: true },
        );
    };

    const handleUpdate = (todo: DashboardTodo) => {
        if (!editBody.trim() || !editDeadline) return;
        router.put(
            TodoController.update.url({ initiative: todo.initiative_id, todo: todo.id }),
            { body: editBody, deadline: editDeadline },
            { preserveScroll: true, onSuccess: () => { setEditingId(null); } },
        );
    };

    return (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Your Todos
                </h2>
                <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
                    <Plus className="size-3.5" />
                    Add
                </Button>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {showAdd && (
                    <div className="flex items-center gap-2 px-4 py-3">
                        <Input
                            value={newBody}
                            onChange={(e) => setNewBody(e.target.value)}
                            placeholder="What needs to be done?"
                            className="flex-1"
                        />
                        <Input
                            type="date"
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                            className="w-40"
                        />
                        <Button
                            size="sm"
                            disabled={!newBody.trim() || !newDeadline}
                            onClick={() => {
                                /* Need initiative_id - user must select from suggestions or create from initiative modal */
                                setShowAdd(false);
                                setNewBody('');
                                setNewDeadline('');
                            }}
                        >
                            Save
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                    </div>
                )}

                {todos.length === 0 && !showAdd && (
                    <p className="text-muted-foreground p-4 text-sm">
                        No todos yet. Add todos from initiative details or accept suggestions below.
                    </p>
                )}

                {todos.map((todo) => {
                    const badge = getDeadlineBadge(todo.deadline);

                    if (editingId === todo.id) {
                        return (
                            <div key={todo.id} className="flex items-center gap-2 px-4 py-3">
                                <Input
                                    value={editBody}
                                    onChange={(e) => setEditBody(e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    type="date"
                                    value={editDeadline}
                                    onChange={(e) => setEditDeadline(e.target.value)}
                                    className="w-40"
                                />
                                <Button size="sm" onClick={() => handleUpdate(todo)} disabled={!editBody.trim() || !editDeadline}>
                                    Save
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                                    Cancel
                                </Button>
                            </div>
                        );
                    }

                    return (
                        <div key={todo.id} className="group flex items-center gap-3 px-4 py-2.5">
                            <Checkbox
                                checked={todo.is_complete}
                                onCheckedChange={() => handleToggle(todo)}
                            />
                            <div className="min-w-0 flex-1">
                                <span className="text-sm text-neutral-900 dark:text-neutral-100">
                                    {todo.body}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {todo.initiative_title && todo.board_id ? (
                                        <Link
                                            href={`${board.show.url(todo.board_id)}?initiative=${todo.initiative_id}`}
                                            className="truncate text-xs text-blue-600 hover:underline dark:text-blue-400"
                                        >
                                            {todo.initiative_title}
                                        </Link>
                                    ) : todo.initiative_title ? (
                                        <span className="text-muted-foreground truncate text-xs">
                                            {todo.initiative_title}
                                        </span>
                                    ) : null}
                                    {todo.team_name && (
                                        <span className="text-muted-foreground text-xs">
                                            {todo.team_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                                {badge.label}
                            </span>
                            <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100">
                                <button
                                    type="button"
                                    className="text-muted-foreground hover:text-foreground p-0.5"
                                    onClick={() => {
                                        setEditingId(todo.id);
                                        setEditBody(todo.body);
                                        setEditDeadline(todo.deadline);
                                    }}
                                >
                                    <Pencil className="size-3.5" />
                                </button>
                                <button
                                    type="button"
                                    className="text-muted-foreground hover:text-destructive p-0.5"
                                    onClick={() => handleDelete(todo)}
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}

export default function Dashboard() {
    const pageProps = usePage<{
        props: DashboardProps & { boards: BoardSummary[] };
    }>().props as unknown as DashboardProps & { boards: BoardSummary[] };
    const { stats, teams, unassigned, recentActivity, todos } = pageProps;
    const firstBoard = pageProps.boards?.[0];

    const statCards = [
        {
            label: 'Total',
            value: stats.total,
            icon: Layers,
            color: 'text-neutral-600 dark:text-neutral-400',
            bgColor: 'bg-neutral-100 dark:bg-neutral-800',
        },
        {
            label: 'In Progress',
            value: stats.inProgress,
            icon: Loader2,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-950/40',
        },
        {
            label: 'Upcoming',
            value: stats.upcoming,
            icon: Clock,
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-50 dark:bg-amber-950/40',
        },
        {
            label: 'Done',
            value: stats.done,
            icon: CheckCircle2,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-950/40',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {statCards.map((card) => (
                        <div
                            key={card.label}
                            className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className={`flex size-8 items-center justify-center rounded-lg ${card.bgColor}`}
                                >
                                    <card.icon
                                        className={`size-4 ${card.color}`}
                                    />
                                </div>
                            </div>
                            <p className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                                {card.value}
                            </p>
                            <p className="text-muted-foreground text-sm">
                                {card.label}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Quick link */}
                {firstBoard && (
                    <div className="flex">
                        <Link
                            href={board.show.url(firstBoard.id)}
                            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                            Open Board &rarr;
                        </Link>
                    </div>
                )}

                {/* Todos */}
                <TodosSection todos={todos ?? []} />

                {/* Per-team cards */}
                {(teams.length > 0 || (unassigned.counts.in_progress + unassigned.counts.upcoming + unassigned.counts.done) > 0) && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {teams.map((team) => (
                            <TeamCard key={team.id} team={team} />
                        ))}
                        <UnassignedCard data={unassigned} />
                    </div>
                )}

                {/* Recent Activity */}
                <div className="flex flex-1 flex-col rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            Recent Activity
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {recentActivity.length === 0 ? (
                            <p className="text-muted-foreground p-4 text-sm">
                                No activity yet. Create an initiative on the
                                board to get started.
                            </p>
                        ) : (
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {recentActivity.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-3 px-4 py-3"
                                    >
                                        <div
                                            className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                                                item.type === 'system'
                                                    ? 'bg-neutral-100 dark:bg-neutral-800'
                                                    : 'bg-blue-50 dark:bg-blue-950/40'
                                            }`}
                                        >
                                            <div
                                                className={`size-1.5 rounded-full ${
                                                    item.type === 'system'
                                                        ? 'bg-neutral-400'
                                                        : 'bg-blue-500'
                                                }`}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-neutral-900 dark:text-neutral-100">
                                                <span className="line-clamp-1">
                                                    {item.body}
                                                </span>
                                            </p>
                                            <div className="mt-0.5 flex items-center gap-2">
                                                {item.initiative_title && (
                                                    <span className="text-muted-foreground truncate text-xs">
                                                        {
                                                            item.initiative_title
                                                        }
                                                    </span>
                                                )}
                                                <span className="text-muted-foreground shrink-0 text-xs">
                                                    {formatTimestamp(
                                                        item.created_at,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
