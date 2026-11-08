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
  VStack,
  Divider,
} from '@chakra-ui/react';
import { Wallet, CheckCircle2, Clock, CreditCard, History as HistoryIcon } from 'lucide-react';
import SearchBar from '../common/SearchBar';
import DataTable from '../common/DataTable';
import PaymentsSubNav from './PaymentsSubNav';
import { paymentStatuses } from '../../data/payments';
import { AxiosToken } from '../../api/Api';

const STATUS_COLORS = {
  payé: { bg: 'positive.50', color: 'positive.600' },
  'non payé': { bg: 'accent.50', color: 'accent.500' },
  'en attente': { bg: 'warning.50', color: 'warning.500' },
};

const STATUS_LABELS = {
  payé: 'مدفوع',
  'non payé': 'غير مدفوع',
  'en attente': 'قيد الانتظار',
};

const ARABIC_MONTHS = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const selectSx = {
  textAlign: 'right',
  paddingRight: '1rem',
  paddingLeft: '2rem',
  '& + div': { insetInlineEnd: 'auto', insetInlineStart: '0.5rem' },
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

// "YYYY-MM" built from the real month/year fields of the payroll row (NOT createdAt)
function periodKey(payment) {
  return `${payment.year}-${pad2(payment.month)}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

// "2026-09" -> "سبتمبر 2026"
function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return `${ARABIC_MONTHS[month - 1]} ${year}`;
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} د.ت`;
}

// Safety net for legacy rows written with the typo "no payé"
function normalizeStatus(status) {
  return status === 'no payé' ? 'non payé' : status;
}

// Works with both API shapes: nested `paymentTeacher` or flat name/last_name
function teacherName(p) {
  const name = p.paymentTeacher?.name ?? p.name ?? '';
  const lastName = p.paymentTeacher?.last_name ?? p.last_name ?? '';
  return `${name} ${lastName}`.trim();
}

function paymentId(p) {
  return p.id ?? p.payment_id;
}

export default function PaymentsMaitres() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentPeriodKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;

  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState(currentYear);
  const [monthFilter, setMonthFilter] = useState(currentPeriodKey);
  const [statusFilter, setStatusFilter] = useState('');

  const [payTarget, setPayTarget] = useState(null);
  const [historyPerson, setHistoryPerson] = useState(null);
  const [isPaying, setIsPaying] = useState(false);

  const payModal = useDisclosure();
  const historyModal = useDisclosure();

  // Load ALL months (no month/year params), filtering happens on the client
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await AxiosToken.get('/teacher-payment');
        const rows = (response.data.payments || []).map((p) => ({
          ...p,
          status: normalizeStatus(p.status),
        }));
        setPayments(rows);
      } catch {
        toast({ title: 'خطأ أثناء تحميل المدفوعات', status: 'error', duration: 3000, isClosable: true });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableYears = useMemo(() => {
    const set = new Set(payments.map((p) => String(p.year)));
    set.add(currentYear);
    return Array.from(set).sort().reverse();
  }, [payments, currentYear]);

  const availableMonths = useMemo(() => {
    const set = new Set(
      payments
        .filter((p) => !yearFilter || String(p.year) === yearFilter)
        .map((p) => periodKey(p))
    );
    // keep the current month selectable even if it has no rows yet
    if (!yearFilter || yearFilter === currentYear) set.add(currentPeriodKey);
    return Array.from(set).sort().reverse();
  }, [payments, yearFilter, currentYear, currentPeriodKey]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((p) => {
      const matchesSearch = !term || teacherName(p).toLowerCase().includes(term);
      const matchesYear = !yearFilter || String(p.year) === yearFilter;
      const matchesMonth = !monthFilter || periodKey(p) === monthFilter;
      const matchesStatus = !statusFilter || p.status === statusFilter;
      return matchesSearch && matchesYear && matchesMonth && matchesStatus;
    });
  }, [payments, search, yearFilter, monthFilter, statusFilter]);

  const selectedPeriodKey = monthFilter || currentPeriodKey;

  // Total actually paid (status "payé") in the selected month
  const totalEncaisseCeMois = useMemo(
    () =>
      payments
        .filter((p) => periodKey(p) === selectedPeriodKey && p.status === 'payé')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments, selectedPeriodKey]
  );

  // Total due (all statuses) within the current filter
  const totalDuFiltre = useMemo(
    () => filtered.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [filtered]
  );

  const totalPayeFiltre = useMemo(
    () => filtered.filter((p) => p.status === 'payé').reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [filtered]
  );

  const totalRestantFiltre = useMemo(
    () => filtered.filter((p) => p.status !== 'payé').length,
    [filtered]
  );

  const historyRows = useMemo(() => {
    if (!historyPerson) return [];
    return payments
      .filter((p) => p.teacher_id === historyPerson.teacher_id)
      .sort((a, b) => (b.year - a.year) || (b.month - a.month));
  }, [payments, historyPerson]);

  const askPay = (p) => { setPayTarget(p); payModal.onOpen(); };
  const openHistory = (p) => { setHistoryPerson(p); historyModal.onOpen(); };

  const handleConfirmPay = async () => {
    if (!payTarget) return;
    setIsPaying(true);
    try {
      const id = paymentId(payTarget);
      const response = await AxiosToken.patch(`/teacher-payments/${id}/pay`);
      const updated = response.data.payment;

      setPayments((prev) =>
        prev.map((p) =>
          paymentId(p) === id
            ? { ...p, ...(updated || {}), status: normalizeStatus(updated?.status ?? 'payé') }
            : p
        )
      );

      toast({
        title: 'تم تأكيد الدفع',
        description: `${teacherName(payTarget)} — ${formatMoney(payTarget.amount)}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      payModal.onClose();
      setPayTarget(null);
    } catch {
      toast({ title: 'فشل تأكيد الدفع', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsPaying(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setYearFilter(currentYear);
    setMonthFilter(currentPeriodKey);
    setStatusFilter('');
  };

  const columns = [
    { key: 'cin', label: 'رقم بطاقة التعريف', sortable: true, render: (row) => row?.cin || row?.paymentTeacher?.cin || '—' },
    { key: 'maitre', label: 'المعلم', sortable: true, render: (row) => teacherName(row) },
    { key: 'periode', label: 'الفترة', sortable: true, render: (row) => formatMonthLabel(periodKey(row)) },
    { key: 'hour_count', label: 'عدد الساعات', sortable: true, render: (row) => Number(row.hour_count || 0) },
    { key: 'amount', label: 'المبلغ', sortable: true, isNumeric: true, render: (row) => formatMoney(row.amount) },
    {
      key: 'status',
      label: 'الحالة',
      sortable: true,
      render: (row) => {
        const c = STATUS_COLORS[row.status] || { bg: 'ink.100', color: 'ink.700' };
        return (
          <Badge bg={c.bg} color={c.color} borderRadius="full" px={2.5}>
            {STATUS_LABELS[row.status] || row.status}
          </Badge>
        );
      },
    },
  ];

  const hasActiveFilters =
    search || yearFilter !== currentYear || monthFilter !== currentPeriodKey || statusFilter;

  return (
    <Box dir="rtl">
      <PaymentsSubNav />

      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={5} mb={6}>
        <Box bg="brand.600" borderRadius="2xl" p={5} color="white" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="whiteAlpha.800">إجمالي المحصّل لهذا الشهر</Text>
            <Wallet size={18} />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700">{formatMoney(totalEncaisseCeMois)}</Text>
          <Text fontSize="xs" color="whiteAlpha.700" mt={1}>{formatMonthLabel(selectedPeriodKey)}</Text>
        </Box>

        <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="ink.500">إجمالي المدفوع (مُصفّى)</Text>
            <Icon as={CheckCircle2} boxSize={4.5} color="positive.500" />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700" color="ink.900">{formatMoney(totalPayeFiltre)}</Text>
          <Text fontSize="xs" color="ink.400" mt={1}>من أصل {formatMoney(totalDuFiltre)}</Text>
        </Box>

        <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="ink.500">المدفوعات المتبقية</Text>
            <Icon as={Clock} boxSize={4.5} color="warning.500" />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700" color="ink.900">{totalRestantFiltre}</Text>
          <Text fontSize="xs" color="ink.400" mt={1}>غير مدفوعة (ضمن التحديد)</Text>
        </Box>
      </SimpleGrid>

      <Wrap spacing={3} mb={5} align="center">
        <SearchBar value={search} onChange={setSearch} placeholder="ابحث عن معلم…" />

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
          {paymentStatuses.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
          ))}
        </Select>

        {hasActiveFilters && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            إعادة التعيين
          </Button>
        )}

        <HStack spacing={1.5} marginInlineStart="auto" color="ink.400">
          <CreditCard size={15} />
          <Text fontSize="xs">{filtered.length} دفعة(ات)</Text>
        </HStack>
      </Wrap>

      <DataTable
        columns={columns}
        data={filtered}
        pageSize={8}
        isLoading={isLoading}
        emptyMessage="لا توجد أي مدفوعات تطابق هذه المعايير."
        renderActions={(row) => (
          <HStack spacing={1}>
            <Tooltip label="الدفع" hasArrow>
              <IconButton
                aria-label="الدفع"
                isDisabled={row.status !== 'non payé'}
                icon={<Wallet size={16} />}
                size="sm"
                variant="ghost"
                color="positive.600"
                _hover={{ bg: 'positive.50' }}
                onClick={() => askPay(row)}
              />
            </Tooltip>
            <Tooltip label="السجل" hasArrow>
              <IconButton
                aria-label="السجل"
                icon={<HistoryIcon size={16} />}
                size="sm"
                variant="ghost"
                onClick={() => openHistory(row)}
              />
            </Tooltip>
          </HStack>
        )}
      />

      {/* Pay confirmation modal */}
      <Modal isOpen={payModal.isOpen} onClose={payModal.onClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>تأكيد الدفع</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="ink.600">
              هل تريد تأكيد الدفع لـ{' '}
              <Text as="span" fontWeight="700" color="ink.900">
                {payTarget ? teacherName(payTarget) : ''}
              </Text>{' '}؟
            </Text>
            {payTarget && (
              <Text fontSize="xs" color="ink.400" mt={2}>
                {formatMonthLabel(periodKey(payTarget))} — {formatMoney(payTarget.amount)}
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" marginInlineEnd={3} onClick={payModal.onClose}>إلغاء</Button>
            <Button colorScheme="green" onClick={handleConfirmPay} isLoading={isPaying}>تأكيد</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* History modal */}
      <Modal isOpen={historyModal.isOpen} onClose={historyModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>
            سجل المدفوعات
            {historyPerson && (
              <Text fontSize="sm" fontWeight="400" color="ink.500" mt={1}>
                {teacherName(historyPerson)}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {historyRows.length === 0 ? (
              <Text fontSize="sm" color="ink.500">لا توجد أي مدفوعات مسجّلة لهذا المعلم.</Text>
            ) : (
              <VStack align="stretch" spacing={0} divider={<Divider />}>
                {historyRows.map((p) => {
                  const c = STATUS_COLORS[p.status] || { bg: 'ink.100', color: 'ink.700' };
                  return (
                    <HStack key={paymentId(p)} justify="space-between" py={3}>
                      <Box>
                        <Text fontSize="sm" fontWeight="600" color="ink.800">{formatMonthLabel(periodKey(p))}</Text>
                        <Text fontSize="xs" color="ink.400">
                          {Number(p.hour_count || 0)} س — {formatMoney(p.amount)} — {formatDate(p.updatedAt || p.paid_at)}
                        </Text>
                      </Box>
                      <Badge bg={c.bg} color={c.color} borderRadius="full" px={2.5}>
                        {STATUS_LABELS[p.status] || p.status}
                      </Badge>
                    </HStack>
                  );
                })}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={historyModal.onClose}>إغلاق</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}