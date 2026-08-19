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
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StudentFormModal from '../components/students/StudentFormModal';
import StudentViewModal from '../components/students/StudentViewModal';
import { students as initialStudents } from '../data/students';
import { levels } from '../data/school';

const GENDER_LABEL = { M: 'Garçon', F: 'Fille' };

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

export default function Students() {
  const toast = useToast();
  const [students, setStudents] = useState(initialStudents);

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formModal = useDisclosure();
  const viewModal = useDisclosure();
  const deleteDialog = useDisclosure();

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchesSearch =
        !term ||
        `${s.nom} ${s.prenom} ${s.localisation}`.toLowerCase().includes(term);
      const matchesLevel = !levelFilter || s.niveau === levelFilter;
      const matchesGender = !genderFilter || s.sexe === genderFilter;
      return matchesSearch && matchesLevel && matchesGender;
    });
  }, [students, search, levelFilter, genderFilter]);

  const openAddModal = () => {
    setSelectedStudent(null);
    formModal.onOpen();
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    formModal.onOpen();
  };

  const openViewModal = (student) => {
    setSelectedStudent(student);
    viewModal.onOpen();
  };

  const askDelete = (student) => {
    setStudentToDelete(student);
    deleteDialog.onOpen();
  };

  const handleSubmit = (formData) => {
    setIsSaving(true);
    // Simule la latence d'un futur appel API (createStudent / updateStudent).
    setTimeout(() => {
      if (selectedStudent) {
        setStudents((prev) => prev.map((s) => (s.id === selectedStudent.id ? { ...s, ...formData } : s)));
        toast({ title: 'Élève modifié avec succès', status: 'success', duration: 3000, isClosable: true });
      } else {
        const newStudent = { ...formData, id: Math.max(0, ...students.map((s) => s.id)) + 1 };
        setStudents((prev) => [newStudent, ...prev]);
        toast({ title: 'Élève ajouté avec succès', status: 'success', duration: 3000, isClosable: true });
      }
      setIsSaving(false);
      formModal.onClose();
    }, 700);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
      toast({ title: 'Élève supprimé', status: 'info', duration: 3000, isClosable: true });
      setIsDeleting(false);
      deleteDialog.onClose();
      setStudentToDelete(null);
    }, 600);
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'nom', label: 'Nom', sortable: true },
    { key: 'prenom', label: 'Prénom', sortable: true },
    {
      key: 'sexe',
      label: 'Sexe',
      sortable: true,
      render: (row) => (
        <Badge
          bg={row.sexe === 'M' ? 'brand.50' : 'accent.50'}
          color={row.sexe === 'M' ? 'brand.700' : 'accent.500'}
          borderRadius="full"
          px={2.5}
        >
          {GENDER_LABEL[row.sexe]}
        </Badge>
      ),
    },
    { key: 'dateNaissance', label: 'Naissance', sortable: true, render: (row) => formatDate(row.dateNaissance) },
    {
      key: 'niveau',
      label: 'Niveau',
      sortable: true,
      render: (row) => (
        <Badge bg="ink.100" color="ink.700" borderRadius="full" px={2.5} fontWeight="600">
          {row.niveau}
        </Badge>
      ),
    },
    { key: 'localisation', label: 'Localisation' },
  ];

  return (
    <Box>
      <PageHeader
        title="Élèves"
        subtitle={`${students.length} élèves inscrits — année ${new Date().getFullYear()}`}
        actions={
          <>
            <Tooltip label="Export bientôt disponible" hasArrow>
              <IconButton aria-label="Exporter" icon={<Download size={17} />} variant="outline" isDisabled />
            </Tooltip>
            <Button leftIcon={<Plus size={17} />} onClick={openAddModal}>
              Ajouter un élève
            </Button>
          </>
        }
      />

      <Wrap spacing={3} mb={5} align="center">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par nom, prénom, localisation…" />

        <Select
          w={{ base: 'full', sm: '190px' }}
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
          w={{ base: 'full', sm: '150px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
        >
          <option value="">Tous les sexes</option>
          <option value="M">Garçons</option>
          <option value="F">Filles</option>
        </Select>

        {(search || levelFilter || genderFilter) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setSearch(''); setLevelFilter(''); setGenderFilter(''); }}
          >
            Réinitialiser
          </Button>
        )}

        <HStack spacing={1.5} ml="auto" color="ink.400">
          <Users size={15} />
          <Text fontSize="xs">{filteredStudents.length} résultat(s)</Text>
        </HStack>
      </Wrap>

      <DataTable
        columns={columns}
        data={filteredStudents}
        pageSize={8}
        emptyMessage="Aucun élève ne correspond à ces critères."
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

      <StudentFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.onClose}
        onSubmit={handleSubmit}
        student={selectedStudent}
        isSaving={isSaving}
      />

      <StudentViewModal
        isOpen={viewModal.isOpen}
        onClose={viewModal.onClose}
        student={selectedStudent}
        onEdit={openEditModal}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Supprimer cet élève ?"
        message={
          studentToDelete
            ? `Voulez-vous vraiment supprimer ${studentToDelete.prenom} ${studentToDelete.nom} ? Cette action est irréversible.`
            : ''
        }
      />
    </Box>
  );
}
