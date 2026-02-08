import { router } from '@inertiajs/react';
import { Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import TodoController from '@/actions/App/Http/Controllers/TodoController';
import type { FlashTodoSuggestion } from '@/types/board';

type Props = {
    suggestions: FlashTodoSuggestion[];
    onClose: () => void;
};

export function TodoSuggestionModal({ suggestions, onClose }: Props) {
    const [items, setItems] = useState(() =>
        suggestions.map((s) => ({ ...s, editBody: s.body, editDeadline: s.deadline })),
    );

    const handleAccept = (index: number) => {
        const item = items[index];
        router.post(
            TodoController.store.url(item.initiative_id),
            { body: item.editBody, deadline: item.editDeadline, source: item.source },
            { preserveScroll: true },
        );
        const next = items.filter((_, i) => i !== index);
        if (next.length === 0) {
            onClose();
        } else {
            setItems(next);
        }
    };

    const handleDismiss = (index: number) => {
        const next = items.filter((_, i) => i !== index);
        if (next.length === 0) {
            onClose();
        } else {
            setItems(next);
        }
    };

    const updateItem = (index: number, field: 'editBody' | 'editDeadline', value: string) => {
        setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    return (
        <Dialog open={items.length > 0} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lightbulb className="size-4 text-amber-500" />
                        Todo Suggestions
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div key={`${item.rule_id}-${item.initiative_id}`} className="space-y-2 rounded-lg border p-3">
                            <p className="text-muted-foreground text-xs">
                                {item.initiative_title}
                            </p>
                            <Input
                                value={item.editBody}
                                onChange={(e) => updateItem(index, 'editBody', e.target.value)}
                            />
                            <Input
                                type="date"
                                value={item.editDeadline}
                                onChange={(e) => updateItem(index, 'editDeadline', e.target.value)}
                                className="w-44"
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleAccept(index)}
                                    disabled={!item.editBody.trim() || !item.editDeadline}
                                >
                                    Accept
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDismiss(index)}>
                                    Dismiss
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
