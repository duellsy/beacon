import { router, useForm } from '@inertiajs/react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { useEffect, useState } from 'react';
import TeamController from '@/actions/App/Http/Controllers/TeamController';
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
import { Textarea } from '@/components/ui/textarea';
import type { Team, TeamColor } from '@/types/board';
import { TEAM_COLORS } from '@/types/board';

type MemberFormData = {
    id: string | null;
    name: string;
    role: string;
};

type TeamModalProps = {
    open: boolean;
    onClose: () => void;
    team: Team | null;
    boardId: string;
};

export function TeamModal({ open, onClose, team, boardId }: TeamModalProps) {
    const isEditing = team !== null;
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [members, setMembers] = useState<MemberFormData[]>([]);

    const form = useForm({
        name: '',
        description: '' as string,
        color: 'blue' as TeamColor,
        board_id: boardId,
        members: [] as MemberFormData[],
    });

    useEffect(() => {
        if (open) {
            const memberData = team?.members?.map((m) => ({
                id: m.id,
                name: m.name,
                role: m.role ?? '',
            })) ?? [];

            setMembers(memberData);
            form.setData({
                name: team?.name ?? '',
                description: team?.description ?? '',
                color: team?.color ?? 'blue',
                board_id: boardId,
                members: memberData,
            });
            form.clearErrors();
            setConfirmDelete(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, team]);

    const addMember = () => {
        const updated = [...members, { id: null, name: '', role: '' }];
        setMembers(updated);
        form.setData('members', updated);
    };

    const updateMember = (index: number, field: 'name' | 'role', value: string) => {
        const updated = members.map((m, i) =>
            i === index ? { ...m, [field]: value } : m,
        );
        setMembers(updated);
        form.setData('members', updated);
    };

    const removeMember = (index: number) => {
        const updated = members.filter((_, i) => i !== index);
        setMembers(updated);
        form.setData('members', updated);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        const data = {
            ...form.data,
            description: form.data.description || null,
            members: members.filter((m) => m.name.trim() !== ''),
        };

        if (isEditing) {
            router.put(TeamController.update.url(team.id), data, {
                onSuccess: () => onClose(),
            });
        } else {
            router.post(TeamController.store.url(), data, {
                onSuccess: () => onClose(),
            });
        }
    };

    const handleDelete = () => {
        if (!team) return;
        router.delete(TeamController.destroy.url(team.id), {
            onSuccess: () => onClose(),
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Team' : 'Add Team'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="team-name">Team Name</Label>
                        <Input
                            id="team-name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            aria-invalid={!!form.errors.name}
                        />
                        {form.errors.name && (
                            <p className="text-destructive text-sm">
                                {form.errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="team-desc">Description</Label>
                        <Textarea
                            id="team-desc"
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            rows={3}
                            placeholder="Team purpose and responsibilities..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {TEAM_COLORS.map((c) => (
                                <button
                                    key={c.key}
                                    type="button"
                                    title={c.label}
                                    className="flex size-7 cursor-pointer items-center justify-center rounded-full border-2 transition-transform hover:scale-110"
                                    style={{
                                        backgroundColor: c.swatch,
                                        borderColor: form.data.color === c.key ? '#1e293b' : 'transparent',
                                    }}
                                    onClick={() => form.setData('color', c.key)}
                                >
                                    {form.data.color === c.key && (
                                        <Check className="size-3.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                        {form.errors.color && (
                            <p className="text-destructive text-sm">
                                {form.errors.color}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Members</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addMember}
                            >
                                <Plus className="size-3.5" />
                                Add
                            </Button>
                        </div>
                        {members.length === 0 && (
                            <p className="text-muted-foreground text-sm">No members yet</p>
                        )}
                        <div className="space-y-2">
                            {members.map((member, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        value={member.name}
                                        onChange={(e) => updateMember(index, 'name', e.target.value)}
                                        placeholder="Name"
                                        className="flex-1"
                                    />
                                    <Input
                                        value={member.role}
                                        onChange={(e) => updateMember(index, 'role', e.target.value)}
                                        placeholder="Role"
                                        className="w-32"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 shrink-0"
                                        onClick={() => removeMember(index)}
                                    >
                                        <X className="size-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        {isEditing && !confirmDelete && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="mr-auto"
                                onClick={() => setConfirmDelete(true)}
                            >
                                <Trash2 className="size-3.5" />
                                Delete
                            </Button>
                        )}

                        {isEditing && confirmDelete && (
                            <div className="mr-auto flex items-center gap-2">
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
                            {form.processing
                                ? 'Saving...'
                                : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
