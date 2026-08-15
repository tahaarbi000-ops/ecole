import { Box, HStack, Text } from '@chakra-ui/react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { LogIn, LogOut, CalendarX2, Clock3, MessageSquareText } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';

const SUB_NAV = [
  { label: 'Entrées', to: '/register/entries', icon: LogIn },
  { label: 'Sorties', to: '/register/exits', icon: LogOut },
  { label: 'Absences', to: '/register/absences', icon: CalendarX2 },
  { label: 'Retards', to: '/register/late', icon: Clock3 },
  { label: 'Observations', to: '/register/observations', icon: MessageSquareText },
];

export default function Register() {
  const location = useLocation();

  // Redirige /register vers /register/entries par défaut.
  if (location.pathname === '/register') {
    return <Navigate to="/register/entries" replace />;
  }

  return (
    <Box>
      <PageHeader title="Registre scolaire" subtitle="Entrées, sorties, absences, retards et observations." />

      <HStack
        spacing={1}
        bg="white"
        border="1px solid"
        borderColor="ink.200"
        borderRadius="xl"
        p={1.5}
        mb={6}
        overflowX="auto"
        w="fit-content"
        maxW="full"
      >
        {SUB_NAV.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <HStack
              as={NavLink}
              key={item.to}
              to={item.to}
              spacing={2}
              px={3.5}
              py={2}
              borderRadius="lg"
              whiteSpace="nowrap"
              bg={isActive ? 'brand.600' : 'transparent'}
              color={isActive ? 'white' : 'ink.600'}
              fontWeight={isActive ? '600' : '500'}
              fontSize="sm"
              transition="all 0.15s ease"
              _hover={{ bg: isActive ? 'brand.600' : 'ink.50' }}
            >
              <item.icon size={16} />
              <Text>{item.label}</Text>
            </HStack>
          );
        })}
      </HStack>

      <Outlet />
    </Box>
  );
}
