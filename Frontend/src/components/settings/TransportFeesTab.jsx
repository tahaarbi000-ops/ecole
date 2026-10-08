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
import { AxiosToken } from '../../api/Api';

export default function TransportFeesTab() {
  const toast = useToast();
  const [fees, setFees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await AxiosToken.get('/zone');
        setFees(response.data.zones);
      } catch (error) {
        console.error(error);

        toast({
          title: 'حدث خطأ أثناء جلب مناطق النقل',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchData();
    // refetch whenever a save finishes (add or edit)
  }, [isSaving]);

  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();

  const openAdd = () => {
    setSelected(null);
    formModal.onOpen();
  };

  const openEdit = (fee) => {
    setSelected(fee);
    formModal.onOpen();
  };

  const askDelete = (fee) => {
    setToDelete(fee);
    deleteDialog.onOpen();
  };

  const handleSubmit = async (formData) => {
    setIsSaving(true);

    try {
      if (selected) {
        // Edit mode
        await AxiosToken.put(`/zone/${selected.id}`, formData);

        toast({
          title: 'تم تعديل المنطقة بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Add mode
        await AxiosToken.post('/zone', formData);

        toast({
          title: 'تم إضافة المنطقة بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error(error);

      toast({
        title: 'حدث خطأ أثناء حفظ المنطقة',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });

      // Re-throw so the modal knows the save failed and stays open
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;

    setIsDeleting(true);

    try {
      await AxiosToken.delete(`/zone/${toDelete.id}`);

      setFees((prev) => prev.filter((f) => f.id !== toDelete.id));

      toast({
        title: 'تم حذف المنطقة بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      deleteDialog.onClose();
      setToDelete(null);
    } catch (error) {
      console.error(error);

      toast({
        title: 'حدث خطأ أثناء حذف المنطقة',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box
      dir="rtl"
      bg="white"
      borderRadius="2xl"
      p={6}
      border="1px solid"
      borderColor="ink.200"
      boxShadow="card"
    >
      <HStack justify="space-between" mb={1}>
        <Text
          fontFamily="heading"
          fontWeight="700"
          color="ink.900"
        >
          معاليم النقل المدرسي
        </Text>

        <Button
          size="sm"
          rightIcon={<Plus size={16} />}
          onClick={openAdd}
        >
          إضافة منطقة
        </Button>
      </HStack>

      <Text fontSize="sm" color="ink.500" mb={6}>
        قم بإدارة مناطق النقل ومعاليمها الشهرية.
      </Text>

      <TableContainer>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>المنطقة</Th>
              <Th isNumeric>المعلوم الشهري</Th>
              <Th isNumeric>المعلوم السنوي</Th>
              <Th textAlign="left">الإجراءات</Th>
            </Tr>
          </Thead>

          <Tbody>
            {fees.length === 0 && (
              <Tr>
                <Td colSpan={4}>
                  <HStack justify="center" py={8} color="ink.400">
                    <Bus size={18} />
                    <Text fontSize="sm">
                      لم يتم تحديد أي منطقة للنقل.
                    </Text>
                  </HStack>
                </Td>
              </Tr>
            )}

            {fees.map((fee) => (
              <Tr key={fee.id} _hover={{ bg: 'ink.50' }}>
                <Td fontWeight="500" color="ink.800">
                  {fee.label}
                </Td>

                <Td isNumeric fontWeight="600" color="ink.900">
                  {fee.amount.toLocaleString('fr-FR')} د.ت
                </Td>

                <Td isNumeric fontWeight="600" color="ink.900">
                  {fee.amount_yearly.toLocaleString('fr-FR')} د.ت
                </Td>

                <Td>
                  <HStack justify="flex-start" spacing={1}>
                    <Tooltip label="تعديل" hasArrow>
                      <IconButton
                        aria-label="تعديل"
                        icon={<Pencil size={15} />}
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(fee)}
                      />
                    </Tooltip>

                    <Tooltip label="حذف" hasArrow>
                      <IconButton
                        aria-label="حذف"
                        icon={<Trash2 size={15} />}
                        size="sm"
                        variant="ghost"
                        color="danger.500"
                        _hover={{ bg: 'danger.50' }}
                        onClick={() => askDelete(fee)}
                      />
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
        title="حذف هذه المنطقة؟"
        message={
          toDelete
            ? `هل أنت متأكد من حذف المنطقة ${toDelete.label}؟`
            : ''
        }
      />
    </Box>
  );
}