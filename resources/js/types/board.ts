export type TeamColor =
    | 'slate' | 'red' | 'orange' | 'amber' | 'lime' | 'green'
    | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo'
    | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose';

export const TEAM_COLORS: { key: TeamColor; label: string; swatch: string }[] = [
    { key: 'slate', label: 'Slate', swatch: '#94a3b8' },
    { key: 'red', label: 'Red', swatch: '#f87171' },
    { key: 'orange', label: 'Orange', swatch: '#fb923c' },
    { key: 'amber', label: 'Amber', swatch: '#fbbf24' },
    { key: 'lime', label: 'Lime', swatch: '#a3e635' },
    { key: 'green', label: 'Green', swatch: '#4ade80' },
    { key: 'emerald', label: 'Emerald', swatch: '#34d399' },
    { key: 'teal', label: 'Teal', swatch: '#2dd4bf' },
    { key: 'cyan', label: 'Cyan', swatch: '#22d3ee' },
    { key: 'sky', label: 'Sky', swatch: '#38bdf8' },
    { key: 'blue', label: 'Blue', swatch: '#60a5fa' },
    { key: 'indigo', label: 'Indigo', swatch: '#818cf8' },
    { key: 'violet', label: 'Violet', swatch: '#a78bfa' },
    { key: 'purple', label: 'Purple', swatch: '#c084fc' },
    { key: 'fuchsia', label: 'Fuchsia', swatch: '#e879f9' },
    { key: 'pink', label: 'Pink', swatch: '#f472b6' },
    { key: 'rose', label: 'Rose', swatch: '#fb7185' },
];

export const COLOR_STYLES: Record<TeamColor, { border: string; bg: string; darkBg: string }> = {
    slate: { border: '#94a3b8', bg: '#f8fafc', darkBg: '#94a3b818' },
    red: { border: '#f87171', bg: '#fef2f2', darkBg: '#f8717118' },
    orange: { border: '#fb923c', bg: '#fff7ed', darkBg: '#fb923c18' },
    amber: { border: '#fbbf24', bg: '#fffbeb', darkBg: '#fbbf2418' },
    lime: { border: '#a3e635', bg: '#f7fee7', darkBg: '#a3e63518' },
    green: { border: '#4ade80', bg: '#f0fdf4', darkBg: '#4ade8018' },
    emerald: { border: '#34d399', bg: '#ecfdf5', darkBg: '#34d39918' },
    teal: { border: '#2dd4bf', bg: '#f0fdfa', darkBg: '#2dd4bf18' },
    cyan: { border: '#22d3ee', bg: '#ecfeff', darkBg: '#22d3ee18' },
    sky: { border: '#38bdf8', bg: '#f0f9ff', darkBg: '#38bdf818' },
    blue: { border: '#60a5fa', bg: '#eff6ff', darkBg: '#60a5fa18' },
    indigo: { border: '#818cf8', bg: '#eef2ff', darkBg: '#818cf818' },
    violet: { border: '#a78bfa', bg: '#f5f3ff', darkBg: '#a78bfa18' },
    purple: { border: '#c084fc', bg: '#faf5ff', darkBg: '#c084fc18' },
    fuchsia: { border: '#e879f9', bg: '#fdf4ff', darkBg: '#e879f918' },
    pink: { border: '#f472b6', bg: '#fdf2f8', darkBg: '#f472b618' },
    rose: { border: '#fb7185', bg: '#fff1f3', darkBg: '#fb718518' },
};

export type Team = {
    id: string;
    name: string;
    delivery_lead: string;
    product_owner: string;
    color: TeamColor;
    sort_order: number;
    created_at: string;
    updated_at: string;
};

export type InitiativeDependency = {
    id: string;
    title: string;
    team_id: string | null;
    status: InitiativeStatus;
};

export type Project = {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
};

export type InitiativeLog = {
    id: string;
    body: string;
    type: 'user' | 'system';
    user_id: number | null;
    created_at: string;
};

export type Initiative = {
    id: string;
    title: string;
    description: string | null;
    jira_url: string | null;
    team_id: string | null;
    project_id: string | null;
    status: InitiativeStatus;
    engineer_owner: string | null;
    expected_date: string | null;
    dependencies: InitiativeDependency[];
    logs: InitiativeLog[];
    team: { id: string; name: string } | null;
    project: { id: string; name: string } | null;
    is_blocked: boolean;
    created_at: string;
    updated_at: string;
};

export type InitiativeStatus = 'upcoming' | 'in_progress' | 'done';

export const STATUSES: { key: InitiativeStatus; label: string }[] = [
    { key: 'in_progress', label: 'In Progress' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'done', label: 'Done' },
];
