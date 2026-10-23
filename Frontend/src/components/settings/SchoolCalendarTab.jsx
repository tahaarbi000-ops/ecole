import { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  Button,
  Text,
  Badge,
  IconButton,
  Tooltip,
  useToast,
  useDisclosure,
} from '@chakra-ui/react';
import { Plus, Pencil, Trash2, CalendarDays, Palmtree } from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import SchoolYearFormModal from './SchoolYearFormModal';
import HolidayFormModal, { TERMS } from './HolidayFormModal';
import { AxiosToken } from '../../api/Api';

// 'YYYY-MM-DD' -> 'DD/MM/YYYY' (string based, no timezone shifts)
const fmt = (d) => (d ? d.split('-').reverse().join('/') : '');

// inclusive number of days between two 'YYYY-MM-DD' strings
const daysBetween = (s, e) =>
  Math.round((new Date(e) - new Date(s)) / 86400000) + 1;

const cardProps = {
  dir: 'rtl',
  bg: 'white',
  borderRadius: '2xl',
  p: 6,
  border: '1px solid',
  borderColor: 'ink.200',
  boxShadow: 'card',
};

export default function SchoolCalendarTab() {
  const toast = useToast();

  const [schoolYears, setSchoolYears] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);

  const [editingYear, setEditingYear] = useState(null);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [holidayTerm, setHolidayTerm] = useState(1);

  const [toDelete, setToDelete] = useState(null); // { type: 'year' | 'holiday', item }
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const yearModal = useDisclosure();
  const holidayModal = useDisclosure();
  const deleteDialog = useDisclosure();

  const fetchData = async () => {
    try {
      const [yearsRes, holidaysRes] = await Promise.all([
        AxiosToken.get('/school-year'),
        AxiosToken.get('/holiday'),
      ]);
      setSchoolYears(yearsRes.data);
      setHolidays(holidaysRes.data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'حدث خطأ أثناء جلب التقويم الدراسي',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // keep a valid selection: current school year first, otherwise the latest one
  useEffect(() => {
    if (schoolYears.length === 0) {
      setSelectedYearId(null);
      return;
    }
    if (schoolYears.some((y) => y.id === selectedYearId)) return;

    const today = new Date().toISOString().slice(0, 10);
    const current = schoolYears.find(
      (y) => y.start_date <= today && y.end_date >= today
    );
    setSelectedYearId((current || schoolYears[0]).id);
  }, [schoolYears, selectedYearId]);

  const selectedYear = schoolYears?.find((y) => y.id === selectedYearId) || null;

  const yearHolidays = selectedYear
    ? holidays?.filter(
        (h) =>
          h.start_date >= selectedYear.start_date &&
          h.end_date <= selectedYear.end_date
      )
    : [];

  const errorMessage = (error, fallback) =>
    error?.response?.data?.message || fallback;

  // ---------- school year actions ----------
  const openAddYear = () => {
    setEditingYear(null);
    yearModal.onOpen();
  };

  const openEditYear = (year) => {
    setEditingYear(year);
    yearModal.onOpen();
  };

  const handleSubmitYear = async (formData) => {
    setIsSaving(true);
    try {
      if (editingYear) {
        await AxiosToken.put(`/school-year/${editingYear.id}`, formData);
      } else {
        const res = await AxiosToken.post('/school-year', formData);
        setSelectedYearId(res.data.schoolYear.id);
      }

      toast({
        title: editingYear
          ? 'تم تعديل السنة الدراسية بنجاح'
          : 'تم إضافة السنة الدراسية بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await fetchData();
    } catch (error) {
      console.error(error);
      toast({
        title: errorMessage(error, 'حدث خطأ أثناء حفظ السنة الدراسية'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      throw error; // keeps the modal open
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- holiday actions ----------
  const openAddHoliday = (term) => {
    setEditingHoliday(null);
    setHolidayTerm(term);
    holidayModal.onOpen();
  };

  const openEditHoliday = (holiday) => {
    setEditingHoliday(holiday);
    setHolidayTerm(holiday.term);
    holidayModal.onOpen();
  };

  const handleSubmitHoliday = async (formData) => {
    setIsSaving(true);
    try {
      if (editingHoliday) {
        await AxiosToken.put(`/holiday/${editingHoliday.id}`, formData);
      } else {
        await AxiosToken.post('/holiday', formData);
      }

      toast({
        title: editingHoliday
          ? 'تم تعديل العطلة بنجاح'
          : 'تم إضافة العطلة بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await fetchData();
    } catch (error) {
      console.error(error);
      toast({
        title: errorMessage(error, 'حدث خطأ أثناء حفظ العطلة'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      throw error; // keeps the modal open
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- delete (year or holiday) ----------
  const askDelete = (type, item) => {
    setToDelete({ type, item });
    deleteDialog.onOpen();
  };

  const handleDelete = async () => {
    if (!toDelete) return;

    const { type, item } = toDelete;
    setIsDeleting(true);

    try {
      await AxiosToken.delete(
        type === 'year' ? `/school-year/${item.id}` : `/holiday/${item.id}`
      );

      toast({
        title:
          type === 'year'
            ? 'تم حذف السنة الدراسية بنجاح'
            : 'تم حذف العطلة بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      deleteDialog.onClose();
      setToDelete(null);
      await fetchData();
    } catch (error) {
      console.error(error);
      toast({
        title: errorMessage(error, 'حدث خطأ أثناء الحذف'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteTitle =
    toDelete?.type === 'year' ? 'حذف هذه السنة الدراسية؟' : 'حذف هذه العطلة؟';

  const deleteMessage = toDelete
    ? toDelete.type === 'year'
      ? `هل أنت متأكد من حذف السنة الدراسية ${toDelete.item.label}؟`
      : `هل أنت متأكد من حذف العطلة ${toDelete.item.label}؟`
    : '';

  return (
    <VStack spacing={6} align="stretch">
      {/* ---------------- School years ---------------- */}
      <Box {...cardProps}>
        <HStack justify="space-between" mb={1}>
          <Text fontFamily="heading" fontWeight="700" color="ink.900">
            السنوات الدراسية
          </Text>

          <Button size="sm" rightIcon={<Plus size={16} />} onClick={openAddYear}>
            إضافة سنة دراسية
          </Button>
        </HStack>

        <Text fontSize="sm" color="ink.500" mb={6}>
          حدد بداية ونهاية السنة الدراسية، ثم اختر سنة لإدارة عطلها.
        </Text>

        <TableContainer>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>السنة</Th>
                <Th>البداية</Th>
                <Th>النهاية</Th>
                <Th textAlign="left">الإجراءات</Th>
              </Tr>
            </Thead>

            <Tbody>
              {schoolYears.length === 0 && (
                <Tr>
                  <Td colSpan={4}>
                    <HStack justify="center" py={8} color="ink.400">
                      <CalendarDays size={18} />
                      <Text fontSize="sm">لم يتم تحديد أي سنة دراسية.</Text>
                    </HStack>
                  </Td>
                </Tr>
              )}

              {schoolYears.map((year) => {
                const isSelected = year.id === selectedYearId;
                return (
                  <Tr
                    key={year.id}
                    cursor="pointer"
                    bg={isSelected ? 'ink.50' : undefined}
                    _hover={{ bg: 'ink.50' }}
                    onClick={() => setSelectedYearId(year.id)}
                  >
                    <Td fontWeight="500" color="ink.800">
                      <HStack spacing={2}>
                        <Text>{year.label}</Text>
                        {isSelected && <Badge>محددة</Badge>}
                      </HStack>
                    </Td>
                    <Td color="ink.800">{fmt(year.start_date)}</Td>
                    <Td color="ink.800">{fmt(year.end_date)}</Td>

                    <Td onClick={(e) => e.stopPropagation()}>
                      <HStack justify="flex-start" spacing={1}>
                        <Tooltip label="تعديل" hasArrow>
                          <IconButton
                            aria-label="تعديل"
                            icon={<Pencil size={15} />}
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditYear(year)}
                          />
                        </Tooltip>

                      </HStack>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      {/* ---------------- Holidays by term ---------------- */}
      {TERMS.map((term) => {
        const termHolidays = yearHolidays.filter((h) => h.term === term.value);
        const hasHoliday = termHolidays.length > 0;

        return (
          <Box key={term.value} {...cardProps}>
            <HStack justify="space-between" mb={1}>
              <Text fontFamily="heading" fontWeight="700" color="ink.900">
                عطل {term.label}
              </Text>

              <Tooltip
                label="تم تحديد عطلة واحدة لهذا الثلاثي بالفعل"
                isDisabled={!selectedYear || !hasHoliday}
                hasArrow
              >
                <Button
                  size="sm"
                  rightIcon={<Plus size={16} />}
                  isDisabled={!selectedYear || hasHoliday}
                  onClick={() => openAddHoliday(term.value)}
                >
                  إضافة عطلة
                </Button>
              </Tooltip>
            </HStack>

            <Text fontSize="sm" color="ink.500" mb={6}>
              {selectedYear
                ? `السنة الدراسية ${selectedYear.label}`
                : 'اختر سنة دراسية أولاً.'}
            </Text>

            <TableContainer>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>العطلة</Th>
                    <Th>من</Th>
                    <Th>إلى</Th>
                    <Th isNumeric>عدد الأيام</Th>
                    <Th textAlign="left">الإجراءات</Th>
                  </Tr>
                </Thead>

                <Tbody>
                  {termHolidays.length === 0 && (
                    <Tr>
                      <Td colSpan={5}>
                        <HStack justify="center" py={8} color="ink.400">
                          <Palmtree size={18} />
                          <Text fontSize="sm">لا توجد عطل في هذا الثلاثي.</Text>
                        </HStack>
                      </Td>
                    </Tr>
                  )}

                  {termHolidays.map((holiday) => (
                    <Tr key={holiday.id} _hover={{ bg: 'ink.50' }}>
                      <Td fontWeight="500" color="ink.800">
                        {holiday.label}
                      </Td>
                      <Td color="ink.800">{fmt(holiday.start_date)}</Td>
                      <Td color="ink.800">{fmt(holiday.end_date)}</Td>
                      <Td isNumeric fontWeight="600" color="ink.900">
                        {daysBetween(holiday.start_date, holiday.end_date)}
                      </Td>

                      <Td>
                        <HStack justify="flex-start" spacing={1}>
                          <Tooltip label="تعديل" hasArrow>
                            <IconButton
                              aria-label="تعديل"
                              icon={<Pencil size={15} />}
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditHoliday(holiday)}
                            />
                          </Tooltip>

                          
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        );
      })}

      <SchoolYearFormModal
        isOpen={yearModal.isOpen}
        onClose={yearModal.onClose}
        onSubmit={handleSubmitYear}
        schoolYear={editingYear}
        isSaving={isSaving}
      />

      <HolidayFormModal
        isOpen={holidayModal.isOpen}
        onClose={holidayModal.onClose}
        onSubmit={handleSubmitHoliday}
        holiday={editingHoliday}
        defaultTerm={holidayTerm}
        schoolYear={selectedYear}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={deleteTitle}
        message={deleteMessage}
      />
    </VStack>
  );
}