import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import DependencyController from '@/actions/App/Http/Controllers/DependencyController';

type DependencyDragLayerProps = {
    contentRef: React.RefObject<HTMLDivElement | null>;
};

type DragState = {
    fromId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
};

export function DependencyDragLayer({ contentRef }: DependencyDragLayerProps) {
    const [drag, setDrag] = useState<DragState | null>(null);
    const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
    const dragRef = useRef(drag);
    dragRef.current = drag;

    const getContentOffset = useCallback(() => {
        if (!contentRef.current) return { x: 0, y: 0 };
        const rect = contentRef.current.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
    }, [contentRef]);

    // Find the initiative card element under a point
    const findInitiativeAt = useCallback((clientX: number, clientY: number, excludeId: string): string | null => {
        const elements = document.elementsFromPoint(clientX, clientY);
        for (const el of elements) {
            const card = (el as HTMLElement).closest?.('[data-initiative-id]') as HTMLElement | null;
            if (card) {
                const id = card.getAttribute('data-initiative-id');
                if (id && id !== excludeId) return id;
            }
        }
        return null;
    }, []);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        const handle = (e.target as HTMLElement).closest('[data-dep-handle]') as HTMLElement | null;
        if (!handle) return;

        const card = handle.closest('[data-initiative-id]') as HTMLElement | null;
        if (!card) return;

        const fromId = card.getAttribute('data-initiative-id');
        if (!fromId) return;

        e.preventDefault();
        e.stopPropagation();

        const offset = getContentOffset();
        setDrag({
            fromId,
            startX: e.clientX - offset.x + (contentRef.current?.scrollLeft ?? 0),
            startY: e.clientY - offset.y + (contentRef.current?.scrollTop ?? 0),
            currentX: e.clientX - offset.x + (contentRef.current?.scrollLeft ?? 0),
            currentY: e.clientY - offset.y + (contentRef.current?.scrollTop ?? 0),
        });
    }, [getContentOffset, contentRef]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragRef.current) return;

        const offset = getContentOffset();
        const x = e.clientX - offset.x + (contentRef.current?.scrollLeft ?? 0);
        const y = e.clientY - offset.y + (contentRef.current?.scrollTop ?? 0);

        setDrag(prev => prev ? { ...prev, currentX: x, currentY: y } : null);

        const targetId = findInitiativeAt(e.clientX, e.clientY, dragRef.current.fromId);
        setHoveredTargetId(targetId);
    }, [getContentOffset, contentRef, findInitiativeAt]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (!dragRef.current) return;

        const targetId = findInitiativeAt(e.clientX, e.clientY, dragRef.current.fromId);

        if (targetId) {
            // "from must happen before to" means "to depends on from"
            router.post(
                DependencyController.store.url(targetId),
                { dependency_id: dragRef.current.fromId },
                { preserveScroll: true },
            );
        }

        setDrag(null);
        setHoveredTargetId(null);
    }, [findInitiativeAt]);

    useEffect(() => {
        document.addEventListener('mousedown', handleMouseDown, true);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown, true);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseDown, handleMouseMove, handleMouseUp]);

    // Highlight target card
    useEffect(() => {
        if (!contentRef.current) return;

        // Remove previous highlight
        contentRef.current.querySelectorAll('[data-dep-target-highlight]').forEach(el => {
            el.removeAttribute('data-dep-target-highlight');
            (el as HTMLElement).style.removeProperty('box-shadow');
        });

        if (hoveredTargetId && drag) {
            const targetEl = contentRef.current.querySelector(`[data-initiative-id="${hoveredTargetId}"]`) as HTMLElement | null;
            if (targetEl) {
                targetEl.setAttribute('data-dep-target-highlight', 'true');
                targetEl.style.boxShadow = '0 0 0 2px #3b82f6, 0 0 8px rgba(59, 130, 246, 0.3)';
            }
        }

        return () => {
            contentRef.current?.querySelectorAll('[data-dep-target-highlight]').forEach(el => {
                el.removeAttribute('data-dep-target-highlight');
                (el as HTMLElement).style.removeProperty('box-shadow');
            });
        };
    }, [hoveredTargetId, drag, contentRef]);

    if (!drag) return null;

    return (
        <svg
            className="pointer-events-none absolute inset-0 z-30"
            style={{
                width: contentRef.current?.scrollWidth ?? '100%',
                height: contentRef.current?.scrollHeight ?? '100%',
            }}
        >
            <defs>
                <marker
                    id="arrow-drag"
                    markerWidth="10"
                    markerHeight="7"
                    refX="10"
                    refY="3.5"
                    orient="auto"
                >
                    <path d="M0,0 L10,3.5 L0,7" fill="#3b82f6" />
                </marker>
            </defs>
            <line
                x1={drag.startX}
                y1={drag.startY}
                x2={drag.currentX}
                y2={drag.currentY}
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="6 3"
                markerEnd="url(#arrow-drag)"
            />
        </svg>
    );
}
