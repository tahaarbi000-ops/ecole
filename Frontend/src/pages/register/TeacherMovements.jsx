import { useMemo, useState } from 'react';
import { Box, Button, HStack, Select, Badge, IconButton, Tooltip, useToast, useDisclosure, Text, Wrap } from '@chakra-ui/react';
import { Plus, Pencil, Trash2, LogIn, LogOut } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TeacherMovementFormModal from '../../components/register/TeacherMovementFormModal';
import { movementDirections } from '../../data/register';
import { AxiosToken } from '../../api/Api';

const SCORING_KEY = ['scoring'];

const SENS_COLORS = {
  "دخول": { bg: 'positive.50', color: 'positive.600', icon: LogIn },
  "خروج": { bg: 'warning.50', color: 'warning.500', icon: LogOut },
};

const fetchScoring = async () => {
  const { data } = await AxiosToken.get('/scoring');
  return data.scoring ?? [];
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

const selectSx = {
  textAlign: 'right',
  paddingRight: '1rem',
  paddingLeft: '2rem',
  '& + div': {
    insetInlineEnd: 'auto',
    insetInlineStart: '0.5rem',
  },
};

export default function TeacherMovements() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [sensFilter, setSensFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();

  // ---------- Query ----------
  const { data, isLoading } = useQuery({
    queryKey: SCORING_KEY,
    queryFn: fetchScoring,
  });
  const movements = data ?? [];

  // ---------- Mutations ----------
  const saveMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      id
        ? AxiosToken.put(`/scoring/${id}`, payload)
        : AxiosToken.post('/scoring', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCORING_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => AxiosToken.delete(`/scoring/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCORING_KEY }),
  });

  // ---------- Filtering ----------
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return movements.filter((m) => {
      const matchesSearch =
        !term ||
        `${m.scoringTeacher?.name ?? ''} ${m.scoringTeacher?.last_name ?? ''} ${m.noticed ?? ''}`
          .toLowerCase()
          .includes(term);
      const matchesSens = !sensFilter || m.sense === sensFilter;
      return matchesSearch && matchesSens;
    });
  }, [movements, search, sensFilter]);

  const openAdd = () => { setSelected(null); formModal.onOpen(); };
  const openEdit = (m) => { setSelected(m); formModal.onOpen(); };
  const askDelete = (m) => { setToDelete(m); deleteDialog.onOpen(); };

  // ---------- Handlers ----------
  // Returns true on success, false on failure (the modal uses this to decide whether to reset)
  const handleSubmit = async (formData) => {
    try {
      await saveMutation.mutateAsync({ id: selected?.id, payload: formData });
      toast({
        title: selected ? 'تم تحديث التسجيل بنجاح' : 'تم إضافة التسجيل بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      formModal.onClose();
      return true;
    } catch {
      toast({
        title: selected ? 'حدث خطأ أثناء تحديث التسجيل' : 'حدث خطأ أثناء إضافة التسجيل',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast({ title: 'تم حذف التسجيل', status: 'info', duration: 3000, isClosable: true });
    } catch {
      toast({ title: 'حدث خطأ أثناء حذف التسجيل', status: 'error', duration: 3000, isClosable: true });
    } finally {
      deleteDialog.onClose();
      setToDelete(null);
    }
  };

  // ---------- Columns ----------
  const columns = [
    { key: 'date', label: 'التاريخ', sortable: true, render: (row) => formatDate(row.date) },
    { key: 'time', label: 'الوقت', sortable: true },
    { key: 'name', label: 'الاسم', sortable: true, render: (row) => row.scoringTeacher?.name },
    { key: 'last_name', label: 'اللقب', sortable: true, render: (row) => row.scoringTeacher?.last_name },
    {
      key: 'sense',
      label: 'الاتجاه',
      sortable: true,
      render: (row) => {
        const c = SENS_COLORS[row.sense] || SENS_COLORS['دخول'];
        return (
          <HStack spacing={1.5}>
            <c.icon size={13} color={`var(--chakra-colors-${c.color.replace('.', '-')})`} />
            <Badge textTransform="capitalize" bg={c.bg} color={c.color} borderRadius="full" px={2.5}>
              {row.sense}
            </Badge>
          </HStack>
        );
      },
    },
    { key: 'noticed', label: 'ملاحظة', render: (row) => row.noticed || <Text color="ink.400">—</Text> },
  ];

  return (
    <Box dir="rtl">
      <Wrap spacing={3} mb={5} align="center">
        <SearchBar value={search} onChange={setSearch} placeholder="ابحث عن معلّم أو ملاحظة…" />
        <Select
          w={{ base: 'full', sm: '160px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={sensFilter}
          onChange={(e) => setSensFilter(e.target.value)}
          sx={selectSx}
        >
          <option value="">الدخول والخروج</option>
          {movementDirections.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
        {(search || sensFilter) && (
          <Button size="sm" variant="ghost" onClick={() => { setSearch(''); setSensFilter(''); }}>
            إعادة التعيين
          </Button>
        )}
        <HStack spacing={1.5} ml="auto" color="ink.400">
          <Text fontSize="xs">{filtered.length} نتيجة(نتائج)</Text>
        </HStack>
        <Button leftIcon={<Plus size={17} />} onClick={openAdd}>تسجيل جديد</Button>
      </Wrap>

      <DataTable
        columns={columns}
        data={filtered}
        pageSize={8}
        isLoading={isLoading}
        emptyMessage="لا يوجد أي تسجيل حضور."
        renderActions={(row) => (
          <HStack spacing={1}>
            <Tooltip label="تعديل" hasArrow>
              <IconButton aria-label="تعديل" icon={<Pencil size={16} />} size="sm" variant="ghost" onClick={() => openEdit(row)} />
            </Tooltip>
            <Tooltip label="حذف" hasArrow>
              <IconButton aria-label="حذف" icon={<Trash2 size={16} />} size="sm" variant="ghost" color="danger.500" _hover={{ bg: 'danger.50' }} onClick={() => askDelete(row)} />
            </Tooltip>
          </HStack>
        )}
      />

      <TeacherMovementFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.onClose}
        onSubmit={handleSubmit}
        scoring={selected}
        isSaving={saveMutation.isPending}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="هل تريد حذف هذا التسجيل؟"
        message={
          toDelete
            ? `هل تريد فعلاً حذف هذا التسجيل الخاص بـ ${toDelete.scoringTeacher?.name ?? ''} ${toDelete.scoringTeacher?.last_name ?? ''} ؟`
            : ''
        }
      />
    </Box>
  );
}