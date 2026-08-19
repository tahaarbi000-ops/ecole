import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const PAGE_TITLES = {
  '/dashboard': 'Tableau de bord',
  '/students': 'Élèves',
  '/teachers': 'Maîtres',
  '/supervisors': 'Surveillants',
  '/employees': 'Employés',
  '/payments': 'Paiements',
  '/backup': 'Sauvegarde',
  '/settings': 'Paramètres',
};

function getPageTitle(pathname) {
  if (pathname.startsWith('/register/absences')) {
    const category = pathname.split('/')[3];
    const map = {
      eleves: 'Registre — Absences Élèves',
      maitres: 'Registre — Absences Maîtres',
      surveillants: 'Registre — Absences Surveillants',
      employes: 'Registre — Absences Employés',
    };
    return map[category] || 'Registre — Absences';
  }
  if (pathname === '/register/late') return 'Registre — Retards';
  if (pathname === '/register/observations') return 'Registre — Observations';
  if (pathname === '/register/teacher-movements') return 'Registre — Maîtres (Entrées/Sorties)';
  if (pathname.startsWith('/register')) return 'Registre';
  return PAGE_TITLES[pathname] || 'École Al Amal';
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <Box minH="100vh" bg="ink.50">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box
        ml={{ base: 0, lg: collapsed ? '84px' : '260px' }}
        transition="margin-left 0.2s ease"
        minH="100vh"
        display="flex"
        flexDirection="column"
      >
        <Header pageTitle={getPageTitle(location.pathname)} onOpenMobileMenu={() => setMobileOpen(true)} />
        <Box as="main" flex={1} px={{ base: 4, md: 6 }} py={{ base: 5, md: 7 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
