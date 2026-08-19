import { useEffect, useState } from 'react';
import { SimpleGrid, FormControl, FormLabel, FormErrorMessage, Input, Button, InputGroup, InputRightElement } from '@chakra-ui/react';
import FormModal from '../common/FormModal';

const EMPTY_FORM = { zone: '', amount: '' };

export default function TransportFeeFormModal({ isOpen, onClose, onSubmit, fee = null, isSaving = false }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const isEditMode = Boolean(fee);

  useEffect(() => {
    if (isOpen) {
      setForm(fee ? { ...EMPTY_FORM, ...fee } : EMPTY_FORM);
      setErrors({});
    }
  }, [isOpen, fee]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.zone.trim()) next.zone = 'Le nom de la zone est requis.';
    if (!form.amount || Number(form.amount) <= 0) next.amount = 'Le tarif doit être positif.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, amount: Number(form.amount) });
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Modifier la zone' : 'Ajouter une zone'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} isLoading={isSaving} loadingText="Enregistrement…">
            {isEditMode ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} noValidate>
        <SimpleGrid columns={1} spacing={4}>
          <FormControl isInvalid={Boolean(errors.zone)} isRequired>
            <FormLabel fontSize="sm">Zone</FormLabel>
            <Input value={form.zone} onChange={setField('zone')} placeholder="Zone 5" />
            <FormErrorMessage>{errors.zone}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.amount)} isRequired>
            <FormLabel fontSize="sm">Tarif mensuel</FormLabel>
            <InputGroup>
              <Input type="number" min="0" value={form.amount} onChange={setField('amount')} placeholder="100" />
              <InputRightElement w="3.2rem" color="ink.400" fontSize="sm">DT</InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.amount}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>
      </form>
    </FormModal>
  );
}
