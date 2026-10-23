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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../common/PageHeader';
import SearchBar from '../common/SearchBar';
import DataTable from '../common/DataTable';
import ConfirmDialog from '../common/ConfirmDialog';
import StaffFormModal from './StaffFormModal';
import StaffViewModal from './StaffViewModal';
import { AxiosToken } from '../../api/Api';

const TEACHERS_KEY = ['teachers'];

const STATUS_COLORS = {
  actif: { bg: 'positive.50', color: 'positive.600' },
  'en congé': { bg: 'warning.50', color: 'warning.500' },
  inactif: { bg: 'danger.50', color: 'danger.500' },
};

const fetchTeachers = async () => {
  const { data } = await AxiosToken.get('/teacher');
  return data.teachers ?? [];
};

// row[roleFieldKey] can be a plain string, an array of strings, or
// (as the API returns for teachers) an array of { label } objects.
// Normalize all of them into a flat array of display strings.
function toRoleValues(raw) {
  if (Array.isArray(raw)) {
    return raw
      .map((v) => (typeof v === 'string' ? v : v?.label))
      .filter(Boolean);
  }
  return raw ? [raw] : [];
}

/**
 * Generic staff management page — encapsulates the CRUD logic
 * (search, filter, sort, pagination, add/edit/delete, toasts).
 *
 * @param {string} pageTitle
 * @param {string} entityLabel
 * @param {Array}  initialData
 * @param {string} roleFieldKey
 * @param {string} roleFieldLabel
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
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cinError, setCinError] = useState(false);

  const formModal = useDisclosure();
  const viewModal = useDisclosure();
  const deleteDialog = useDisclosure();

  // ---------- Query ----------
  const { data: teacherData, isLoading } = useQuery({
    queryKey: TEACHERS_KEY,
    queryFn: fetchTeachers,
    staleTime: 5 * 60 * 1000,
  });
  const teachers = teacherData ?? [];

  // ---------- Mutations ----------
  const saveMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      id
        ? AxiosToken.put(`/teacher/${id}`, payload)
        : AxiosToken.post('/teacher', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEACHERS_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => AxiosToken.delete(`/teacher/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEACHERS_KEY }),
  });

  // ---------- Filtering ----------
  const filteredPeople = useMemo(() => {
    const term = search.trim().toLowerCase();
    return teachers
      .filter((p) => {
        const matchesSearch =
          !term ||
          `${p.name ?? ''} ${p.last_name ?? ''} ${p.phone ?? ''}`
            .toLowerCase()
            .includes(term);
        const matchesRole =
          !roleFilter || toRoleValues(p[roleFieldKey]).includes(roleFilter);
        const matchesStatus = !statusFilter || p.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      })
      // display-only sequential number, computed after filtering
      .map((p, idx) => ({ ...p, displayNumber: idx + 1 }));
  }, [teachers, search, roleFilter, statusFilter, roleFieldKey]);

  // ---------- Modal openers ----------
  const openAddModal = () => {
    setSelectedPerson(null);
    setCinError(false);
    formModal.onOpen();
  };
  const openEditModal = (person) => {
    setSelectedPerson(person);
    setCinError(false);
    formModal.onOpen();
  };
  const openViewModal = (person) => {
    setSelectedPerson(person);
    viewModal.onOpen();
  };
  const askDelete = (person) => {
    setPersonToDelete(person);
    deleteDialog.onOpen();
  };

  // ---------- Handlers ----------
  const handleSubmit = async (formData) => {
    setIsSaving(true);
    setCinError(false);

    try {
      await saveMutation.mutateAsync({
        id: selectedPerson?.id,
        payload: formData,
      });

      toast({
        title: selectedPerson
          ? 'تم تحديث المعلم بنجاح'
          : 'تم إضافة المعلم بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      formModal.onClose();
    } catch (error) {
      const isCinConflict = error.response?.status === 400;
      if (isCinConflict) setCinError(true);

      toast({
        title: selectedPerson
          ? 'حدث خطأ أثناء تحديث المعلم'
          : 'حدث خطأ أثناء إضافة المعلم',
        description: isCinConflict
          ? 'رقم بطاقة التعريف غير صالح أو مستعمل'
          : 'حدث خطأ غير متوقع',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!personToDelete) return;
    setIsDeleting(true);

    try {
      await deleteMutation.mutateAsync(personToDelete.id);

      toast({
        title: 'تم حذف المعلم بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'حدث خطأ أثناء حذف المعلم',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      deleteDialog.onClose();
      setPersonToDelete(null);
    }
  };

  // ---------- Columns ----------
  const columns = [
    {
      key: 'displayNumber',
      label: '#',
      render: (row) => row.displayNumber,
    },
    {
      key: 'cin',
      label: 'رقم بطاقة التعريف',
      sortable: true,
    },
    {
      key: 'name',
      label: 'الاسم',
      sortable: true,
    },
    {
      key: 'last_name',
      label: 'اللقب',
      sortable: true,
    },
    {
      key: 'phone',
      label: 'رقم الهاتف',
    },
    {
      key: 'subject',
      label: 'المادة',
      sortable: true,
      render: (row) => {
        const values = toRoleValues(row[roleFieldKey]);

        if (!values.length) {
          return <Text color="ink.400" fontSize="sm">—</Text>;
        }

        return (
          <Wrap spacing={1}>
            {values.map((v) => (
              <Badge
                key={v}
                bg="ink.100"
                color="ink.700"
                borderRadius="full"
                px={2.5}
                fontWeight="600"
              >
                {v}
              </Badge>
            ))}
          </Wrap>
        );
      },
    },
    {
      key: 'price_by_hour',
      label: 'سعر الساعة',
      sortable: true,
      isNumeric: true,
      render: (row) =>
        `${Number(row.price_by_hour ?? 0).toLocaleString('fr-FR')} DT`,
    },
    ...(showStatus
      ? [
          {
            key: 'status',
            label: 'الحالة',
            sortable: true,
            render: (row) => {
              const c = STATUS_COLORS[row.status] || {
                bg: 'ink.100',
                color: 'ink.700',
              };

              return (
                <Badge bg={c.bg} color={c.color} borderRadius="full" px={2.5}>
                  {row.status}
                </Badge>
              );
            },
          },
        ]
      : []),
  ];

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
  };

  const selectSx = {
    textAlign: 'right',
    paddingRight: '1rem',
    paddingLeft: '2rem',
    '& + div': {
      insetInlineEnd: 'auto',
      insetInlineStart: '0.5rem',
    },
  };

  return (
    <Box dir="rtl">
      <PageHeader
        title={pageTitle}
        subtitle={` أعضاء الموظفين المسجلين ${teachers.length}`}
        actions={
          <>
            <Tooltip label="Export bientôt disponible" hasArrow>
              <IconButton
                aria-label="Exporter"
                icon={<Download size={17} />}
                variant="outline"
                isDisabled
              />
            </Tooltip>
            <Button leftIcon={<Plus size={17} />} onClick={openAddModal}>
              اضافة {entityLabel}
            </Button>
          </>
        }
      />

      <Wrap spacing={3} mb={5} align="center">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="ابحث بالاسم، أو اللقب، أو رقم الهاتف…"
        />

        <Select
          w={{ base: 'full', sm: '210px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          sx={selectSx}
        >
          <option value="">{`جميع — ${roleFieldLabel.toLowerCase()}`}</option>
          {roleOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
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
            sx={selectSx}
          >
            <option value="">جميع الحالات</option>
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        )}

        {(search || roleFilter || statusFilter) && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            إعادة ضبط
          </Button>
        )}

        <HStack spacing={1.5} ml="auto" color="ink.400">
          <Users size={15} />
          <Text fontSize="xs">{filteredPeople.length} نتيجة</Text>
        </HStack>
      </Wrap>

      <DataTable
        columns={columns}
        data={filteredPeople}
        pageSize={8}
        isLoading={isLoading}
        emptyMessage="لا توجد نتائج مطابقة لهذه المعايير."
        renderActions={(row) => (
          <HStack spacing={1}>
            <Tooltip label="Voir" hasArrow>
              <IconButton
                aria-label="Voir"
                icon={<Eye size={16} />}
                size="sm"
                variant="ghost"
                onClick={() => openViewModal(row)}
              />
            </Tooltip>
            <Tooltip label="Modifier" hasArrow>
              <IconButton
                aria-label="Modifier"
                icon={<Pencil size={16} />}
                size="sm"
                variant="ghost"
                onClick={() => openEditModal(row)}
              />
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
        cinError={cinError}
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
        title="تأكيد الحذف"
        message={
          personToDelete
            ? `هل أنت متأكد من حذف المعلم ${personToDelete.name} ${personToDelete.last_name}؟ لا يمكن التراجع عن هذا الإجراء.`
            : ''
        }
      />
    </Box>
  );
}