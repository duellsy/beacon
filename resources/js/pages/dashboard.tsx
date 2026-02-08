import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import TodoController from '@/actions/App/Http/Controllers/TodoController';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import board from '@/routes/board';
import type { BreadcrumbItem } from '@/types';
import type { BoardSummary, TeamColor } from '@/types/board';
import { COLOR_STYLES, RAG_STATUSES } from '@/types/board';

type InProgressInitiative = {
    id: string;
    title: string;
    team_name: string | null;
    team_color: TeamColor | null;
    board_id: string | null;
    board_name: string | null;
    todo_count: number;
    incomplete_todo_count: number;
    rag_status: string | null;
    expected_date: string | null;
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
    inProgressInitiatives: InProgressInitiative[];
    todos: DashboardTodo[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

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
    const { inProgressInitiatives, todos } = pageProps;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Todos */}
                <TodosSection todos={todos ?? []} />

                {/* In-progress initiatives */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            In Progress
                        </h2>
                    </div>
                    {inProgressInitiatives.length === 0 ? (
                        <p className="text-muted-foreground p-4 text-sm">
                            No initiatives are currently in progress.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-neutral-500 dark:text-neutral-400">
                                        <th className="px-4 py-2 font-medium">Title</th>
                                        <th className="px-4 py-2 font-medium">Board</th>
                                        <th className="px-4 py-2 font-medium">Team</th>
                                        <th className="px-4 py-2 font-medium">Todos</th>
                                        <th className="px-4 py-2 font-medium">RAG</th>
                                        <th className="px-4 py-2 font-medium">Due Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {inProgressInitiatives.map((initiative) => {
                                        const ragEntry = initiative.rag_status
                                            ? RAG_STATUSES.find((r) => r.key === initiative.rag_status)
                                            : undefined;
                                        const dueBadge = initiative.expected_date
                                            ? getDeadlineBadge(initiative.expected_date)
                                            : undefined;
                                        const href = initiative.board_id
                                            ? `${board.show.url(initiative.board_id)}?initiative=${initiative.id}`
                                            : undefined;
                                        const colorStyle = initiative.team_color
                                            ? COLOR_STYLES[initiative.team_color]
                                            : undefined;

                                        const row = (
                                            <>
                                                <td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">
                                                    {initiative.title}
                                                </td>
                                                <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400">
                                                    {initiative.board_name ?? <span className="text-muted-foreground">&mdash;</span>}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {initiative.team_name ? (
                                                        <span className="inline-flex items-center gap-1.5">
                                                            {colorStyle && (
                                                                <span
                                                                    className="size-2 shrink-0 rounded-full"
                                                                    style={{ backgroundColor: colorStyle.border }}
                                                                />
                                                            )}
                                                            <span className="text-neutral-700 dark:text-neutral-300">
                                                                {initiative.team_name}
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400">
                                                    {initiative.incomplete_todo_count}/{initiative.todo_count}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {ragEntry && (
                                                        <span
                                                            className="inline-block size-2.5 rounded-full"
                                                            style={{ backgroundColor: ragEntry.color }}
                                                            title={ragEntry.label}
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {dueBadge && (
                                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${dueBadge.className}`}>
                                                            {initiative.expected_date && new Date(initiative.expected_date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    )}
                                                </td>
                                            </>
                                        );

                                        return (
                                            <tr
                                                key={initiative.id}
                                                className={href ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50' : ''}
                                                onClick={href ? () => router.visit(href) : undefined}
                                            >
                                                {row}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
