import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Flex,
  Icon,
  Badge,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import {
  GraduationCap,
  Users,
  ShieldCheck,
  Briefcase,
  Wallet,
  CheckCircle2,
  Clock,
  UserPlus,
  BadgeDollarSign,
  DatabaseBackup,
  School,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import GenderChart from '../components/charts/GenderChart';
import LevelChart from '../components/charts/LevelChart';
import PaymentsChart from '../components/charts/PaymentsChart';
import { useAuth } from '../context/AuthContext';
import {
  schoolInfo,
  dashboardStats,
  genderDistribution,
  studentsByLevel,
  monthlyPayments,
  recentActivities,
  tuitionFees,
} from '../data/school';

const ACTIVITY_ICONS = {
  payment: { icon: BadgeDollarSign, color: 'positive.500', bg: 'positive.50' },
  student: { icon: UserPlus, color: 'brand.600', bg: 'brand.50' },
  salary: { icon: Wallet, color: 'accent.500', bg: 'accent.50' },
  backup: { icon: DatabaseBackup, color: 'warning.500', bg: 'warning.50' },
};

function InfoRow({ icon, label, value }) {
  return (
    <HStack spacing={3} align="flex-start">
      <Flex w="34px" h="34px" borderRadius="lg" bg="brand.50" align="center" justify="center" flexShrink={0}>
        <Icon as={icon} boxSize={4} color="brand.600" />
      </Flex>
      <VStack spacing={0} align="flex-start">
        <Text fontSize="xs" color="ink.400">{label}</Text>
        <Text fontSize="sm" fontWeight="600" color="ink.900">{value}</Text>
      </VStack>
    </HStack>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { paymentsThisMonth } = dashboardStats;
  const pendingPct = Math.round((paymentsThisMonth.pending / paymentsThisMonth.total) * 100);

  return (
    <VStack align="stretch" spacing={7}>
      {/* En-tête de bienvenue */}
      <Box>
        <Text fontFamily="heading" fontSize="2xl" fontWeight="700" color="ink.900">
          Bonjour, {user?.name || 'Administrateur'} 👋
        </Text>
        <Text fontSize="sm" color="ink.500" mt={1}>
          Voici un aperçu de votre école aujourd’hui — {schoolInfo.schoolYear}.
        </Text>
      </Box>

      {/* Cartes statistiques principales */}
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={5}>
        <StatCard
          label="Total élèves"
          value={dashboardStats.totalStudents}
          icon={GraduationCap}
          iconColor="brand.600"
          iconBg="brand.50"
          trend={4.2}
        />
        <StatCard
          label="Total maîtres"
          value={dashboardStats.totalTeachers}
          icon={Users}
          iconColor="accent.500"
          iconBg="accent.50"
          trend={1.8}
        />
        <StatCard
          label="Total surveillants"
          value={dashboardStats.totalSupervisors}
          icon={ShieldCheck}
          iconColor="warning.500"
          iconBg="warning.50"
          trend={0}
          trendLabel="stable"
        />
        <StatCard
          label="Total employés"
          value={dashboardStats.totalEmployees}
          icon={Briefcase}
          iconColor="positive.500"
          iconBg="positive.50"
          trend={2.5}
        />
      </SimpleGrid>

      {/* Cartes paiements */}
      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={5}>
        <Box bg="brand.600" borderRadius="2xl" p={5} color="white" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="whiteAlpha.800">Paiements du mois</Text>
            <Wallet size={18} />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700">
            {paymentsThisMonth.total.toLocaleString('fr-FR')} DT
          </Text>
          <Text fontSize="xs" color="whiteAlpha.700" mt={1}>Montant total attendu</Text>
        </Box>

        <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="ink.500">Paiements effectués</Text>
            <Icon as={CheckCircle2} boxSize={4.5} color="positive.500" />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700" color="ink.900">
            {paymentsThisMonth.collected.toLocaleString('fr-FR')} DT
          </Text>
          <Badge mt={2} bg="positive.50" color="positive.600" borderRadius="full" px={2}>
            {100 - pendingPct}% encaissé
          </Badge>
        </Box>

        <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="ink.500">Paiements en attente</Text>
            <Icon as={Clock} boxSize={4.5} color="warning.500" />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700" color="ink.900">
            {paymentsThisMonth.pending.toLocaleString('fr-FR')} DT
          </Text>
          <Badge mt={2} bg="warning.50" color="warning.500" borderRadius="full" px={2}>
            {pendingPct}% en attente
          </Badge>
        </Box>
      </SimpleGrid>

      {/* Graphiques */}
      <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={5}>
        <Box gridColumn={{ xl: 'span 2' }} bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <Text fontFamily="heading" fontWeight="700" color="ink.900" mb={1}>Paiements mensuels</Text>
          <Text fontSize="xs" color="ink.400" mb={2}>Évolution des encaissements sur l’année scolaire</Text>
          <PaymentsChart data={monthlyPayments} />
        </Box>

        <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <Text fontFamily="heading" fontWeight="700" color="ink.900" mb={1}>Répartition des élèves</Text>
          <Text fontSize="xs" color="ink.400" mb={2}>Par genre</Text>
          <GenderChart data={genderDistribution} />
        </Box>
      </SimpleGrid>

      <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
        <Text fontFamily="heading" fontWeight="700" color="ink.900" mb={1}>Élèves par niveau</Text>
        <Text fontSize="xs" color="ink.400" mb={2}>Effectifs répartis sur les 10 niveaux</Text>
        <LevelChart data={studentsByLevel} />
      </Box>

      {/* Activités récentes + Informations école */}
      <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={5}>
        <Box gridColumn={{ xl: 'span 2' }} bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <Text fontFamily="heading" fontWeight="700" color="ink.900" mb={4}>Activités récentes</Text>
          <VStack align="stretch" spacing={4} divider={<Divider borderColor="ink.100" />}>
            {recentActivities.map((activity) => {
              const meta = ACTIVITY_ICONS[activity.type];
              return (
                <HStack key={activity.id} spacing={3} align="flex-start">
                  <Flex w="36px" h="36px" borderRadius="lg" bg={meta.bg} align="center" justify="center" flexShrink={0}>
                    <Icon as={meta.icon} boxSize={4} color={meta.color} />
                  </Flex>
                  <VStack spacing={0} align="flex-start">
                    <Text fontSize="sm" color="ink.800" fontWeight="500">{activity.text}</Text>
                    <Text fontSize="xs" color="ink.400">{activity.time}</Text>
                  </VStack>
                </HStack>
              );
            })}
          </VStack>
        </Box>

        <VStack align="stretch" spacing={5}>
          <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
            <HStack mb={4} spacing={2}>
              <Icon as={School} boxSize={4.5} color="brand.600" />
              <Text fontFamily="heading" fontWeight="700" color="ink.900">Informations école</Text>
            </HStack>
            <VStack align="stretch" spacing={3.5}>
              <InfoRow icon={MapPin} label="Adresse" value={schoolInfo.address} />
              <InfoRow icon={Phone} label="Téléphone" value={schoolInfo.phone} />
              <InfoRow icon={Mail} label="Email" value={schoolInfo.email} />
              <InfoRow icon={CalendarDays} label="Année scolaire" value={schoolInfo.schoolYear} />
            </VStack>
          </Box>
        </VStack>
      </SimpleGrid>

      {/* Tarifs scolarité */}
      <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
        <HStack justify="space-between" mb={4}>
          <Text fontFamily="heading" fontWeight="700" color="ink.900">Tarifs de scolarité</Text>
          <Badge bg="brand.50" color="brand.700" borderRadius="full" px={2.5} py={1}>
            {schoolInfo.schoolYear}
          </Badge>
        </HStack>
        <TableContainer>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Niveau</Th>
                <Th isNumeric>Tarif annuel</Th>
              </Tr>
            </Thead>
            <Tbody>
              {tuitionFees.map((fee) => (
                <Tr key={fee.id}>
                  <Td fontWeight="500" color="ink.800">{fee.level}</Td>
                  <Td isNumeric fontWeight="600" color="ink.900">{fee.amount.toLocaleString('fr-FR')} DT</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </VStack>
  );
}
