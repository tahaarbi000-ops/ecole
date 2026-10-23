import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  SimpleGrid,
  VStack,
  Text,
  Avatar,
  HStack,
  Badge,
} from '@chakra-ui/react';

function Field({ label, value }) {
  return (
    <VStack align="flex-start" spacing={0.5}>
      <Text fontSize="xs" color="ink.400">{label}</Text>
      <Text fontSize="sm" fontWeight="600" color="ink.900">{value || '—'}</Text>
    </VStack>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

/**
 * Modal de consultation générique pour le personnel (maîtres, surveillants, employés).
 */
export default function EmployViewModal({ isOpen, onClose, person, onEdit, roleFieldKey, roleFieldLabel }) {
  if (!person) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent dir='rtl' borderRadius="2xl" mx={4}>
        <ModalHeader borderBottom="1px solid" borderColor="ink.100">
          <HStack spacing={3}>
            <Avatar  name={`${person.last_name} ${person.name}`} bg="brand.600" color="white" />
            <VStack spacing={0} align="flex-start">
              <Text textTransform={"capitalize"} fontFamily="heading" fontWeight="700" color="ink.900">
                {person.last_name} {person.name}
              </Text>
              <Badge textTransform={"capitalize"} bg="brand.50" color="brand.700" borderRadius="full" px={2} fontSize="10px">
                {person[roleFieldKey]}
              </Badge>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton 
        insetInlineStart="3"
        insetInlineEnd="auto"
        />
        <ModalBody py={5}>
          <SimpleGrid columns={2} spacing={5}>
                      <Field label="الهاتف" value={person.phone} />
                      <Field label={roleFieldLabel} value={person[roleFieldKey]} />
                      <Field
                        label="تاريخ إيداع الراتب"
                        value={formatDate(person.joined_date)}
                      />
                      <Field
                        label="الراتب"
                        value={
                          person.salary
                            ? `${person.salary.toLocaleString("fr-FR")} د.ت`
                            : "—"
                        }
                      />
                      {person.status && <Field label="الحالة" value={person.status} />}
                    </SimpleGrid>
        </ModalBody>
         <ModalFooter borderTop="1px solid" borderColor="ink.100" gap={2}>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          <Button
            onClick={() => {
              onClose();
              onEdit(person);
            }}
          >
            تعديل
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
