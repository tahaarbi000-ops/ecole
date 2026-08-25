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
  HStack,
  Button,
  Text,
  IconButton,
  Tooltip,
  useToast,
  useDisclosure,
} from '@chakra-ui/react';
import { Plus, Pencil, Trash2, Bus } from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import TransportFeeFormModal from './TransportFeeFormModal';
import { transportFees as initialFees } from '../../data/school';
import { AxiosToken } from '../../api/Api';

export default function TransportFeesTab() {
  const toast = useToast();
  const [fees, setFees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(()=>{
    const fetchData = async () => {
      try{
        const response = await AxiosToken.get("/zone");
        setFees(response.data.zones)
      }catch{
        console.error("error")
      }
    }
    fetchData()
  },[isSaving])

  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();

  const openAdd = () => { setSelected(null); formModal.onOpen(); };
  const openEdit = (fee) => { setSelected(fee); formModal.onOpen(); };
  const askDelete = (fee) => { setToDelete(fee); deleteDialog.onOpen(); };

  const handleSubmit = async (formData) => {
    
    setIsSaving(true);
             try {
                const response = await AxiosToken.post(
                    "/zone",
                     formData
                 );
         
                 resetForm();
         
                 formModal.onClose();
         
             } catch (error) {
                 console.error(error);
             } finally {
                 setIsSaving(false);
             }

  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setFees((prev) => prev.filter((f) => f.id !== toDelete.id));
      toast({ title: 'Zone supprimée', status: 'info', duration: 3000, isClosable: true });
      setIsDeleting(false);
      deleteDialog.onClose();
      setToDelete(null);
    }, 500);
  };

  return (
    <Box bg="white" borderRadius="2xl" p={6} border="1px solid" borderColor="ink.200" boxShadow="card">
      <HStack justify="space-between" mb={1}>
        <Text fontFamily="heading" fontWeight="700" color="ink.900">Tarifs de transport scolaire</Text>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={openAdd}>Ajouter une zone</Button>
      </HStack>
      <Text fontSize="sm" color="ink.500" mb={5}>Gérez les zones de transport et leur tarif mensuel.</Text>

      <TableContainer>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Zone</Th>
              <Th isNumeric>Tarif mensuel</Th>
              <Th textAlign="right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {fees.length === 0 && (
              <Tr>
                <Td colSpan={3}>
                  <HStack justify="center" py={8} color="ink.400">
                    <Bus size={18} />
                    <Text fontSize="sm">Aucune zone de transport définie.</Text>
                  </HStack>
                </Td>
              </Tr>
            )}
            {fees.map((fee) => (
              <Tr key={fee.id} _hover={{ bg: 'ink.50' }}>
                <Td fontWeight="500" color="ink.800">{fee.label}</Td>
                <Td isNumeric fontWeight="600" color="ink.900">{fee.amount.toLocaleString('fr-FR')} DT</Td>
                <Td>
                  <HStack justify="flex-end" spacing={1}>
                    <Tooltip label="Modifier" hasArrow>
                      <IconButton aria-label="Modifier" icon={<Pencil size={15} />} size="sm" variant="ghost" onClick={() => openEdit(fee)} />
                    </Tooltip>
                    <Tooltip label="Supprimer" hasArrow>
                      <IconButton aria-label="Supprimer" icon={<Trash2 size={15} />} size="sm" variant="ghost" color="danger.500" _hover={{ bg: 'danger.50' }} onClick={() => askDelete(fee)} />
                    </Tooltip>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <TransportFeeFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.onClose}
        onSubmit={handleSubmit}
        fee={selected}
        isSaving={isSaving}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Supprimer cette zone ?"
        message={toDelete ? `Voulez-vous vraiment supprimer la ${toDelete.zone} ?` : ''}
      />
    </Box>
  );
}
