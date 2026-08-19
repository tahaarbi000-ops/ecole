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
} from '@chakra-ui/react';
import { Plus, Eye, Pencil, Trash2, Download, Users } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import SearchBar from '../common/SearchBar';
import DataTable from '../common/DataTable';
import ConfirmDialog from '../common/ConfirmDialog';
import StaffFormModal from './StaffFormModal';
import StaffViewModal from './StaffViewModal';

const STATUS_COLORS = {
  Actif: { bg: 'positive.50', color: 'positive.600' },
  'En congé': { bg: 'warning.50', color: 'warning.500' },
  Inactif: { bg: 'danger.50', color: 'danger.500' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

/**
 * Page générique de gestion du personnel — encapsule toute la logique CRUD
 * (recherche, filtre, tri, pagination, ajout/modification/suppression, toasts)
 * pour être configurée différemment sur Maîtres / Surveillants / Employés.
 *
 * @param {string} pageTitle          Ex: "Maîtres"
 * @param {string} entityLabel        Ex: "un maître" (utilisé dans les libellés de formulaire)
 * @param {Array}  initialData
 * @param {string} roleFieldKey       'matiere' ou 'role'
 * @param {string} roleFieldLabel     'Matière' ou 'Rôle'
 * @param {Array}  roleOptions
 * @param {boolean} [showStatus]
 * @param {Array}  [statusOptions]
 */
export default function StaffPageBase({
  pageTitle,
  entityLabel,
  initialData,
  roleFieldKey,
  roleFieldLabel,
  roleOptions,
  showStatus = false,
  statusOptions = [],
}) {
  const toast = useToast();
  const [people, setPeople] = useState(initialData);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formModal = useDisclosure();
  const viewModal = useDisclosure();
  const deleteDialog = useDisclosure();

  const filteredPeople = useMemo(() => {
    const term = search.trim().toLowerCase();
    return people.filter((p) => {
      const matchesSearch = !term || `${p.nom} ${p.prenom} ${p.telephone}`.toLowerCase().includes(term);
      const matchesRole = !roleFilter || p[roleFieldKey] === roleFilter;
      const matchesStatus = !statusFilter || p.statut === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [people, search, roleFilter, statusFilter, roleFieldKey]);

  const openAddModal = () => { setSelectedPerson(null); formModal.onOpen(); };
  const openEditModal = (person) => { setSelectedPerson(person); formModal.onOpen(); };
  const openViewModal = (person) => { setSelectedPerson(person); viewModal.onOpen(); };
  const askDelete = (person) => { setPersonToDelete(person); deleteDialog.onOpen(); };

  const handleSubmit = (formData) => {
    setIsSaving(true);
    setTimeout(() => {
      if (selectedPerson) {
        setPeople((prev) => prev.map((p) => (p.id === selectedPerson.id ? { ...p, ...formData } : p)));
        toast({ title: 'Modifié avec succès', status: 'success', duration: 3000, isClosable: true });
      } else {
        const newPerson = { ...formData, id: Math.max(0, ...people.map((p) => p.id)) + 1 };
        setPeople((prev) => [newPerson, ...prev]);
        toast({ title: 'Ajouté avec succès', status: 'success', duration: 3000, isClosable: true });
      }
      setIsSaving(false);
      formModal.onClose();
    }, 700);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setPeople((prev) => prev.filter((p) => p.id !== personToDelete.id));
      toast({ title: 'Supprimé', status: 'info', duration: 3000, isClosable: true });
      setIsDeleting(false);
      deleteDialog.onClose();
      setPersonToDelete(null);
    }, 600);
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'nom', label: 'Nom', sortable: true },
    { key: 'prenom', label: 'Prénom', sortable: true },
    { key: 'telephone', label: 'Téléphone' },
    {
      key: roleFieldKey,
      label: roleFieldLabel,
      sortable: true,
      render: (row) => (
        <Badge bg="ink.100" color="ink.700" borderRadius="full" px={2.5} fontWeight="600">
          {row[roleFieldKey]}
        </Badge>
      ),
    },
    { key: 'dateDepotSalaire', label: 'Date dépôt salaire', sortable: true, render: (row) => formatDate(row.dateDepotSalaire) },
    {
      key: 'salaire',
      label: 'Salaire',
      sortable: true,
      isNumeric: true,
      render: (row) => `${row.salaire.toLocaleString('fr-FR')} DT`,
    },
    ...(showStatus
      ? [{
          key: 'statut',
          label: 'Statut',
          sortable: true,
          render: (row) => {
            const c = STATUS_COLORS[row.statut] || { bg: 'ink.100', color: 'ink.700' };
            return (
              <Badge bg={c.bg} color={c.color} borderRadius="full" px={2.5}>
                {row.statut}
              </Badge>
            );
          },
        }]
      : []),
  ];

  return (
    <Box>
      <PageHeader
        title={pageTitle}
        subtitle={`${people.length} membres du personnel enregistrés`}
        actions={
          <>
            <Tooltip label="Export bientôt disponible" hasArrow>
              <IconButton aria-label="Exporter" icon={<Download size={17} />} variant="outline" isDisabled />
            </Tooltip>
            <Button leftIcon={<Plus size={17} />} onClick={openAddModal}>
              Ajouter {entityLabel}
            </Button>
          </>
        }
      />

      <Wrap spacing={3} mb={5} align="center">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par nom, prénom, téléphone…" />

        <Select
          w={{ base: 'full', sm: '210px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">{`Tous — ${roleFieldLabel.toLowerCase()}`}</option>
          {roleOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </Select>

        {showStatus && (
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
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
        )}

        {(search || roleFilter || statusFilter) && (
          <Button size="sm" variant="ghost" onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}>
            Réinitialiser
          </Button>
        )}

        <HStack spacing={1.5} ml="auto" color="ink.400">
          <Users size={15} />
          <Text fontSize="xs">{filteredPeople.length} résultat(s)</Text>
        </HStack>
      </Wrap>

      <DataTable
        columns={columns}
        data={filteredPeople}
        pageSize={8}
        emptyMessage="Aucun résultat ne correspond à ces critères."
        renderActions={(row) => (
          <HStack spacing={1}>
            <Tooltip label="Voir" hasArrow>
              <IconButton aria-label="Voir" icon={<Eye size={16} />} size="sm" variant="ghost" onClick={() => openViewModal(row)} />
            </Tooltip>
            <Tooltip label="Modifier" hasArrow>
              <IconButton aria-label="Modifier" icon={<Pencil size={16} />} size="sm" variant="ghost" onClick={() => openEditModal(row)} />
            </Tooltip>
            <Tooltip label="Supprimer" hasArrow>
              <IconButton
                aria-label="Supprimer"
                icon={<Trash2 size={16} />}
                size="sm"
                variant="ghost"
                color="danger.500"
                _hover={{ bg: 'danger.50' }}
                onClick={() => askDelete(row)}
              />
            </Tooltip>
          </HStack>
        )}
      />

      <StaffFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.onClose}
        onSubmit={handleSubmit}
        person={selectedPerson}
        isSaving={isSaving}
        entityLabel={entityLabel}
        roleFieldKey={roleFieldKey}
        roleFieldLabel={roleFieldLabel}
        roleOptions={roleOptions}
        showStatus={showStatus}
        statusOptions={statusOptions}
      />

      <StaffViewModal
        isOpen={viewModal.isOpen}
        onClose={viewModal.onClose}
        person={selectedPerson}
        onEdit={openEditModal}
        roleFieldKey={roleFieldKey}
        roleFieldLabel={roleFieldLabel}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Confirmer la suppression"
        message={
          personToDelete
            ? `Voulez-vous vraiment supprimer ${personToDelete.prenom} ${personToDelete.nom} ? Cette action est irréversible.`
            : ''
        }
      />
    </Box>
  );
}
