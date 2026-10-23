import { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Button,
  Text,
} from '@chakra-ui/react';

export const TERMS = [
  { value: 1, label: 'الثلاثي الأول' },
  { value: 2, label: 'الثلاثي الثاني' },
];

export default function HolidayFormModal({
  isOpen,
  onClose,
  onSubmit,
  holiday,
  defaultTerm = 1,
  schoolYear,
  isSaving,
}) {
  const [form, setForm] = useState({
    label: '',
    term: defaultTerm,
    start_date: '',
    end_date: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setForm(
      holiday
        ? {
            label: holiday.label,
            term: holiday.term,
            start_date: holiday.start_date,
            end_date: holiday.end_date,
          }
        : { label: '', term: defaultTerm, start_date: '', end_date: '' }
    );
  }, [isOpen, holiday, defaultTerm]);

  const termLabel =
    TERMS.find((t) => t.value === Number(form.term))?.label || '';

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.label.trim() || !form.start_date || !form.end_date) {
      setError('جميع الحقول مطلوبة');
      return;
    }
    if (form.end_date < form.start_date) {
      setError('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      return;
    }
    if (
      schoolYear &&
      (form.start_date < schoolYear.start_date ||
        form.end_date > schoolYear.end_date)
    ) {
      setError('يجب أن تكون العطلة ضمن السنة الدراسية المحددة');
      return;
    }

    setError('');
    try {
      await onSubmit({
        label: form.label.trim(),
        term: Number(form.term),
        start_date: form.start_date,
        end_date: form.end_date,
      });
      onClose();
    } catch {
      // the parent already showed a toast; keep the modal open
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent dir="rtl" borderRadius="2xl">
        <ModalHeader>{holiday ? 'تعديل العطلة' : 'إضافة عطلة'}</ModalHeader>
        <ModalCloseButton left={4} right="auto" />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>الثلاثي</FormLabel>
              <Text fontWeight="600" color="ink.900">
                {termLabel}
              </Text>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>التسمية</FormLabel>
              <Input
                placeholder="عطلة الشتاء"
                value={form.label}
                onChange={setField('label')}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>من</FormLabel>
              <Input
                type="date"
                value={form.start_date}
                min={schoolYear?.start_date}
                max={schoolYear?.end_date}
                onChange={setField('start_date')}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>إلى</FormLabel>
              <Input
                type="date"
                value={form.end_date}
                min={form.start_date || schoolYear?.start_date}
                max={schoolYear?.end_date}
                onChange={setField('end_date')}
              />
            </FormControl>

            {error && (
              <Text fontSize="sm" color="danger.500">
                {error}
              </Text>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose} isDisabled={isSaving}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} isLoading={isSaving}>
            حفظ
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}