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
  Divider,
} from '@chakra-ui/react';

function Field({ label, value }) {
  return (
    <VStack align="flex-start" spacing={0.5}>
      <Text fontSize="xs" color="ink.400">{label}</Text>
      <Text fontSize="sm" fontWeight="600" color="ink.900">{value || '—'}</Text>
    </VStack>
  );
}

export default function StudentViewModal({ isOpen, onClose, student, onEdit }) {
  if (!student) return null;

  const age = student.birthday
    ? Math.floor((Date.now() - new Date(student.birthday).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="2xl" mx={4}>
        <ModalHeader borderBottom="1px solid" borderColor="ink.100">
          <HStack spacing={3}>
            <Avatar name={`${student.last_name} ${student.name}`} bg="brand.600" color="white" />
            <VStack spacing={0} align="flex-start">
              <Text fontFamily="heading" fontWeight="700" color="ink.900">
                {student.last_name} {student.name}
              </Text>
              <Badge bg="brand.50" color="brand.700" borderRadius="full" px={2} fontSize="10px">
                {student.classe}
              </Badge>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={5}>
          <SimpleGrid columns={2} spacing={5}>
            <Field label="Sexe" value={student.gender} />
            <Field label="Âge" value={age ? `${age} ans` : '—'} />
            <Field label="Date de naissance" value={student.birthday} />
            <Field label="Localisation" value={student.address} />
          </SimpleGrid>

          <Divider my={4} borderColor="ink.100" />

          <Text fontSize="xs" fontWeight="700" color="ink.500" mb={3} textTransform="uppercase" letterSpacing="wide">
            Informations parents
          </Text>
          <SimpleGrid columns={2} spacing={5}>
            <Field label="Nom du père" value={student.father_name} />
            <Field label="Nom de la mère" value={student.mother_name} />
            <Field label="Téléphone du père" value={student.father_phone} />
            <Field label="Téléphone de la mère" value={student.mother_phone} />
          </SimpleGrid>
        </ModalBody>
        <ModalFooter borderTop="1px solid" borderColor="ink.100" gap={2}>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <Button onClick={() => { onClose(); onEdit(student); }}>Modifier cet élève</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
