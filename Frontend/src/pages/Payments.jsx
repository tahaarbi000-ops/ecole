import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Select,
  Badge,
  IconButton,
  Tooltip,
  useToast,
  useDisclosure,
  Text,
  Wrap,
  SimpleGrid,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  Divider,
} from '@chakra-ui/react';
import { Plus, Wallet, CheckCircle2, Clock, CreditCard, History as HistoryIcon } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import PaymentFormModal from '../components/payments/PaymentFormModal';
import { payments as initialPayments, paymentStatuses } from '../data/payments';
import { levels } from '../data/school';
import { AxiosToken } from '../api/Api';

const STATUS_COLORS = {
  payé: { bg: 'positive.50', color: 'positive.600' },
  "no payé": { bg: 'accent.50', color: 'accent.500' },
  'en attente': { bg: 'warning.50', color: 'warning.500' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function Payments() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [payTarget, setPayTarget] = useState(null);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const formModal = useDisclosure();
  const payModal = useDisclosure();
  const historyModal = useDisclosure();

  useEffect(()=>{
     const fetchData = async () => {
       try{
         const response = await AxiosToken.get("/subscription");
         setPayments(response.data.subscriptions)
       }catch{
         console.error("error")
       }
     }
     fetchData()
   },[isSaving])

  const availableMonths = useMemo(() => {
    const set = new Set(payments.map((p) => p.createdAt.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [payments]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((p) => {
      const matchesSearch = !term || (p.student.name + " " +p.student.last_name ).toLowerCase().includes(term);
      const matchesLevel = !levelFilter || p.student.class === levelFilter;
      const matchesMonth = !monthFilter || p.createdAt.startsWith(monthFilter);
      const matchesStatus = !statusFilter || p.status === statusFilter;
      return matchesSearch && matchesLevel && matchesMonth && matchesStatus;
    });
  }, [payments, search, levelFilter, monthFilter, statusFilter]);

  // --- Statistiques ---------------------------------------------------------
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const totalEncaisseCeMois = useMemo(
    () =>
      payments
        .filter((p) => p.createdAt.startsWith(currentMonthKey) && p.status !== 'en attente')
        .reduce((sum, p) => sum + p.amount, 0),
    [payments, currentMonthKey]
  );
  const totalPayeFiltre = useMemo(
    () => filtered.filter((p) => p.status === 'payé' || p.status === 'partiel').reduce((sum, p) => sum + p.amount, 0),
    [filtered]
  );
  const totalRestantFiltre = useMemo(
    () => filtered.filter((p) => p.status === 'en attente' || p.status === 'partiel').length,
    [filtered]
  );

  // --- Historique d'un élève -------------------------------------------------
  const historyRows = useMemo(() => {
    if (!historyStudent) return [];
    return payments
      .filter((p) => p.eleve === historyStudent.eleve)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [payments, historyStudent]);

  const openAdd = () => { formModal.onOpen(); };
  const askPay = (p) => { setPayTarget(p); payModal.onOpen(); };
  const openHistory = (p) => { setHistoryStudent(p); historyModal.onOpen(); };

  const handleCreateSubmit = (formData) => {
    setIsSaving(true);
    setTimeout(() => {
      const newPayment = { ...formData, id: Math.max(0, ...payments.map((p) => p.id)) + 1 };
      setPayments((prev) => [newPayment, ...prev]);
      toast({ title: 'Paiement enregistré', status: 'success', duration: 3000, isClosable: true });
      setIsSaving(false);
      formModal.onClose();
    }, 700);
  };

  const handleConfirmPay = () => {
    if (!payTarget) return;
    setIsPaying(true);
    setTimeout(() => {
      setPayments((prev) =>
        prev.map((p) => (p.id === payTarget.id ? { ...p, statut: 'Payé' } : p))
      );
      toast({
        title: 'Paiement confirmé',
        description: `${payTarget.eleve} — ${payTarget.montant.toLocaleString('fr-FR')} DT`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsPaying(false);
      payModal.onClose();
      setPayTarget(null);
    }, 600);
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'eleve', label: 'Élève', sortable: true, render: (row) => row.student.name + " " + row.student.last_name },
    { key: 'class', label: 'Niveau', sortable: true, render: (row) => <Badge bg="ink.100" color="ink.700" borderRadius="full" px={2.5}>{row.student.class}</Badge> },
    { key: 'montant', label: 'Montant', sortable: true, isNumeric: true, render: (row) => `${row.amount.toLocaleString('fr-FR')} DT` },
    { key: 'datePaiement', label: 'Date', sortable: true, render: (row) => formatDate(row.createdAt) },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (row) => {
        const c = STATUS_COLORS[row.status] || { bg: 'ink.100', color: 'ink.700' };
        return <Badge bg={c.bg} color={c.color} borderRadius="full" px={2.5}>{row.status}</Badge>;
      },
    },
  ];

  return (
    <Box>

      {/* Cartes statistiques */}
      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={5} mb={6}>
        <Box bg="brand.600" borderRadius="2xl" p={5} color="white" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="whiteAlpha.800">Total encaissé ce mois</Text>
            <Wallet size={18} />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700">
            {totalEncaisseCeMois.toLocaleString('fr-FR')} DT
          </Text>
          <Text fontSize="xs" color="whiteAlpha.700" mt={1}>{formatMonthLabel(currentMonthKey)}</Text>
        </Box>

        <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="ink.500">Total payé (filtré)</Text>
            <Icon as={CheckCircle2} boxSize={4.5} color="positive.500" />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700" color="ink.900">
            {totalPayeFiltre.toLocaleString('fr-FR')} DT
          </Text>
          <Text fontSize="xs" color="ink.400" mt={1}>Sur la sélection actuelle</Text>
        </Box>

        <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="ink.500">Paiements restants</Text>
            <Icon as={Clock} boxSize={4.5} color="warning.500" />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700" color="ink.900">
            {totalRestantFiltre}
          </Text>
          <Text fontSize="xs" color="ink.400" mt={1}>En attente (sélection)</Text>
        </Box>
      </SimpleGrid>

      <Wrap spacing={3} mb={5} align="center">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un élève…" />

        <Select
          w={{ base: 'full', sm: '180px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="">Tous les niveaux</option>
          {levels.map((lvl) => (
            <option key={lvl} value={lvl}>{lvl}</option>
          ))}
        </Select>

        <Select
          w={{ base: 'full', sm: '170px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        >
          <option value="">Tous les mois</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>{formatMonthLabel(m)}</option>
          ))}
        </Select>

        <Select
          w={{ base: 'full', sm: '160px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {paymentStatuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>

        {(search || levelFilter || monthFilter || statusFilter) && (
          <Button size="sm" variant="ghost" onClick={() => { setSearch(''); setLevelFilter(''); setMonthFilter(''); setStatusFilter(''); }}>
            Réinitialiser
          </Button>
        )}

        <HStack spacing={1.5} ml="auto" color="ink.400">
          <CreditCard size={15} />
          <Text fontSize="xs">{filtered.length} paiement(s)</Text>
        </HStack>
      </Wrap>

      <DataTable
        columns={columns}
        data={filtered}
        pageSize={8}
        emptyMessage="Aucun paiement ne correspond à ces critères."
        renderActions={(row) => (
          <HStack spacing={1}>
            <Tooltip label="Payer" hasArrow>
              <IconButton
                aria-label="Payer"
                disabled={row.status === "payé"}
                icon={<Wallet size={16} />}
                size="sm"
                variant="ghost"
                color="positive.600"
                _hover={{ bg: 'positive.50' }}
                onClick={() => askPay(row)}
              />
            </Tooltip>
            <Tooltip label="Historique" hasArrow>
              <IconButton
                aria-label="Historique"
                icon={<HistoryIcon size={16} />}
                size="sm"
                variant="ghost"
                onClick={() => openHistory(row)}
              />
            </Tooltip>
          </HStack>
        )}
      />

      {/* Formulaire — uniquement pour un nouveau paiement */}
      <PaymentFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.onClose}
        onSubmit={handleCreateSubmit}
        payment={null}
        isSaving={isSaving}
      />

      {/* Modal confirmation de paiement */}
      <Modal isOpen={payModal.isOpen} onClose={payModal.onClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>Confirmer le paiement</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="ink.600">
              Voulez-vous confirmer le paiement pour{' '}
              <Text as="span" fontWeight="700" color="ink.900">
                {payTarget?.eleve}
              </Text>{' '}
              ?
            </Text>
            {payTarget && (
              <Text fontSize="xs" color="ink.400" mt={2}>
                {payTarget.montant.toLocaleString('fr-FR')} DT — {payTarget.niveau}
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={payModal.onClose}>
              Annuler
            </Button>
            <Button colorScheme="green" onClick={handleConfirmPay} isLoading={isPaying}>
              Confirmer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Historique */}
      <Modal isOpen={historyModal.isOpen} onClose={historyModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>
            Historique des paiements
            {historyStudent && (
              <Text fontSize="sm" fontWeight="400" color="ink.500" mt={1}>
                {historyStudent.eleve} — {historyStudent.niveau}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {historyRows.length === 0 ? (
              <Text fontSize="sm" color="ink.500">Aucun paiement enregistré pour cet élève.</Text>
            ) : (
              <VStack align="stretch" spacing={0} divider={<Divider />}>
                {historyRows.map((p) => {
                  const c = STATUS_COLORS[p.statut] || { bg: 'ink.100', color: 'ink.700' };
                  return (
                    <HStack key={p.id} justify="space-between" py={3}>
                      <Box>
                        <Text fontSize="sm" fontWeight="600" color="ink.800">
                          {p.montant.toLocaleString('fr-FR')} DT
                        </Text>
                        <Text fontSize="xs" color="ink.400">{formatDate(p.createdAt)}</Text>
                      </Box>
                      <Badge bg={c.bg} color={c.color} borderRadius="full" px={2.5}>{p.statut}</Badge>
                    </HStack>
                  );
                })}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={historyModal.onClose}>Fermer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}