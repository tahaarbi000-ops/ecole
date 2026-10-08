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
};

const STATUS_LABELS = {
  payé: 'مدفوع',
  'non payé': 'غير مدفوع',
  'en attente': 'قيد الانتظار',
};

const selectSx = {
  textAlign: 'right',
  paddingRight: '1rem',
  paddingLeft: '2rem',
  '& + div': { insetInlineEnd: 'auto', insetInlineStart: '0.5rem' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('ar-TN', { month: 'long', year: 'numeric' });
}

export default function PaymentsEleves() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [payTarget, setPayTarget] = useState(null);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formModal = useDisclosure();
  const payModal = useDisclosure();
  const historyModal = useDisclosure();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await AxiosToken.get('/subscription');
        setPayments(response.data.subscriptions);
      } catch {
        console.error('error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isSaving, isPaying]);

  const availableYears = useMemo(() => {
    const set = new Set(payments.map((p) => p.createdAt.slice(0, 4)));
    return Array.from(set).sort().reverse();
  }, [payments]);

  const availableMonths = useMemo(() => {
    const set = new Set(
      payments
        .filter((p) => !yearFilter || p.createdAt.startsWith(yearFilter))
        .map((p) => p.createdAt.slice(0, 7))
    );
    return Array.from(set).sort().reverse();
  }, [payments, yearFilter]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((p) => {
      const matchesSearch = !term || (p.student.name + ' ' + p.student.last_name).toLowerCase().includes(term);
      const matchesLevel = !levelFilter || p.student.class === levelFilter;
      const matchesYear = !yearFilter || p.createdAt.startsWith(yearFilter);
      const matchesMonth = !monthFilter || p.createdAt.startsWith(monthFilter);
      const matchesStatus = !statusFilter || p.status === statusFilter;
      return matchesSearch && matchesLevel && matchesYear && matchesMonth && matchesStatus;
    });
  }, [payments, search, levelFilter, yearFilter, monthFilter, statusFilter]);

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const totalEncaisseCeMois = useMemo(
    () =>
      payments
        .filter((p) => p.createdAt.startsWith(currentMonthKey) && p.status !== 'en attente')
        .reduce((sum, p) => sum + p.amount, 0),
    [payments, currentMonthKey]
  );
  const totalPayeFiltre = useMemo(
    () => filtered.filter((p) => p.status === 'payé').reduce((sum, p) => sum + p.amount, 0),
    [filtered]
  );
  const totalRestantFiltre = useMemo(
    () => filtered.filter((p) => p.status === 'en attente' || p.status === 'non payé').length,
    [filtered]
  );

  const historyRows = useMemo(() => {
    if (!historyStudent) return [];
    return payments
      .filter((p) => p.eleve === historyStudent.eleve)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [payments, historyStudent]);

  const askPay = (p) => { setPayTarget(p); payModal.onOpen(); };
  const openHistory = (p) => { setHistoryStudent(p); historyModal.onOpen(); };

  const handleCreateSubmit = (formData) => {
    setIsSaving(true);
    setTimeout(() => {
      const newPayment = { ...formData, id: Math.max(0, ...payments.map((p) => p.id)) + 1 };
      setPayments((prev) => [newPayment, ...prev]);
      toast({ title: 'تم تسجيل الدفع', status: 'success', duration: 3000, isClosable: true });
      setIsSaving(false);
      formModal.onClose();
    }, 700);
  };

  const handleConfirmPay = async () => {
    if (!payTarget) return;
    setIsPaying(true);
    try {
      await AxiosToken.post(`/subscription/${payTarget.id}/pay`);
      setPayments((prev) => prev.map((p) => (p.id === payTarget.id ? { ...p, status: 'payé' } : p)));
      toast({
        title: 'تم تأكيد الدفع',
        description: `${payTarget.eleve} — ${payTarget?.amount?.toLocaleString('fr-FR')} د.ت`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      payModal.onClose();
      setPayTarget(null);
    } catch (error) {
      toast({
        title: 'فشل تأكيد الدفع',
        description: 'حدث خطأ أثناء تسجيل الدفع، حاول مجددا.',
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
    setLevelFilter('');
    setYearFilter('');
    setMonthFilter('');
    setStatusFilter('');
  };

  const columns = [
    { key: 'id', label: 'المعرّف', sortable: true,render:(row) => row.student.unique_id || "--" },
    { key: 'eleve', label: 'الطالب', sortable: true, render: (row) => row.student.name + ' ' + row.student.last_name },
    {
      key: 'class',
      label: 'المستوى',
      sortable: true,
      render: (row) => (
        <Badge bg="ink.100" color="ink.700" borderRadius="full" px={2.5}>{row.student.class}</Badge>
      ),
    },
    { key: 'montant', label: 'المبلغ', sortable: true, isNumeric: true, render: (row) => `${row.amount?.toLocaleString('fr-FR')} د.ت` },
    { key: 'datePaiement', label: 'التاريخ', sortable: true, render: (row) => formatDate(row.createdAt) },
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
            {totalEncaisseCeMois?.toLocaleString('fr-FR')} د.ت
          </Text>
          <Text fontSize="xs" color="whiteAlpha.700" mt={1}>{formatMonthLabel(currentMonthKey)}</Text>
        </Box>

        <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="ink.500">إجمالي المدفوع (مُصفّى)</Text>
            <Icon as={CheckCircle2} boxSize={4.5} color="positive.500" />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700" color="ink.900">
            {totalPayeFiltre?.toLocaleString('fr-FR')} د.ت
          </Text>
          <Text fontSize="xs" color="ink.400" mt={1}>ضمن التحديد الحالي</Text>
        </Box>

        <Box bg="white" borderRadius="2xl" p={5} border="1px solid" borderColor="ink.200" boxShadow="card">
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="600" color="ink.500">المدفوعات المتبقية</Text>
            <Icon as={Clock} boxSize={4.5} color="warning.500" />
          </HStack>
          <Text fontFamily="heading" fontSize="2xl" fontWeight="700" color="ink.900">
            {totalRestantFiltre}
          </Text>
          <Text fontSize="xs" color="ink.400" mt={1}>قيد الانتظار (ضمن التحديد)</Text>
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

        {(search || levelFilter || yearFilter || monthFilter || statusFilter) && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            إعادة التعيين
          </Button>
        )}

        <HStack spacing={1.5} ml="auto" color="ink.400">
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
                disabled={row.status === 'payé'}
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

      <Modal isOpen={payModal.isOpen} onClose={payModal.onClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>تأكيد الدفع</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="ink.600">
              هل تريد تأكيد الدفع لـ{' '}
              <Text as="span" fontWeight="700" color="ink.900">{payTarget?.eleve}</Text>{' '}؟
            </Text>
            {payTarget && (
              <Text fontSize="xs" color="ink.400" mt={2}>
                {payTarget.amount?.toLocaleString('fr-FR')} د.ت — {payTarget.niveau}
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={payModal.onClose}>إلغاء</Button>
            <Button colorScheme="green" onClick={handleConfirmPay} isLoading={isPaying}>تأكيد</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={historyModal.isOpen} onClose={historyModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>
            سجل المدفوعات
            {historyStudent && (
              <Text fontSize="sm" fontWeight="400" color="ink.500" mt={1}>
                {historyStudent.eleve} — {historyStudent.niveau}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {historyRows.length === 0 ? (
              <Text fontSize="sm" color="ink.500">لا توجد أي مدفوعات مسجّلة لهذا الطالب.</Text>
            ) : (
              <VStack align="stretch" spacing={0} divider={<Divider />}>
                {historyRows.map((p) => {
                  const c = STATUS_COLORS[p.status] || { bg: 'ink.100', color: 'ink.700' };
                  return (
                    <HStack key={p.id} justify="space-between" py={3}>
                      <Box>
                        <Text fontSize="sm" fontWeight="600" color="ink.800">{p.amount?.toLocaleString('fr-FR')} د.ت</Text>
                        <Text fontSize="xs" color="ink.400">{formatDate(p.createdAt)}</Text>
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