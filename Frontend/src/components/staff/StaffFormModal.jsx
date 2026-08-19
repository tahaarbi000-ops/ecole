import { useEffect, useState } from 'react';
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
import FormModal from '../common/FormModal';

const EMPTY_FORM = {
  nom: '',
  prenom: '',
  telephone: '',
  dateDepotSalaire: '',
  salaire: '',
};

/**
 * Formulaire modal générique d'ajout / modification d'un membre du personnel
 * (maître, surveillant ou employé). Réutilisé sur les 3 pages avec une
 * configuration différente pour le champ "rôle".
 *
 * @param {string} entityLabel        Ex: "un maître", "un surveillant", "un employé"
 * @param {string} roleFieldKey       Nom du champ ('matiere' ou 'role')
 * @param {string} roleFieldLabel     Ex: "Matière" ou "Rôle"
 * @param {Array}  roleOptions        Liste d'options pour le select
 * @param {boolean} [showStatus]      Affiche un champ Statut (utilisé pour les maîtres)
 * @param {Array}  [statusOptions]
 */
export default function StaffFormModal({
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
  const emptyForm = { ...EMPTY_FORM, [roleFieldKey]: '', ...(showStatus ? { statut: statusOptions[0] || '' } : {}) };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const isEditMode = Boolean(person);

  useEffect(() => {
    if (isOpen) {
      setForm(person ? { ...emptyForm, ...person } : emptyForm);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, person]);

  const setField = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.nom.trim()) next.nom = 'Le nom est requis.';
    if (!form.prenom.trim()) next.prenom = 'Le prénom est requis.';
    if (!form.telephone.trim()) next.telephone = 'Le téléphone est requis.';
    else if (!/^\d[\d\s]{6,}$/.test(form.telephone)) next.telephone = 'Numéro invalide.';
    if (!form[roleFieldKey]) next[roleFieldKey] = `${roleFieldLabel} est requis(e).`;
    if (!form.dateDepotSalaire) next.dateDepotSalaire = 'La date est requise.';
    if (!form.salaire || Number(form.salaire) <= 0) next.salaire = 'Le salaire doit être positif.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, salaire: Number(form.salaire) });
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Modifier — ${person.prenom} ${person.nom}` : `Ajouter ${entityLabel}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} isLoading={isSaving} loadingText="Enregistrement…">
            {isEditMode ? 'Enregistrer les modifications' : 'Ajouter'}
          </Button>
        </>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate>
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

          <FormControl isInvalid={Boolean(errors.telephone)} isRequired>
            <FormLabel fontSize="sm">Téléphone</FormLabel>
            <Input value={form.telephone} onChange={setField('telephone')} placeholder="20 456 789" />
            <FormErrorMessage>{errors.telephone}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors[roleFieldKey])} isRequired>
            <FormLabel fontSize="sm">{roleFieldLabel}</FormLabel>
            <Select
              placeholder={`Sélectionner — ${roleFieldLabel.toLowerCase()}`}
              value={form[roleFieldKey]}
              onChange={setField(roleFieldKey)}
            >
              {roleOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
            <FormErrorMessage>{errors[roleFieldKey]}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.dateDepotSalaire)} isRequired>
            <FormLabel fontSize="sm">Date dépôt salaire</FormLabel>
            <Input type="date" value={form.dateDepotSalaire} onChange={setField('dateDepotSalaire')} />
            <FormErrorMessage>{errors.dateDepotSalaire}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.salaire)} isRequired>
            <FormLabel fontSize="sm">Salaire</FormLabel>
            <InputGroup>
              <Input type="number" min="0" value={form.salaire} onChange={setField('salaire')} placeholder="1200" />
              <InputRightElement w="3.2rem" color="ink.400" fontSize="sm">DT</InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.salaire}</FormErrorMessage>
          </FormControl>

          {showStatus && (
            <FormControl>
              <FormLabel fontSize="sm">Statut</FormLabel>
              <Select value={form.statut} onChange={setField('statut')}>
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>
            </FormControl>
          )}
        </SimpleGrid>
      </form>
    </FormModal>
  );
}
