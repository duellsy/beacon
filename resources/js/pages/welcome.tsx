import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Ban,
    CheckCircle2,
    ChevronDown,
    Circle,
    Eye,
    GitBranch,
    GripVertical,
    LayoutGrid,
    ListTodo,
    Puzzle,
    Shield,
    Users,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { dashboard, login, register } from '@/routes';
import type { SharedData } from '@/types';

function BeaconLogo({ className = 'size-8' }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="16" cy="10" r="6" className="fill-amber-400" />
            <circle cx="16" cy="10" r="3" className="fill-amber-200" />
            <path
                d="M12 16L10 28H22L20 16"
                className="fill-current"
                opacity="0.9"
            />
            <rect x="9" y="27" width="14" height="3" rx="1" className="fill-current" />
            <path d="M16 1V3" strokeWidth="1.5" strokeLinecap="round" className="stroke-amber-400" />
            <path d="M22.5 3.5L21 5" strokeWidth="1.5" strokeLinecap="round" className="stroke-amber-400" />
            <path d="M9.5 3.5L11 5" strokeWidth="1.5" strokeLinecap="round" className="stroke-amber-400" />
            <path d="M26 10H24" strokeWidth="1.5" strokeLinecap="round" className="stroke-amber-400" />
            <path d="M8 10H6" strokeWidth="1.5" strokeLinecap="round" className="stroke-amber-400" />
        </svg>
    );
}

function BoardMockup() {
    const teams = [
        { name: 'Platform', color: 'bg-blue-500' },
        { name: 'Growth', color: 'bg-emerald-500' },
        { name: 'Mobile', color: 'bg-purple-500' },
    ];
    const statuses = ['In Progress', 'Upcoming'];

    return (
        <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl">
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-2.5">
                <div className="flex gap-1.5">
                    <div className="size-3 rounded-full bg-red-400/80" />
                    <div className="size-3 rounded-full bg-amber-400/80" />
                    <div className="size-3 rounded-full bg-green-400/80" />
                </div>
                <span className="ml-2 text-xs text-muted-foreground">Planning Board</span>
            </div>

            {/* Board grid */}
            <div className="p-4">
                {/* Team headers */}
                <div className="mb-3 grid grid-cols-3 gap-3">
                    {teams.map((team) => (
                        <div
                            key={team.name}
                            className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5"
                        >
                            <div className={`size-2.5 rounded-full ${team.color}`} />
                            <span className="text-xs font-medium">{team.name}</span>
                        </div>
                    ))}
                </div>

                {statuses.map((status) => (
                    <div key={status} className="mb-3">
                        <div className="mb-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                            {status}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {teams.map((team, i) => (
                                <div
                                    key={`${status}-${team.name}`}
                                    className="min-h-[60px] rounded-lg border border-dashed border-border/60 p-2"
                                >
                                    {status === 'In Progress' && i === 0 && (
                                        <div className="rounded-md border border-border bg-background p-2 shadow-sm">
                                            <div className="flex items-center gap-1">
                                                <GripVertical className="size-3 text-muted-foreground/50" />
                                                <span className="text-[10px] font-medium">Auth v2</span>
                                                <div className="ml-auto size-2 rounded-full bg-green-500" title="Green" />
                                            </div>
                                        </div>
                                    )}
                                    {status === 'In Progress' && i === 1 && (
                                        <div className="rounded-md border border-red-200 bg-red-50/50 p-2 shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
                                            <div className="flex items-center gap-1">
                                                <GripVertical className="size-3 text-muted-foreground/50" />
                                                <span className="text-[10px] font-medium">Onboarding</span>
                                                <div className="ml-auto flex items-center gap-1">
                                                    <div className="size-2 rounded-full bg-red-500" title="Red" />
                                                    <Ban className="size-3 text-red-500" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {status === 'In Progress' && i === 2 && (
                                        <div className="rounded-md border border-border bg-background p-2 shadow-sm">
                                            <div className="flex items-center gap-1">
                                                <GripVertical className="size-3 text-muted-foreground/50" />
                                                <span className="text-[10px] font-medium">Push Notifs</span>
                                                <div className="ml-auto size-2 rounded-full bg-amber-500" title="Amber" />
                                            </div>
                                        </div>
                                    )}
                                    {status === 'Upcoming' && i === 0 && (
                                        <div className="rounded-md border border-border bg-background p-2 shadow-sm">
                                            <div className="flex items-center gap-1">
                                                <GripVertical className="size-3 text-muted-foreground/50" />
                                                <span className="text-[10px] font-medium">API Caching</span>
                                            </div>
                                        </div>
                                    )}
                                    {status === 'Upcoming' && i === 2 && (
                                        <div className="rounded-md border border-border bg-background p-2 shadow-sm">
                                            <div className="flex items-center gap-1">
                                                <GripVertical className="size-3 text-muted-foreground/50" />
                                                <span className="text-[10px] font-medium">Offline Mode</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* SVG dependency line overlay */}
            <svg className="pointer-events-none absolute inset-0 size-full" style={{ zIndex: 10 }}>
                <defs>
                    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                        <polygon points="0 0, 6 4, 0 4" className="fill-amber-500" />
                    </marker>
                </defs>
                <path
                    d="M 155 105 C 200 105, 200 105, 245 105"
                    className="stroke-amber-500/70"
                    strokeWidth="1.5"
                    fill="none"
                    strokeDasharray="4 2"
                    markerEnd="url(#arrowhead)"
                />
            </svg>
        </div>
    );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b border-border">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between py-5 text-left"
            >
                <span className="text-base font-medium">{question}</span>
                <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && (
                <div className="pb-5 text-sm leading-relaxed text-muted-foreground">
                    {answer}
                </div>
            )}
        </div>
    );
}

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Beacon - See What Every Team Is Working On">
                <meta
                    name="description"
                    content="See what every team is working on at a glance. Plan initiatives across teams, track dependencies, monitor health with RAG status, and manage todos — all on visual planning boards."
                />
                <meta
                    property="og:title"
                    content="Beacon - See What Every Team Is Working On"
                />
                <meta
                    property="og:description"
                    content="Visual planning boards for cross-team initiatives. Track dependencies, RAG status, and todos."
                />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content="Beacon - See What Every Team Is Working On"
                />
                <meta
                    name="twitter:description"
                    content="Visual planning boards for cross-team initiatives. Track dependencies, RAG status, and todos."
                />
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'SoftwareApplication',
                        name: 'Beacon',
                        applicationCategory: 'BusinessApplication',
                        operatingSystem: 'Web',
                        description:
                            'See what every team is working on. Plan initiatives across teams, track dependencies, monitor RAG status, and manage todos on visual planning boards.',
                        offers: {
                            '@type': 'Offer',
                            price: '0',
                            priceCurrency: 'USD',
                            description: 'Free to use',
                        },
                    })}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: [
                            {
                                '@type': 'Question',
                                name: 'How is Beacon different from Jira or Asana?',
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: 'Beacon is purpose-built for seeing what every team is working on. While Jira and Asana track individual tasks, Beacon focuses on the bigger picture — initiatives across teams, RAG health status, and smart todos.',
                                },
                            },
                            {
                                '@type': 'Question',
                                name: 'What is RAG status?',
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: 'RAG stands for Red, Amber, Green. Set health status on each initiative to signal whether it is on track, at risk, or off track. Your dashboard aggregates RAG status across all teams.',
                                },
                            },
                            {
                                '@type': 'Question',
                                name: 'How does dependency tracking work?',
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: 'Link any initiative to the ones it depends on. Beacon automatically detects blocked initiatives and prevents circular dependencies.',
                                },
                            },
                        ],
                    })}
                </script>
            </Head>

            <div className="min-h-screen bg-background text-foreground">
                {/* Sticky Nav */}
                <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-2">
                            <BeaconLogo className="size-7" />
                            <span className="text-lg font-semibold">Beacon</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                href="#features"
                                className="hidden px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
                            >
                                Features
                            </a>
                            <a
                                href="#faq"
                                className="hidden px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
                            >
                                FAQ
                            </a>
                            {auth.user ? (
                                <Button asChild size="sm">
                                    <Link href={dashboard().url}>Dashboard</Link>
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={login().url}>Log in</Link>
                                    </Button>
                                    {canRegister && (
                                        <Button size="sm" asChild>
                                            <Link href={register().url}>
                                                Start Planning Free
                                            </Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero */}
                <section className="relative overflow-hidden px-6 pt-20 pb-16 lg:pt-32 lg:pb-24">
                    <div className="mx-auto max-w-6xl">
                        <div className="mx-auto max-w-2xl text-center">
                            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                                See what every{' '}
                                <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                                    team is working on
                                </span>
                            </h1>
                            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                                Beacon puts every team's initiatives on visual
                                planning boards with RAG health tracking, smart
                                todos, and dependency mapping — so you always
                                know what's on track and what needs attention.
                            </p>
                            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                                {auth.user ? (
                                    <Button size="lg" asChild>
                                        <Link href={dashboard().url}>
                                            Go to Dashboard
                                            <ArrowRight className="ml-2 size-4" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        {canRegister && (
                                            <Button size="lg" asChild>
                                                <Link href={register().url}>
                                                    Start Planning Free
                                                    <ArrowRight className="ml-2 size-4" />
                                                </Link>
                                            </Button>
                                        )}
                                        <Button variant="outline" size="lg" asChild>
                                            <Link href={login().url}>Log in</Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">
                                Free to use. No credit card required.
                            </p>
                        </div>

                        {/* Board mockup */}
                        <div className="mt-16 lg:mt-20">
                            <BoardMockup />
                        </div>
                    </div>
                </section>

                {/* Problem Statement */}
                <section className="border-t border-border/50 bg-muted/30 px-6 py-20 lg:py-28">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Knowing what every team is doing shouldn't require
                            a spreadsheet and six meetings
                        </h2>
                        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                            When multiple teams work on interconnected initiatives,
                            it's hard to see the full picture. Progress is scattered
                            across tools. Dependencies go unnoticed. Nobody has a
                            single view of what's happening.
                        </p>
                        <div className="mt-10 grid gap-6 text-left sm:grid-cols-3">
                            <div className="rounded-lg border border-border bg-card p-5">
                                <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-red-100 dark:bg-red-950/50">
                                    <Ban className="size-4 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="font-medium">No single view</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Each team tracks their own work, but nobody can
                                    see what every team is doing in one place.
                                </p>
                            </div>
                            <div className="rounded-lg border border-border bg-card p-5">
                                <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950/50">
                                    <Puzzle className="size-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="font-medium">Fragmented context</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Plans live across Jira, Confluence, Sheets, and
                                    Slack. No single view of what's happening.
                                </p>
                            </div>
                            <div className="rounded-lg border border-border bg-card p-5">
                                <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-950/50">
                                    <Users className="size-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="font-medium">Coordination tax</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Syncs, standups, status updates. Hours spent
                                    asking "where are we at?" across teams.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section id="features" className="px-6 py-20 lg:py-28">
                    <div className="mx-auto max-w-5xl">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                How Beacon works
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                Four steps to cross-team clarity.
                            </p>
                        </div>

                        <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="text-center">
                                <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 ring-1 ring-blue-500/20">
                                    <LayoutGrid className="size-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-semibold">
                                    1. Create boards
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    Create multiple boards for different contexts.
                                    Add teams with members and colour-coded columns.
                                    Drag initiatives between statuses as plans evolve.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 ring-1 ring-amber-500/20">
                                    <GitBranch className="size-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="text-lg font-semibold">
                                    2. Map dependencies
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    Link initiatives to what they depend on. See
                                    dependency lines drawn across the board. Hover to
                                    trace the full chain.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-amber-600/10 ring-1 ring-red-500/20">
                                    <Eye className="size-6 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-lg font-semibold">
                                    3. Track health
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    Set RAG status on each initiative. Your dashboard
                                    surfaces what's red, amber, or green across every
                                    team at a glance.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-600/10 ring-1 ring-emerald-500/20">
                                    <ListTodo className="size-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-semibold">
                                    4. Act on todos
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    Create custom rules that automatically suggest todos
                                    when initiatives change status or RAG. Beacon
                                    triggers suggestions based on your activity.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Feature Deep-Dives */}
                <section className="border-t border-border/50 bg-muted/30 px-6 py-20 lg:py-28">
                    <div className="mx-auto max-w-5xl space-y-20">
                        {/* Feature 1: Board View */}
                        <div className="grid items-center gap-10 lg:grid-cols-2">
                            <div>
                                <div className="mb-4 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                    Planning Boards
                                </div>
                                <h3 className="text-2xl font-bold">
                                    Multiple boards, one clear picture
                                </h3>
                                <p className="mt-4 leading-relaxed text-muted-foreground">
                                    Create boards for different contexts — quarterly
                                    planning, product areas, or org-wide views. Each
                                    board shows teams as columns and status as rows.
                                    Add team members, assign initiatives, and set RAG
                                    status to track health at a glance.
                                </p>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                <div className="flex gap-4">
                                    {['Platform', 'Growth', 'Mobile'].map((team, i) => (
                                        <div key={team} className="flex-1">
                                            <div className="mb-3 flex items-center gap-1.5">
                                                <div
                                                    className={`size-2 rounded-full ${
                                                        i === 0
                                                            ? 'bg-blue-500'
                                                            : i === 1
                                                              ? 'bg-emerald-500'
                                                              : 'bg-purple-500'
                                                    }`}
                                                />
                                                <span className="text-xs font-medium">{team}</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between rounded border border-border bg-background px-2 py-1.5 text-[10px]">
                                                    <span>{i === 0 && 'Auth v2'}{i === 1 && 'Onboarding'}{i === 2 && 'Push Notifs'}</span>
                                                    <div className={`size-1.5 rounded-full ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-red-500' : 'bg-amber-500'}`} />
                                                </div>
                                                {i !== 1 && (
                                                    <div className="rounded border border-dashed border-border/50 px-2 py-1.5 text-[10px] text-muted-foreground">
                                                        {i === 0 && 'API Caching'}
                                                        {i === 2 && 'Offline Mode'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Feature 2: Dependency Tracking */}
                        <div className="grid items-center gap-10 lg:grid-cols-2">
                            <div className="order-2 lg:order-1">
                                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 rounded border border-border bg-background px-3 py-2 text-xs">
                                            Onboarding Flow
                                        </div>
                                        <div className="text-xs text-amber-500">depends on</div>
                                        <div className="flex-1 rounded border border-border bg-background px-3 py-2 text-xs">
                                            Auth v2
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 dark:bg-red-950/30">
                                        <Ban className="size-3.5 text-red-500" />
                                        <span className="text-xs text-red-700 dark:text-red-400">
                                            Blocked — Auth v2 is still in progress
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 dark:bg-green-950/30">
                                        <Shield className="size-3.5 text-green-500" />
                                        <span className="text-xs text-green-700 dark:text-green-400">
                                            Cycle detection prevents circular dependencies
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 lg:order-2">
                                <div className="mb-4 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                    Dependency Tracking
                                </div>
                                <h3 className="text-2xl font-bold">
                                    See the full dependency chain
                                </h3>
                                <p className="mt-4 leading-relaxed text-muted-foreground">
                                    Link initiatives to their dependencies. Beacon
                                    automatically detects blocked work and prevents
                                    circular dependencies. Hover any initiative to
                                    trace its full chain across teams.
                                </p>
                            </div>
                        </div>

                        {/* Feature 3: Dashboard & Todos */}
                        <div className="grid items-center gap-10 lg:grid-cols-2">
                            <div>
                                <div className="mb-4 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                    Dashboard & Todos
                                </div>
                                <h3 className="text-2xl font-bold">
                                    Know what needs attention
                                </h3>
                                <p className="mt-4 leading-relaxed text-muted-foreground">
                                    Your dashboard shows per-team stats, RAG
                                    distributions, and in-progress work at a glance.
                                    Define custom automation rules to trigger todo
                                    suggestions when initiatives change status or RAG
                                    — so nothing slips through the cracks.
                                </p>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                <div className="space-y-3">
                                    {/* Summary stats */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="rounded-md bg-muted/50 px-2 py-1.5 text-center">
                                            <div className="text-sm font-bold">12</div>
                                            <div className="text-[9px] text-muted-foreground">Total</div>
                                        </div>
                                        <div className="rounded-md bg-muted/50 px-2 py-1.5 text-center">
                                            <div className="text-sm font-bold">5</div>
                                            <div className="text-[9px] text-muted-foreground">In Progress</div>
                                        </div>
                                        <div className="rounded-md bg-muted/50 px-2 py-1.5 text-center">
                                            <div className="text-sm font-bold">4</div>
                                            <div className="text-[9px] text-muted-foreground">Done</div>
                                        </div>
                                    </div>
                                    {/* Automation rule example */}
                                    <div className="rounded-md border border-dashed border-emerald-500/30 bg-emerald-50/50 p-2 dark:bg-emerald-950/20">
                                        <div className="flex items-center gap-1.5">
                                            <Zap className="size-3 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-[9px] font-medium text-emerald-700 dark:text-emerald-300">Rule: RAG → Red triggers todo</span>
                                        </div>
                                    </div>
                                    {/* Todo suggestions */}
                                    <div className="space-y-1.5">
                                        <div className="text-[10px] font-medium text-muted-foreground">Todos</div>
                                        <div className="flex items-center gap-2 rounded-md bg-background px-2.5 py-1.5">
                                            <CheckCircle2 className="size-3 text-emerald-500" />
                                            <span className="text-[10px] line-through text-muted-foreground">Update API docs</span>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-md bg-background px-2.5 py-1.5">
                                            <Circle className="size-3 text-muted-foreground/50" />
                                            <span className="text-[10px]">Address red RAG on Onboarding</span>
                                            <span className="ml-auto rounded bg-red-100 px-1.5 py-0.5 text-[8px] font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400">auto</span>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-md bg-background px-2.5 py-1.5">
                                            <Circle className="size-3 text-muted-foreground/50" />
                                            <span className="text-[10px]">Unblock Mobile team</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Use Cases */}
                <section className="px-6 py-20 lg:py-28">
                    <div className="mx-auto max-w-5xl">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Built for teams that ship together
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                Whether you lead a team or coordinate across many,
                                Beacon gives you the visibility you need.
                            </p>
                        </div>
                        <div className="mt-12 grid gap-6 sm:grid-cols-3">
                            <div className="rounded-xl border border-border bg-card p-6">
                                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                                    <Zap className="size-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="font-semibold">Engineering Leads</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    Assign initiatives to team members, track
                                    health with RAG status, and create automation
                                    rules for todos triggered by activity changes.
                                </p>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-6">
                                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/50">
                                    <LayoutGrid className="size-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="font-semibold">Product Managers</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    Create boards for quarterly planning or
                                    product areas. See RAG status across all teams
                                    and track dependencies visually.
                                </p>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-6">
                                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
                                    <Eye className="size-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="font-semibold">Engineering Leadership</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    Dashboard with per-team stats, RAG health
                                    indicators, and activity feeds. Replace the
                                    status-update meeting with a glance.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mid-page CTA */}
                {!auth.user && canRegister && (
                    <section className="px-6 py-16">
                        <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-10 text-center ring-1 ring-amber-500/20">
                            <h2 className="text-2xl font-bold">
                                Ready to see what every team is working on?
                            </h2>
                            <p className="mt-3 text-muted-foreground">
                                Set up your first board in minutes. Free to use, no
                                credit card required.
                            </p>
                            <Button size="lg" className="mt-6" asChild>
                                <Link href={register().url}>
                                    Start Planning Free
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                        </div>
                    </section>
                )}

                {/* FAQ */}
                <section id="faq" className="border-t border-border/50 bg-muted/30 px-6 py-20 lg:py-28">
                    <div className="mx-auto max-w-2xl">
                        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
                            Frequently asked questions
                        </h2>
                        <div className="mt-12">
                            <FaqItem
                                question="How is Beacon different from Jira or Asana?"
                                answer="Beacon is purpose-built for seeing what every team is working on. While Jira and Asana track individual tasks, Beacon focuses on the bigger picture: each team's initiatives, how they depend on each other, RAG health status, and overall progress across your organization."
                            />
                            <FaqItem
                                question="Can I have multiple boards?"
                                answer="Yes. Create as many boards as you need — one for quarterly planning, another for a product area, or an org-wide view. Switch between them from the sidebar."
                            />
                            <FaqItem
                                question="What is RAG status?"
                                answer="RAG stands for Red, Amber, Green. Set the health status on each initiative to signal whether it's on track (green), at risk (amber), or off track (red). Your dashboard aggregates RAG status across all teams so you can spot problems early."
                            />
                            <FaqItem
                                question="How do smart todos work?"
                                answer="Create custom automation rules that trigger todo suggestions when initiatives change. For example: when any initiative goes to red RAG, suggest 'Address red RAG on [initiative]' with a 3-day deadline. When an initiative changes from in progress to done, suggest 'Create changelog'. Beacon watches your initiative activity and suggests todos based on the rules you define."
                            />
                            <FaqItem
                                question="How does dependency tracking work?"
                                answer="Link any initiative to the ones it depends on. Beacon automatically detects when an initiative is blocked because its dependencies aren't done yet. It also prevents circular dependencies so your plan stays coherent."
                            />
                            <FaqItem
                                question="Can I import existing data?"
                                answer="Yes. Beacon supports JSON import/export, so you can bulk-load your teams, projects, and initiatives. You can also link initiatives to external Jira tickets for easy reference."
                            />
                            <FaqItem
                                question="Is Beacon free?"
                                answer="Yes. Beacon is free to use. Create an account and start planning your team initiatives right away."
                            />
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="px-6 py-20 lg:py-28">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Boards. Teams. Todos. Full clarity.
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            See what every team is working on, track health
                            with RAG status, and act on smart todos before
                            things slip.
                        </p>
                        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                            {auth.user ? (
                                <Button size="lg" asChild>
                                    <Link href={dashboard().url}>
                                        Go to Dashboard
                                        <ArrowRight className="ml-2 size-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    {canRegister && (
                                        <Button size="lg" asChild>
                                            <Link href={register().url}>
                                                Start Planning Free
                                                <ArrowRight className="ml-2 size-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    <Button variant="outline" size="lg" asChild>
                                        <Link href={login().url}>Log in</Link>
                                    </Button>
                                </>
                            )}
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Free to use. Set up in under 10 minutes.
                        </p>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-border/50 px-6 py-10">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
                        <div className="flex items-center gap-2">
                            <BeaconLogo className="size-5" />
                            <span className="text-sm font-medium">Beacon</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            See what every team is working on.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
