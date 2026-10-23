import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
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
import { paymentStatuses } from '../../data/payments';
import { levels } from '../../data/school';
import PaymentsSubNav from './PaymentsSubNav';
import DataTable from '../common/DataTable';
import { AxiosToken } from '../../api/Api';
import SearchBar from '../common/SearchBar';
import PageHeader from '../common/PageHeader';

const STATUS_COLORS = {
  payé: { bg: 'positive.50', color: 'positive.600' },
  'non payé': { bg: 'accent.50', color: 'accent.500' },
  'en attente': { bg: 'warning.50', color: 'warning.500' },
  partially_paid: { bg: 'warning.50', color: 'warning.500' },
};

const STATUS_LABELS = {
  payé: 'مدفوع',
  'non payé': 'غير مدفوع',
  'en attente': 'قيد الانتظار',
  partially_paid: 'مدفوع جزئيًا',
};

// Payment types where the parent can pay all at once or in parts
const UPFRONT_TYPES = ['يدفع بالثلاثي', 'يدفع سنويًا'];

// studentPayment can be a single object (hasOne) or an array (hasMany) — normalize to array
function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

// Month label formatting — mirrors the backend key shape:
// monthly   -> "YYYY-MM"   (normal calendar month)
// trimestre -> "YYYY-T#"
// yearly    -> "YYYY-YYYY"
function formatMonthLabel(monthKey) {
  if (!monthKey) return '—';

  if (monthKey.includes('-T')) {
    const [year, trimester] = monthKey.split('-T');
    return `الثلاثي ${trimester} — ${year}`;
  }

  const parts = monthKey.split('-');
  if (parts.length === 2 && parts[1].length === 2) {
    const [year, month] = parts;
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('ar-TN', { month: 'long', year: 'numeric' });
  }

  // yearly, e.g. "2026-2027" — show as-is
  return monthKey;
}

// Mirrors the backend getCurrentMonth() — normal calendar month.
function getCurrentMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const CURRENT_MONTH_KEY = getCurrentMonth();
const [CURRENT_YEAR, CURRENT_MONTH] = CURRENT_MONTH_KEY.split('-');

// Month select: value "01".."12", label = month name
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const value = String(i + 1).padStart(2, '0');
  const label = new Date(2000, i, 1).toLocaleDateString('ar-TN', { month: 'long' });
  return { value, label };
});

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const selectSx = {
  textAlign: 'right',
  paddingRight: '1rem',
  paddingLeft: '2rem',
  '& + div': { insetInlineEnd: 'auto', insetInlineStart: '0.5rem' },
};

export default function PaymentsEleves() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(CURRENT_YEAR);
  const [monthFilter, setMonthFilter] = useState(CURRENT_MONTH);
  const [statusFilter, setStatusFilter] = useState('');

  const [payTarget, setPayTarget] = useState(null);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [showPartInput, setShowPartInput] = useState(false);
  const [partAmount, setPartAmount] = useState('');

  const payModal = useDisclosure();
  const historyModal = useDisclosure();

  const debouncedSearch = useDebounce(search);

  const queryParams = {
    search: debouncedSearch.trim(),
    level: levelFilter,
    status: statusFilter,
    year: yearFilter,
    month: monthFilter,
  };

  const { data, isFetching } = useQuery({
    queryKey: ['subscriptions', queryParams],
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(queryParams).filter(([, v]) => v !== '')
      );
      const response = await AxiosToken.get('/subscription', { params });
      return response.data;
    },
    placeholderData: keepPreviousData, // keep old rows visible while refetching (v5; in v4 use keepPreviousData: true)
  });

  const payments = data?.subscriptions ?? [];
  const summary = data?.summary;

  const yearOptions = useMemo(() => {
    const set = new Set([...(data?.years ?? []), CURRENT_YEAR]);
    return Array.from(set).sort().reverse();
  }, [data?.years]);

  // History comes from the subscription's own studentPayment (object or array).
  const historyRows = useMemo(() => {
    return toArray(historyStudent?.studentPayment).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [historyStudent]);

  // --- Pay modal derived values ---
  const totalAmount = Number(payTarget?.amount ?? 0);
  const paidSoFar = toArray(payTarget?.studentPayment).reduce(
    (sum, p) => sum + Number(p.amount ?? 0),
    0
  );
  const remaining = Math.max(totalAmount - paidSoFar, 0);

  const isPartiallyPaid = payTarget?.status === 'partially_paid';
  const isUpfront = UPFRONT_TYPES.includes(payTarget?.payment_type);

  // 'choice' = pay everything that is left OR pay a part
  //            (partially_paid, or quarterly/yearly not paid yet)
  // 'full'   = simple confirmation
  const payMode = isPartiallyPaid || (isUpfront && payTarget?.status === 'non payé')
    ? 'choice'
    : 'full';

  const partNumber = Number(partAmount);
  const partInvalid =
    partAmount !== '' && (Number.isNaN(partNumber) || partNumber <= 0 || partNumber >= remaining);
  const canConfirmPart = partAmount !== '' && !partInvalid;

  const payMutation = useMutation({
    // amount omitted => backend pays the full remaining amount
    mutationFn: ({ id, amount }) =>
      AxiosToken.post(`/subscription/${id}/pay`, amount != null ? { amount } : {}),
    onSuccess: (_res, variables) => {
      toast({
        title: 'تم تأكيد الدفع',
        description: `${payTarget?.student?.name} ${payTarget?.student?.last_name} — ${(variables.amount ?? remaining).toLocaleString('fr-FR')} د.ت`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      closePayModal();
    },
    onError: () => {
      toast({
        title: 'فشل تأكيد الدفع',
        description: 'حدث خطأ أثناء تسجيل الدفع، حاول مجددا.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const closePayModal = () => {
    payModal.onClose();
    setPayTarget(null);
    setShowPartInput(false);
    setPartAmount('');
  };

  const askPay = (p) => {
    setPayTarget(p);
    setShowPartInput(false);
    setPartAmount('');
    payModal.onOpen();
  };
  const openHistory = (p) => { setHistoryStudent(p); historyModal.onOpen(); };

  // No amount => backend pays the whole remaining balance
  const payAll = () => {
    if (payTarget) payMutation.mutate({ id: payTarget.id });
  };
  const payPart = () => {
    if (payTarget && canConfirmPart) {
      payMutation.mutate({ id: payTarget.id, amount: partNumber });
    }
  };

  const isFiltered =
    search ||
    levelFilter ||
    statusFilter ||
    yearFilter !== CURRENT_YEAR ||
    monthFilter !== CURRENT_MONTH;

  const resetFilters = () => {
    setSearch('');
    setLevelFilter('');
    setStatusFilter('');
    setYearFilter(CURRENT_YEAR);
    setMonthFilter(CURRENT_MONTH);
  };

  const getSchoolYearLabel = (month) => {
  if (!month) return '-';
  const [y, m] = month.split('-').map(Number);
  return m >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

const getTermNumber = (month) => {
  const m = Number(month?.split('-')[1]);
  if (m >= 9 && m <= 12) return 1; // Sep-Dec
  if (m >= 1 && m <= 3) return 2;  // Jan-Mar
  return 3;                        // Apr-Aug
};

const formatPeriod = (row) => {
  const type = row.payment_type || '';
  if (type.includes('سنوي')) return getSchoolYearLabel(row.month);
  if (type.includes('ثلاثي')) return `الثلاثي ${getTermNumber(row.month)} · ${getSchoolYearLabel(row.month)}`;
  return formatMonthLabel(row.month);
};

const columns = [
  { key: 'unique_id', label: 'المعرّف', sortable: true, render: (row) => row.student.unique_id || row.id },
  { key: 'eleve', label: 'الطالب', sortable: true, render: (row) => row.student.name + ' ' + row.student.last_name },
  { key: 'class', label: 'المستوى', sortable: true, render: (row) => <Badge bg="ink.100" color="ink.700" borderRadius="full" px={2.5}>{row.student.class}</Badge> },
  { key: 'montant', label: 'المبلغ', sortable: true, isNumeric: true, render: (row) => `${row.amount?.toLocaleString('fr-FR')} د.ت` },
  { key: 'datePaiement', label: 'الفترة', sortable: true, render: (row) => formatPeriod(row) },
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

  return (
    <Box dir="rtl">
      <PageHeader title="سجل المدرسة" subtitle="سجلات الغياب وحضور المعلمين." />

      <PaymentsSubNav />

      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={5} mb={6}>
        <Box bg="brand.600" borderRadius="2xl" p={5} color="white" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="whiteAlpha.800">إجمالي المحصّل هذا الشهر</Text>
            <Wallet size={18} />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700">
            {(summary?.totalCollectedCurrentMonth ?? 0).toLocaleString('fr-FR')} د.ت
          </Text>
          <Text fontSize="xs" color="whiteAlpha.700" mt={1}>{formatMonthLabel(CURRENT_MONTH_KEY)}</Text>
        </Box>

        <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="ink.500">إجمالي المدفوع (مُصفّى)</Text>
            <Icon as={CheckCircle2} boxSize={4.5} color="positive.500" />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700" color="ink.900">
            {(summary?.totalPaidFiltered ?? 0).toLocaleString('fr-FR')} د.ت
          </Text>
          <Text fontSize="xs" color="ink.400" mt={1}>ضمن التحديد الحالي</Text>
        </Box>

        <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="ink.500">المدفوعات المتبقية</Text>
            <Icon as={Clock} boxSize={4.5} color="warning.500" />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700" color="ink.900">
            {summary?.unpaidCount ?? 0}
          </Text>
          <Text fontSize="xs" color="ink.400" mt={1}>غير مدفوع (ضمن التحديد)</Text>
        </Box>
      </SimpleGrid>

      <Wrap spacing={3} mb={5} align="center">
        <SearchBar value={search} onChange={setSearch} placeholder="ابحث عن طالب…" />

        <Select
          w={{ base: 'full', sm: '180px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          sx={selectSx}
        >
          <option value="">جميع المستويات</option>
          {levels.map((lvl) => (
            <option key={lvl} value={lvl}>{lvl}</option>
          ))}
        </Select>

        <Select
          w={{ base: 'full', sm: '120px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          sx={selectSx}
        >
          <option value="">جميع السنوات</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>

        <Select
          w={{ base: 'full', sm: '150px' }}
          size="sm"
          borderRadius="lg"
          bg="white"
          borderColor="ink.200"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          sx={selectSx}
        >
          <option value="">جميع الأشهر</option>
          {MONTH_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
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

        {isFiltered && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            إعادة التعيين
          </Button>
        )}

        <HStack spacing={1.5} ml="auto" color="ink.400">
          <CreditCard size={15} />
          <Text fontSize="xs">{summary?.count ?? payments.length} دفعة(ات)</Text>
        </HStack>
      </Wrap>

      <DataTable
        columns={columns}
        data={payments}
        pageSize={8}
        isLoading={isFetching}
        emptyMessage="لا توجد أي مدفوعات تطابق هذه المعايير."
        renderActions={(row) => (
          <HStack spacing={1}>
            <Tooltip label="الدفع" hasArrow>
              <IconButton
                aria-label="الدفع"
                isDisabled={row.status === 'payé' || row.status === 'en attente'}
                icon={<Wallet size={16} />}
                size="sm"
                variant="ghost"
                color="positive.600"
                _hover={{ bg: 'positive.50' }}
                onClick={() => askPay(row)}
              />
            </Tooltip>
            <Tooltip label="السجل" hasArrow>
              <IconButton aria-label="السجل" icon={<HistoryIcon size={16} />} size="sm" variant="ghost" onClick={() => openHistory(row)} />
            </Tooltip>
          </HStack>
        )}
      />

      {/* Pay modal */}
      <Modal isOpen={payModal.isOpen} onClose={closePayModal} isCentered size="sm">
        <ModalOverlay />
        <ModalContent borderRadius="xl" dir="rtl">
          <ModalHeader>
            {isPartiallyPaid ? 'دفع المبلغ المتبقي' : 'تأكيد الدفع'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="ink.600">
              {payMode === 'choice'
                ? 'هل تريد دفع كامل المبلغ المتبقي أم جزء منه لـ'
                : 'هل تريد تأكيد الدفع لـ'}{' '}
              <Text as="span" fontWeight="700" color="ink.900">
                {payTarget?.student?.name} {payTarget?.student?.last_name}
              </Text>{' '}؟
            </Text>

            {payTarget && payMode === 'full' && (
              <Text fontSize="xs" color="ink.400" mt={2}>
                {payTarget.amount?.toLocaleString('fr-FR')} د.ت — {payTarget.student?.class}
              </Text>
            )}

            {payTarget && payMode === 'choice' && (
              <VStack align="stretch" spacing={1} mt={3} fontSize="sm">
                <HStack justify="space-between">
                  <Text color="ink.500">المبلغ الإجمالي</Text>
                  <Text fontWeight="600">{totalAmount.toLocaleString('fr-FR')} د.ت</Text>
                </HStack>
                {paidSoFar > 0 && (
                  <HStack justify="space-between">
                    <Text color="ink.500">المدفوع</Text>
                    <Text fontWeight="600" color="positive.600">{paidSoFar.toLocaleString('fr-FR')} د.ت</Text>
                  </HStack>
                )}
                <Divider />
                <HStack justify="space-between">
                  <Text color="ink.500">المتبقي</Text>
                  <Text fontWeight="700" color="accent.500">{remaining.toLocaleString('fr-FR')} د.ت</Text>
                </HStack>
              </VStack>
            )}

            {payMode === 'choice' && showPartInput && (
              <FormControl mt={4} isInvalid={partInvalid}>
                <FormLabel fontSize="sm">المبلغ المدفوع الآن (د.ت)</FormLabel>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  autoFocus
                  value={partAmount}
                  onChange={(e) => setPartAmount(e.target.value)}
                  placeholder="0.00"
                />
                <FormErrorMessage>
                  المبلغ يجب أن يكون أكبر من 0 وأقل من المتبقي ({remaining.toLocaleString('fr-FR')} د.ت).
                </FormErrorMessage>
              </FormControl>
            )}
          </ModalBody>

          <ModalFooter gap={2}>
            {payMode === 'full' && (
              <>
                <Button variant="ghost" onClick={closePayModal}>إلغاء</Button>
                <Button colorScheme="green" onClick={payAll} isLoading={payMutation.isPending}>تأكيد</Button>
              </>
            )}

            {payMode === 'choice' && !showPartInput && (
              <>
                <Button variant="ghost" onClick={closePayModal}>إلغاء</Button>
                <Button variant="outline" onClick={() => setShowPartInput(true)} isDisabled={payMutation.isPending}>
                  دفع جزء
                </Button>
                <Button colorScheme="green" onClick={payAll} isLoading={payMutation.isPending}>
                  {isPartiallyPaid ? 'دفع المتبقي' : 'دفع الكل'}
                </Button>
              </>
            )}

            {payMode === 'choice' && showPartInput && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => { setShowPartInput(false); setPartAmount(''); }}
                  isDisabled={payMutation.isPending}
                >
                  رجوع
                </Button>
                <Button
                  colorScheme="green"
                  onClick={payPart}
                  isDisabled={!canConfirmPart}
                  isLoading={payMutation.isPending}
                >
                  تأكيد الدفع الجزئي
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* History modal */}
      <Modal isOpen={historyModal.isOpen} onClose={historyModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="xl" dir="rtl">
          <ModalHeader>
            سجل المدفوعات
            {historyStudent && (
              <Text fontSize="sm" fontWeight="400" color="ink.500" mt={1}>
                {historyStudent.student?.name} {historyStudent.student?.last_name} — {historyStudent.student?.class}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {historyRows.length === 0 ? (
              <Text fontSize="sm" color="ink.500">لا توجد أي مدفوعات مسجّلة لهذا الطالب.</Text>
            ) : (
              <VStack align="stretch" spacing={0} divider={<Divider />}>
                {historyRows.map((p) => (
                  <HStack key={p.id} justify="space-between" py={3}>
                    <Box>
                      <Text fontSize="sm" fontWeight="600" color="ink.800">{Number(p.amount ?? 0).toLocaleString('fr-FR')} د.ت</Text>
                      <Text fontSize="xs" color="ink.400">{formatDate(p.date)}</Text>
                    </Box>
                    <Badge
                      bg={STATUS_COLORS['payé'].bg}
                      color={STATUS_COLORS['payé'].color}
                      borderRadius="full"
                      px={2.5}
                    >
                      مدفوع
                    </Badge>
                  </HStack>
                ))}
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