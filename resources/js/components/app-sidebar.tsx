import { Link, router, usePage } from '@inertiajs/react';
import { Kanban, LayoutGrid, Lightbulb, Plus } from 'lucide-react';
import { useState } from 'react';
import BoardCrudController from '@/actions/App/Http/Controllers/BoardCrudController';
import TodoRuleController from '@/actions/App/Http/Controllers/TodoRuleController';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
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
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';
import board from '@/routes/board';
import type { NavItem } from '@/types';
import type { BoardSummary } from '@/types/board';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Suggestion Rules',
        href: TodoRuleController.index.url(),
        icon: Lightbulb,
    },
];

export function AppSidebar() {
    const { boards } = usePage<{ props: { boards: BoardSummary[] } }>().props as unknown as { boards: BoardSummary[] };
    const { isCurrentUrl } = useCurrentUrl();
    const [newBoardModal, setNewBoardModal] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleCreateBoard = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(BoardCrudController.store.url(), { name: newBoardName }, {
            onSuccess: () => {
                setNewBoardModal(false);
                setNewBoardName('');
                setSubmitting(false);
            },
            onError: () => setSubmitting(false),
        });
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Boards</SidebarGroupLabel>
                    <SidebarMenu>
                        {boards?.map((b) => (
                            <SidebarMenuItem key={b.id}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(board.show.url(b.id))}
                                    tooltip={{ children: b.name }}
                                >
                                    <Link href={board.show.url(b.id)} prefetch>
                                        <Kanban />
                                        <span>{b.name}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => setNewBoardModal(true)}
                                tooltip={{ children: 'New Board' }}
                            >
                                <Plus />
                                <span>New Board</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>

            <Dialog open={newBoardModal} onOpenChange={(v) => !v && setNewBoardModal(false)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>New Board</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateBoard} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="board-name">Board Name</Label>
                            <Input
                                id="board-name"
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setNewBoardModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting || !newBoardName.trim()}>
                                {submitting ? 'Creating...' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Sidebar>
    );
}
