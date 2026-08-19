import { useEffect, useState } from 'react';
import { SimpleGrid, FormControl, FormLabel, FormErrorMessage, Input, Select, Button, Switch, HStack, Text } from '@chakra-ui/react';
import FormModal from '../common/FormModal';
import { absenceMotifs } from '../../data/register';

const EMPTY_FORM = { personne: '', date: '', motif: '', justifiee: false };

/**
 * Formulaire modal générique de déclaration d'absence — réutilisé pour
 * Élèves, Maîtres, Surveillants et Employés avec un champ secondaire
 * configurable (niveau / matière / rôle).
 *
 * @param {string} personLabel        Ex: "Élève", "Maître", "Surveillant", "Employé"
 * @param {string} secondaryFieldKey  Ex: 'niveau' | 'matiere' | 'role'
 * @param {string} secondaryFieldLabel
 * @param {Array}  secondaryOptions
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
}) {
  const emptyForm = { ...EMPTY_FORM, [secondaryFieldKey]: '' };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const isEditMode = Boolean(absence);

  useEffect(() => {
    if (isOpen) {
      setForm(absence ? { ...emptyForm, ...absence } : emptyForm);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, absence]);

  const setField = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.personne.trim()) next.personne = `${personLabel} est requis(e).`;
    if (!form[secondaryFieldKey]) next[secondaryFieldKey] = `${secondaryFieldLabel} est requis(e).`;
    if (!form.date) next.date = 'La date est requise.';
    if (!form.motif) next.motif = 'Le motif est requis.';
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
      title={isEditMode ? 'Modifier l\u2019absence' : `Déclarer une absence — ${personLabel}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} isLoading={isSaving} loadingText="Enregistrement…">
            {isEditMode ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isInvalid={Boolean(errors.personne)} isRequired gridColumn={{ md: 'span 2' }}>
            <FormLabel fontSize="sm">{personLabel}</FormLabel>
            <Input value={form.personne} onChange={setField('personne')} placeholder="Nom Prénom" />
            <FormErrorMessage>{errors.personne}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors[secondaryFieldKey])} isRequired>
            <FormLabel fontSize="sm">{secondaryFieldLabel}</FormLabel>
            <Select
              placeholder={`Sélectionner — ${secondaryFieldLabel.toLowerCase()}`}
              value={form[secondaryFieldKey]}
              onChange={setField(secondaryFieldKey)}
            >
              {secondaryOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
            <FormErrorMessage>{errors[secondaryFieldKey]}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.date)} isRequired>
            <FormLabel fontSize="sm">Date</FormLabel>
            <Input type="date" value={form.date} onChange={setField('date')} />
            <FormErrorMessage>{errors.date}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.motif)} isRequired>
            <FormLabel fontSize="sm">Motif</FormLabel>
            <Select placeholder="Sélectionner" value={form.motif} onChange={setField('motif')}>
              {absenceMotifs.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
            <FormErrorMessage>{errors.motif}</FormErrorMessage>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Justification</FormLabel>
            <HStack h="40px" spacing={3}>
              <Switch colorScheme="blue" isChecked={form.justifiee} onChange={(e) => setField('justifiee')(e.target.checked)} />
              <Text fontSize="sm" color="ink.600">{form.justifiee ? 'Justifiée' : 'Non justifiée'}</Text>
            </HStack>
          </FormControl>
        </SimpleGrid>
      </form>
    </FormModal>
  );
}
