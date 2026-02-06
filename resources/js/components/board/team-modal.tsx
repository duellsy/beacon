import { router, useForm } from '@inertiajs/react';
import { Check, Trash2 } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { useEffect, useState } from 'react';
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
import TeamController from '@/actions/App/Http/Controllers/TeamController';
import type { Team, TeamColor } from '@/types/board';
import { TEAM_COLORS } from '@/types/board';

type TeamModalProps = {
    open: boolean;
    onClose: () => void;
    team: Team | null;
};

export function TeamModal({ open, onClose, team }: TeamModalProps) {
    const isEditing = team !== null;
    const [confirmDelete, setConfirmDelete] = useState(false);

    const form = useForm({
        name: '',
        delivery_lead: '',
        product_owner: '',
        color: 'blue' as TeamColor,
    });

    useEffect(() => {
        if (open) {
            form.setData({
                name: team?.name ?? '',
                delivery_lead: team?.delivery_lead ?? '',
                product_owner: team?.product_owner ?? '',
                color: team?.color ?? 'blue',
            });
            form.clearErrors();
            setConfirmDelete(false);
        }
    }, [open, team]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (isEditing) {
            form.put(TeamController.update.url(team.id), {
                onSuccess: () => onClose(),
            });
        } else {
            form.post(TeamController.store.url(), {
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
            <DialogContent className="sm:max-w-md">
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
                        <Label htmlFor="team-dl">Delivery Lead</Label>
                        <Input
                            id="team-dl"
                            value={form.data.delivery_lead}
                            onChange={(e) =>
                                form.setData(
                                    'delivery_lead',
                                    e.target.value,
                                )
                            }
                            aria-invalid={!!form.errors.delivery_lead}
                        />
                        {form.errors.delivery_lead && (
                            <p className="text-destructive text-sm">
                                {form.errors.delivery_lead}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="team-po">Product Owner</Label>
                        <Input
                            id="team-po"
                            value={form.data.product_owner}
                            onChange={(e) =>
                                form.setData(
                                    'product_owner',
                                    e.target.value,
                                )
                            }
                            aria-invalid={!!form.errors.product_owner}
                        />
                        {form.errors.product_owner && (
                            <p className="text-destructive text-sm">
                                {form.errors.product_owner}
                            </p>
                        )}
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
