import { useEffect } from 'react';
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
} from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import FormModal from '../common/FormModal';
import { levels } from '../../data/school';

// TODO: replace with zones fetched from API (Zone model: id, label, price)
const DUMMY_ZONES = [
  { id: 1, label: 'Zone A - Khezama' },
  { id: 2, label: 'Zone B - Sahloul' },
  { id: 3, label: 'Zone C - Hammam Sousse' },
];

const EMPTY_FORM = {
  name: '',
  last_name: '',
  father_name: '',
  mother_name: '',
  father_phone: '',
  mother_phone: '',
  gender: 'garçon',
  birthday: '',
  classe: '',
  address: '',
  transport: 'non',
  zone_id: '',
};

const studentSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('Name is required.'),

  last_name: Yup.string()
    .trim()
    .required('Last name is required.'),

  father_name: Yup.string()
    .trim(),

  mother_name: Yup.string()
    .trim(),

  father_phone: Yup.string()
    .matches(
      /^\d[\d\s]{6,}$/,
      'Invalid phone number.'
    )
    .nullable(),

  mother_phone: Yup.string()
    .matches(
      /^\d[\d\s]{6,}$/,
      'Invalid phone number.'
    )
    .nullable(),

  gender: Yup.string()
    .oneOf(['garçon', 'fille'], 'Gender must be garçon or fille.')
    .required('Gender is required.'),

  birthday: Yup.date()
    .required('Date of birth is required.')
    .typeError('Invalid date of birth.'),

  classe: Yup.string()
    .trim()
    .required('Class is required.'),

  address: Yup.string()
    .trim()
    .required('Address is required.'),

  transport: Yup.string()
    .oneOf(['oui', 'non'], 'Invalid transport value.')
    .required('Transport is required.'),

  zone_id: Yup.string()
    .when('transport', {
      is: 'oui',
      then: (schema) => schema.required('Zone is required when transport is enabled.'),
      otherwise: (schema) => schema.notRequired(),
    }),
});

export default function StudentFormModal({
  isOpen,
  onClose,
  onSubmit,
  student = null,
  isSaving = false,
}) {
  const isEditMode = Boolean(student);

  const initialValues = student
    ? {
        ...EMPTY_FORM,
        ...student,
      }
    : EMPTY_FORM;

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
              ? `Modifier l’élève — ${student.first_name || student.prenom} ${student.name || student.nom}`
              : 'Ajouter un élève'
          }
          footer={
            <>
              <Button
                variant="outline"
                onClick={onClose}
                isDisabled={isSaving}
              >
                Annuler
              </Button>

              <Button
                onClick={handleSubmit}
                isLoading={isSaving}
                loadingText="Enregistrement…"
              >
                {isEditMode
                  ? 'Enregistrer les modifications'
                  : 'Ajouter l’élève'}
              </Button>
            </>
          }
        >
          <Form id="student-form">
            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              spacing={4}
            >
              {/* Name */}
              <FormControl
                isInvalid={touched.name && errors.name}
                isRequired
              >
                <FormLabel fontSize="sm">
                  Nom
                </FormLabel>

                <Input
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  placeholder="Ben Ali"
                />

                <FormErrorMessage>
                  {errors.name}
                </FormErrorMessage>
              </FormControl>

              {/* Last name */}
              <FormControl
                isInvalid={touched.last_name && errors.last_name}
                isRequired
              >
                <FormLabel fontSize="sm">
                  Prénom
                </FormLabel>

                <Input
                  name="last_name"
                  value={values.last_name}
                  onChange={handleChange}
                  placeholder="Mohamed"
                />

                <FormErrorMessage>
                  {errors.last_name}
                </FormErrorMessage>
              </FormControl>

              {/* Father */}
              <FormControl>
                <FormLabel fontSize="sm">
                  Nom de pére
                </FormLabel>

                <Input
                  name="father_name"
                  value={values.father_name}
                  onChange={handleChange}
                  placeholder="Karim Ben Ali"
                />
              </FormControl>

              {/* Mother */}
              <FormControl>
                <FormLabel fontSize="sm">
                  Nom de mére
                </FormLabel>

                <Input
                  name="mother_name"
                  value={values.mother_name}
                  onChange={handleChange}
                  placeholder="Amel Trabelsi"
                />
              </FormControl>

              {/* Father phone */}
              <FormControl
                isInvalid={
                  touched.father_phone &&
                  errors.father_phone
                }
              >
                <FormLabel fontSize="sm">
                  Numéro de téléphone du père
                </FormLabel>

                <Input
                  name="father_phone"
                  value={values.father_phone}
                  onChange={handleChange}
                  placeholder="20 145 632"
                />

                <FormErrorMessage>
                  {errors.father_phone}
                </FormErrorMessage>
              </FormControl>

              {/* Mother phone */}
              <FormControl
                isInvalid={
                  touched.mother_phone &&
                  errors.mother_phone
                }
              >
                <FormLabel fontSize="sm">
                  Numéro de téléphone du mére

                </FormLabel>

                <Input
                  name="mother_phone"
                  value={values.mother_phone}
                  onChange={handleChange}
                  placeholder="22 987 411"
                />

                <FormErrorMessage>
                  {errors.mother_phone}
                </FormErrorMessage>
              </FormControl>

              {/* Gender */}
              <FormControl isRequired>
                <FormLabel fontSize="sm">
                  Genre
                </FormLabel>

                <RadioGroup
                  value={values.gender}
                  onChange={(value) =>
                    setFieldValue('gender', value)
                  }
                >
                  <HStack spacing={5} h="40px">
                    <Radio value="garçon" colorScheme="blue">
                      Boy
                    </Radio>

                    <Radio value="fille" colorScheme="blue">
                      Girl
                    </Radio>
                  </HStack>
                </RadioGroup>

                <FormErrorMessage>
                  {errors.gender}
                </FormErrorMessage>
              </FormControl>

              {/* Birthday */}
              <FormControl
                isInvalid={
                  touched.birthday &&
                  errors.birthday
                }
                isRequired
              >
                <FormLabel fontSize="sm">
                  Date de naissance
                </FormLabel>

                <Input
                  type="date"
                  name="birthday"
                  value={values.birthday}
                  onChange={handleChange}
                  max={new Date(
                  new Date().setFullYear(new Date().getFullYear() - 5)
                )
                  .toISOString()
                  .split("T")[0]}
                />

                <FormErrorMessage>
                  {errors.birthday}
                </FormErrorMessage>
              </FormControl>

              {/* Class */}
              <FormControl
                isInvalid={
                  touched.classe &&
                  errors.classe
                }
                isRequired
              >
                <FormLabel fontSize="sm">
                  Niveau
                </FormLabel>

                <Select
                  name="classe"
                  placeholder="Sélectionnez une classe"
                  value={values.classe}
                  onChange={handleChange}
                >
                  {levels.map((level) => (
                    <option
                      key={level}
                      value={level}
                    >
                      {level}
                    </option>
                  ))}
                </Select>

                <FormErrorMessage>
                  {errors.classe}
                </FormErrorMessage>
              </FormControl>

              {/* Transport */}
              <FormControl isRequired>
                <FormLabel fontSize="sm">
                  Transport
                </FormLabel>

                <RadioGroup
                  value={values.transport}
                  onChange={(value) => {
                    setFieldValue('transport', value);
                    if (value === 'non') {
                      setFieldValue('zone_id', '');
                    }
                  }}
                >
                  <HStack spacing={5} h="40px">
                    <Radio value="oui" colorScheme="blue">
                      Oui
                    </Radio>

                    <Radio value="non" colorScheme="blue">
                      Non
                    </Radio>
                  </HStack>
                </RadioGroup>

                <FormErrorMessage>
                  {errors.transport}
                </FormErrorMessage>
              </FormControl>

              {/* Zone (only relevant when transport is enabled) */}
              <FormControl
                isInvalid={
                  touched.zone_id &&
                  errors.zone_id
                }
                isRequired={values.transport === 'oui'}
                isDisabled={values.transport !== 'oui'}
              >
                <FormLabel fontSize="sm">
                  Zone
                </FormLabel>

                <Select
                  name="zone_id"
                  placeholder="Sélectionnez une zone"
                  value={values.zone_id}
                  onChange={handleChange}
                >
                  {DUMMY_ZONES.map((zone) => (
                    <option
                      key={zone.id}
                      value={zone.id}
                    >
                      {zone.label}
                    </option>
                  ))}
                </Select>

                <FormErrorMessage>
                  {errors.zone_id}
                </FormErrorMessage>
              </FormControl>

              {/* Address */}
              <FormControl
                isInvalid={
                  touched.address &&
                  errors.address
                }
                isRequired
                gridColumn={{ md: 'span 2' }}
              >
                <FormLabel fontSize="sm">
                  Adresse
                </FormLabel>

                <Input
                  name="address"
                  value={values.address}
                  onChange={handleChange}
                  placeholder="Sousse — Khezama"
                />

                <FormErrorMessage>
                  {errors.address}
                </FormErrorMessage>
              </FormControl>
            </SimpleGrid>
          </Form>
        </FormModal>
      )}
    </Formik>
  );
}