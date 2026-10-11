import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  HStack,
  VStack,
  Select,
  Badge,
  IconButton,
  Tooltip,
  useToast,
  useDisclosure,
  Text,
  Wrap,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Pencil, Trash2, Download, Users, RefreshCcw, FileText, FileSpreadsheet } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StudentFormModal from '../components/students/StudentFormModal';
import StudentViewModal from '../components/students/StudentViewModal';
import { levels } from '../data/school';
import { AxiosToken } from '../api/Api';
import ReenrollModal from '../components/students/ReenrollModal';

const EMPTY = [];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

// ---- API functions ----
const fetchStudents = async () => {
  const { data } = await AxiosToken.get('/student');
  return data.students ?? [];
};

const fetchAcademicYear = async () => {
  const { data } = await AxiosToken.get('/school-info');
  return data?.schoolInfo?.[0]?.academic_year ?? '';
};

export default function Students() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [studentToReenroll, setStudentToReenroll] = useState(null);
  const [reenrollStatus, setReenrollStatus] = useState('');

  const [exportLevel, setExportLevel] = useState('');
  const [uniqueIsError, setUniqueIsError] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const formModal = useDisclosure();
  const viewModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const reenrollModal = useDisclosure();
  const exportModal = useDisclosure();

  // ---- Queries ----
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
    staleTime: 5 * 60 * 1000,
  });
  const students = studentsData ?? EMPTY;

  const { data: yearAcademy = '' } = useQuery({
    queryKey: ['school-info', 'academic-year'],
    queryFn: fetchAcademicYear,
    staleTime: 30 * 60 * 1000,
  });

  // ---- Mutations ----
  const saveMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      id ? AxiosToken.put(`/student/${id}`, payload) : AxiosToken.post('/student', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => AxiosToken.delete(`/student/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  const reenrollMutation = useMutation({
    mutationFn: ({ id, status }) => AxiosToken.post(`/student/${id}/reenroll`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  // React Query v5: isPending. On v4 use isLoading instead.
  const isSaving = saveMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isReenrolling = reenrollMutation.isPending;

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students
      .filter((s) => {
        const matchesSearch =
          !term || `${s.name} ${s.last_name} ${s.address}`.toLowerCase().includes(term);
        const matchesLevel = !levelFilter || s.class === levelFilter;
        const matchesGender = !genderFilter || s.gender === genderFilter;
        return matchesSearch && matchesLevel && matchesGender;
      })
      .map((p, idx) => ({ ...p, displayNumber: idx + 1 }));
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

  const askReenroll = (student) => {
    setStudentToReenroll(student);
    setReenrollStatus('');
    reenrollModal.onOpen();
  };

  const handleSubmit = async (formData, { resetForm }) => {
    setUniqueIsError(false);
    const isEdit = !!selectedStudent;

    try {
      await saveMutation.mutateAsync({ id: selectedStudent?.id, payload: formData });
      toast({
        title: isEdit ? 'تم تعديل التلميذ بنجاح' : 'تم إضافة التلميذ بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      resetForm();
      formModal.onClose();
      setSelectedStudent(null);
    } catch (error) {
      if (error.response?.status) {
        setUniqueIsError(true);
      }
      toast({
        title: 'حدث خطأ أثناء حفظ بيانات التلميذ',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(studentToDelete.id);
      toast({
        title: 'تم حذف التلميذ بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'حدث خطأ أثناء حذف التلميذ',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      deleteDialog.onClose();
      setStudentToDelete(null);
    }
  };

  const handleReenroll = async () => {
    if (!reenrollStatus) return;
    try {
      await reenrollMutation.mutateAsync({ id: studentToReenroll.id, status: reenrollStatus });
      toast({
        title:
          reenrollStatus === 'ناجح'
            ? 'تم تسجيل نجاح التلميذ وإعادة تسجيله للسنة القادمة'
            : 'تم تسجيل رسوب التلميذ وإعادة تسجيله لنفس المستوى',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'حدث خطأ أثناء إعادة تسجيل التلميذ',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      reenrollModal.onClose();
      setStudentToReenroll(null);
      setReenrollStatus('');
    }
  };

  const handleExport = async (format) => {
    try {
      setIsExporting(true);

      const response = await AxiosToken.get('/download/students', {
        params: { format, level: exportLevel },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type:
          format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `students${exportLevel ? `-${exportLevel}` : ''}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      exportModal.onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل بيانات التلاميذ',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    { key: 'displayNumber', label: '#', sortable: false, render: (row) => row.displayNumber },
    { key: 'unique_id', label: 'المعرف الوحيد', sortable: true, render: (row) => row?.unique_id || '-' },
    { key: 'name', label: 'الاسم', sortable: true },
    { key: 'last_name', label: 'اللقب', sortable: true },
    {
      key: 'gender',
      label: 'الجنس',
      sortable: true,
      render: (row) => (
        <Badge
          bg={row.gender === 'بنت' ? 'brand.50' : 'accent.50'}
          color={row.gender === 'ولد' ? 'brand.700' : 'accent.500'}
          borderRadius="full"
          px={2.5}
        >
          {row.gender}
        </Badge>
      ),
    },
    { key: 'birthday', label: 'تاريخ الميلاد', sortable: true, render: (row) => formatDate(row.birthday) },
    {
      key: 'class',
      label: 'الاقسام',
      sortable: true,
      render: (row) => (
        <Badge bg="ink.100" color="ink.700" borderRadius="full" px={2.5} fontWeight="600">
          {row.class}
        </Badge>
      ),
    },
    { key: 'address', label: 'العنوان' },
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

  return (
    <Box dir="rtl">
      <PageHeader
        title="التلاميذ"
        subtitle={
          <>
            <span dir="ltr">{students.length}</span>
            {' '}
            الطلاب المسجلين
            {' '}
            <span dir="ltr">{yearAcademy || '-'}</span>
          </>
        }
        actions={
          <>
            <Button
              leftIcon={<Download size={17} />}
              variant="outline"
              onClick={() => {
                setExportLevel('');
                exportModal.onOpen();
              }}
            >
              تحميل
            </Button>
            <Button leftIcon={<Plus size={17} />} onClick={openAddModal}>
              إضافة تلميذ
            </Button>
          </>
        }
      />

      <Wrap spacing={3} mb={5} align="center" dir="rtl">
        <SearchBar value={search} onChange={setSearch} placeholder="ابحث بالاسم، أو اللقب، أو الموقع..." />

        <Select
          w={{ base: 'full', sm: '190px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          dir="rtl"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          sx={selectSx}
        >
          <option value="">جميع الاقسام </option>
          {levels.map((lvl) => (
            <option key={lvl} value={lvl}>{lvl}</option>
          ))}
        </Select>

        <Select
          dir="rtl"
          w={{ base: 'full', sm: '190px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          sx={selectSx}
        >
          <option value="">كل الأجناس</option>
          <option value="ولد">ولد</option>
          <option value="بنت">بنت</option>
        </Select>

        {(search || levelFilter || genderFilter) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setSearch(''); setLevelFilter(''); setGenderFilter(''); }}
          >
            إعادة ضبط
          </Button>
        )}

        <HStack spacing={1.5} ml="auto" color="ink.400">
          <Users size={15} />
          <Text fontSize="xs">{filteredStudents.length} نتيجة</Text>
        </HStack>
      </Wrap>

      <DataTable
        columns={columns}
        data={filteredStudents}
        pageSize={8}
        isLoading={isLoading}
        emptyMessage="لا يوجد طالب يستوفي هذه المعايير."
        renderActions={(row) => (
          <HStack spacing={1}>
            <Tooltip label="عرض" hasArrow>
              <IconButton aria-label="عرض" icon={<Eye size={16} />} size="sm" variant="ghost" onClick={() => openViewModal(row)} />
            </Tooltip>
            <Tooltip label="إعادة تسجيل للسنة القادمة" hasArrow>
              <IconButton
                aria-label="إعادة تسجيل"
                icon={<RefreshCcw size={16} />}
                size="sm"
                variant="ghost"
                color="brand.600"
                isDisabled={true}
                _hover={{ bg: 'brand.50' }}
                onClick={() => askReenroll(row)}
              />
            </Tooltip>
            <Tooltip label="تعديل" hasArrow>
              <IconButton aria-label="تعديل" icon={<Pencil size={16} />} size="sm" variant="ghost" onClick={() => openEditModal(row)} />
            </Tooltip>
            <Tooltip label="حذف" hasArrow>
              <IconButton
                aria-label="حذف"
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
        uniqueIsError={uniqueIsError}
        setUniqueIsError={setUniqueIsError}
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
        title="حذف هذا التلميذ؟"
        message={
          studentToDelete
            ? `هل أنت متأكد من حذف التلميذ ${studentToDelete.last_name} ${studentToDelete.name}؟ هذا الإجراء لا يمكن التراجع عنه.`
            : ''
        }
      />

      <Modal isOpen={exportModal.isOpen} onClose={exportModal.onClose} isCentered dir="rtl">
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>تحميل بيانات التلاميذ</ModalHeader>
          <ModalCloseButton insetInlineStart={3} insetInlineEnd="auto" />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel fontSize="sm">اختر القسم / المستوى</FormLabel>
                <Select
                  dir="rtl"
                  value={exportLevel}
                  onChange={(e) => setExportLevel(e.target.value)}
                  sx={selectSx}
                >
                  <option value="">جميع المستويات</option>
                  {levels.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2} w="full">
              <Button
                flex={1}
                leftIcon={<FileText size={16} />}
                colorScheme="red"
                variant="outline"
                isLoading={isExporting}
                onClick={() => handleExport('pdf')}
                isDisabled
              >
                تحميلPDF
              </Button>
              <Button
                flex={1}
                leftIcon={<FileSpreadsheet size={16} />}
                colorScheme="green"
                variant="outline"
                isLoading={isExporting}
                onClick={() => handleExport('excel')}
              >
                تحميل Excel
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ReenrollModal
        reenrollModal={reenrollModal}
        studentToReenroll={studentToReenroll}
        isReenrolling={isReenrolling}
        onConfirm={handleReenroll}
      />
    </Box>
  );
}