import { useEffect, useState } from 'react';
import { SimpleGrid, FormControl, FormLabel, FormErrorMessage, Input, Select, Button, Textarea } from '@chakra-ui/react';
import FormModal from '../common/FormModal';
import { movementDirections } from '../../data/register';

const EMPTY_FORM = { date: '', heure: '', nom: '', prenom: '', sens: '', remarque: '' };

/**
 * Formulaire modal pour le pointage des maîtres (entrée ou sortie).
 * Le registre général d'entrées/sorties a été retiré ; seul ce suivi
 * dédié aux maîtres est conservé.
 */
export default function TeacherMovementFormModal({ isOpen, onClose, onSubmit, movement = null, isSaving = false }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const isEditMode = Boolean(movement);

  useEffect(() => {
    if (isOpen) {
      setForm(movement ? { ...EMPTY_FORM, ...movement } : EMPTY_FORM);
      setErrors({});
    }
  }, [isOpen, movement]);

  const setField = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.date) next.date = 'La date est requise.';
    if (!form.heure) next.heure = 'L\u2019heure est requise.';
    if (!form.nom.trim()) next.nom = 'Le nom est requis.';
    if (!form.prenom.trim()) next.prenom = 'Le prénom est requis.';
    if (!form.sens) next.sens = 'Le sens est requis.';
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
      title={isEditMode ? 'Modifier le pointage' : 'Enregistrer un pointage — Maître'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} isLoading={isSaving} loadingText="Enregistrement…">
            {isEditMode ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isInvalid={Boolean(errors.date)} isRequired>
            <FormLabel fontSize="sm">Date</FormLabel>
            <Input type="date" value={form.date} onChange={setField('date')} />
            <FormErrorMessage>{errors.date}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.heure)} isRequired>
            <FormLabel fontSize="sm">Heure</FormLabel>
            <Input type="time" value={form.heure} onChange={setField('heure')} />
            <FormErrorMessage>{errors.heure}</FormErrorMessage>
          </FormControl>

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

          <FormControl isInvalid={Boolean(errors.sens)} isRequired gridColumn={{ md: 'span 2' }}>
            <FormLabel fontSize="sm">Sens</FormLabel>
            <Select placeholder="Sélectionner" value={form.sens} onChange={setField('sens')}>
              {movementDirections.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
            <FormErrorMessage>{errors.sens}</FormErrorMessage>
          </FormControl>

          <FormControl gridColumn={{ md: 'span 2' }}>
            <FormLabel fontSize="sm">Remarque</FormLabel>
            <Textarea value={form.remarque} onChange={setField('remarque')} placeholder="Optionnel…" rows={3} />
          </FormControl>
        </SimpleGrid>
      </form>
    </FormModal>
  );
}
