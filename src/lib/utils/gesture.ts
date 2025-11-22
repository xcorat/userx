export function getInteractiveAncestor(el: Element | null): Element | null {
	if (!el) return null;
	return el.closest('button, a, input, textarea, select, [role="button"], [data-interactive="true"], [data-no-drag]') as HTMLElement | null;
}
