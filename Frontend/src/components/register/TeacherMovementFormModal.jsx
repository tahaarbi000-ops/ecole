import { useMemo } from 'react';
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
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import FormModal from '../common/FormModal';
import { AxiosToken } from '../../api/Api';

const SENSE_OPTIONS = [
  { value: 'دخول', label: 'دخول' },
  { value: 'خروج', label: 'خروج' },
];

const EMPTY_VALUES = {
  date: '',
  time: '',
  sense: '',
  justification: '',
  teacher_id: '',
  noticed: '',
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

// Same key as StaffPageBase, so the teachers list is shared from cache
const fetchTeachers = async () => {
  const { data } = await AxiosToken.get('/teacher');
  return data.teachers ?? [];
};

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

const selectSx = {
  textAlign: 'right',
  paddingRight: '1rem',
  paddingLeft: '2rem',
  '& + div': {
    insetInlineEnd: 'auto',
    insetInlineStart: '0.5rem',
  },
};

/**
 * نافذة نموذج لتسجيل حضور/انصراف المعلّمين (دخول أو خروج).
 * onSubmit should return false on failure to keep the form values.
 */
export default function TeacherScoringFormModal({
  isOpen,
  onClose,
  onSubmit,
  scoring = null,
  isSaving = false,
}) {
  const isEditMode = Boolean(scoring);

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: fetchTeachers,
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
  });
  const teachers = teachersData ?? [];

  const initialValues = useMemo(
    () => ({
      ...EMPTY_VALUES,
      ...(scoring
        ? {
            ...scoring,
            teacher_id: scoring.teacher_id ?? scoring.scoringTeacher?.id ?? '',
            noticed: scoring.noticed ?? '',
            justification:
              scoring.justification === true || scoring.justification === false
                ? String(scoring.justification)
                : scoring.justification ?? '',
          }
        : {}),
    }),
    [scoring]
  );

  const timeSlots = useMemo(() => generateTimeSlots(8, 18, 30), []);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const ok = await onSubmit({
        ...values,
        teacher_id: Number(values.teacher_id),
        justification: values.justification === 'true',
      });
      if (ok !== false) resetForm();
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
      {({ values, errors, touched, handleChange, handleBlur, submitForm }) => (
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
                <Select
                  name="teacher_id"
                  placeholder="اختر"
                  value={values.teacher_id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  sx={selectSx}
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.last_name} - {t.cin}
                    </option>
                  ))}
                </Select>
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