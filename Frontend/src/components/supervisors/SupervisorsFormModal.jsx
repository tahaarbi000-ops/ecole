import { useEffect, useState } from 'react';
import {
  SimpleGrid,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Button,
  Checkbox,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import FormModal from '../common/FormModal';

const ADMIN_ROLES = ['كاتب(ة)'];
const OTHER_ROLES = ['قيم(ة)', 'مدير(ة)', 'نائب مدير'];

const EMPTY_FORM = {
  name: '',
  last_name: '',
  phone: '',
  cin: '',
  salary: '',
  role: '',
  status: 'نشط',
  joined_date: '',
  email: '',
  password: '',
};

const validationSchema = Yup.object({
  name: Yup.string().trim().required('الاسم مطلوب.'),

  last_name: Yup.string().trim().required('اللقب مطلوب.'),

  phone: Yup.string()
    .trim()
    .required('رقم الهاتف مطلوب.')
    .matches(/^\d{8}$/, 'يجب أن يتكون رقم الهاتف من 8 أرقام.'),

  cin: Yup.string()
    .trim()
    .required('رقم بطاقة التعريف مطلوب.')
    .matches(/^\d{8}$/, 'يجب أن يتكون رقم بطاقة التعريف من 8 أرقام.'),

  salary: Yup.number()
    .typeError('الراتب يجب أن يكون رقمًا.')
    .positive('الراتب يجب أن يكون موجبًا.')
    .required('الراتب مطلوب.'),

  status: Yup.string()
    .oneOf(['نشط', 'في إجازة', 'غير نشط'], 'حالة غير صالحة.')
    .required('الحالة مطلوبة.'),

  role: Yup.string()
    .oneOf([...OTHER_ROLES, ...ADMIN_ROLES], 'الدور غير صالح.')
    .required('الدور مطلوب.'),

  joined_date: Yup.date()
    .required('تاريخ بداية العمل مطلوب')
    .typeError('تاريخ بداية العمل غير صالح'),

  email: Yup.string().when('role', {
    is: (role) => ADMIN_ROLES.includes(role),
    then: (schema) =>
      schema
        .trim()
        .email('البريد الإلكتروني غير صالح.')
        .required('البريد الإلكتروني مطلوب.'),
    otherwise: (schema) => schema.strip(),
  }),

  // Password is required on create, or on edit only when "change password" is ticked
  password: Yup.string().when(['role', '$requirePassword'], {
    is: (role, requirePassword) => ADMIN_ROLES.includes(role) && requirePassword,
    then: (schema) =>
      schema
        .min(6, 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.')
        .required('كلمة المرور مطلوبة.'),
    otherwise: (schema) => schema.strip(),
  }),
});

export default function SupervisorsFormModal({
  isOpen,
  onClose,
  onSubmit,
  person = null,
  isSaving = false,
  entityLabel,
  roleFieldKey,
  roleFieldLabel,
  roleOptions,
  showStatus = true,
  statusOptions = [],
  cinError,
  emailError,
}) {
  const isEditMode = Boolean(person);
  const [changePassword, setChangePassword] = useState(false);
  const requirePassword = !isEditMode || changePassword;

  const formik = useFormik({
    initialValues: EMPTY_FORM,
    validationSchema,
    validationContext: { isEditMode, requirePassword },

    enableReinitialize: true,

    onSubmit: async (values) => {
      const payload = {
        ...values,
        salary: Number(values.salary),
      };

      if (!ADMIN_ROLES.includes(values.role)) {
        delete payload.email;
        delete payload.password;
      } else if (!requirePassword || !payload.password) {
        delete payload.password;
      }

      await onSubmit(payload);
    },
  });

  useEffect(() => {
    if (isOpen) {
      setChangePassword(false);

      if (person) {
        // strip nested/server-only fields so they don't leak into the payload
        const { userSupervisor, createdAt, updatedAt, is_deleted, ...rest } = person;

        formik.setValues({
          ...EMPTY_FORM,
          ...rest,
          salary: person.salary ?? '',
          email: userSupervisor?.email ?? '',
          password: '',
        });
      } else {
        formik.resetForm({
          values: {
            ...EMPTY_FORM,
            status: statusOptions[0] || 'actif',
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, person]);

  const isAdminRole = ADMIN_ROLES.includes(formik.values.role);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditMode
          ? `تعديل — ${person.last_name} ${person.name}`
          : `اضافة ${entityLabel}`
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>

          <Button
            onClick={formik.handleSubmit}
            isLoading={isSaving}
            loadingText="جارٍ الحفظ…"
          >
            {isEditMode ? 'حفظ التعديلات' : 'إضافة'}
          </Button>
        </>
      }
      size="lg"
    >
      <form dir="rtl" onSubmit={formik.handleSubmit} noValidate>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {/* CIN */}
          <FormControl
            isInvalid={(formik.touched.cin && Boolean(formik.errors.cin)) || cinError}
            isRequired
          >
            <FormLabel fontSize="sm">رقم بطاقة التعريف</FormLabel>

            <Input
              name="cin"
              value={formik.values.cin}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="12345678"
            />

            <FormErrorMessage>
              {formik.errors.cin || (cinError && 'رقم بطاقة التعريف مستعمل')}
            </FormErrorMessage>
          </FormControl>

          {/* Nom */}
          <FormControl
            isInvalid={formik.touched.name && Boolean(formik.errors.name)}
            isRequired
          >
            <FormLabel fontSize="sm">الاسم</FormLabel>

            <Input
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="محمد"
            />

            <FormErrorMessage>{formik.errors.name}</FormErrorMessage>
          </FormControl>

          {/* Prénom */}
          <FormControl
            isInvalid={formik.touched.last_name && Boolean(formik.errors.last_name)}
            isRequired
          >
            <FormLabel fontSize="sm">اللقب</FormLabel>

            <Input
              name="last_name"
              value={formik.values.last_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="علي"
            />

            <FormErrorMessage>{formik.errors.last_name}</FormErrorMessage>
          </FormControl>

          {/* Téléphone */}
          <FormControl
            isInvalid={formik.touched.phone && Boolean(formik.errors.phone)}
            isRequired
          >
            <FormLabel fontSize="sm">رقم الهاتف</FormLabel>

            <Input
              name="phone"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="20123456"
            />

            <FormErrorMessage>{formik.errors.phone}</FormErrorMessage>
          </FormControl>

          {/* Role / matière */}
          <FormControl
            isInvalid={formik.touched.role && Boolean(formik.errors.role)}
            isRequired
          >
            <FormLabel fontSize="sm">وظيفة</FormLabel>

            <Select
              name="role"
              placeholder="اختر الوظيفة"
              value={formik.values.role || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              sx={{
                textAlign: 'right',
                paddingRight: '1rem',
                paddingLeft: '2rem',
                '& + div': { insetInlineEnd: 'auto', insetInlineStart: '0.5rem' },
              }}
            >
              {roleOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
            <FormErrorMessage>{formik.errors.role}</FormErrorMessage>
          </FormControl>

          {/* Salaire */}
          <FormControl
            isInvalid={formik.touched.salary && Boolean(formik.errors.salary)}
            isRequired
          >
            <FormLabel fontSize="sm">الراتب</FormLabel>

            <InputGroup>
              <Input
                type="number"
                min="0"
                name="salary"
                value={formik.values.salary}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="1200"
                dir="ltr"
                textAlign="right"
              />
              <InputLeftElement
                textAlign="left"
                w="3.2rem"
                color="ink.400"
                fontSize="sm"
              >
                دت
              </InputLeftElement>
            </InputGroup>

            <FormErrorMessage>{formik.errors.salary}</FormErrorMessage>
          </FormControl>

          {/* Email — only for كاتب(ة) */}
          {isAdminRole && (
            <FormControl
              isInvalid={
                (formik.touched.email && Boolean(formik.errors.email)) || emailError
              }
              isRequired
            >
              <FormLabel fontSize="sm">البريد الإلكتروني</FormLabel>

              <Input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="example@domain.com"
                dir="ltr"
                textAlign="right"
              />

              <FormErrorMessage>
                {formik.errors.email || (emailError && 'البريد الإلكتروني مستعمل')}
              </FormErrorMessage>
            </FormControl>
          )}

          {/* Change-password checkbox — edit mode only */}
          {isAdminRole && isEditMode && (
            <FormControl display="flex" alignItems="center" pt={{ md: 8 }}>
              <Checkbox
                isChecked={changePassword}
                onChange={(e) => {
                  setChangePassword(e.target.checked);
                  if (!e.target.checked) {
                    formik.setFieldValue('password', '');
                    formik.setFieldTouched('password', false);
                  }
                }}
              >
                تغيير كلمة المرور
              </Checkbox>
            </FormControl>
          )}

          {/* Password — always in create mode, only when checked in edit mode */}
          {isAdminRole && requirePassword && (
            <FormControl
              isInvalid={formik.touched.password && Boolean(formik.errors.password)}
              isRequired
            >
              <FormLabel fontSize="sm">كلمة المرور</FormLabel>

              <Input
                type="password"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="••••••••"
                dir="ltr"
                textAlign="right"
              />

              <FormErrorMessage>{formik.errors.password}</FormErrorMessage>
            </FormControl>
          )}

          {/* Joined date */}
          <FormControl
            isInvalid={formik.touched.joined_date && Boolean(formik.errors.joined_date)}
          >
            <FormLabel fontSize="sm">تاريخ بدء العمل</FormLabel>

            <Input
              type="date"
              name="joined_date"
              value={formik.values.joined_date}
              onChange={formik.handleChange}
              max={new Date().toISOString().split('T')[0]}
            />

            <FormErrorMessage>{formik.errors.joined_date}</FormErrorMessage>
          </FormControl>

          {/* Status */}
          <FormControl
            isInvalid={formik.touched.status && Boolean(formik.errors.status)}
          >
            <FormLabel fontSize="sm">الحالة</FormLabel>

            <Select
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              sx={{
                textAlign: 'right',
                paddingRight: '1rem',
                paddingLeft: '2rem',
                '& + div': {
                  insetInlineEnd: 'auto',
                  insetInlineStart: '0.5rem',
                },
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>

            <FormErrorMessage>{formik.errors.status}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>
      </form>
    </FormModal>
  );
}