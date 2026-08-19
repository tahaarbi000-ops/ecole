import { useMemo, useState } from 'react';
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
} from '@chakra-ui/react';
import { Plus, Pencil, Trash2, Wallet, CheckCircle2, Clock, CreditCard } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PaymentFormModal from '../components/payments/PaymentFormModal';
import { payments as initialPayments, paymentStatuses } from '../data/payments';
import { levels } from '../data/school';

const STATUS_COLORS = {
  Payé: { bg: 'positive.50', color: 'positive.600' },
  Partiel: { bg: 'accent.50', color: 'accent.500' },
  'En attente': { bg: 'warning.50', color: 'warning.500' },
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
  const [payments, setPayments] = useState(initialPayments);

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();

  const availableMonths = useMemo(() => {
    const set = new Set(payments.map((p) => p.datePaiement.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [payments]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((p) => {
      const matchesSearch = !term || p.eleve.toLowerCase().includes(term);
      const matchesLevel = !levelFilter || p.niveau === levelFilter;
      const matchesMonth = !monthFilter || p.datePaiement.startsWith(monthFilter);
      const matchesStatus = !statusFilter || p.statut === statusFilter;
      return matchesSearch && matchesLevel && matchesMonth && matchesStatus;
    });
  }, [payments, search, levelFilter, monthFilter, statusFilter]);

  // --- Statistiques ---------------------------------------------------------
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const totalEncaisseCeMois = useMemo(
    () =>
      payments
        .filter((p) => p.datePaiement.startsWith(currentMonthKey) && p.statut !== 'En attente')
        .reduce((sum, p) => sum + p.montant, 0),
    [payments, currentMonthKey]
  );
  const totalPayeFiltre = useMemo(
    () => filtered.filter((p) => p.statut === 'Payé' || p.statut === 'Partiel').reduce((sum, p) => sum + p.montant, 0),
    [filtered]
  );
  const totalRestantFiltre = useMemo(
    () => filtered.filter((p) => p.statut === 'En attente' || p.statut === 'Partiel').length,
    [filtered]
  );

  const openAdd = () => { setSelected(null); formModal.onOpen(); };
  const openEdit = (p) => { setSelected(p); formModal.onOpen(); };
  const askDelete = (p) => { setToDelete(p); deleteDialog.onOpen(); };

  const handleSubmit = (formData) => {
    setIsSaving(true);
    setTimeout(() => {
      if (selected) {
        setPayments((prev) => prev.map((p) => (p.id === selected.id ? { ...p, ...formData } : p)));
        toast({ title: 'Paiement modifié', status: 'success', duration: 3000, isClosable: true });
      } else {
        const newPayment = { ...formData, id: Math.max(0, ...payments.map((p) => p.id)) + 1 };
        setPayments((prev) => [newPayment, ...prev]);
        toast({ title: 'Paiement enregistré', status: 'success', duration: 3000, isClosable: true });
      }
      setIsSaving(false);
      formModal.onClose();
    }, 700);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setPayments((prev) => prev.filter((p) => p.id !== toDelete.id));
      toast({ title: 'Paiement supprimé', status: 'info', duration: 3000, isClosable: true });
      setIsDeleting(false);
      deleteDialog.onClose();
      setToDelete(null);
    }, 600);
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'eleve', label: 'Élève', sortable: true },
    { key: 'niveau', label: 'Niveau', sortable: true, render: (row) => <Badge bg="ink.100" color="ink.700" borderRadius="full" px={2.5}>{row.niveau}</Badge> },
    { key: 'typePaiement', label: 'Type' },
    { key: 'montant', label: 'Montant', sortable: true, isNumeric: true, render: (row) => `${row.montant.toLocaleString('fr-FR')} DT` },
    { key: 'datePaiement', label: 'Date', sortable: true, render: (row) => formatDate(row.datePaiement) },
    { key: 'modePaiement', label: 'Mode' },
    {
      key: 'statut',
      label: 'Statut',
      sortable: true,
      render: (row) => {
        const c = STATUS_COLORS[row.statut] || { bg: 'ink.100', color: 'ink.700' };
        return <Badge bg={c.bg} color={c.color} borderRadius="full" px={2.5}>{row.statut}</Badge>;
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Paiements"
        subtitle="Suivi des paiements scolaires — scolarité, transport, inscription."
        actions={<Button leftIcon={<Plus size={17} />} onClick={openAdd}>Nouveau paiement</Button>}
      />

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
          <Text fontSize="xs" color="ink.400" mt={1}>Partiels + en attente (sélection)</Text>
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
            <Tooltip label="Modifier" hasArrow>
              <IconButton aria-label="Modifier" icon={<Pencil size={16} />} size="sm" variant="ghost" onClick={() => openEdit(row)} />
            </Tooltip>
            <Tooltip label="Supprimer" hasArrow>
              <IconButton aria-label="Supprimer" icon={<Trash2 size={16} />} size="sm" variant="ghost" color="danger.500" _hover={{ bg: 'danger.50' }} onClick={() => askDelete(row)} />
            </Tooltip>
          </HStack>
        )}
      />

      <PaymentFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.onClose}
        onSubmit={handleSubmit}
        payment={selected}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Supprimer ce paiement ?"
        message={toDelete ? `Voulez-vous vraiment supprimer le paiement de ${toDelete.eleve} du ${formatDate(toDelete.datePaiement)} ?` : ''}
      />
    </Box>
  );
}
