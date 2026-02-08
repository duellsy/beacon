import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import TodoRuleController from '@/actions/App/Http/Controllers/TodoRuleController';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { TodoRule, TodoRuleTriggerType } from '@/types/board';

type Props = {
    rules: TodoRule[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Suggestion Rules', href: '/todo-rules' },
];

const TRIGGER_TYPES: { key: TodoRuleTriggerType; label: string; description: string; hasTransition: boolean }[] = [
    { key: 'rag_status_changed', label: 'RAG Status Changed', description: 'When RAG status changes between values', hasTransition: true },
    { key: 'status_changed', label: 'Status Changed', description: 'When initiative status changes between values', hasTransition: true },
    { key: 'deadline_changed', label: 'Deadline Changed', description: 'When due date is modified', hasTransition: false },
    { key: 'deadline_overdue', label: 'Deadline Overdue', description: 'When an initiative is past due and not done', hasTransition: false },
    { key: 'deadline_missing', label: 'Deadline Missing', description: 'When moved to In Progress with no due date', hasTransition: false },
    { key: 'no_rag_set', label: 'No RAG Set', description: 'When moved to In Progress with no RAG status', hasTransition: false },
    { key: 'status_changed_notify_dependents', label: 'Status Changed (Has Dependents)', description: 'When status changes and other initiatives depend on this one', hasTransition: false },
    { key: 'moved_to_done', label: 'Moved to Done', description: 'When an initiative is marked as done', hasTransition: false },
];

const RAG_OPTIONS = [
    { key: '', label: 'Any' },
    { key: 'green', label: 'Green' },
    { key: 'amber', label: 'Amber' },
    { key: 'red', label: 'Red' },
];

const STATUS_OPTIONS = [
    { key: '', label: 'Any' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'done', label: 'Done' },
];

function triggerDescription(rule: TodoRule): string {
    const triggerType = TRIGGER_TYPES.find((t) => t.key === rule.trigger_type);
    if (!triggerType?.hasTransition) {
        return triggerType?.label ?? rule.trigger_type;
    }

    const typeLabel = rule.trigger_type === 'rag_status_changed' ? 'RAG' : 'Status';
    const from = rule.trigger_from ? capitalize(rule.trigger_from.replace('_', ' ')) : 'Any';
    const to = rule.trigger_to ? capitalize(rule.trigger_to.replace('_', ' ')) : 'Any';
    return `${typeLabel}: ${from} → ${to}`;
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function hasTransition(triggerType: TodoRuleTriggerType): boolean {
    return triggerType === 'rag_status_changed' || triggerType === 'status_changed';
}

type FormData = {
    trigger_type: TodoRuleTriggerType;
    trigger_from: string;
    trigger_to: string;
    suggested_body: string;
    suggested_deadline_days: number;
    is_active: boolean;
};

const defaultForm: FormData = {
    trigger_type: 'rag_status_changed',
    trigger_from: '',
    trigger_to: 'red',
    suggested_body: '',
    suggested_deadline_days: 3,
    is_active: true,
};

export default function TodoRules({ rules }: Props) {
    const [modal, setModal] = useState<{ open: boolean; rule: TodoRule | null }>({ open: false, rule: null });
    const [form, setForm] = useState<FormData>(defaultForm);
    const [submitting, setSubmitting] = useState(false);

    const openCreate = () => {
        setForm(defaultForm);
        setModal({ open: true, rule: null });
    };

    const openEdit = (rule: TodoRule) => {
        setForm({
            trigger_type: rule.trigger_type,
            trigger_from: rule.trigger_from ?? '',
            trigger_to: rule.trigger_to ?? '',
            suggested_body: rule.suggested_body,
            suggested_deadline_days: rule.suggested_deadline_days,
            is_active: rule.is_active,
        });
        setModal({ open: true, rule });
    };

    const handleTriggerTypeChange = (v: string) => {
        const triggerType = v as TodoRuleTriggerType;
        if (hasTransition(triggerType)) {
            setForm({
                ...form,
                trigger_type: triggerType,
                trigger_from: '',
                trigger_to: triggerType === 'rag_status_changed' ? 'red' : 'done',
            });
        } else {
            setForm({
                ...form,
                trigger_type: triggerType,
                trigger_from: '',
                trigger_to: '',
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const data = {
            ...form,
            trigger_from: form.trigger_from || null,
            trigger_to: form.trigger_to || null,
        };

        if (modal.rule) {
            router.put(TodoRuleController.update.url(modal.rule.id), data, {
                onSuccess: () => { setModal({ open: false, rule: null }); setSubmitting(false); },
                onError: () => setSubmitting(false),
            });
        } else {
            router.post(TodoRuleController.store.url(), data, {
                onSuccess: () => { setModal({ open: false, rule: null }); setSubmitting(false); },
                onError: () => setSubmitting(false),
            });
        }
    };

    const handleDelete = (rule: TodoRule) => {
        router.delete(TodoRuleController.destroy.url(rule.id), { preserveScroll: true });
    };

    const handleToggleActive = (rule: TodoRule) => {
        router.put(TodoRuleController.update.url(rule.id), {
            trigger_type: rule.trigger_type,
            trigger_from: rule.trigger_from,
            trigger_to: rule.trigger_to,
            suggested_body: rule.suggested_body,
            suggested_deadline_days: rule.suggested_deadline_days,
            is_active: !rule.is_active,
        }, { preserveScroll: true });
    };

    const showTransition = hasTransition(form.trigger_type);
    const fromOptions = form.trigger_type === 'rag_status_changed' ? RAG_OPTIONS : STATUS_OPTIONS;
    const toOptions = (form.trigger_type === 'rag_status_changed' ? RAG_OPTIONS : STATUS_OPTIONS).filter((o) => o.key !== '');
    const currentTrigger = TRIGGER_TYPES.find((t) => t.key === form.trigger_type);
    const canSubmit = form.suggested_body.trim() && (showTransition ? !!form.trigger_to : true);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Suggestion Rules" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Suggestion Rules
                    </h1>
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="size-3.5" />
                        Add Rule
                    </Button>
                </div>

                <p className="text-muted-foreground text-sm">
                    Define rules to automatically suggest todos when initiatives change.
                    Use <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">{'{title}'}</code> in the body template to insert the initiative name.
                </p>

                {rules.length === 0 ? (
                    <div className="rounded-xl border border-neutral-200 p-8 text-center dark:border-neutral-800">
                        <p className="text-muted-foreground text-sm">No rules yet. Create one to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-neutral-50 dark:bg-neutral-900">
                                    <th className="px-4 py-2.5 text-left font-medium text-neutral-600 dark:text-neutral-400">Trigger</th>
                                    <th className="px-4 py-2.5 text-left font-medium text-neutral-600 dark:text-neutral-400">Suggested Body</th>
                                    <th className="px-4 py-2.5 text-left font-medium text-neutral-600 dark:text-neutral-400">Deadline</th>
                                    <th className="px-4 py-2.5 text-left font-medium text-neutral-600 dark:text-neutral-400">Active</th>
                                    <th className="px-4 py-2.5 text-right font-medium text-neutral-600 dark:text-neutral-400"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {rules.map((rule) => (
                                    <tr key={rule.id} className="group">
                                        <td className="px-4 py-2.5 text-neutral-900 dark:text-neutral-100">
                                            {triggerDescription(rule)}
                                        </td>
                                        <td className="max-w-xs truncate px-4 py-2.5 text-neutral-700 dark:text-neutral-300">
                                            {rule.suggested_body}
                                        </td>
                                        <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400">
                                            {rule.suggested_deadline_days}d
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <Checkbox
                                                checked={rule.is_active}
                                                onCheckedChange={() => handleToggleActive(rule)}
                                            />
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                                                <button
                                                    type="button"
                                                    className="text-muted-foreground hover:text-foreground p-1"
                                                    onClick={() => openEdit(rule)}
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="text-muted-foreground hover:text-destructive p-1"
                                                    onClick={() => handleDelete(rule)}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Dialog open={modal.open} onOpenChange={(v) => !v && setModal({ open: false, rule: null })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{modal.rule ? 'Edit Rule' : 'New Rule'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Trigger Type</Label>
                            <Select
                                value={form.trigger_type}
                                onValueChange={handleTriggerTypeChange}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {TRIGGER_TYPES.map((t) => (
                                        <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {currentTrigger && (
                                <p className="text-muted-foreground text-xs">{currentTrigger.description}</p>
                            )}
                        </div>

                        {showTransition && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>From</Label>
                                    <Select
                                        value={form.trigger_from || '__any'}
                                        onValueChange={(v) => setForm({ ...form, trigger_from: v === '__any' ? '' : v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {fromOptions.map((o) => (
                                                <SelectItem key={o.key || '__any'} value={o.key || '__any'}>{o.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>To</Label>
                                    <Select
                                        value={form.trigger_to}
                                        onValueChange={(v) => setForm({ ...form, trigger_to: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {toOptions.map((o) => (
                                                <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Suggested Body</Label>
                            <textarea
                                className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm"
                                rows={2}
                                value={form.suggested_body}
                                onChange={(e) => setForm({ ...form, suggested_body: e.target.value })}
                                placeholder='e.g. Address red RAG status on {title}'
                            />
                            <p className="text-muted-foreground text-xs">
                                Use <code>{'{title}'}</code> to insert the initiative name.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Deadline (days from trigger)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={form.suggested_deadline_days}
                                onChange={(e) => setForm({ ...form, suggested_deadline_days: parseInt(e.target.value) || 0 })}
                                className="w-24"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="is-active"
                                checked={form.is_active}
                                onCheckedChange={(v) => setForm({ ...form, is_active: !!v })}
                            />
                            <Label htmlFor="is-active">Active</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setModal({ open: false, rule: null })}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting || !canSubmit}>
                                {submitting ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
