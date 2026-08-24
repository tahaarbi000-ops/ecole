import { useEffect, useMemo, useState } from 'react';
import { Box, Button, HStack, Select, Badge, IconButton, Tooltip, useToast, useDisclosure, Text, Wrap } from '@chakra-ui/react';
import { Plus, Pencil, Trash2, LogIn, LogOut } from 'lucide-react';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TeacherMovementFormModal from '../../components/register/TeacherMovementFormModal';
import { teacherMovements as initialMovements, movementDirections } from '../../data/register';
import { AxiosToken } from '../../api/Api';

const SENS_COLORS = {
  entrée: { bg: 'positive.50', color: 'positive.600', icon: LogIn },
  sortie: { bg: 'warning.50', color: 'warning.500', icon: LogOut },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

export default function TeacherMovements() {
  const toast = useToast();
  const [movements, setMovements] = useState([]);
  const [search, setSearch] = useState('');
  const [sensFilter, setSensFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return movements.filter((m) => {
      const matchesSearch = !term || `${m.nom} ${m.prenom} ${m.remarque}`.toLowerCase().includes(term);
      const matchesSens = !sensFilter || m.sens === sensFilter;
      return matchesSearch && matchesSens;
    });
  }, [movements, search, sensFilter]);

  const openAdd = () => { setSelected(null); formModal.onOpen(); };
  const openEdit = (m) => { setSelected(m); formModal.onOpen(); };
  const askDelete = (m) => { setToDelete(m); deleteDialog.onOpen(); };

  useEffect(()=>{
    const dataFetch = async ()=> {
      try{
        const response = await AxiosToken.get("/scoring")
        setMovements(response.data.scoring)
      }catch{
        console.error("error")
      }
    }
    dataFetch()
  },[isSaving])

  const handleSubmit = async (formData) => {
    setIsSaving(true);
    try{
      await AxiosToken.post("/scoring",formData)
    }catch{

    }finally{
        setIsSaving(false)
        formModal.onClose()
    }
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setMovements((prev) => prev.filter((m) => m.id !== toDelete.id));
      toast({ title: 'Pointage supprimé', status: 'info', duration: 3000, isClosable: true });
      setIsDeleting(false);
      deleteDialog.onClose();
      setToDelete(null);
    }, 500);
  };

  const columns = [
    { key: 'date', label: 'Date', sortable: true, render: (row) => formatDate(row.date) },
    { key: 'time', label: 'Heure', sortable: true },
    { key: 'name', label: 'Nom', sortable: true, render: (row) => row.scoringTeacher?.name },
    { key: 'last_name', label: 'Prénom', sortable: true, render: (row) => row.scoringTeacher?.last_name},
    {
      key: 'sense',
      label: 'Sens',
      sortable: true,
      render: (row) => {
        const c = SENS_COLORS[row.sense] || SENS_COLORS.entrée;
        return (
          <HStack spacing={1.5}>
            <c.icon size={13} color={`var(--chakra-colors-${c.color.replace('.', '-')})`} />
            <Badge textTransform={"capitalize"} bg={c.bg} color={c.color} borderRadius="full" px={2.5}>{row.sense}</Badge>
          </HStack>
        );
      },
    },
    { key: 'noticed', label: 'Remarque', render: (row) => row.remarque || <Text color="ink.400">—</Text> },
  ];

  return (
    <Box>
      <Wrap spacing={3} mb={5} align="center">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un maître, une remarque…" />
        <Select
          w={{ base: 'full', sm: '160px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={sensFilter}
          onChange={(e) => setSensFilter(e.target.value)}
        >
          <option value="">Entrées et sorties</option>
          {movementDirections.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
        {(search || sensFilter) && (
          <Button size="sm" variant="ghost" onClick={() => { setSearch(''); setSensFilter(''); }}>
            Réinitialiser
          </Button>
        )}
        <HStack spacing={1.5} ml="auto" color="ink.400">
          <Text fontSize="xs">{filtered.length} résultat(s)</Text>
        </HStack>
        <Button leftIcon={<Plus size={17} />} onClick={openAdd}>Nouveau pointage</Button>
      </Wrap>

      <DataTable
        columns={columns}
        data={filtered}
        pageSize={8}
        emptyMessage="Aucun pointage enregistré."
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

      <TeacherMovementFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.onClose}
        onSubmit={handleSubmit}
        movement={selected}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Supprimer ce pointage ?"
        message={toDelete ? `Voulez-vous vraiment supprimer ce pointage de ${toDelete.prenom} ${toDelete.nom} ?` : ''}
      />
    </Box>
  );
}
