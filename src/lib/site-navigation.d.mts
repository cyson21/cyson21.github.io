export const pageLinks: ReadonlyArray<{label: string; href: string}>;
export const workCases: ReadonlyArray<{id: string; label: string}>;
export function renderHeader(path: string): string;
export function renderFooter(): string;
export function applySiteChrome(html: string, path: string): string;
