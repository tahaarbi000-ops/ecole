import { useEffect, useMemo, useRef, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  SimpleGrid,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Button,
  Textarea,
  Box,
  Text,
  useOutsideClick,
  Spinner,
} from '@chakra-ui/react';
import FormModal from '../common/FormModal';
import { AxiosToken } from '../../api/Api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const SENSE_OPTIONS = [
  { value: 'دخول', label: 'دخول' },
  { value: 'خروج', label: 'خروج' },
];

const EMPTY_VALUES = {
  date: '',
  time: '',
  sense: '',
  justification: true,
  teacher_id: '',
  noticed: '',
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

const validationSchema = Yup.object({
  date: Yup.string().required('التاريخ مطلوب.'),
  time: Yup.string()
    .required('الوقت مطلوب.')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'وقت غير صالح.'),
  sense: Yup.string()
    .required('الاتجاه مطلوب.')
    .oneOf(SENSE_OPTIONS.map((o) => o.value), 'اتجاه غير صالح.'),
  justification: Yup.string().required('التبرير مطلوب.'),
  teacher_id: Yup.number()
    .typeError('المعلّم مطلوب.')
    .required('المعلّم مطلوب.')
    .integer('معرّف المعلّم غير صالح.'),
  noticed: Yup.string().max(255, 'يجب ألا يتجاوز 255 حرفًا.'),
});

function generateTimeSlots(startHour = 8, endHour = 18, stepMinutes = 30) {
  const slots = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      if (h === endHour && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

const teacherLabel = (t) => `${t.name ?? ''} ${t.last_name ?? ''} - ${t.cin ?? ''}`.trim();

/**
 * حقل اختيار المعلّم مع بحث بالاسم أو اللقب أو رقم بطاقة التعريف (CIN).
 */
function TeacherSearchSelect({ teachers, value, onChange, onBlur, isInvalid }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => teachers.find((t) => String(t.id) === String(value)),
    [teachers, value]
  );

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return teachers;
    return teachers.filter((t) =>
      `${t.name ?? ''} ${t.last_name ?? ''} ${t.last_name ?? ''} ${t.name ?? ''} ${t.cin ?? ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [teachers, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  useOutsideClick({
    ref,
    handler: () => {
      if (!open) return;
      close();
      onBlur?.();
    },
  });

  const pick = (t) => {
    onChange(String(t.id));
    close();
  };

  const inputValue = open ? query : selected ? teacherLabel(selected) : '';

  return (
    <Box ref={ref} position="relative">
      <Input
        name="teacher_search"
        autoComplete="off"
        placeholder={open && selected ? teacherLabel(selected) : 'ابحث بالاسم أو رقم CIN…'}
        value={inputValue}
        isInvalid={isInvalid}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (open && results.length > 0) pick(results[0]);
          }
          if (e.key === 'Escape') close();
        }}
      />

      {open && (
        <Box
          position="absolute"
          top="100%"
          insetInlineStart={0}
          insetInlineEnd={0}
          mt={1}
          zIndex={20}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="md"
          maxH="220px"
          overflowY="auto"
        >
          {results.length === 0 ? (
            <Text px={3} py={2} fontSize="sm" color="gray.500">
              لا توجد نتائج.
            </Text>
          ) : (
            results.map((t) => (
              <Box
                key={t.id}
                px={3}
                py={2}
                fontSize="sm"
                cursor="pointer"
                bg={String(t.id) === String(value) ? 'gray.100' : 'transparent'}
                _hover={{ bg: 'gray.50' }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(t)}
              >
                {teacherLabel(t)}
              </Box>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}

const fetchScoring = async () => {
  const { data } = await AxiosToken.get('/teacher');
  return data.teachers;
};

export default function TeacherScoringFormModal({
  isOpen,
  onClose,
  onSubmit,
  scoring = null,
  isSaving = false,
}) {
  const isEditMode = Boolean(scoring);
  const timeSlots = useMemo(() => generateTimeSlots(8, 18, 30), []);
  
  const { data : teachers = [], isLoading } = useQuery({
      queryKey: ['teachers'],
      queryFn: () => fetchScoring(),
      placeholderData: (prev) => prev,
      staleTime: 60 * 5 * 1000
    });

  const initialValues = useMemo(() => {
    if (!scoring) return EMPTY_VALUES;
    return {
      date: scoring.date ? String(scoring.date).slice(0, 10) : '',
      time: scoring.time ? String(scoring.time).slice(0, 5) : '',
      sense: scoring.sense ?? '',
      justification:
        scoring.justification === true || scoring.justification === false
          ? String(scoring.justification)
          : scoring.justification ?? '',
      teacher_id: String(scoring.teacher_id ?? scoring.scoringTeacher?.id ?? ''),
      noticed: scoring.noticed ?? scoring.remarque ?? '',
    };
  }, [scoring]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await onSubmit({
        ...values,
        teacher_id: Number(values.teacher_id),
        justification: values.justification === 'true',
      });
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        submitForm,
        setFieldValue,
        setFieldTouched,
      }) => (
        <FormModal
          isOpen={isOpen}
          onClose={onClose}
          title={isEditMode ? 'تعديل التسجيل' : 'تسجيل حضور — معلّم'}
          footer={
            <>
              <Button variant="outline" onClick={onClose}>إلغاء</Button>
              <Button onClick={submitForm} isLoading={isSaving} loadingText="جارٍ الحفظ…">
                {isEditMode ? 'حفظ' : 'إضافة'}
              </Button>
            </>
          }
          size="lg"
        >
          <Form noValidate dir="rtl">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isInvalid={Boolean(touched.date && errors.date)} isRequired>
                <FormLabel fontSize="sm">التاريخ</FormLabel>
                <Input
                  type="date"
                  name="date"
                  value={values.date}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <FormErrorMessage>{errors.date}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={Boolean(touched.time && errors.time)} isRequired>
                <FormLabel fontSize="sm">الوقت</FormLabel>
                <Select
                  name="time"
                  placeholder="اختر الوقت"
                  value={values.time}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  sx={selectSx}
                >
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.time}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={Boolean(touched.teacher_id && errors.teacher_id)} isRequired>
                <FormLabel fontSize="sm">المعلّم</FormLabel>
                <TeacherSearchSelect
                  teachers={teachers}
                  value={values.teacher_id}
                  isInvalid={Boolean(touched.teacher_id && errors.teacher_id)}
                  onChange={(id) => {
                    setFieldValue('teacher_id', id);
                    setFieldTouched('teacher_id', true, false);
                  }}
                  onBlur={() => setFieldTouched('teacher_id', true)}
                />
                {isLoading && (
                  <Spinner
                    size="sm"
                    color="blue.500"
                    position="absolute"
                    left="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    zIndex={2}
                  />
                )}
                            <FormErrorMessage>{errors.teacher_id}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={Boolean(touched.sense && errors.sense)} isRequired>
                <FormLabel fontSize="sm">الاتجاه</FormLabel>
                <Select
                  name="sense"
                  placeholder="اختر"
                  value={values.sense}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  sx={selectSx}
                >
                  {SENSE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.sense}</FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={Boolean(touched.justification && errors.justification)}
                isRequired
                gridColumn={{ md: 'span 2' }}
              >
                <FormLabel fontSize="sm">التبرير</FormLabel>
                <Select
                  name="justification"
                  placeholder="اختر"
                  value={values.justification}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  sx={selectSx}
                >
                  <option value="true">مُبرَّر</option>
                  <option value="false">غير مُبرَّر</option>
                </Select>
                <FormErrorMessage>{errors.justification}</FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={Boolean(touched.noticed && errors.noticed)}
                gridColumn={{ md: 'span 2' }}
              >
                <FormLabel fontSize="sm">ملاحظة</FormLabel>
                <Field
                  as={Textarea}
                  name="noticed"
                  value={values.noticed}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="اختياري…"
                  rows={3}
                />
                <FormErrorMessage>{errors.noticed}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>
          </Form>
        </FormModal>
      )}
    </Formik>
  );
}