import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  SimpleGrid,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Button,
  Switch,
  HStack,
  Text,
  Spinner,
  Box,
  useOutsideClick,
} from '@chakra-ui/react';
import FormModal from '../common/FormModal';
import { absenceMotifs } from '../../data/register';

const EMPTY_FORM = { personne: '', date: '', reason: '', justification: false };

/**
 * Champ de recherche par nom réutilisable (Input + liste déroulante filtrée),
 * utilisé pour le mode Élève (avec niveau) et le mode générique `persons`
 * (Maîtres / Surveillants / Employés).
 */
function PersonSearchField({
  label,
  searchValue,
  onSearchChange,
  onSelect,
  isOpen,
  onOpen,
  onClose,
  isDisabled,
  isLoading,
  placeholder,
  items,
  errorMessage,
  isPhone
}) {
  const boxRef = useRef(null);
  useOutsideClick({ ref: boxRef, handler: onClose });

  return (
    <FormControl isInvalid={Boolean(errorMessage)} isRequired>
      <FormLabel fontSize="sm">{label}</FormLabel>
      <Box position="relative" ref={boxRef}>
        <HStack>
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => !isDisabled && onOpen()}
            placeholder={placeholder}
            isDisabled={isDisabled}
            autoComplete="off"
          />
          {isLoading && <Spinner size="sm" flexShrink={0} />}
        </HStack>

        {isOpen && !isDisabled && (
          <Box
            position="absolute"
            top="calc(100% + 4px)"
            left={0}
            right={0}
            zIndex={20}
            bg="white"
            border="1px solid"
            borderColor="ink.200"
            borderRadius="md"
            boxShadow="0 4px 12px rgba(16,26,46,0.12)"
            maxH="200px"
            overflowY="auto"
          >
            {items.length === 0 ? (
              <Text fontSize="sm" color="ink.400" px={3} py={2}>Aucun résultat.</Text>
            ) : (
              items.map((it) => (
                <Box
                  key={it.id}
                  px={3}
                  py={2}
                  fontSize="sm"
                  cursor="pointer"
                  _hover={{ bg: 'ink.50' }}
                  onMouseDown={(e) => {
                    e.preventDefault(); // évite le blur avant le clic
                    onSelect(it);
                  }}
                >{
                  isPhone ?
                  `${it.name} ${it.last_name} - ${it.phone}`
                  :
                  `${it.name} ${it.last_name}`
                }
                </Box>
              ))
            )}
          </Box>
        )}
      </Box>
      <FormErrorMessage>{errorMessage}</FormErrorMessage>
    </FormControl>
  );
}

/**
 * Construit le schéma Yup en fonction du mode actif (Élève / recherche
 * générique / freeform). `person_id` est requis dans les deux modes de
 * recherche ; le champ secondaire (`secondaryFieldKey`) n'existe qu'en
 * dehors du mode `persons`.
 */
function buildValidationSchema({
  isStudentMode,
  isPersonSearchMode,
  secondaryFieldKey,
  secondaryFieldLabel,
  personLabel,
}) {
  const shape = {
    date: yup.string().required('La date est requise.'),
    reason: yup.string().required('Le motif est requis.'),
    justification: yup.boolean(),
  };

  if (isStudentMode || isPersonSearchMode) {
    shape.person_id = yup
      .mixed()
      .test('required', `${personLabel} est requis(e).`, (v) => v !== '' && v !== null && v !== undefined);
    shape.personne = yup.string();
  } else {
    shape.personne = yup.string().trim().required(`${personLabel} est requis(e).`);
  }

  if (!isPersonSearchMode) {
    shape[secondaryFieldKey] = yup.string().required(`${secondaryFieldLabel} est requis(e).`);
  }

  return yup.object().shape(shape);
}

/**
 * Formulaire modal générique de déclaration d'absence — réutilisé pour
 * Élèves, Maîtres, Surveillants et Employés.
 *
 * @param {string} personLabel        Ex: "Élève", "Maître", "Surveillant", "Employé"
 * @param {string} secondaryFieldKey  Ex: 'niveau' | 'matiere' | 'role' — ignoré si `persons` est fourni.
 * @param {string} secondaryFieldLabel
 * @param {Array}  secondaryOptions   Ignoré si `students` ou `persons` est fourni.
 *
 * @param {Array|string} [students]   Optionnel — mode "Élève" : niveau (généré depuis les valeurs
 *                                    uniques de `.class`) + recherche par nom filtrée par ce niveau.
 *                                    Array (déjà chargé) ou string (URL, fetch interne).
 *
 * @param {Array|string} [persons]    Optionnel — mode générique (Maîtres / Surveillants / Employés) :
 *                                    recherche par nom DIRECTE sur toute la liste, sans select
 *                                    secondaire (le champ {secondaryFieldLabel} disparaît entièrement,
 *                                    n'est ni affiché ni envoyé). Array ou string (URL, fetch interne).
 *                                    N'utiliser QU'UN SEUL de `students` / `persons` à la fois.
 *
 *                                    Dans les deux modes, le form soumis contient :
 *                                    - `personne`  : nom complet ("Nom Prénom"), pour l'affichage/
 *                                                    recherche dans le tableau.
 *                                    - `person_id` : id réel de la personne — à envoyer à l'API
 *                                                    en tant que person_id du modèle Absence,
 *                                                    jamais `personne`.
 *
 *                                    Sans `students` ni `persons` : comportement historique
 *                                    (Input libre + Select `secondaryOptions`, pas de `person_id`).
 */
export default function AbsenceRoleFormModal({
  isOpen,
  onClose,
  onSubmit,
  absence = null,
  isSaving = false,
  personLabel,
  secondaryFieldKey,
  secondaryFieldLabel,
  secondaryOptions,
  students,
  persons,
}) {
  const isStudentMode = Boolean(students);
  const studentsIsUrl = typeof students === 'string';
  const isPersonSearchMode = Boolean(persons);
  const personsIsUrl = typeof persons === 'string';

  const emptyForm = useMemo(
    () => ({
      ...EMPTY_FORM,
      ...(isStudentMode || isPersonSearchMode ? { person_id: '' } : {}),
      ...(!isPersonSearchMode ? { [secondaryFieldKey]: '' } : {}),
    }),
    [isStudentMode, isPersonSearchMode, secondaryFieldKey]
  );

  const validationSchema = useMemo(
    () =>
      buildValidationSchema({
        isStudentMode,
        isPersonSearchMode,
        secondaryFieldKey,
        secondaryFieldLabel,
        personLabel,
      }),
    [isStudentMode, isPersonSearchMode, secondaryFieldKey, secondaryFieldLabel, personLabel]
  );

  const formik = useFormik({
    initialValues: emptyForm,
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: false,
    onSubmit: (values) => {
      // values.person_id = valeur à envoyer à l'API en tant que person_id.
      // values.personne reste uniquement pour l'affichage/recherche dans le tableau.
      onSubmit(values);
    },
  });

  const isEditMode = Boolean(absence);
  const selectedNiveau = formik.values[secondaryFieldKey];

  // N'affiche les erreurs qu'après une première tentative de soumission,
  // comme dans le comportement d'origine.
  const fieldError = (name) => (formik.submitCount > 0 ? formik.errors[name] : undefined);

  // ---- Mode Élève : liste + niveau + recherche filtrée par niveau ----
  const [studentsList, setStudentsList] = useState(Array.isArray(students) ? students : []);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentListOpen, setIsStudentListOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !isStudentMode) return;
    if (Array.isArray(students)) {
      setStudentsList(students);
      setStudentsError(null);
      return;
    }
    if (studentsIsUrl) {
      setStudentsLoading(true);
      setStudentsError(null);
      fetch(students)
        .then((res) => {
          if (!res.ok) throw new Error('Impossible de charger la liste des élèves.');
          return res.json();
        })
        .then((data) => setStudentsList(Array.isArray(data) ? data : []))
        .catch((err) => setStudentsError(err.message || 'Erreur de chargement.'))
        .finally(() => setStudentsLoading(false));
    }
  }, [isOpen, isStudentMode, students, studentsIsUrl]);

  const classes = useMemo(() => {
    if (!isStudentMode) return [];
    return [...new Set(studentsList.map((s) => s.class).filter(Boolean))];
  }, [isStudentMode, studentsList]);

  const studentsInNiveau = useMemo(() => {
    if (!isStudentMode || !selectedNiveau) return [];
    return studentsList.filter((s) => s.class === selectedNiveau);
  }, [isStudentMode, studentsList, selectedNiveau]);

  const searchedStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return studentsInNiveau;
    return studentsInNiveau.filter((s) => `${s.name} ${s.last_name}`.toLowerCase().includes(term));
  }, [studentsInNiveau, studentSearch]);

  useEffect(() => {
    if (isStudentMode) setStudentSearch(formik.values.personne || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudentMode, formik.values.personne]);

  const handleNiveauChange = (e) => {
    const value = e.target.value;
    formik.setFieldValue(secondaryFieldKey, value);
    formik.setFieldValue('person_id', '');
    formik.setFieldValue('personne', '');
  };

  const handleStudentSearchChange = (value) => {
    setStudentSearch(value);
    setIsStudentListOpen(true);
    if (formik.values.person_id) {
      formik.setFieldValue('person_id', '');
      formik.setFieldValue('personne', '');
    }
  };

  const selectStudent = (student) => {
    const label = `${student.name} ${student.last_name}`;
    formik.setFieldValue('person_id', student.id);
    formik.setFieldValue('personne', label);
    setStudentSearch(label);
    setIsStudentListOpen(false);
  };

  // ---- Mode générique (Maîtres / Surveillants / Employés) : recherche directe, pas de select secondaire ----
  const [personsList, setPersonsList] = useState(Array.isArray(persons) ? persons : []);
  const [personsLoading, setPersonsLoading] = useState(false);
  const [personsError, setPersonsError] = useState(null);
  const [personSearch, setPersonSearch] = useState('');
  const [isPersonListOpen, setIsPersonListOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !isPersonSearchMode) return;
    if (Array.isArray(persons)) {
      setPersonsList(persons);
      setPersonsError(null);
      return;
    }
    if (personsIsUrl) {
      setPersonsLoading(true);
      setPersonsError(null);
      fetch(persons)
        .then((res) => {
          if (!res.ok) throw new Error(`Impossible de charger la liste — ${personLabel.toLowerCase()}.`);
          return res.json();
        })
        .then((data) => setPersonsList(Array.isArray(data) ? data : []))
        .catch((err) => setPersonsError(err.message || 'Erreur de chargement.'))
        .finally(() => setPersonsLoading(false));
    }
  }, [isOpen, isPersonSearchMode, persons, personsIsUrl, personLabel]);

  const searchedPersons = useMemo(() => {
    const term = personSearch.trim().toLowerCase();
    if (!term) return personsList;
    return personsList.filter((p) => `${p.name} ${p.last_name}`.toLowerCase().includes(term));
  }, [personsList, personSearch]);

  useEffect(() => {
    if (isPersonSearchMode) setPersonSearch(formik.values.personne || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPersonSearchMode, formik.values.personne]);

  const handlePersonSearchChange = (value) => {
    setPersonSearch(value);
    setIsPersonListOpen(true);
    if (formik.values.person_id) {
      formik.setFieldValue('person_id', '');
      formik.setFieldValue('personne', '');
    }
  };

  const selectPerson = (person) => {
    const label = `${person.name} ${person.last_name}`;
    formik.setFieldValue('person_id', person.id);
    formik.setFieldValue('personne', label);
    setPersonSearch(label);
    setIsPersonListOpen(false);
  };

  // ---- Commun ----
  useEffect(() => {
    if (isOpen) {
      formik.resetForm({ values: absence ? { ...emptyForm, ...absence } : emptyForm });
      setIsStudentListOpen(false);
      setIsPersonListOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, absence]);

  const today = new Date().toLocaleDateString('en-CA');

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Modifier l\u2019absence' : `Déclarer une absence — ${personLabel}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={formik.handleSubmit} isLoading={isSaving} loadingText="Enregistrement…">
            {isEditMode ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </>
      }
    >
      <form onSubmit={formik.handleSubmit} noValidate>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {isStudentMode && (
            <>
              <FormControl isInvalid={Boolean(fieldError(secondaryFieldKey))} isRequired>
                <FormLabel fontSize="sm">{secondaryFieldLabel}</FormLabel>
                <Select
                  placeholder={studentsLoading ? 'Chargement…' : `Sélectionner — ${secondaryFieldLabel.toLowerCase()}`}
                  value={selectedNiveau}
                  onChange={handleNiveauChange}
                  isDisabled={studentsLoading}
                >
                  {classes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
                <FormErrorMessage>{fieldError(secondaryFieldKey)}</FormErrorMessage>
                {studentsError && <Text fontSize="xs" color="danger.500" mt={1}>{studentsError}</Text>}
              </FormControl>

              <PersonSearchField
                label={personLabel}
                searchValue={studentSearch}
                onSearchChange={handleStudentSearchChange}
                onSelect={selectStudent}
                isOpen={isStudentListOpen}
                onOpen={() => setIsStudentListOpen(true)}
                onClose={() => setIsStudentListOpen(false)}
                isDisabled={!selectedNiveau || studentsLoading}
                isLoading={studentsLoading}
                placeholder={selectedNiveau ? `Rechercher — ${personLabel.toLowerCase()}` : `Sélectionnez d\u2019abord — ${secondaryFieldLabel.toLowerCase()}`}
                items={searchedStudents}
                errorMessage={fieldError('person_id')}
                isPhone={false}
              />

              <FormControl isInvalid={Boolean(fieldError('date'))} isRequired>
                <FormLabel fontSize="sm">Date</FormLabel>
                <Input type="date" name="date" value={formik.values.date} onChange={formik.handleChange} max={today} />
                <FormErrorMessage>{fieldError('date')}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={Boolean(fieldError('reason'))} isRequired>
                <FormLabel fontSize="sm">reason</FormLabel>
                <Select placeholder="Sélectionner" name="reason" value={formik.values.reason} onChange={formik.handleChange}>
                  {absenceMotifs.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
                <FormErrorMessage>{fieldError('reason')}</FormErrorMessage>
              </FormControl>

              <FormControl gridColumn={{ md: 'span 2' }}>
                <FormLabel fontSize="sm">Justification</FormLabel>
                <HStack h="40px" spacing={3}>
                  <Switch
                    colorScheme="blue"
                    isChecked={formik.values.justification}
                    onChange={(e) => formik.setFieldValue('justification', e.target.checked)}
                  />
                  <Text fontSize="sm" color="ink.600">{formik.values.justification ? 'Justifiée' : 'Non justifiée'}</Text>
                </HStack>
              </FormControl>
            </>
          )}

          {isPersonSearchMode && (
            <>
              <Box gridColumn={{ md: 'span 2' }}>
                <PersonSearchField
                  label={personLabel}
                  searchValue={personSearch}
                  onSearchChange={handlePersonSearchChange}
                  onSelect={selectPerson}
                  isOpen={isPersonListOpen}
                  onOpen={() => setIsPersonListOpen(true)}
                  onClose={() => setIsPersonListOpen(false)}
                  isDisabled={personsLoading}
                  isLoading={personsLoading}
                  placeholder={`Rechercher — ${personLabel.toLowerCase()}`}
                  items={searchedPersons}
                  errorMessage={fieldError('person_id')}
                  isPhone={true}
                />
                {personsError && <Text fontSize="xs" color="danger.500" mt={1}>{personsError}</Text>}
              </Box>

              <FormControl isInvalid={Boolean(fieldError('date'))} isRequired>
                <FormLabel fontSize="sm">Date</FormLabel>
                <Input type="date" name="date" value={formik.values.date} onChange={formik.handleChange} max={today} />
                <FormErrorMessage>{fieldError('date')}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={Boolean(fieldError('reason'))} isRequired>
                <FormLabel fontSize="sm">reason</FormLabel>
                <Select placeholder="Sélectionner" name="reason" value={formik.values.reason} onChange={formik.handleChange}>
                  {absenceMotifs.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
                <FormErrorMessage>{fieldError('reason')}</FormErrorMessage>
              </FormControl>

              <FormControl gridColumn={{ md: 'span 2' }}>
                <FormLabel fontSize="sm">Justification</FormLabel>
                <HStack h="40px" spacing={3}>
                  <Switch
                    colorScheme="blue"
                    isChecked={formik.values.justification}
                    onChange={(e) => formik.setFieldValue('justification', e.target.checked)}
                  />
                  <Text fontSize="sm" color="ink.600">{formik.values.justification ? 'Justifiée' : 'Non justifiée'}</Text>
                </HStack>
              </FormControl>
            </>
          )}

          {!isStudentMode && !isPersonSearchMode && (
            <>
              <FormControl isInvalid={Boolean(fieldError('personne'))} isRequired gridColumn={{ md: 'span 2' }}>
                <FormLabel fontSize="sm">{personLabel}</FormLabel>
                <Input name="personne" value={formik.values.personne} onChange={formik.handleChange} placeholder="Nom Prénom" />
                <FormErrorMessage>{fieldError('personne')}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={Boolean(fieldError(secondaryFieldKey))} isRequired>
                <FormLabel fontSize="sm">{secondaryFieldLabel}</FormLabel>
                <Select
                  placeholder={`Sélectionner — ${secondaryFieldLabel.toLowerCase()}`}
                  name={secondaryFieldKey}
                  value={formik.values[secondaryFieldKey]}
                  onChange={formik.handleChange}
                >
                  {secondaryOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </Select>
                <FormErrorMessage>{fieldError(secondaryFieldKey)}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={Boolean(fieldError('date'))} isRequired>
                <FormLabel fontSize="sm">Date</FormLabel>
                <Input type="date" name="date" value={formik.values.date} onChange={formik.handleChange} max={today} />
                <FormErrorMessage>{fieldError('date')}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={Boolean(fieldError('reason'))} isRequired>
                <FormLabel fontSize="sm">reason</FormLabel>
                <Select placeholder="Sélectionner" name="reason" value={formik.values.reason} onChange={formik.handleChange}>
                  {absenceMotifs.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
                <FormErrorMessage>{fieldError('reason')}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Justification</FormLabel>
                <HStack h="40px" spacing={3}>
                  <Switch
                    colorScheme="blue"
                    isChecked={formik.values.justification}
                    onChange={(e) => formik.setFieldValue('justification', e.target.checked)}
                  />
                  <Text fontSize="sm" color="ink.600">{formik.values.justification ? 'Justifiée' : 'Non justifiée'}</Text>
                </HStack>
              </FormControl>
            </>
          )}
        </SimpleGrid>
      </form>
    </FormModal>
  );
}