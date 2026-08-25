import { useEffect, useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Input,
  InputGroup,
  InputRightElement,
  HStack,
  Button,
  Text,
  useToast,
} from '@chakra-ui/react';
import { Save } from 'lucide-react';
import { tuitionFees as initialFees } from '../../data/school';
import { AxiosToken } from '../../api/Api';

export default function TuitionFeesTab() {
  const toast = useToast();
  const [fees, setFees] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(()=>{
      const fetchData = async () => {
        try{
          const response = await AxiosToken.get("/price");
          setFees(response.data.price)
        }catch{
          console.error("error")
        }
      }
      fetchData()
    },[isSaving])

  const updateAmount = (id, value) => {
    setFees((prev) => prev.map((f) => (f.id === id ? { ...f, amount: value } : f)));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simule le futur appel updateTuitionFees().
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: 'Tarifs de scolarité mis à jour', status: 'success', duration: 3000, isClosable: true });
    }, 700);
  };

  return (
    <Box bg="white" borderRadius="2xl" p={6} border="1px solid" borderColor="ink.200" boxShadow="card">
      <Text fontFamily="heading" fontWeight="700" color="ink.900" mb={1}>Tarifs de scolarité</Text>
      <Text fontSize="sm" color="ink.500" mb={5}>Modifiez les montants annuels par niveau, puis enregistrez.</Text>

      <TableContainer>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Niveau</Th>
              <Th isNumeric>Frais mensuels</Th>
            </Tr>
          </Thead>
          <Tbody>
            {fees.map((fee) => (
              <Tr key={fee.id}>
                <Td fontWeight="500" color="ink.800">{fee.label}</Td>
                <Td isNumeric>
                  <InputGroup size="sm" maxW="150px" ml="auto">
                    <Input
                      type="number"
                      min="0"
                      textAlign="right"
                      value={fee.price}
                      onChange={(e) => updateAmount(fee.id, Number(e.target.value))}
                      borderRadius="lg"
                    />
                    <InputRightElement w="2.5rem" color="ink.400" fontSize="xs">DT</InputRightElement>
                  </InputGroup>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <HStack justify="flex-end" mt={6}>
        <Button leftIcon={<Save size={16} />} onClick={handleSave} isLoading={isSaving} loadingText="Enregistrement…">
          Enregistrer les tarifs
        </Button>
      </HStack>
    </Box>
  );
}
