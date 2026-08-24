import { useEffect, useMemo, useState } from 'react';
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
import FormModal from '../common/FormModal';
import { AxiosToken } from '../../api/Api';

const SENSE_OPTIONS = [
  { value: 'entrée', label: 'Entrée' },
  { value: 'sortie', label: 'Sortie' },
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
  date: Yup.string().required('La date est requise.'),
  time: Yup.string()
    .required('L\u2019heure est requise.')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Heure invalide.'),
  sense: Yup.string()
    .required('Le sens est requis.')
    .oneOf(SENSE_OPTIONS.map((o) => o.value), 'Sens invalide.'),
  justification: Yup.string().required('La justification est requise.'),
  teacher_id: Yup.number()
    .typeError('Le maître est requis.')
    .required('Le maître est requis.')
    .integer('Identifiant de maître invalide.'),
  noticed: Yup.string().max(255, 'Ne doit pas dépasser 255 caractères.'),
});

/**
 * Formulaire modal pour le pointage/scoring des maîtres (entrée ou sortie).
 * Les champs correspondent à ceux attendus par le contrôleur createScoring.
 */
export default function TeacherScoringFormModal({
  isOpen,
  onClose,
  onSubmit,
  scoring = null,
  isSaving = false,
}) {
  const isEditMode = Boolean(scoring);
  const [teachers,setTeachers] = useState([])

    useEffect(() => {
    const loadPeople = async () => {
      try {
        const data = await AxiosToken.get("/teacher");
  
        setTeachers(data.data.teachers);
      } catch (error) {
        console.error('Error loading personnel:', error);
    };
    }
    loadPeople();
  }, [isSaving]);

  const initialValues = useMemo(
    () => ({
      ...EMPTY_VALUES,
      ...(scoring
        ? {
            ...scoring,
            justification:
              scoring.justification === true || scoring.justification === false
                ? String(scoring.justification)
                : scoring.justification ?? '',
          }
        : {}),
    }),
    [scoring]
  );

  const handleSubmit = (values, { setSubmitting }) => {
    onSubmit({
      ...values,
      teacher_id: Number(values.teacher_id),
      justification: values.justification === 'true',
    });
    setSubmitting(false);
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
          title={isEditMode ? 'Modifier le pointage' : 'Enregistrer un pointage — Maître'}
          footer={
            <>
              <Button variant="outline" onClick={onClose}>Annuler</Button>
              <Button onClick={submitForm} isLoading={isSaving} loadingText="Enregistrement…">
                {isEditMode ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </>
          }
          size="lg"
        >
          <Form noValidate>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isInvalid={Boolean(touched.date && errors.date)} isRequired>
                <FormLabel fontSize="sm">Date</FormLabel>
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
                <FormLabel fontSize="sm">Heure</FormLabel>
                <Input
                  type="time"
                  name="time"
                  value={values.time}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <FormErrorMessage>{errors.time}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={Boolean(touched.teacher_id && errors.teacher_id)} isRequired>
                <FormLabel fontSize="sm">Maître</FormLabel>
                <Select
                  name="teacher_id"
                  placeholder="Sélectionner"
                  value={values.teacher_id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.last_name} - {t.phone}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.teacher_id}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={Boolean(touched.sense && errors.sense)} isRequired>
                <FormLabel fontSize="sm">Sens</FormLabel>
                <Select
                  name="sense"
                  placeholder="Sélectionner"
                  value={values.sense}
                  onChange={handleChange}
                  onBlur={handleBlur}
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
                <FormLabel fontSize="sm">Justification</FormLabel>
                <Select
                  name="justification"
                  placeholder="Sélectionner"
                  value={values.justification}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="true">Justifié</option>
                  <option value="false">Non justifié</option>
                </Select>
                <FormErrorMessage>{errors.justification}</FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={Boolean(touched.noticed && errors.noticed)}
                gridColumn={{ md: 'span 2' }}
              >
                <FormLabel fontSize="sm">Remarque</FormLabel>
                <Field
                  as={Textarea}
                  name="noticed"
                  value={values.noticed}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Optionnel…"
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