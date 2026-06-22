/**
 * Détermine si un lien de navigation sidebar doit être marqué actif.
 * @param {string} pathname - location.pathname
 * @param {{ path: string, exact?: boolean, alsoMatch?: string[], isActive?: (p: string) => boolean }} item
 */
export function isNavItemActive(pathname, item) {
  if (typeof item.isActive === 'function') {
    return item.isActive(pathname);
  }

  const { path, exact } = item;

  if (exact) {
    if (pathname === path) return true;
  } else if (pathname === path || pathname.startsWith(`${path}/`)) {
    return true;
  }

  if (Array.isArray(item.alsoMatch)) {
    return item.alsoMatch.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  }

  return false;
}
