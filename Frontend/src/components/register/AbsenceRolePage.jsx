import { useMemo, useState } from 'react';
import { Box, Button, HStack, Select, Badge, IconButton, Tooltip, useToast, useDisclosure, Text, Wrap } from '@chakra-ui/react';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import SearchBar from '../common/SearchBar';
import DataTable from '../common/DataTable';
import ConfirmDialog from '../common/ConfirmDialog';
import AbsenceSubNav from './AbsenceSubNav';
import AbsenceRoleFormModal from './AbsenceRoleFormModal';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

/**
 * Page générique de gestion des absences pour une catégorie donnée
 * (Élèves, Maîtres, Surveillants, Employés) — recherche, filtre sur le
 * champ secondaire, ajout/modification/suppression, toasts.
 *
 * @param {string} personLabel        Ex: "Élève"
 * @param {Array}  initialData
 * @param {string} secondaryFieldKey  'niveau' | 'matiere' | 'role'
 * @param {string} secondaryFieldLabel
 * @param {Array}  secondaryOptions
 */
export default function AbsenceRolePage({
  personLabel,
  initialData,
  secondaryFieldKey,
  secondaryFieldLabel,
  secondaryOptions,
}) {
  const toast = useToast();
  const [items, setItems] = useState(initialData);
  const [search, setSearch] = useState('');
  const [secondaryFilter, setSecondaryFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((a) => {
      const matchesSearch = !term || a.personne.toLowerCase().includes(term);
      const matchesSecondary = !secondaryFilter || a[secondaryFieldKey] === secondaryFilter;
      return matchesSearch && matchesSecondary;
    });
  }, [items, search, secondaryFilter, secondaryFieldKey]);

  const openAdd = () => { setSelected(null); formModal.onOpen(); };
  const openEdit = (a) => { setSelected(a); formModal.onOpen(); };
  const askDelete = (a) => { setToDelete(a); deleteDialog.onOpen(); };

  const handleSubmit = (formData) => {
    setIsSaving(true);
    setTimeout(() => {
      if (selected) {
        setItems((prev) => prev.map((a) => (a.id === selected.id ? { ...a, ...formData } : a)));
        toast({ title: 'Absence modifiée', status: 'success', duration: 3000, isClosable: true });
      } else {
        const newItem = { ...formData, id: Math.max(0, ...items.map((a) => a.id)) + 1 };
        setItems((prev) => [newItem, ...prev]);
        toast({ title: 'Absence enregistrée', status: 'success', duration: 3000, isClosable: true });
      }
      setIsSaving(false);
      formModal.onClose();
    }, 600);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setItems((prev) => prev.filter((a) => a.id !== toDelete.id));
      toast({ title: 'Absence supprimée', status: 'info', duration: 3000, isClosable: true });
      setIsDeleting(false);
      deleteDialog.onClose();
      setToDelete(null);
    }, 500);
  };

  const columns = [
    { key: 'personne', label: personLabel, sortable: true },
    {
      key: secondaryFieldKey,
      label: secondaryFieldLabel,
      sortable: true,
      render: (row) => (
        <Badge bg="ink.100" color="ink.700" borderRadius="full" px={2.5}>
          {row[secondaryFieldKey]}
        </Badge>
      ),
    },
    { key: 'date', label: 'Date', sortable: true, render: (row) => formatDate(row.date) },
    { key: 'motif', label: 'Motif' },
    {
      key: 'justifiee',
      label: 'Justification',
      sortable: true,
      render: (row) => (
        <HStack spacing={1.5}>
          {row.justifiee ? <CheckCircle2 size={15} color="var(--chakra-colors-positive-500)" /> : <XCircle size={15} color="var(--chakra-colors-danger-500)" />}
          <Text fontSize="sm" color={row.justifiee ? 'positive.600' : 'danger.500'} fontWeight="600">
            {row.justifiee ? 'Justifiée' : 'Non justifiée'}
          </Text>
        </HStack>
      ),
    },
  ];

  return (
    <Box>
      <AbsenceSubNav />

      <Wrap spacing={3} mb={5} align="center">
        <SearchBar value={search} onChange={setSearch} placeholder={`Rechercher — ${personLabel.toLowerCase()}…`} />
        <Select
          w={{ base: 'full', sm: '200px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={secondaryFilter}
          onChange={(e) => setSecondaryFilter(e.target.value)}
        >
          <option value="">{`Tous — ${secondaryFieldLabel.toLowerCase()}`}</option>
          {secondaryOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </Select>
        {(search || secondaryFilter) && (
          <Button size="sm" variant="ghost" onClick={() => { setSearch(''); setSecondaryFilter(''); }}>
            Réinitialiser
          </Button>
        )}
        <HStack spacing={1.5} ml="auto" color="ink.400">
          <Text fontSize="xs">{filtered.length} résultat(s)</Text>
        </HStack>
        <Button leftIcon={<Plus size={17} />} onClick={openAdd}>Déclarer une absence</Button>
      </Wrap>

      <DataTable
        columns={columns}
        data={filtered}
        pageSize={8}
        emptyMessage="Aucune absence enregistrée."
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

      <AbsenceRoleFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.onClose}
        onSubmit={handleSubmit}
        absence={selected}
        isSaving={isSaving}
        personLabel={personLabel}
        secondaryFieldKey={secondaryFieldKey}
        secondaryFieldLabel={secondaryFieldLabel}
        secondaryOptions={secondaryOptions}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Supprimer cette absence ?"
        message={toDelete ? `Voulez-vous vraiment supprimer l\u2019absence de ${toDelete.personne} du ${formatDate(toDelete.date)} ?` : ''}
      />
    </Box>
  );
}
