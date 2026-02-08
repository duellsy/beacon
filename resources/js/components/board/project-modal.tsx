import { router, useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { useEffect, useState } from 'react';
import ProjectController from '@/actions/App/Http/Controllers/ProjectController';
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
import type { Project } from '@/types/board';

type ProjectModalProps = {
    open: boolean;
    onClose: () => void;
    project: Project | null;
};

export function ProjectModal({ open, onClose, project }: ProjectModalProps) {
    const isEditing = project !== null;
    const [confirmDelete, setConfirmDelete] = useState(false);

    const form = useForm({
        name: '',
    });

    useEffect(() => {
        if (open) {
            form.setData({
                name: project?.name ?? '',
            });
            form.clearErrors();
            setConfirmDelete(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, project]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (isEditing) {
            form.put(ProjectController.update.url(project.id), {
                onSuccess: () => onClose(),
            });
        } else {
            form.post(ProjectController.store.url(), {
                onSuccess: () => onClose(),
            });
        }
    };

    const handleDelete = () => {
        if (!project) return;
        router.delete(ProjectController.destroy.url(project.id), {
            onSuccess: () => onClose(),
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Project' : 'Add Project'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input
                            id="project-name"
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
                            {form.processing ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
