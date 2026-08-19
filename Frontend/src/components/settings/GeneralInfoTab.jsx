import { useState } from 'react';
import { Box, SimpleGrid, FormControl, FormLabel, Input, Button, HStack, Text, useToast } from '@chakra-ui/react';
import { Save } from 'lucide-react';
import { schoolInfo as initialSchoolInfo } from '../../data/school';

export default function GeneralInfoTab() {
  const toast = useToast();
  const [form, setForm] = useState(initialSchoolInfo);
  const [isSaving, setIsSaving] = useState(false);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = () => {
    setIsSaving(true);
    // Simule le futur appel updateSchoolInfo().
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: 'Informations enregistrées', status: 'success', duration: 3000, isClosable: true });
    }, 700);
  };

  return (
    <Box bg="white" borderRadius="2xl" p={6} border="1px solid" borderColor="ink.200" boxShadow="card">
      <Text fontFamily="heading" fontWeight="700" color="ink.900" mb={1}>Informations de l’école</Text>
      <Text fontSize="sm" color="ink.500" mb={5}>Ces informations apparaissent sur le Dashboard et les documents officiels.</Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl gridColumn={{ md: 'span 2' }}>
          <FormLabel fontSize="sm">Nom de l’école</FormLabel>
          <Input value={form.name} onChange={setField('name')} />
        </FormControl>

        <FormControl gridColumn={{ md: 'span 2' }}>
          <FormLabel fontSize="sm">Slogan</FormLabel>
          <Input value={form.slogan} onChange={setField('slogan')} />
        </FormControl>

        <FormControl gridColumn={{ md: 'span 2' }}>
          <FormLabel fontSize="sm">Adresse</FormLabel>
          <Input value={form.address} onChange={setField('address')} />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Téléphone</FormLabel>
          <Input value={form.phone} onChange={setField('phone')} />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Email</FormLabel>
          <Input type="email" value={form.email} onChange={setField('email')} />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Directeur</FormLabel>
          <Input value={form.director} onChange={setField('director')} />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Année scolaire</FormLabel>
          <Input value={form.schoolYear} onChange={setField('schoolYear')} />
        </FormControl>
      </SimpleGrid>

      <HStack justify="flex-end" mt={6}>
        <Button leftIcon={<Save size={16} />} onClick={handleSave} isLoading={isSaving} loadingText="Enregistrement…">
          Enregistrer les modifications
        </Button>
      </HStack>
    </Box>
  );
}
