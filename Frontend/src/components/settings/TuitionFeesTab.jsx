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
  InputLeftElement,
  HStack,
  Button,
  ButtonGroup,
  IconButton,
  Text,
  useToast,
} from '@chakra-ui/react';
import { Save } from 'lucide-react';
import { AxiosToken } from '../../api/Api';

export default function TuitionFeesTab() {
  const toast = useToast();

  const [fees, setFees] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [period, setPeriod] = useState('monthly');

  // Get prices
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await AxiosToken.get('/price');

        setFees(response.data.price);
      } catch (error) {
        console.error('Error:', error);

        toast({
          title: 'حدث خطأ أثناء جلب المعاليم',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchData();
  }, []);

  // Only display the selected type
  const displayedFees = fees.filter(
    (fee) => fee.type === period
  );

  // Update amount (local state only)
  const updateAmount = (id, value) => {
    setFees((prev) =>
      prev.map((fee) =>
        fee.id === id
          ? {
              ...fee,
              amount: value,
            }
          : fee
      )
    );
  };

  // Save a single fee
  const handleSave = async (fee) => {
    try {
      setSavingId(fee.id);

      await AxiosToken.put(`/price/${fee.id}`, {
        amount: fee.amount,
      });

      toast({
        title: 'تم تحديث المعلوم بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error:', error);

      toast({
        title: 'حدث خطأ أثناء حفظ المعلوم',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSavingId(null);
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
      <HStack justify="space-between" align="flex-start" mb={1}>
        <Box>
          <Text
            fontFamily="heading"
            fontWeight="700"
            color="ink.900"
          >
            معاليم الدراسة
          </Text>

          <Text fontSize="sm" color="ink.500" mt={1}>
            قم بتعديل المعلوم ثم اضغط حفظ لتأكيد التغيير على كل سطر على حدة.
          </Text>
        </Box>

        <ButtonGroup
          dir="ltr"
          size="sm"
          isAttached
          variant="outline"
        >
          <Button
            onClick={() => setPeriod('monthly')}
            colorScheme={period === 'monthly' ? 'blue' : 'gray'}
            variant={period === 'monthly' ? 'solid' : 'outline'}
          >
            شهري
          </Button>

          <Button
            onClick={() => setPeriod('yearly')}
            colorScheme={period === 'yearly' ? 'blue' : 'gray'}
            variant={period === 'yearly' ? 'solid' : 'outline'}
          >
            سنوي
          </Button>
        </ButtonGroup>
      </HStack>

      <TableContainer mt={5}>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>المستوى</Th>

              <Th isNumeric>
                {period === 'yearly'
                  ? 'المعلوم السنوي'
                  : 'المعلوم الشهري'}
              </Th>

              <Th isNumeric>الإجراءات</Th>
            </Tr>
          </Thead>

          <Tbody>
            {displayedFees.map((fee) => (
              <Tr key={fee.id}>
                <Td fontWeight="500" color="ink.800">
                  {fee.label}
                </Td>

                <Td isNumeric>
                  <InputGroup
                    size="sm"
                    maxW="150px"
                    ml="auto"
                  >
                    <Input
                      type="number"
                      min="0"
                      textAlign="right"
                      value={fee.amount}
                      onChange={(e) =>
                        updateAmount(
                          fee.id,
                          Number(e.target.value)
                        )
                      }
                      borderRadius="lg"
                      dir="ltr"
                    />

                    <InputLeftElement
                      w="2.5rem"
                      color="ink.400"
                      fontSize="xs"
                    >
                      د.ت
                    </InputLeftElement>
                  </InputGroup>
                </Td>

                <Td isNumeric>
                  <IconButton
                    aria-label="حفظ"
                    icon={<Save size={16} />}
                    size="sm"
                    onClick={() => handleSave(fee)}
                    isLoading={savingId === fee.id}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}