import { useCallback, useEffect, useRef, useState } from 'react';
import type { Initiative } from '@/types/board';

type Rect = { left: number; top: number; width: number; height: number };

type Line = {
    fromId: string;
    toId: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
};

type DependencyLinesProps = {
    initiatives: Initiative[];
    hoveredId: string | null;
    contentRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Find the closest edge point on a rect to a target point.
 * Returns the point on the rect's border nearest to (tx, ty).
 */
function closestEdgePoint(
    rect: Rect,
    tx: number,
    ty: number,
): { x: number; y: number } {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = tx - cx;
    const dy = ty - cy;

    if (dx === 0 && dy === 0) {
        return { x: cx, y: rect.top };
    }

    const hw = rect.width / 2;
    const hh = rect.height / 2;

    // Scale factor to reach the edge of the rect from center
    const sx = dx !== 0 ? hw / Math.abs(dx) : Infinity;
    const sy = dy !== 0 ? hh / Math.abs(dy) : Infinity;
    const s = Math.min(sx, sy);

    return {
        x: cx + dx * s,
        y: cy + dy * s,
    };
}

export function DependencyLines({
    initiatives,
    hoveredId,
    contentRef,
}: DependencyLinesProps) {
    const [lines, setLines] = useState<Line[]>([]);
    const [svgSize, setSvgSize] = useState<{ width: string; height: string }>({ width: '100%', height: '100%' });
    const svgRef = useRef<SVGSVGElement>(null);

    const calculateLines = useCallback(() => {
        if (!contentRef.current) return;

        const content = contentRef.current;
        const contentRect = content.getBoundingClientRect();
        const newLines: Line[] = [];

        for (const initiative of initiatives) {
            for (const dep of initiative.dependencies) {
                const fromEl = content.querySelector(
                    `[data-initiative-id="${dep.id}"]`,
                );
                const toEl = content.querySelector(
                    `[data-initiative-id="${initiative.id}"]`,
                );

                if (!fromEl || !toEl) continue;

                const fromBounds = fromEl.getBoundingClientRect();
                const toBounds = toEl.getBoundingClientRect();

                // Convert to content-relative coordinates
                const fromRect: Rect = {
                    left: fromBounds.left - contentRect.left,
                    top: fromBounds.top - contentRect.top,
                    width: fromBounds.width,
                    height: fromBounds.height,
                };
                const toRect: Rect = {
                    left: toBounds.left - contentRect.left,
                    top: toBounds.top - contentRect.top,
                    width: toBounds.width,
                    height: toBounds.height,
                };

                // Find closest edge points between the two cards
                const fromCenter = {
                    x: toRect.left + toRect.width / 2,
                    y: toRect.top + toRect.height / 2,
                };
                const toCenter = {
                    x: fromRect.left + fromRect.width / 2,
                    y: fromRect.top + fromRect.height / 2,
                };

                const from = closestEdgePoint(fromRect, fromCenter.x, fromCenter.y);
                const to = closestEdgePoint(toRect, toCenter.x, toCenter.y);

                newLines.push({
                    fromId: dep.id,
                    toId: initiative.id,
                    x1: from.x,
                    y1: from.y,
                    x2: to.x,
                    y2: to.y,
                });
            }
        }

        setLines(newLines);
    }, [initiatives, contentRef]);

    useEffect(() => {
        const el = contentRef.current;

        const updateSize = () => {
            if (el) {
                setSvgSize({
                    width: `${el.scrollWidth}px`,
                    height: `${el.scrollHeight}px`,
                });
            }
        };

        const recalc = () => {
            calculateLines();
            updateSize();
        };

        // Initial calculation via rAF to avoid synchronous setState in effect
        const raf = requestAnimationFrame(recalc);

        const observer = new ResizeObserver(recalc);
        if (el) {
            observer.observe(el);
        }

        const scrollParent = el?.parentElement;
        scrollParent?.addEventListener('scroll', recalc);
        window.addEventListener('resize', recalc);

        const interval = setInterval(recalc, 200);

        return () => {
            cancelAnimationFrame(raf);
            observer.disconnect();
            scrollParent?.removeEventListener('scroll', recalc);
            window.removeEventListener('resize', recalc);
            clearInterval(interval);
        };
    }, [calculateLines, contentRef]);

    const isRelated = (line: Line) =>
        hoveredId !== null &&
        (line.fromId === hoveredId || line.toId === hoveredId);

    return (
        <svg
            ref={svgRef}
            className="pointer-events-none absolute inset-0 z-20"
            style={{
                width: svgSize.width,
                height: svgSize.height,
            }}
        >
            <defs>
                <marker
                    id="arrow-gray"
                    markerWidth="8"
                    markerHeight="6"
                    refX="8"
                    refY="3"
                    orient="auto"
                >
                    <path d="M0,0 L8,3 L0,6" fill="#9ca3af" />
                </marker>
                <marker
                    id="arrow-gray-bright"
                    markerWidth="8"
                    markerHeight="6"
                    refX="8"
                    refY="3"
                    orient="auto"
                >
                    <path d="M0,0 L8,3 L0,6" fill="#6b7280" />
                </marker>
            </defs>
            {lines.map((line, i) => {
                const related = isRelated(line);
                const color = related ? '#6b7280' : '#9ca3af';
                const opacity =
                    hoveredId === null ? 0.5 : related ? 1 : 0.15;
                const markerId = related
                    ? 'arrow-gray-bright'
                    : 'arrow-gray';

                return (
                    <line
                        key={i}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke={color}
                        strokeWidth={related ? 2 : 1.5}
                        strokeOpacity={opacity}
                        strokeDasharray="6 3"
                        markerEnd={`url(#${markerId})`}
                        className="transition-all duration-150"
                    />
                );
            })}
        </svg>
    );
}
