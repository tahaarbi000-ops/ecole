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
} from '@chakra-ui/react';
import FormModal from '../common/FormModal';
import { levels } from '../../data/school';

const EMPTY_FORM = {
  nom: '',
  prenom: '',
  nomPere: '',
  nomMere: '',
  telephonePere: '',
  telephoneMere: '',
  sexe: 'M',
  dateNaissance: '',
  niveau: '',
  localisation: '',
};

/**
 * Formulaire modal d'ajout / modification d'un élève.
 *
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {Function} onSubmit  (formData) => void
 * @param {Object|null} student  Élève à modifier (null = mode ajout)
 * @param {boolean} isSaving
 */
export default function StudentFormModal({ isOpen, onClose, onSubmit, student = null, isSaving = false }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const isEditMode = Boolean(student);

  useEffect(() => {
    if (isOpen) {
      setForm(student ? { ...EMPTY_FORM, ...student } : EMPTY_FORM);
      setErrors({});
    }
  }, [isOpen, student]);

  const setField = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.nom.trim()) next.nom = 'Le nom est requis.';
    if (!form.prenom.trim()) next.prenom = 'Le prénom est requis.';
    if (!form.niveau) next.niveau = 'Le niveau est requis.';
    if (!form.dateNaissance) next.dateNaissance = 'La date de naissance est requise.';
    if (!form.localisation.trim()) next.localisation = 'La localisation est requise.';
    if (form.telephonePere && !/^\d[\d\s]{6,}$/.test(form.telephonePere)) {
      next.telephonePere = 'Numéro invalide.';
    }
    if (form.telephoneMere && !/^\d[\d\s]{6,}$/.test(form.telephoneMere)) {
      next.telephoneMere = 'Numéro invalide.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Modifier l\u2019élève — ${student.prenom} ${student.nom}` : 'Ajouter un élève'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} isLoading={isSaving} loadingText="Enregistrement…">
            {isEditMode ? 'Enregistrer les modifications' : 'Ajouter l\u2019élève'}
          </Button>
        </>
      }
    >
      <form id="student-form" onSubmit={handleSubmit} noValidate>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isInvalid={Boolean(errors.nom)} isRequired>
            <FormLabel fontSize="sm">Nom</FormLabel>
            <Input value={form.nom} onChange={setField('nom')} placeholder="Ben Ali" />
            <FormErrorMessage>{errors.nom}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.prenom)} isRequired>
            <FormLabel fontSize="sm">Prénom</FormLabel>
            <Input value={form.prenom} onChange={setField('prenom')} placeholder="Mohamed" />
            <FormErrorMessage>{errors.prenom}</FormErrorMessage>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Nom du père</FormLabel>
            <Input value={form.nomPere} onChange={setField('nomPere')} placeholder="Karim Ben Ali" />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Nom de la mère</FormLabel>
            <Input value={form.nomMere} onChange={setField('nomMere')} placeholder="Amel Trabelsi" />
          </FormControl>

          <FormControl isInvalid={Boolean(errors.telephonePere)}>
            <FormLabel fontSize="sm">Téléphone du père</FormLabel>
            <Input value={form.telephonePere} onChange={setField('telephonePere')} placeholder="20 145 632" />
            <FormErrorMessage>{errors.telephonePere}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.telephoneMere)}>
            <FormLabel fontSize="sm">Téléphone de la mère</FormLabel>
            <Input value={form.telephoneMere} onChange={setField('telephoneMere')} placeholder="22 987 411" />
            <FormErrorMessage>{errors.telephoneMere}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontSize="sm">Sexe</FormLabel>
            <RadioGroup value={form.sexe} onChange={setField('sexe')}>
              <HStack spacing={5} h="40px">
                <Radio value="M" colorScheme="blue">Garçon</Radio>
                <Radio value="F" colorScheme="blue">Fille</Radio>
              </HStack>
            </RadioGroup>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.dateNaissance)} isRequired>
            <FormLabel fontSize="sm">Date de naissance</FormLabel>
            <Input type="date" value={form.dateNaissance} onChange={setField('dateNaissance')} />
            <FormErrorMessage>{errors.dateNaissance}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.niveau)} isRequired>
            <FormLabel fontSize="sm">Niveau</FormLabel>
            <Select placeholder="Sélectionner un niveau" value={form.niveau} onChange={setField('niveau')}>
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </Select>
            <FormErrorMessage>{errors.niveau}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.localisation)} isRequired gridColumn={{ md: 'span 2' }}>
            <FormLabel fontSize="sm">Localisation</FormLabel>
            <Input value={form.localisation} onChange={setField('localisation')} placeholder="Sousse — Khezama" />
            <FormErrorMessage>{errors.localisation}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>
      </form>
    </FormModal>
  );
}
