import { Head, Link, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Clock, Layers, Loader2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { board, dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { TeamColor } from '@/types/board';
import { COLOR_STYLES } from '@/types/board';

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
};

type DashboardTeam = {
    id: string;
    name: string;
    color: TeamColor;
    counts: StatusCounts;
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

type DashboardProps = {
    stats: DashboardStats;
    teams: DashboardTeam[];
    unassigned: UnassignedData;
    recentActivity: ActivityItem[];
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

            {team.counts.in_progress === 0 && totalCount > 0 && (
                <div className="mt-3 flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <AlertCircle className="size-3.5 shrink-0" />
                    Nothing in progress
                </div>
            )}

            {team.inProgressInitiatives.length > 0 && (
                <ul className="mt-3 space-y-1">
                    {team.inProgressInitiatives.map((initiative) => (
                        <li
                            key={initiative.id}
                            className="truncate text-sm text-neutral-700 dark:text-neutral-300"
                        >
                            {initiative.title}
                        </li>
                    ))}
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

export default function Dashboard() {
    const { stats, teams, unassigned, recentActivity } = usePage<{
        props: DashboardProps;
    }>().props as unknown as DashboardProps;

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
                <div className="flex">
                    <Link
                        href={board().url}
                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                        Open Board &rarr;
                    </Link>
                </div>

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
