import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Tooltip,
  Divider,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  IconButton,
} from '@chakra-ui/react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ShieldCheck,
  Briefcase,
  BookOpenCheck,
  Wallet,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  CalendarRange,
  ClipboardList,
} from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

/**
 * Chaque item a un champ `scope` qui indique dans quel(s) type(s)
 * d'établissement il doit apparaître :
 *  - 'ecole'    -> uniquement pour une école
 *  - 'academie' -> uniquement pour une académie de formation
 *  - 'both'     -> visible dans les deux cas
 *
 * Le type d'établissement vient de l'utilisateur connecté
 * (user.establishmentType : 'ecole' | 'academie'), stocké par
 * exemple au niveau de l'organisation/tenant en base de données.
 */
const NAV_ITEMS = [
  { label: 'لوحة التحكم', to: '/dashboard', icon: LayoutDashboard, scope: 'both' },

  // --- Spécifique école ---
  { label: 'التلاميذ', to: '/students', icon: GraduationCap, scope: 'ecole' },
  { label: 'سجل الحضور', to: '/register', icon: BookOpenCheck, matchPrefix: '/register', scope: 'ecole' },

  // --- Spécifique académie ---
  { label: 'المتدربون', to: '/trainees', icon: GraduationCap, scope: 'academie' },
  { label: 'الدورات التدريبية', to: '/sessions', icon: CalendarRange, matchPrefix: '/sessions', scope: 'academie' },
  { label: 'التسجيلات', to: '/enrollments', icon: ClipboardList, matchPrefix: '/enrollments', scope: 'academie' },

  // --- Commun (socle partagé) ---
  { label: 'المعلمون', to: '/teachers', icon: Users, scope: 'both' },
  { label: 'المشرفون', to: '/supervisors', icon: ShieldCheck, scope: 'both' },
  { label: 'الموظفين', to: '/employees', icon: Briefcase, scope: 'both' },
  { label: 'المدفوعات', to: '/payments', icon: Wallet, matchPrefix: '/payments', scope: 'both' },
  { label: 'الإعدادات', to: '/settings', icon: Settings, scope: 'both' },
];

function NavItem({ item, collapsed, onClick }) {
  const location = useLocation();
  const isActive = item.matchPrefix
    ? location.pathname.startsWith(item.matchPrefix)
    : location.pathname === item.to;

  const content = (
    <HStack
      dir="rtl"
      as={NavLink}
      to={item.to}
      onClick={onClick}
      spacing={3}
      px={collapsed ? 0 : 3.5}
      py={2.5}
      borderRadius="xl"
      justify={collapsed ? 'center' : 'flex-start'}
      position="relative"
      bg={isActive ? 'whiteAlpha.200' : 'transparent'}
      color={isActive ? 'white' : 'whiteAlpha.700'}
      fontWeight={isActive ? '600' : '500'}
      transition="all 0.15s ease"
      _hover={{ bg: 'whiteAlpha.150', color: 'white' }}
      w="full"
    >
      {isActive && (
        <Box
          position="absolute"
          left="-12px"
          top="50%"
          transform="translateY(-50%)"
          w="4px"
          h="60%"
          bg="accent.300"
          borderRadius="full"
        />
      )}
      <Icon as={item.icon} boxSize={5} flexShrink={0} />
      {!collapsed && (
        <Text fontSize="sm" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
          {item.label}
        </Text>
      )}
    </HStack>
  );

  if (collapsed) {
    return (
      <Tooltip label={item.label} placement="right" hasArrow bg="ink.900">
        {content}
      </Tooltip>
    );
  }
  return content;
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onNavigate,
  showCollapseToggle = true,
}) {
  const { user } = useAuth();
  const isDirector = user?.role === 'مديرة';

  // 'ecole' ou 'academie' — vient du profil de l'établissement de l'utilisateur
  const establishmentType = user?.establishmentType || 'ecole';

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    const matchesScope = item.scope === 'both' || item.scope === establishmentType;
    const matchesRole = isDirector || item.to !== '/dashboard';
    return matchesScope && matchesRole;
  });

  return (
    <VStack
      h="full"
      bgGradient="linear(to-b, brand.700, brand.800)"
      align="stretch"
      spacing={0}
      py={5}
      px={collapsed ? 3 : 4}
      position="relative"
    >
      <Box
        px={collapsed ? 0 : 1}
        mb={6}
        display="flex"
        justifyContent={collapsed ? 'center' : 'flex-end'}
      >
        {collapsed ? (
          <Logo variant="mark" size={38} />
        ) : (
          <Logo variant="full" nameColor="white" />
        )}
      </Box>

      <VStack spacing={1} align="stretch" flex={1} overflowY="auto">
        {visibleNavItems.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} onClick={onNavigate} />
        ))}
      </VStack>

      <Divider borderColor="whiteAlpha.200" my={3} />

      {showCollapseToggle && (
        <HStack justify={collapsed ? 'center' : 'flex-end'} px={collapsed ? 0 : 1}>
          <IconButton
            aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
            icon={collapsed ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
            size="sm"
            variant="ghost"
            color="whiteAlpha.700"
            _hover={{
              bg: 'whiteAlpha.150',
              color: 'white',
            }}
            onClick={onToggleCollapse}
          />
        </HStack>
      )}
    </VStack>
  );
}

export default function Sidebar({ collapsed, onToggleCollapse, isMobileOpen, onMobileClose }) {
  return (
    <>
      {/* Sidebar fixe — desktop / tablette */}
      <Box
        as="aside"
        display={{ base: 'none', lg: 'block' }}
        w={collapsed ? '84px' : '260px'}
        transition="width 0.2s ease"
        position="fixed"
        top={0}
        right={0}
        h="100vh"
        zIndex={20}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </Box>

      {/* Drawer — mobile */}
      <Drawer isOpen={isMobileOpen} placement="left" onClose={onMobileClose}>
        <DrawerOverlay />
        <DrawerContent maxW="270px">
          <SidebarContent collapsed={false} onNavigate={onMobileClose} showCollapseToggle={false} />
        </DrawerContent>
      </Drawer>
    </>
  );
}