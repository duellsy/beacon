import {
    DndContext,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Head, router, usePage } from '@inertiajs/react';
import { Download, FolderOpen, MoreVertical, Pencil, Plus, Upload } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { BoardCell } from '@/components/board/board-cell';
import { MobileTeamTabs } from '@/components/board/mobile-team-tabs';
import { DependencyLines } from '@/components/board/dependency-lines';
import { InitiativeCard } from '@/components/board/initiative-card';
import { InitiativeModal } from '@/components/board/initiative-modal';
import { ProjectModal } from '@/components/board/project-modal';
import { TeamHeader } from '@/components/board/team-header';
import { TeamModal } from '@/components/board/team-modal';
import { Button } from '@/components/ui/button';
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
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from '@/layouts/app-layout';
import BoardController from '@/actions/App/Http/Controllers/BoardController';
import InitiativeController from '@/actions/App/Http/Controllers/InitiativeController';
import type {
    Initiative,
    InitiativeStatus,
    Project,
    Team,
} from '@/types/board';
import { STATUSES } from '@/types/board';

type BoardProps = {
    teams: Team[];
    initiatives: Initiative[];
    projects: Project[];
    currentProjectId: string | null;
};

export default function Board() {
    const { teams, initiatives, projects, currentProjectId } = usePage<{
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

    // All columns: unassigned + teams
    const columns = useMemo(
        () => [
            ...teams.map((t) => ({ id: t.id, team: t })),
            { id: 'unassigned', team: null as Team | null },
        ],
        [teams],
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
            initiatives.filter(
                (i) =>
                    i.status === status &&
                    (columnId === 'unassigned'
                        ? i.team_id === null
                        : i.team_id === columnId),
            ),
        [initiatives],
    );

    // Get initiatives for a mobile swimlane (filtered by selected team)
    const getMobileInitiatives = useCallback(
        (status: InitiativeStatus) =>
            initiatives.filter((i) => {
                if (i.status !== status) return false;
                if (selectedTeamId === '__all') return true;
                if (selectedTeamId === 'unassigned') return i.team_id === null;
                return i.team_id === selectedTeamId;
            }),
        [initiatives, selectedTeamId],
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

        const [targetTeamId, targetStatus] = (
            over.id as string
        ).split(':');

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

    // Export
    const handleExport = async () => {
        const response = await fetch(BoardController.export.url());
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
                router.post(BoardController.import.url(), data);
            } catch {
                alert('Invalid JSON file');
            }
        };
        input.click();
    };

    const gridCols = columns.length;

    return (
        <AppLayout>
            <Head title="Board" />

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
                                    BoardController.index.url(),
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
                            </>
                        )}
                    </div>
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
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Desktop: grid layout */
                        <div className="flex-1 overflow-auto">
                            <div
                                ref={contentRef}
                                className="relative min-w-fit p-4"
                            >
                                <div
                                    className="grid gap-2"
                                    style={{
                                        gridTemplateColumns: `90px repeat(${gridCols}, 280px)`,
                                    }}
                                >
                                    {/* Row 1: Header row */}
                                    {/* Corner spacer */}
                                    <div />
                                    {/* Team headers */}
                                    {columns.map((col) => (
                                        <TeamHeader
                                            key={col.id}
                                            team={col.team}
                                            onEditTeam={(t) =>
                                                setTeamModal({
                                                    open: true,
                                                    team: t,
                                                })
                                            }
                                        />
                                    ))}

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
                                                            defaultTeamId:
                                                                col.id === 'unassigned'
                                                                    ? null
                                                                    : col.id,
                                                            defaultStatus: status.key,
                                                        })
                                                    }
                                                >
                                                    {getCellInitiatives(
                                                        col.id,
                                                        status.key,
                                                    ).map((initiative) => (
                                                        <InitiativeCard
                                                            key={
                                                                initiative.id
                                                            }
                                                            initiative={
                                                                initiative
                                                            }
                                                            teamColor={col.team?.color}
                                                            onOpen={(
                                                                init,
                                                            ) =>
                                                                setInitiativeModal(
                                                                    {
                                                                        open: true,
                                                                        initiative:
                                                                            init,
                                                                        defaultTeamId:
                                                                            null,
                                                                        defaultStatus:
                                                                            null,
                                                                    },
                                                                )
                                                            }
                                                            onHover={
                                                                setHoveredInitiativeId
                                                            }
                                                            isHighlighted={highlightedInitiativeIds.has(
                                                                initiative.id,
                                                            )}
                                                        />
                                                    ))}
                                                </BoardCell>
                                            ))}
                                        </>
                                    ))}
                                </div>

                                {/* Dependency lines SVG overlay */}
                                <DependencyLines
                                    initiatives={initiatives}
                                    hoveredId={hoveredInitiativeId}
                                    contentRef={contentRef}
                                />
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
        </AppLayout>
    );
}
