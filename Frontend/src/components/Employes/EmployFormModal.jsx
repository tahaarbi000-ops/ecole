import { useEffect } from 'react';
import {
  SimpleGrid,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Button,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import FormModal from '../common/FormModal';

const EMPTY_FORM = {
  name: '',
  last_name: '',
  phone: '',
  date_deposited: '',
  salary: '',
  status: 'actif',
};

const validationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('Le nom est requis.'),

  last_name: Yup.string()
    .trim()
    .required('Le prénom est requis.'),

  phone: Yup.string()
    .trim()
    .required('Le téléphone est requis.')
    .matches(/^\d{8}$/, 'Le numéro doit contenir 8 chiffres.'),

  date_deposited: Yup.date()
    .required('La date est requise.')
    .typeError('Date invalide.'),

  salary: Yup.number()
    .typeError('Le salaire doit être un nombre.')
    .positive('Le salaire doit être positif.')
    .required('Le salaire est requis.'),
    role: Yup.string()
        .oneOf(
          ["secrétaire","comptable","chauffeur","agent de nettoyage","agent de sécurité"],
          'Rôle invalide.'
        )
        .required('Le rôle est requis.'),

  status: Yup.string()
    .oneOf(
      ['actif', 'inactif', 'en congé'],
      'Statut invalide.'
    )
    .required('Le statut est requis.'),
});

export default function EmployFormModal({
  isOpen,
  onClose,
  onSubmit,
  person = null,
  isSaving = false,
  entityLabel,
  roleFieldKey,
  roleFieldLabel,
  roleOptions,
  showStatus = false,
  statusOptions = [],
}) {
  const isEditMode = Boolean(person);

  const formik = useFormik({
    initialValues: EMPTY_FORM,
    validationSchema,

    enableReinitialize: true,

    onSubmit: async (values) => {
      await onSubmit({
        ...values,
        salary: Number(values.salary),
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (person) {
        formik.setValues({
          ...EMPTY_FORM,
          ...person,
          salary: person.salary ?? '',
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
  }, [isOpen, person]);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditMode
          ? `Modifier — ${person.last_name} ${person.name}`
          : `Ajouter ${entityLabel}`
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>

          <Button
            onClick={formik.handleSubmit}
            isLoading={isSaving}
            loadingText="Enregistrement…"
          >
            {isEditMode
              ? 'Enregistrer les modifications'
              : 'Ajouter'}
          </Button>
        </>
      }
      size="lg"
    >
      <form onSubmit={formik.handleSubmit} noValidate>
        <SimpleGrid
          columns={{ base: 1, md: 2 }}
          spacing={4}
        >
          {/* Nom */}
          <FormControl
            isInvalid={
              formik.touched.name && Boolean(formik.errors.name)
            }
            isRequired
          >
            <FormLabel fontSize="sm">
              Nom
            </FormLabel>

            <Input
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Ben Ali"
            />

            <FormErrorMessage>
              {formik.errors.name}
            </FormErrorMessage>
          </FormControl>

          {/* Prénom */}
          <FormControl
            isInvalid={
              formik.touched.last_name &&
              Boolean(formik.errors.last_name)
            }
            isRequired
          >
            <FormLabel fontSize="sm">
              Prénom
            </FormLabel>

            <Input
              name="last_name"
              value={formik.values.last_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Mohamed"
            />

            <FormErrorMessage>
              {formik.errors.last_name}
            </FormErrorMessage>
          </FormControl>

          {/* Téléphone */}
          <FormControl
            isInvalid={
              formik.touched.phone &&
              Boolean(formik.errors.phone)
            }
            isRequired
          >
            <FormLabel fontSize="sm">
              Téléphone
            </FormLabel>

            <Input
              name="phone"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="20123456"
            />

            <FormErrorMessage>
              {formik.errors.phone}
            </FormErrorMessage>
          </FormControl>

          <FormControl
            isRequired
          >
            <FormLabel fontSize="sm">
              Rôle
            </FormLabel>

            <Select
              name="role"
              placeholder={`Sélectionner rôle`}
              value={formik.values.role}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              {roleOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </FormControl>

          {/* Date */}
          <FormControl
            isInvalid={
              formik.touched.date_deposited &&
              Boolean(formik.errors.date_deposited)
            }
            isRequired
          >
            <FormLabel fontSize="sm">
              Date dépôt salaire
            </FormLabel>

            <Input
              type="date"
              name="date_deposited"
              value={formik.values.date_deposited}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />

            <FormErrorMessage>
              {formik.errors.date_deposited}
            </FormErrorMessage>
          </FormControl>

          {/* Salaire */}
          <FormControl
            isInvalid={
              formik.touched.salary &&
              Boolean(formik.errors.salary)
            }
            isRequired
          >
            <FormLabel fontSize="sm">
              Salaire
            </FormLabel>

            <InputGroup>
              <Input
                type="number"
                min="0"
                name="salary"
                value={formik.values.salary}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="1200"
              />

              <InputRightElement
                w="3.2rem"
                color="ink.400"
                fontSize="sm"
              >
                DT
              </InputRightElement>
            </InputGroup>

            <FormErrorMessage>
              {formik.errors.salary}
            </FormErrorMessage>
          </FormControl>

          {/* Status */}
          {showStatus && (
            <FormControl
              isInvalid={
                formik.touched.status &&
                Boolean(formik.errors.status)
              }
            >
              <FormLabel fontSize="sm">
                Statut
              </FormLabel>

              <Select
                name="status"
                value={formik.values.status}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>

              <FormErrorMessage>
                {formik.errors.status}
              </FormErrorMessage>
            </FormControl>
          )}
        </SimpleGrid>
      </form>
    </FormModal>
  );
}