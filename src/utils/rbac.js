/**
 * Matrice RBAC côté frontend (miroir du backend)
 */

export const STAFF_ROLES = ['ADMIN', 'COMPTABLE', 'DIRECTEUR'];

export const DIRECTEUR_CYCLES = ['Primaire', 'Collège', 'Lycée'];

export const ROLE_LABELS = {
  ADMIN: 'Administrateur',
  COMPTABLE: 'Comptable',
  DIRECTEUR: 'Directeur',
  PROFESSEUR: 'Professeur',
  ELEVE: 'Élève',
  PARENT: 'Parent',
};

export const ROLE_HOME = {
  ADMIN: '/admin',
  COMPTABLE: '/admin/students',
  DIRECTEUR: '/admin/students',
  PROFESSEUR: '/teacher',
  ELEVE: '/student',
  PARENT: '/parent',
};

export function getHomePathForRole(role) {
  return ROLE_HOME[role] || '/login';
}

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

export function canManageStudents(role) {
  return role === 'ADMIN' || role === 'COMPTABLE';
}

export function canDeleteStudents(role) {
  return role === 'ADMIN';
}

export function canManagePayments(role) {
  return role === 'ADMIN' || role === 'COMPTABLE';
}

export function canManageFinances(role) {
  return role === 'ADMIN' || role === 'COMPTABLE';
}

export function canAccessGrades(role) {
  return role === 'ADMIN' || role === 'DIRECTEUR';
}

export function canManageUsers(role) {
  return role === 'ADMIN';
}

export function canManageTeachers(role) {
  return role === 'ADMIN' || role === 'DIRECTEUR';
}

export function canManageSubjects(role) {
  return role === 'ADMIN' || role === 'DIRECTEUR';
}

export function canDeleteTeachers(role) {
  return role === 'ADMIN';
}

export function canDeleteSubjects(role) {
  return role === 'ADMIN';
}

export function isDirecteurRole(role) {
  return role === 'DIRECTEUR';
}

export function canManageSchoolStructure(role) {
  return role === 'ADMIN';
}

/** Navigation admin filtrée par rôle */
export function getStaffNavItems(role) {
  const all = [
    { path: '/admin', iconKey: 'dashboard', label: "Vue d'ensemble", exact: true, roles: ['ADMIN', 'COMPTABLE', 'DIRECTEUR'] },
    { path: '/admin/students', iconKey: 'students', label: 'Élèves', roles: ['ADMIN', 'COMPTABLE', 'DIRECTEUR'] },
    { path: '/admin/teachers', iconKey: 'teachers', label: 'Professeurs', roles: ['ADMIN', 'DIRECTEUR'] },
    { path: '/admin/classes', iconKey: 'classes', label: 'Classes', roles: ['ADMIN'] },
    { path: '/admin/niveaux', iconKey: 'niveaux', label: "Niveaux d'étude", roles: ['ADMIN'] },
    { path: '/admin/subjects', iconKey: 'subjects', label: 'Matières', roles: ['ADMIN', 'DIRECTEUR'] },
    { path: '/admin/years', iconKey: 'years', label: 'Années Scolaires', roles: ['ADMIN'] },
    { path: '/admin/payments', iconKey: 'payments', label: 'Paiements', roles: ['ADMIN', 'COMPTABLE'] },
    { path: '/admin/reports/finance', iconKey: 'finance', label: 'Rapports financiers', roles: ['ADMIN', 'COMPTABLE'] },
    { path: '/admin/teacher-pay', iconKey: 'teacherPay', label: 'Paie professeurs', roles: ['ADMIN'] },
    { path: '/admin/notifications', iconKey: 'notifications', label: 'Notifications', roles: ['ADMIN'] },
    { path: '/admin/annonces', iconKey: 'annonces', label: 'Annonces', roles: ['ADMIN'] },
    { path: '/admin/grades/consultation', iconKey: 'grades', label: 'Consultation notes', roles: ['ADMIN', 'DIRECTEUR'], isActive: (p) => p === '/admin/grades' || p.startsWith('/admin/grades/consultation') },
    { path: '/admin/grades/results', iconKey: 'results', label: 'Bulletins & Résultats', roles: ['ADMIN', 'DIRECTEUR'], isActive: (p) => p.startsWith('/admin/grades/results') },
    { path: '/admin/users', iconKey: 'users', label: 'Utilisateurs', roles: ['ADMIN'] },
    { path: '/admin/settings', iconKey: 'settings', label: 'Paramètres site', roles: ['ADMIN'] },
  ];

  return all.filter((item) => item.roles.includes(role));
}

export function getStaffRoleLabel(role, perimetre) {
  if (role === 'DIRECTEUR' && perimetre) {
    return `Directeur — ${perimetre}`;
  }
  if (role === 'COMPTABLE') {
    return 'Comptable — Tous niveaux';
  }
  return ROLE_LABELS[role] || role;
}

/** Vérifie qu'un membre du personnel peut accéder à une route /admin/* */
export function canAccessStaffRoute(role, pathname) {
  if (!role || !pathname.startsWith('/admin')) return false;
  if (pathname === '/admin/profile') return true;
  const navPaths = getStaffNavItems(role).map((item) => item.path);
  if (pathname === '/admin') return navPaths.includes('/admin');
  return navPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
