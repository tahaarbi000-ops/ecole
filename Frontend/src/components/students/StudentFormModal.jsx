import { useEffect, useState } from 'react';
import {
  SimpleGrid,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Button,
  RadioGroup,
  Radio,
  HStack,
  Badge,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import FormModal from '../common/FormModal';
import { levels, paiements } from '../../data/school';
import { AxiosToken } from '../../api/Api';



const EMPTY_FORM = {
  name: '',
  unique_id: '',
  last_name: '',
  father_name: '',
  mother_name: '',
  father_phone: '',
  mother_phone: '',
  gender: 'ولد',
  birthday: '',
  classe: '',
  address: '',
  payment_type: '',
  transport: 'false',
  is_take_uniform: 'false',
  is_take_book: 'false',
  zone_id: '',
};

const studentSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('الاسم مطلوب.'),

  last_name: Yup.string()
    .trim()
    .required('اللقب مطلوب.'),

  father_name: Yup.string()
    .trim(),

  mother_name: Yup.string()
    .trim(),

  father_phone: Yup.string()
    .matches(
      /^\d[\d\s]{6,}$/,
      'رقم هاتف الأب غير صالح.'
    )
    .nullable(),

  mother_phone: Yup.string()
    .matches(
      /^\d[\d\s]{6,}$/,
      'رقم هاتف الأم غير صالح.'
    )
    .nullable(),

  gender: Yup.string()
    .oneOf(
      ['بنت', 'ولد'],
      'الجنس يجب أن يكون ولد أو بنت.'
    )
    .required('الجنس مطلوب.'),

  birthday: Yup.date()
    .required('تاريخ الميلاد مطلوب.')
    .typeError('تاريخ الميلاد غير صالح.'),

  classe: Yup.string()
    .trim()
    .required('القسم مطلوب.'),

  payment_type: Yup.string()
    .trim()
    .required('طريقة الدفع مطلوب.'),

  address: Yup.string()
    .trim()
    .required('العنوان مطلوب.'),

  transport: Yup.string()
    .oneOf(
      ['true', 'false'],
      'قيمة النقل غير صالحة.'
    )
    .required('النقل مطلوب.'),

  zone_id: Yup.string()
    .when('transport', {
      is: 'true',
      then: (schema) =>
        schema.required('المنطقة مطلوبة عند تفعيل النقل.'),
      otherwise: (schema) =>
        schema.notRequired(),
    }),
});

export default function StudentFormModal({
  isOpen,
  onClose,
  onSubmit,
  student = null,
  isSaving = false,
  uniqueIsError = false,
  setUniqueIsError = () => {},
  lockedFatherName = null,      // NEW
  offerPositionLabel = null,    // NEW
  offerPromotionLabel = null,   // NEW — "خصم 50%" أو "مجاني بالكامل" عند تلميذ العرض الأخير
}) {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await AxiosToken.get('/zone');
        setZones(response.data.zones);
      } catch (err) {
        console.error('error', err);
      }
    };
    fetchData();
  }, [isSaving]);

  const isEditMode = Boolean(student);
  const isFatherNameLocked = Boolean(lockedFatherName) && !isEditMode;

  const mapStudentToFormValues = (s) => ({
    name: s.name ?? '',
    unique_id: s.unique_id ?? '',
    last_name: s.last_name ?? '',
    father_name: s.father_name ?? '',
    mother_name: s.mother_name ?? '',
    father_phone: s.father_phone ?? '',
    mother_phone: s.mother_phone ?? '',
    gender: s.gender ?? 'ولد',
    birthday: s.birthday ? s.birthday.split('T')[0] : '',
    classe: s.class ?? '',
    address: s.address ?? '',
    payment_type: s.subscription?.payment_type ?? '',
    transport: s.subscription?.transport ? 'true' : 'false',
    is_take_uniform: s.subscription?.is_take_uniform ? 'true' : 'false',
    is_take_book: s.subscription?.is_take_book ? 'true' : 'false',
    zone_id: s.subscription?.zone?.id ?? '',
  });

  const initialValues = student
    ? mapStudentToFormValues(student)
    : { ...EMPTY_FORM, father_name: lockedFatherName || '' }; // NEW

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={studentSchema}
      enableReinitialize
      onSubmit={onSubmit}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleSubmit,
        setFieldValue,
      }) => (
        <FormModal
          isOpen={isOpen}
          onClose={onClose}
          title={
            isEditMode
              ? `تعديل التلميذ — ${student.name} ${student.last_name}`
              : offerPositionLabel
                ? `إضافة تلميذ — ${offerPositionLabel}` // NEW
                : 'إضافة تلميذ'
          }
          footer={
            <>
              <Button variant="outline" onClick={onClose} isDisabled={isSaving}>
                الغاء
              </Button>
              <Button onClick={handleSubmit} isLoading={isSaving} loadingText="حفظ…">
                {isEditMode ? 'حفظ التغييرات' : 'أضف التلميذ'}
              </Button>
            </>
          }
        >
          <Form id="student-form" dir="rtl">
            {offerPromotionLabel && (
              <Alert status="success" borderRadius="lg" fontSize="sm" mb={4}>
                <AlertIcon />
                سيتم تطبيق عرض الإخوة على هذا التلميذ: <b>&nbsp;{offerPromotionLabel}&nbsp;</b>
              </Alert>
            )}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>

              {/* Unique ID */}
              <FormControl
                isInvalid={(touched.unique_id && errors.unique_id) || uniqueIsError}
              >
                <FormLabel fontSize="sm">المعرف الوحيد</FormLabel>
                <Input
                  name="unique_id"
                  value={values.unique_id}
                  onChange={(e) => {
                    handleChange(e);
                    if (uniqueIsError) setUniqueIsError(false);
                  }}
                  placeholder="11111111"
                />
                <FormErrorMessage>
                  {errors.unique_id ? errors.unique_id : uniqueIsError ? 'المعرف الوحيد متكرر' : null}
                </FormErrorMessage>
              </FormControl>

              {/* Name */}
              <FormControl isInvalid={touched.name && errors.name} isRequired>
                <FormLabel fontSize="sm">الاسم</FormLabel>
                <Input name="name" value={values.name} onChange={handleChange} placeholder="محمد" />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              {/* Last name */}
              <FormControl isInvalid={touched.last_name && errors.last_name} isRequired>
                <FormLabel fontSize="sm">اللقب</FormLabel>
                <Input name="last_name" value={values.last_name} onChange={handleChange} placeholder="علي" />
                <FormErrorMessage>{errors.last_name}</FormErrorMessage>
              </FormControl>

              {/* Father - locked when coming from an offer session */}
              <FormControl isDisabled={isFatherNameLocked}>
                <FormLabel fontSize="sm">
                  اسم الأب {isFatherNameLocked && <Badge ml={2} colorScheme="purple">مثبّت من العرض</Badge>}
                </FormLabel>
                <Input
                  name="father_name"
                  value={values.father_name}
                  onChange={handleChange}
                  placeholder="كريم علي"
                  isDisabled={isFatherNameLocked}
                />
              </FormControl>

              {/* Mother */}
              <FormControl>
                <FormLabel fontSize="sm">اسم الأم</FormLabel>
                <Input name="mother_name" value={values.mother_name} onChange={handleChange} placeholder="أمل التونسي" />
              </FormControl>

              {/* Father phone */}
              <FormControl isInvalid={touched.father_phone && errors.father_phone}>
                <FormLabel fontSize="sm">رقم هاتف الأب</FormLabel>
                <Input name="father_phone" value={values.father_phone} onChange={handleChange} placeholder="632 145 20" />
                <FormErrorMessage>{errors.father_phone}</FormErrorMessage>
              </FormControl>

              {/* Mother phone */}
              <FormControl isInvalid={touched.mother_phone && errors.mother_phone}>
                <FormLabel fontSize="sm">رقم هاتف الأم</FormLabel>
                <Input dir="rtl" name="mother_phone" value={values.mother_phone} onChange={handleChange} placeholder="411 987 22" />
                <FormErrorMessage>{errors.mother_phone}</FormErrorMessage>
              </FormControl>

              {/* Gender */}
              <FormControl isRequired>
                <FormLabel fontSize="sm">جنس</FormLabel>
                <RadioGroup value={values.gender} onChange={(value) => setFieldValue('gender', value)}>
                  <HStack spacing={5} h="40px">
                    <Radio value="ولد" colorScheme="blue">ولد</Radio>
                    <Radio value="بنت" colorScheme="blue">بنت</Radio>
                  </HStack>
                </RadioGroup>
                <FormErrorMessage>{errors.gender}</FormErrorMessage>
              </FormControl>

              {/* Birthday */}
              <FormControl isInvalid={touched.birthday && errors.birthday} isRequired>
                <FormLabel fontSize="sm">تاريخ الميلاد</FormLabel>
                <Input
                  lang="ar-AR"
                  dir="rtl"
                  type="date"
                  name="birthday"
                  value={values.birthday}
                  onChange={handleChange}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 5)).toISOString().split('T')[0]}
                />
                <FormErrorMessage>{errors.birthday}</FormErrorMessage>
              </FormControl>

              {/* Class */}
              <FormControl isInvalid={touched.classe && errors.classe} isRequired>
                <FormLabel fontSize="sm">القسم</FormLabel>
                <Select
                  name="classe"
                  placeholder="اختر مستوى"
                  value={values.classe}
                  onChange={handleChange}
                  sx={{
                    textAlign: 'right', paddingRight: '1rem', paddingLeft: '2rem',
                    '& + div': { insetInlineEnd: 'auto', insetInlineStart: '0.5rem' },
                  }}
                >
                  {levels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.classe}</FormErrorMessage>
              </FormControl>

              {/* Payment */}
              <FormControl isInvalid={touched.payment_type && errors.payment_type} isRequired>
                <FormLabel fontSize="sm">الدفع</FormLabel>
                <Select
                  name="payment_type"
                  placeholder="اختر طريق الدفع"
                  value={values.payment_type}
                  onChange={handleChange}
                  sx={{
                    textAlign: 'right', paddingRight: '1rem', paddingLeft: '2rem',
                    '& + div': { insetInlineEnd: 'auto', insetInlineStart: '0.5rem' },
                  }}
                >
                  {paiements.map((paiement) => (
                    <option key={paiement} value={paiement}>{paiement}</option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.payment_type}</FormErrorMessage>
              </FormControl>

              {['التحضيري', 'السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة'].includes(values.classe) && (
                <FormControl isRequired>
                  <FormLabel fontSize="sm">اقتناء الكتب</FormLabel>
                  <RadioGroup value={values.is_take_book} onChange={(value) => setFieldValue('is_take_book', value)}>
                    <HStack spacing={5} h="40px">
                      <Radio value="true" colorScheme="blue">نعم</Radio>
                      <Radio value="false" colorScheme="blue">لا</Radio>
                    </HStack>
                  </RadioGroup>
                </FormControl>
              )}

              <FormControl isRequired>
                <FormLabel fontSize="sm">اقتناء ميدعة</FormLabel>
                <RadioGroup value={values.is_take_uniform} onChange={(value) => setFieldValue('is_take_uniform', value)}>
                  <HStack spacing={5} h="40px">
                    <Radio value="true" colorScheme="blue">نعم</Radio>
                    <Radio value="false" colorScheme="blue">لا</Radio>
                  </HStack>
                </RadioGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">مواصلات</FormLabel>
                <RadioGroup
                  value={values.transport}
                  onChange={(value) => {
                    setFieldValue('transport', value);
                    if (value === 'false') setFieldValue('zone_id', '');
                  }}
                >
                  <HStack spacing={5} h="40px">
                    <Radio value="true" colorScheme="blue">نعم</Radio>
                    <Radio value="false" colorScheme="blue">لا</Radio>
                  </HStack>
                </RadioGroup>
                <FormErrorMessage>{errors.transport}</FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={touched.zone_id && errors.zone_id}
                isRequired={values.transport === 'true'}
                isDisabled={values.transport !== 'true'}
              >
                <FormLabel fontSize="sm">منطقة</FormLabel>
                <Select
                  name="zone_id"
                  placeholder="اختر منطقة"
                  value={values.zone_id}
                  onChange={handleChange}
                  sx={{
                    textAlign: 'right', paddingRight: '1rem', paddingLeft: '2rem',
                    '& + div': { insetInlineEnd: 'auto', insetInlineStart: '0.5rem' },
                  }}
                >
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>{zone.label}</option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.zone_id}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={touched.address && errors.address} isRequired gridColumn={{ md: 'span 2' }}>
                <FormLabel fontSize="sm">عنوان</FormLabel>
                <Input name="address" value={values.address} onChange={handleChange} placeholder="فوار الشرقية" />
                <FormErrorMessage>{errors.address}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>
          </Form>
        </FormModal>
      )}
    </Formik>
  );
}