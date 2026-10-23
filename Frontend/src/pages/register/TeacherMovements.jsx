import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Button, HStack, Select, Badge, IconButton, Tooltip, useToast, useDisclosure, Text, Wrap } from '@chakra-ui/react';
import { Plus, Pencil, Trash2, LogIn, LogOut, ChevronRight, ChevronLeft } from 'lucide-react';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TeacherMovementFormModal from '../../components/register/TeacherMovementFormModal';
import { movementDirections } from '../../data/register';
import { AxiosToken } from '../../api/Api';

const PAGE_SIZE = 8;

const SENS_COLORS = {
  "دخول": { bg: 'positive.50', color: 'positive.600', icon: LogIn },
  "خروج": { bg: 'warning.50', color: 'warning.500', icon: LogOut },
};

const MONTHS = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const selectSx = {
  textAlign: 'right',
  paddingRight: '1rem',
  paddingLeft: '2rem',
  '& + div': {
    insetInlineEnd: 'auto',
    insetInlineStart: '0.5rem',
  },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const fetchScoring = async (params) => {
  const { data } = await AxiosToken.get('/scoring', { params });
  return data;
};

export default function TeacherMovements() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [sensFilter, setSensFilter] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const debouncedSearch = useDebounce(search);

  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();

  // back to page 1 whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sensFilter, year, month]);

  const params = {
    page,
    limit: PAGE_SIZE,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(sensFilter && { sense: sensFilter }),
    ...(year && { year }),
    ...(year && month && { month }),
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['scoring', params],
    queryFn: () => fetchScoring(params),
    placeholderData: (prev) => prev, // keep previous page while loading the next
  });

  const movements = data?.scoring ?? [];
  const years = data?.years ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  const saveMutation = useMutation({
    mutationFn: ({ id, formData }) =>
      id ? AxiosToken.put(`/scoring/${id}`, formData) : AxiosToken.post('/scoring', formData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['scoring'] });
      toast({
        title: id ? 'تم تعديل التسجيل' : 'تمت إضافة التسجيل',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      formModal.onClose();
      setSelected(null);
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: 'حدث خطأ أثناء الحفظ',
        description: error?.response?.data?.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => AxiosToken.delete(`/scoring/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring'] });
      toast({ title: 'تم حذف التسجيل', status: 'info', duration: 3000, isClosable: true });
      deleteDialog.onClose();
      setToDelete(null);
      // if we deleted the last row of the last page, go back one page
      if (movements.length === 1 && page > 1) setPage((p) => p - 1);
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: 'حدث خطأ أثناء الحذف',
        description: error?.response?.data?.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    },
  });

  const openAdd = () => { setSelected(null); formModal.onOpen(); };
  const openEdit = (m) => { setSelected(m); formModal.onOpen(); };
  const askDelete = (m) => { setToDelete(m); deleteDialog.onOpen(); };

  const handleSubmit = (formData) => saveMutation.mutate({ id: selected?.id, formData });
  const handleDelete = () => deleteMutation.mutate(toDelete.id);

  const resetFilters = () => {
    setSearch('');
    setSensFilter('');
    setYear('');
    setMonth('');
  };

  const hasFilters = search || sensFilter || year || month;

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
            <Badge textTransform="capitalize" bg={c.bg} color={c.color} borderRadius="full" px={2.5}>{row.sense}</Badge>
          </HStack>
        );
      },
    },
    { key: 'noticed', label: 'ملاحظة', render: (row) => row.noticed || row.remarque || <Text color="ink.400">—</Text> },
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

        <Select
          w={{ base: 'full', sm: '120px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            if (!e.target.value) setMonth('');
          }}
          sx={selectSx}
        >
          <option value="">كل السنوات</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>

        <Select
          w={{ base: 'full', sm: '140px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          isDisabled={!year}
          sx={selectSx}
        >
          <option value="">كل الأشهر</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </Select>

        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            إعادة التعيين
          </Button>
        )}
        <HStack spacing={1.5} ml="auto" color="ink.400">
          <Text fontSize="xs">{total} نتيجة(نتائج)</Text>
        </HStack>
        <Button leftIcon={<Plus size={17} />} onClick={openAdd}>تسجيل جديد</Button>
      </Wrap>

      <DataTable
        columns={columns}
        data={movements}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        serverPagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        onPageChange={setPage}
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
        onClose={() => { formModal.onClose(); setSelected(null); }}
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
        message={toDelete ? `هل تريد فعلاً حذف هذا التسجيل الخاص بـ ${toDelete.scoringTeacher?.name ?? ''} ${toDelete.scoringTeacher?.last_name ?? ''} ؟` : ''}
      />
    </Box>
  );
}