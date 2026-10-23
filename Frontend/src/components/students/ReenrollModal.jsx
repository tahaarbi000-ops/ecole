import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  Button,
  Select,
  Switch,
  Input,
  Divider,
} from '@chakra-ui/react';
import { CheckCircle2, XCircle } from 'lucide-react';

// payment_type enum values used across the app
const PAYMENT_TYPES = ['يدفع شهريًا', 'يدفع بالثلاثي', 'يدفع سنويًا', 'غير معني بالدفع'];
const PROMOTIONS = [
  { value: '', label: 'بدون' },
  { value: 'discount_50', label: 'تخفيض 50%' },
  { value: 'free', label: 'مجاني' },
];

const BOOK_ELIGIBLE_CLASSES = [
  'التحضيري',
  'السنة الأولى',
  'السنة الثانية',
  'السنة الثالثة',
  'السنة الرابعة',
];

const SELECT_RTL_SX = {
  textAlign: 'right',
  paddingRight: '1rem',
  paddingLeft: '2rem',
  '& + div': { insetInlineEnd: 'auto', insetInlineStart: '0.5rem' },
};

export default function ReenrollModal({
  reenrollModal,
  studentToReenroll,
  isReenrolling,
  zones = [], // [{ id, name }]
  onConfirm, // (payload) => void
}) {
  const [reenrollStatus, setReenrollStatus] = useState(null);
  // null = not chosen yet, true = keep same, false = change it
  const [keepSameSubscription, setKeepSameSubscription] = useState(null);
  const [subscription, setSubscription] = useState({
    transport: false,
    is_take_uniform: false,
    is_take_book: false,
    payment_type: 'يدفع شهريًا',
    promotion: '',
    siblings_count: '',
    zone_id: '',
  });

  // Reset everything when a new student is selected / modal reopens
  useEffect(() => {
    if (reenrollModal.isOpen) {
      setReenrollStatus(null);
      setKeepSameSubscription(null);
      if (studentToReenroll?.subscription) {
        const s = studentToReenroll.subscription;
        setSubscription({
          transport: Boolean(s.transport),
          is_take_uniform: Boolean(s.is_take_uniform),
          is_take_book: Boolean(s.is_take_book),
          payment_type: s.payment_type || 'يدفع شهريًا',
          promotion: s.promotion || '',
          siblings_count: s.siblings_count ?? '',
          zone_id: s.zone?.id ?? s.zone_id ?? '',
        });
      }
    }
  }, [reenrollModal.isOpen, studentToReenroll]);

  const setSub = (field, value) =>
    setSubscription((prev) => ({ ...prev, [field]: value }));

  // Turning transport off clears the zone since it's only relevant with transport
  const setTransport = (checked) => {
    setSubscription((prev) => ({
      ...prev,
      transport: checked,
      zone_id: checked ? prev.zone_id : '',
    }));
  };

  const canConfirm =
    Boolean(reenrollStatus) &&
    (keepSameSubscription === true || keepSameSubscription === false);

  const handleConfirm = () => {
    const payload = {
      studentId: studentToReenroll?.id,
      result: reenrollStatus,
      keepSameSubscription,
      // only send subscription fields when the user chose to change them
      subscription: keepSameSubscription === false ? subscription : undefined,
    };
    onConfirm(payload);
  };

  return (
    <Modal isOpen={reenrollModal.isOpen} onClose={reenrollModal.onClose} isCentered dir="rtl" size="lg">
      <ModalOverlay />
      <ModalContent dir="rtl">
        <ModalHeader>إعادة تسجيل للسنة القادمة</ModalHeader>
        <ModalCloseButton insetInlineStart={3} insetInlineEnd="auto" />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm">
              {studentToReenroll
                ? `حدد نتيجة التلميذ ${studentToReenroll.last_name} ${studentToReenroll.name} لإعادة تسجيله للسنة الدراسية القادمة.`
                : ''}
            </Text>

            <FormControl isRequired>
              <FormLabel fontSize="sm">نتيجة التلميذ</FormLabel>
              <HStack spacing={3}>
                <Button
                  flex={1}
                  size="lg"
                  leftIcon={<CheckCircle2 size={18} />}
                  colorScheme="green"
                  variant={reenrollStatus === 'ناجح' ? 'solid' : 'outline'}
                  onClick={() => setReenrollStatus('ناجح')}
                  disabled={studentToReenroll?.class === 'السنة السادسة'}
                >
                  ناجح
                </Button>
                <Button
                  flex={1}
                  size="lg"
                  leftIcon={<XCircle size={18} />}
                  colorScheme="red"
                  variant={reenrollStatus === 'راسب' ? 'solid' : 'outline'}
                  onClick={() => setReenrollStatus('راسب')}
                >
                  راسب
                </Button>
              </HStack>
            </FormControl>

            {reenrollStatus && (
              <>
                <Divider />
                <FormControl isRequired>
                  <FormLabel fontSize="sm">الاشتراك للسنة القادمة</FormLabel>
                  <HStack spacing={3}>
                    <Button
                      flex={1}
                      variant={keepSameSubscription === true ? 'solid' : 'outline'}
                      colorScheme="brand"
                      onClick={() => setKeepSameSubscription(true)}
                    >
                      نفس الاشتراك
                    </Button>
                    <Button
                      flex={1}
                      variant={keepSameSubscription === false ? 'solid' : 'outline'}
                      colorScheme="brand"
                      onClick={() => setKeepSameSubscription(false)}
                    >
                      تغيير الاشتراك
                    </Button>
                  </HStack>
                </FormControl>
              </>
            )}

            {keepSameSubscription === false && (
              <VStack spacing={3} align="stretch" bg="gray.50" p={3} borderRadius="md">
                <FormControl>
                  <FormLabel fontSize="sm">نوع الدفع</FormLabel>
                  <Select
                    value={subscription.payment_type}
                    onChange={(e) => setSub('payment_type', e.target.value)}
                    sx={SELECT_RTL_SX}
                  >
                    {PAYMENT_TYPES.map((pt) => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </Select>
                </FormControl>

                <HStack justify="space-between">
                  <FormLabel fontSize="sm" mb={0}>النقل</FormLabel>
                  <Switch
                    isChecked={subscription.transport}
                    onChange={(e) => setTransport(e.target.checked)}
                  />
                </HStack>

                {subscription.transport && (
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">المنطقة</FormLabel>
                    <Select
                      value={subscription.zone_id}
                      onChange={(e) => setSub('zone_id', e.target.value)}
                      placeholder="اختر المنطقة"
                      sx={SELECT_RTL_SX}
                    >
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {/* <FormControl>
                  <FormLabel fontSize="sm">التخفيض</FormLabel>
                  <Select
                    value={subscription.promotion}
                    onChange={(e) => setSub('promotion', e.target.value)}
                    sx={SELECT_RTL_SX}
                  >
                    {PROMOTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </Select>
                </FormControl> */}

                {/* <FormControl>
                  <FormLabel fontSize="sm">عدد الإخوة</FormLabel>
                  <Input
                    type="number"
                    min="0"
                    value={subscription.siblings_count}
                    onChange={(e) => setSub('siblings_count', e.target.value)}
                  />
                </FormControl> */}

                <HStack justify="space-between">
                  <FormLabel fontSize="sm" mb={0}>يأخذ الزي المدرسي</FormLabel>
                  <Switch
                    isChecked={subscription.is_take_uniform}
                    onChange={(e) => setSub('is_take_uniform', e.target.checked)}
                  />
                </HStack>

                {BOOK_ELIGIBLE_CLASSES.includes(studentToReenroll?.class) && (
                  <HStack justify="space-between">
                    <FormLabel fontSize="sm" mb={0}>يأخذ الكتب</FormLabel>
                    <Switch
                      isChecked={subscription.is_take_book}
                      onChange={(e) => setSub('is_take_book', e.target.checked)}
                    />
                  </HStack>
                )}
              </VStack>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={2}>
            <Button variant="ghost" onClick={reenrollModal.onClose}>
              إلغاء
            </Button>
            <Button
              colorScheme="brand"
              isDisabled={!canConfirm}
              isLoading={isReenrolling}
              onClick={handleConfirm}
            >
              تأكيد إعادة التسجيل
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}