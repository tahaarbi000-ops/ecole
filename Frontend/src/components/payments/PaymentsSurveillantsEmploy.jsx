import { useEffect, useMemo, useState } from 'react';
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';
import { Wallet, CheckCircle2, Clock, CreditCard } from 'lucide-react';
import SearchBar from '../common/SearchBar';
import DataTable from '../common/DataTable';
import PaymentsSubNav from './PaymentsSubNav';
import { AxiosToken } from '../../api/Api';

const STATUS_COLORS = {
  'payé': { bg: 'positive.50', color: 'positive.600' },
  'غير مدفوع': { bg: 'accent.50', color: 'accent.500' },
  'en attente': { bg: 'warning.50', color: 'warning.500' },
};

const STATUS_LABELS = {
  'payé': 'مدفوع',
  'غير مدفوع': 'غير مدفوع',
  'en attente': 'قيد الانتظار',
};

const ARABIC_MONTHS = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const PERSON_TYPE_LABELS = {
  employ: 'عامل',
  supervisor: 'مشرف',
};

const selectSx = {
  textAlign: 'right',
  paddingRight: '1rem',
  paddingLeft: '2rem',
  '& + div': { insetInlineEnd: 'auto', insetInlineStart: '0.5rem' },
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

// month / year réels de la ligne (sur la ligne ou dans row.payment)
function rowYear(row) {
  return row.year ?? row.payment?.year;
}
function rowMonth(row) {
  return row.month ?? row.payment?.month;
}

// Clé "YYYY-MM" construite depuis les vrais champs month/year
function periodKey(row) {
  return `${rowYear(row)}-${pad2(rowMonth(row))}`;
}

// "YYYY-MM" -> "سبتمبر 2026"
function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return `${ARABIC_MONTHS[month - 1]} ${year}`;
}

export default function PaymentsStaff() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentPeriodKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;

  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState(currentYear);
  const [monthFilter, setMonthFilter] = useState(currentPeriodKey);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [payTarget, setPayTarget] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const payModal = useDisclosure();

  const fetchSalaries = async () => {
    setIsLoading(true);
    try {
      const response = await AxiosToken.get('/staff-payment/staff-salaries');
      setRows(response.data.salaries || []);
    } catch {
      toast({ title: 'تعذّر تحميل الرواتب', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableYears = useMemo(() => {
    const set = new Set(rows.map((r) => String(rowYear(r))));
    set.add(currentYear);
    return Array.from(set).sort().reverse();
  }, [rows, currentYear]);

  const availableMonths = useMemo(() => {
    const set = new Set(
      rows
        .filter((r) => !yearFilter || String(rowYear(r)) === yearFilter)
        .map((r) => periodKey(r))
    );
    return Array.from(set).sort().reverse();
  }, [rows, yearFilter]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch = !term || `${r.name} ${r.last_name}`.toLowerCase().includes(term);
      const matchesYear = !yearFilter || String(rowYear(r)) === yearFilter;
      const matchesMonth = !monthFilter || periodKey(r) === monthFilter;
      const matchesType = !typeFilter || r.person_type === typeFilter;
      const matchesStatus = !statusFilter || r.payment.status === statusFilter;
      return matchesSearch && matchesYear && matchesMonth && matchesType && matchesStatus;
    });
  }, [rows, search, yearFilter, monthFilter, typeFilter, statusFilter]);

  const totalPaye = useMemo(
    () => filtered.filter((r) => r.payment.status === 'payé').reduce((sum, r) => sum + Number(r.payment.amount), 0),
    [filtered]
  );
  const totalMasseSalariale = useMemo(
    () => filtered.reduce((sum, r) => sum + Number(r.total_salary), 0),
    [filtered]
  );
  const totalRestant = useMemo(
    () => filtered.filter((r) => r.payment.status !== 'payé').length,
    [filtered]
  );

  const askPay = (row) => {
    setPayTarget(row);
    payModal.onOpen();
  };

  const handleConfirmPay = async () => {
    if (!payTarget) return;
    setIsPaying(true);
    try {
      await AxiosToken.post('/staff-payment/staff-payments/confirm', {
        person_type: payTarget.person_type,
        person_id: payTarget.person_id,
        month: Number(rowMonth(payTarget)),
        year: Number(rowYear(payTarget)),
      });
      toast({
        title: 'تم تأكيد الدفع',
        description: `${payTarget.name} ${payTarget.last_name} — ${payTarget.total_salary?.toLocaleString('fr-FR')} د.ت`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      payModal.onClose();
      setPayTarget(null);
      fetchSalaries();
    } catch (error) {
      toast({
        title: 'تعذّر تأكيد الدفع',
        description: error?.response?.data?.message || '',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsPaying(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setYearFilter(currentYear);
    setMonthFilter(currentPeriodKey);
    setTypeFilter('');
    setStatusFilter('');
  };

  const columns = [
    { label: 'رقم بطاقة التعريف', sortable: true, render: (row) => row?.cin },
    { key: 'name', label: 'الاسم', sortable: true, render: (row) => `${row.name} ${row.last_name}` },
    {
      key: 'periode',
      label: 'الفترة',
      sortable: true,
      render: (row) => formatMonthLabel(periodKey(row)),
    },
    {
      key: 'person_type',
      label: 'الصنف',
      sortable: true,
      render: (row) => (
        <Badge bg="ink.100" color="ink.700" borderRadius="full" px={2.5}>
          {PERSON_TYPE_LABELS[row.person_type] || row.person_type}
          {row.role ? ` — ${row.role}` : ''}
        </Badge>
      ),
    },
    { key: 'base_salary', label: 'الراتب الأساسي', sortable: true, isNumeric: true, render: (row) => `${row.base_salary?.toLocaleString('fr-FR')} د.ت` },
    { key: 'absence_days', label: 'أيام الغياب', sortable: true, isNumeric: true },
    { key: 'total_salary', label: 'الصافي', sortable: true, isNumeric: true, render: (row) => `${row.total_salary?.toLocaleString('fr-FR')} د.ت` },
    {
      key: 'status',
      label: 'الحالة',
      sortable: true,
      render: (row) => {
        const c = STATUS_COLORS[row.payment.status] || { bg: 'ink.100', color: 'ink.700' };
        return (
          <Badge bg={c.bg} color={c.color} borderRadius="full" px={2.5}>
            {STATUS_LABELS[row.payment.status] || row.payment.status}
          </Badge>
        );
      },
    },
  ];

  return (
    <Box dir="rtl">
      <PaymentsSubNav />

      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={5} mb={6}>
        <Box bg="brand.600" borderRadius="2xl" p={5} color="white" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="whiteAlpha.800">إجمالي المدفوع</Text>
            <Wallet size={18} />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700">{totalPaye?.toLocaleString('fr-FR')} د.ت</Text>
          <Text fontSize="xs" color="whiteAlpha.700" mt={1}>
            {monthFilter ? formatMonthLabel(monthFilter) : yearFilter || 'كل الفترات'}
          </Text>
        </Box>

        <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="ink.500">كتلة الأجور (ضمن التحديد)</Text>
            <Icon as={CheckCircle2} boxSize={4.5} color="positive.500" />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700" color="ink.900">{totalMasseSalariale?.toLocaleString('fr-FR')} د.ت</Text>
          <Text fontSize="xs" color="ink.400" mt={1}>ضمن التحديد الحالي</Text>
        </Box>

        <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="ink.500">المدفوعات المتبقية</Text>
            <Icon as={Clock} boxSize={4.5} color="warning.500" />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700" color="ink.900">{totalRestant}</Text>
          <Text fontSize="xs" color="ink.400" mt={1}>قيد الانتظار (ضمن التحديد)</Text>
        </Box>
      </SimpleGrid>

      <Wrap spacing={3} mb={5} align="center">
        <SearchBar value={search} onChange={setSearch} placeholder="ابحث عن اسم…" />

        <Select
          w={{ base: 'full', sm: '140px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={yearFilter}
          onChange={(e) => { setYearFilter(e.target.value); setMonthFilter(''); }}
          sx={selectSx}
        >
          <option value="">جميع السنوات</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
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
          sx={selectSx}
        >
          <option value="">جميع الأشهر</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>{formatMonthLabel(m)}</option>
          ))}
        </Select>

        <Select
          w={{ base: 'full', sm: '150px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={selectSx}
        >
          <option value="">جميع الأصناف</option>
          <option value="employ">عامل</option>
          <option value="supervisor">مشرف</option>
        </Select>

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
          <option value="payé">مدفوع</option>
          <option value="غير مدفوع">غير مدفوع</option>
        </Select>

        {(search || typeFilter || statusFilter || yearFilter !== currentYear || monthFilter !== currentPeriodKey) && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            إعادة التعيين
          </Button>
        )}

        <HStack spacing={1.5} ml="auto" color="ink.400">
          <CreditCard size={15} />
          <Text fontSize="xs">{filtered.length} راتب(رواتب)</Text>
        </HStack>
      </Wrap>

      <DataTable
        columns={columns}
        data={filtered}
        pageSize={8}
        isLoading={isLoading}
        emptyMessage="لا توجد أي رواتب تطابق هذه المعايير."
        renderActions={(row) => (
          <Tooltip label="الدفع" hasArrow>
            <IconButton
              aria-label="الدفع"
              disabled={row.payment.status === 'en attente' || row.payment.status === 'payé'}
              icon={<Wallet size={16} />}
              size="sm"
              variant="ghost"
              color="positive.600"
              _hover={{ bg: 'positive.50' }}
              onClick={() => askPay(row)}
            />
          </Tooltip>
        )}
      />

      <Modal isOpen={payModal.isOpen} onClose={payModal.onClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>تأكيد الدفع</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="ink.600">
              هل تريد تأكيد الدفع لـ{' '}
              <Text as="span" fontWeight="700" color="ink.900">
                {payTarget ? `${payTarget.name} ${payTarget.last_name}` : ''}
              </Text>{' '}؟
            </Text>
            {payTarget && (
              <Text fontSize="xs" color="ink.400" mt={2}>{payTarget.total_salary?.toLocaleString('fr-FR')} د.ت</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={payModal.onClose}>إلغاء</Button>
            <Button colorScheme="green" onClick={handleConfirmPay} isLoading={isPaying}>تأكيد</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}