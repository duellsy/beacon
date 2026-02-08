import {
    DndContext,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, Calendar, Columns3, Download, FolderOpen, MoreVertical, Pencil, Plus, Search, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BoardCell } from '@/components/board/board-cell';
import { MobileTeamTabs } from '@/components/board/mobile-team-tabs';
import { DependencyDragLayer } from '@/components/board/dependency-drag-layer';
import { DependencyLines } from '@/components/board/dependency-lines';
import { InitiativeCard } from '@/components/board/initiative-card';
import { InitiativeModal } from '@/components/board/initiative-modal';
import { ProjectModal } from '@/components/board/project-modal';
import { TeamDetailSheet } from '@/components/board/team-detail-sheet';
import { TeamHeader } from '@/components/board/team-header';
import { TeamModal } from '@/components/board/team-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from '@/layouts/app-layout';
import BoardController from '@/actions/App/Http/Controllers/BoardController';
import InitiativeController from '@/actions/App/Http/Controllers/InitiativeController';
import TeamController from '@/actions/App/Http/Controllers/TeamController';
import type {
    Board as BoardType,
    BoardSummary,
    Initiative,
    InitiativeStatus,
    Project,
    Team,
} from '@/types/board';
import { STATUSES } from '@/types/board';

type BoardProps = {
    board: BoardType;
    boards: BoardSummary[];
    teams: Team[];
    initiatives: Initiative[];
    projects: Project[];
    currentProjectId: string | null;
};

export default function Board() {
    const { board, boards, teams, initiatives, projects, currentProjectId } = usePage<{
        props: BoardProps;
    }>().props as unknown as BoardProps;

    const contentRef = useRef<HTMLDivElement>(null);

    // Modal state
    const [teamModal, setTeamModal] = useState<{
        open: boolean;
        team: Team | null;
    }>({ open: false, team: null });

    const [projectModal, setProjectModal] = useState<{
        open: boolean;
        project: Project | null;
    }>({ open: false, project: null });

    const [initiativeModal, setInitiativeModal] = useState<{
        open: boolean;
        initiative: Initiative | null;
        defaultTeamId: string | null;
        defaultStatus: InitiativeStatus | null;
    }>({ open: false, initiative: null, defaultTeamId: null, defaultStatus: null });

    // Auto-open initiative from URL param (e.g. ?initiative=uuid)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const initiativeId = params.get('initiative');
        if (initiativeId) {
            const init = initiatives.find((i) => i.id === initiativeId);
            if (init) {
                setInitiativeModal({ open: true, initiative: init, defaultTeamId: null, defaultStatus: null });
            }
            // Clean up the URL param
            params.delete('initiative');
            const newUrl = params.toString()
                ? `${window.location.pathname}?${params.toString()}`
                : window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, []);

    // Team detail sheet state
    const [teamDetailSheet, setTeamDetailSheet] = useState<{
        open: boolean;
        team: Team | null;
    }>({ open: false, team: null });

    // Hover state for dependency lines
    const [hoveredInitiativeId, setHoveredInitiativeId] = useState<
        string | null
    >(null);

    // Drag state
    const [activeInitiative, setActiveInitiative] =
        useState<Initiative | null>(null);

    const mouseSensor = useSensor(MouseSensor, {
        activationConstraint: { distance: 5 },
    });
    const touchSensor = useSensor(TouchSensor, {
        activationConstraint: { delay: 200, tolerance: 5 },
    });
    const sensors = useSensors(mouseSensor, touchSensor);

    const isMobile = useIsMobile();
    const [selectedTeamId, setSelectedTeamId] = useState('__all');

    // Search & filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBlocked, setFilterBlocked] = useState(false);
    const [filterOverdue, setFilterOverdue] = useState(false);

    const hasActiveFilters = searchQuery !== '' || filterBlocked || filterOverdue;

    const filteredInitiatives = useMemo(() => {
        let result = initiatives;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (i) =>
                    i.title.toLowerCase().includes(q) ||
                    (i.assignee?.name.toLowerCase().includes(q) ?? false) ||
                    (i.description?.toLowerCase().includes(q) ?? false),
            );
        }

        if (filterBlocked) {
            result = result.filter((i) => i.is_blocked);
        }

        if (filterOverdue) {
            const todayStr = new Date().toLocaleDateString('en-CA', {
                timeZone: 'Australia/Sydney',
            });
            result = result.filter(
                (i) =>
                    i.expected_date &&
                    i.status !== 'done' &&
                    i.expected_date <= todayStr,
            );
        }

        return result;
    }, [initiatives, searchQuery, filterBlocked, filterOverdue]);

    // Column layout toggle (fit to screen vs fixed-width scrollable)
    const [fitColumns, setFitColumns] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('board-fit-columns') === 'true';
        }
        return false;
    });
    const handleFitColumnsToggle = (pressed: boolean) => {
        setFitColumns(pressed);
        localStorage.setItem('board-fit-columns', String(pressed));
    };

    // Team column order (optimistic reordering)
    const [teamOrder, setTeamOrder] = useState(() => teams.map((t) => t.id));

    useEffect(() => {
        setTeamOrder(teams.map((t) => t.id));
    }, [teams]);

    const orderedTeams = useMemo(
        () => teamOrder.map((id) => teams.find((t) => t.id === id)).filter(Boolean) as Team[],
        [teamOrder, teams],
    );

    // Team columns only (unassigned is a separate section)
    const columns = useMemo(
        () => orderedTeams.map((t) => ({ id: t.id, team: t })),
        [orderedTeams],
    );

    // Unassigned initiatives (all statuses, shown as backlog)
    const unassignedInitiatives = useMemo(
        () => filteredInitiatives.filter((i) => i.team_id === null),
        [filteredInitiatives],
    );

    // Compute highlighted initiative IDs when hovering
    const highlightedInitiativeIds = useMemo(() => {
        const ids = new Set<string>();
        if (!hoveredInitiativeId) return ids;

        ids.add(hoveredInitiativeId);

        const hovered = initiatives.find(
            (i) => i.id === hoveredInitiativeId,
        );
        if (hovered) {
            for (const dep of hovered.dependencies) {
                ids.add(dep.id);
            }
        }

        for (const init of initiatives) {
            if (
                init.dependencies.some(
                    (d) => d.id === hoveredInitiativeId,
                )
            ) {
                ids.add(init.id);
            }
        }

        return ids;
    }, [hoveredInitiativeId, initiatives]);

    // Get initiatives for a specific cell
    const getCellInitiatives = useCallback(
        (columnId: string, status: InitiativeStatus) =>
            filteredInitiatives.filter(
                (i) =>
                    i.status === status &&
                    (columnId === 'unassigned'
                        ? i.team_id === null
                        : i.team_id === columnId),
            ),
        [filteredInitiatives],
    );

    // Get initiatives for a mobile swimlane (filtered by selected team)
    const getMobileInitiatives = useCallback(
        (status: InitiativeStatus) =>
            filteredInitiatives.filter((i) => {
                if (i.status !== status) return false;
                if (selectedTeamId === '__all') return true;
                if (selectedTeamId === 'unassigned') return i.team_id === null;
                return i.team_id === selectedTeamId;
            }),
        [filteredInitiatives, selectedTeamId],
    );

    // Drag handlers
    const handleDragStart = (event: DragStartEvent) => {
        const initiative = event.active.data.current
            ?.initiative as Initiative;
        setActiveInitiative(initiative);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveInitiative(null);

        const { active, over } = event;
        if (!over) return;

        const initiative = active.data.current
            ?.initiative as Initiative;
        if (!initiative) return;

        const overId = over.id as string;

        // Backlog drop target: unassign team, keep current status
        if (overId === 'backlog') {
            if (initiative.team_id === null) return;
            router.patch(
                InitiativeController.move.url(initiative.id),
                { team_id: null, status: initiative.status },
                { preserveScroll: true },
            );
            return;
        }

        const [targetTeamId, targetStatus] = overId.split(':');

        const newTeamId =
            targetTeamId === '__keep'
                ? initiative.team_id
                : targetTeamId === 'unassigned' ? null : targetTeamId;
        const newStatus = targetStatus as InitiativeStatus;

        if (
            initiative.team_id === newTeamId &&
            initiative.status === newStatus
        ) {
            return;
        }

        router.patch(
            InitiativeController.move.url(initiative.id),
            { team_id: newTeamId, status: newStatus },
            { preserveScroll: true },
        );
    };

    // Team column reorder handler
    const handleTeamDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = teamOrder.indexOf(active.id as string);
        const newIndex = teamOrder.indexOf(over.id as string);
        const newOrder = arrayMove(teamOrder, oldIndex, newIndex);

        setTeamOrder(newOrder);
        router.post(TeamController.reorder.url(), { ids: newOrder }, { preserveScroll: true });
    };

    // Export
    const handleExport = async () => {
        const response = await fetch(BoardController.export.url(board.id));
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `board-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Import
    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const text = await file.text();
            try {
                const data = JSON.parse(text);
                router.post(BoardController.import.url(board.id), data);
            } catch {
                alert('Invalid JSON file');
            }
        };
        input.click();
    };

    const gridCols = columns.length;

    return (
        <AppLayout>
            <Head title={board.name} />

            <div className="flex h-full flex-col overflow-hidden">
                {/* Top nav */}
                <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-semibold">
                            <span className="md:hidden">Board</span>
                            <span className="hidden md:inline">Initiative Board</span>
                        </h1>
                        <Select
                            value={currentProjectId ?? '__all'}
                            onValueChange={(v) => {
                                const params =
                                    v === '__all'
                                        ? {}
                                        : { project: v };
                                router.get(
                                    BoardController.index.url(board.id),
                                    params,
                                    { preserveState: true },
                                );
                            }}
                        >
                            <SelectTrigger className="w-[140px] md:w-[200px]">
                                <FolderOpen className="size-3.5" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all">
                                    All Projects
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
                        {!isMobile && currentProjectId && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => {
                                    const p = projects.find(
                                        (proj) =>
                                            proj.id ===
                                            currentProjectId,
                                    );
                                    if (p) {
                                        setProjectModal({
                                            open: true,
                                            project: p,
                                        });
                                    }
                                }}
                                title="Edit Project"
                            >
                                <Pencil className="size-3.5" />
                            </Button>
                        )}
                        {!isMobile && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() =>
                                    setProjectModal({
                                        open: true,
                                        project: null,
                                    })
                                }
                                title="Add Project"
                            >
                                <Plus className="size-3.5" />
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isMobile ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-8">
                                        <MoreVertical className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setProjectModal({ open: true, project: null })}>
                                        <Plus className="size-4" />
                                        New Project
                                    </DropdownMenuItem>
                                    {currentProjectId && (
                                        <DropdownMenuItem
                                            onClick={() => {
                                                const p = projects.find((proj) => proj.id === currentProjectId);
                                                if (p) setProjectModal({ open: true, project: p });
                                            }}
                                        >
                                            <Pencil className="size-4" />
                                            Edit Project
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => setTeamModal({ open: true, team: null })}>
                                        <Plus className="size-4" />
                                        Add Team
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleExport}>
                                        <Download className="size-4" />
                                        Export
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleImport}>
                                        <Upload className="size-4" />
                                        Import
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleFitColumnsToggle(!fitColumns)}>
                                        <Columns3 className="size-4" />
                                        {fitColumns ? 'Fixed-width columns' : 'Fit to screen'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setTeamModal({
                                            open: true,
                                            team: null,
                                        })
                                    }
                                >
                                    <Plus className="size-3.5" />
                                    Add Team
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExport}
                                >
                                    <Download className="size-3.5" />
                                    Export
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleImport}
                                >
                                    <Upload className="size-3.5" />
                                    Import
                                </Button>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Toggle
                                                variant="outline"
                                                size="sm"
                                                pressed={fitColumns}
                                                onPressedChange={handleFitColumnsToggle}
                                                aria-label="Fit columns to screen"
                                            >
                                                <Columns3 className="size-3.5" />
                                            </Toggle>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {fitColumns ? 'Switch to fixed-width columns' : 'Fit columns to screen'}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </>
                        )}
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search initiatives..."
                            className="h-8 pl-8 text-sm"
                        />
                    </div>
                    <Button
                        variant={filterBlocked ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => setFilterBlocked(!filterBlocked)}
                    >
                        <AlertTriangle className="size-3" />
                        Blocked
                    </Button>
                    <Button
                        variant={filterOverdue ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => setFilterOverdue(!filterOverdue)}
                    >
                        <Calendar className="size-3" />
                        Overdue
                    </Button>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => {
                                setSearchQuery('');
                                setFilterBlocked(false);
                                setFilterOverdue(false);
                            }}
                        >
                            <X className="size-3" />
                            Clear
                        </Button>
                    )}
                    {hasActiveFilters && (
                        <span className="text-muted-foreground text-xs tabular-nums">
                            {filteredInitiatives.length} of {initiatives.length}
                        </span>
                    )}
                </div>

                {/* Board */}
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    {isMobile ? (
                        /* Mobile: team tabs + stacked swimlanes */
                        <div className="flex flex-1 flex-col overflow-hidden">
                            <MobileTeamTabs
                                teams={teams}
                                selectedTeamId={selectedTeamId}
                                onSelect={setSelectedTeamId}
                            />
                            <div className="flex-1 overflow-auto p-4">
                                <div className="space-y-4">
                                    {STATUSES.map((status) => {
                                        const filtered = getMobileInitiatives(status.key);
                                        const selectedTeam = teams.find((t) => t.id === selectedTeamId);
                                        const dropId =
                                            selectedTeamId === '__all'
                                                ? `__keep:${status.key}`
                                                : selectedTeamId === 'unassigned'
                                                  ? `unassigned:${status.key}`
                                                  : `${selectedTeamId}:${status.key}`;

                                        return (
                                            <div key={status.key}>
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                                                        {status.label}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs tabular-nums">
                                                        {filtered.length}
                                                    </span>
                                                </div>
                                                <BoardCell
                                                    id={dropId}
                                                    teamColor={selectedTeam?.color}
                                                    onAddInitiative={() =>
                                                        setInitiativeModal({
                                                            open: true,
                                                            initiative: null,
                                                            defaultTeamId:
                                                                selectedTeamId === '__all' || selectedTeamId === 'unassigned'
                                                                    ? null
                                                                    : selectedTeamId,
                                                            defaultStatus: status.key,
                                                        })
                                                    }
                                                    isMobile
                                                >
                                                    {filtered.map((initiative) => (
                                                        <InitiativeCard
                                                            key={initiative.id}
                                                            initiative={initiative}
                                                            teamColor={
                                                                selectedTeamId === '__all'
                                                                    ? teams.find((t) => t.id === initiative.team_id)?.color
                                                                    : selectedTeam?.color
                                                            }
                                                            onOpen={(init) =>
                                                                setInitiativeModal({
                                                                    open: true,
                                                                    initiative: init,
                                                                    defaultTeamId: null,
                                                                    defaultStatus: null,
                                                                })
                                                            }
                                                            onHover={() => {}}
                                                            isHighlighted={false}
                                                        />
                                                    ))}
                                                </BoardCell>
                                            </div>
                                        );
                                    })}

                                    {/* Backlog (unassigned) */}
                                    {(selectedTeamId === '__all' || selectedTeamId === 'unassigned') && (
                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                                                    Backlog
                                                </span>
                                                <span className="text-muted-foreground text-xs tabular-nums">
                                                    {unassignedInitiatives.length}
                                                </span>
                                            </div>
                                            <BoardCell
                                                id="backlog"
                                                onAddInitiative={() =>
                                                    setInitiativeModal({
                                                        open: true,
                                                        initiative: null,
                                                        defaultTeamId: null,
                                                        defaultStatus: 'upcoming',
                                                    })
                                                }
                                                isMobile
                                            >
                                                {unassignedInitiatives.map((initiative) => (
                                                    <InitiativeCard
                                                        key={initiative.id}
                                                        initiative={initiative}
                                                        onOpen={(init) =>
                                                            setInitiativeModal({
                                                                open: true,
                                                                initiative: init,
                                                                defaultTeamId: null,
                                                                defaultStatus: null,
                                                            })
                                                        }
                                                        onHover={() => {}}
                                                        isHighlighted={false}
                                                    />
                                                ))}
                                            </BoardCell>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Desktop: grid layout */
                        <div className="flex-1 overflow-auto">
                            <div
                                ref={contentRef}
                                className="relative p-4"
                                style={{ minWidth: fitColumns ? undefined : 'fit-content' }}
                            >
                                <div
                                    className="grid gap-2"
                                    style={{
                                        gridTemplateColumns: fitColumns
                                            ? `90px repeat(${gridCols}, minmax(180px, 1fr))`
                                            : `90px repeat(${gridCols}, 280px)`,
                                    }}
                                >
                                    {/* Row 1: Header row */}
                                    {/* Corner spacer */}
                                    <div />
                                    {/* Team headers (sortable) */}
                                    <DndContext onDragEnd={handleTeamDragEnd}>
                                        <SortableContext items={teamOrder} strategy={horizontalListSortingStrategy}>
                                            {columns.map((col) => (
                                                <TeamHeader
                                                    key={col.id}
                                                    team={col.team}
                                                    sortableId={col.id}
                                                    onEditTeam={(t) =>
                                                        setTeamModal({
                                                            open: true,
                                                            team: t,
                                                        })
                                                    }
                                                    onClickTeam={(t) =>
                                                        setTeamDetailSheet({
                                                            open: true,
                                                            team: t,
                                                        })
                                                    }
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>

                                    {/* Status rows */}
                                    {STATUSES.map((status) => (
                                        <>
                                            {/* Swimlane label */}
                                            <div
                                                key={`label-${status.key}`}
                                                className="flex items-start pt-3"
                                            >
                                                <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                                                    {status.label}
                                                </span>
                                            </div>

                                            {/* Cells for each column in this status row */}
                                            {columns.map((col) => (
                                                <BoardCell
                                                    key={`${col.id}:${status.key}`}
                                                    id={`${col.id}:${status.key}`}
                                                    teamColor={col.team?.color}
                                                    onAddInitiative={() =>
                                                        setInitiativeModal({
                                                            open: true,
                                                            initiative: null,
                                                            defaultTeamId: col.id,
                                                            defaultStatus: status.key,
                                                        })
                                                    }
                                                >
                                                    {getCellInitiatives(
                                                        col.id,
                                                        status.key,
                                                    ).map((initiative) => (
                                                        <InitiativeCard
                                                            key={initiative.id}
                                                            initiative={initiative}
                                                            teamColor={col.team?.color}
                                                            onOpen={(init) =>
                                                                setInitiativeModal({
                                                                    open: true,
                                                                    initiative: init,
                                                                    defaultTeamId: null,
                                                                    defaultStatus: null,
                                                                })
                                                            }
                                                            onHover={setHoveredInitiativeId}
                                                            isHighlighted={highlightedInitiativeIds.has(initiative.id)}
                                                        />
                                                    ))}
                                                </BoardCell>
                                            ))}
                                        </>
                                    ))}
                                </div>

                                {/* Backlog (unassigned initiatives) */}
                                <div className="mt-4 border-t pt-4">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                                                Backlog (Unassigned)
                                            </span>
                                            <span className="text-muted-foreground text-xs tabular-nums">
                                                {unassignedInitiatives.length}
                                            </span>
                                        </div>
                                        <BoardCell
                                            id="backlog"
                                            onAddInitiative={() =>
                                                setInitiativeModal({
                                                    open: true,
                                                    initiative: null,
                                                    defaultTeamId: null,
                                                    defaultStatus: 'upcoming',
                                                })
                                            }
                                        >
                                            <div className="flex flex-wrap gap-2">
                                                {unassignedInitiatives.map((initiative) => (
                                                    <div key={initiative.id} className="w-[260px]">
                                                        <InitiativeCard
                                                            initiative={initiative}
                                                            onOpen={(init) =>
                                                                setInitiativeModal({
                                                                    open: true,
                                                                    initiative: init,
                                                                    defaultTeamId: null,
                                                                    defaultStatus: null,
                                                                })
                                                            }
                                                            onHover={setHoveredInitiativeId}
                                                            isHighlighted={highlightedInitiativeIds.has(initiative.id)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </BoardCell>
                                </div>

                                {/* Dependency lines SVG overlay */}
                                <DependencyLines
                                    initiatives={filteredInitiatives}
                                    hoveredId={hoveredInitiativeId}
                                    contentRef={contentRef}
                                />
                                <DependencyDragLayer contentRef={contentRef} />
                            </div>
                        </div>
                    )}

                    <DragOverlay dropAnimation={null}>
                        {activeInitiative && (
                            <div className="w-[260px] rotate-2 opacity-80">
                                <InitiativeCard
                                    initiative={activeInitiative}
                                    teamColor={teams.find((t) => t.id === activeInitiative.team_id)?.color}
                                    onOpen={() => {}}
                                    onHover={() => {}}
                                    isHighlighted={false}
                                />
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Modals */}
            <TeamModal
                open={teamModal.open}
                onClose={() =>
                    setTeamModal({ open: false, team: null })
                }
                team={teamModal.team}
                boardId={board.id}
            />

            <ProjectModal
                open={projectModal.open}
                onClose={() =>
                    setProjectModal({
                        open: false,
                        project: null,
                    })
                }
                project={projectModal.project}
            />

            <InitiativeModal
                open={initiativeModal.open}
                onClose={() =>
                    setInitiativeModal({
                        open: false,
                        initiative: null,
                        defaultTeamId: null,
                        defaultStatus: null,
                    })
                }
                initiative={
                    initiativeModal.initiative
                        ? (initiatives.find(i => i.id === initiativeModal.initiative!.id) ?? initiativeModal.initiative)
                        : null
                }
                teams={teams}
                projects={projects}
                allInitiatives={initiatives}
                defaultTeamId={initiativeModal.defaultTeamId}
                defaultStatus={initiativeModal.defaultStatus}
            />

            <TeamDetailSheet
                open={teamDetailSheet.open}
                onClose={() => setTeamDetailSheet({ open: false, team: null })}
                team={teamDetailSheet.team ? (teams.find(t => t.id === teamDetailSheet.team!.id) ?? teamDetailSheet.team) : null}
                onEditTeam={(t) => {
                    setTeamDetailSheet({ open: false, team: null });
                    setTeamModal({ open: true, team: t });
                }}
            />
        </AppLayout>
    );
}
