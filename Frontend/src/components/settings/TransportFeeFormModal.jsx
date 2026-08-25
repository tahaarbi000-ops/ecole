import { useEffect } from 'react';
import {
  SimpleGrid,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Button,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import FormModal from '../common/FormModal';

const EMPTY_FORM = {
  label: '',
  amount: '',
};

const validationSchema = Yup.object({
  label: Yup.string()
    .trim()
    .required('Le nom de la zone est requis.'),

  amount: Yup.number()
    .typeError('Le tarif doit être un nombre.')
    .positive('Le tarif doit être positif.')
    .required('Le tarif est requis.'),
});

export default function TransportFeeFormModal({
  isOpen,
  onClose,
  onSubmit,
  fee = null,
  isSaving = false,
}) {
  const isEditMode = Boolean(fee);

  const formik = useFormik({
    initialValues: EMPTY_FORM,
    validationSchema,

    onSubmit: (values) => {
      onSubmit({
        ...values,
        amount: Number(values.amount),
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      formik.setValues(
        fee
          ? {
              label: fee.zone ?? '',
              amount: fee.amount ?? '',
            }
          : EMPTY_FORM
      );

      formik.setTouched({});
      formik.setErrors({});
    }
  }, [isOpen, fee]);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Modifier la zone' : 'Ajouter une zone'}
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>

          <Button
            onClick={formik.handleSubmit}
            isLoading={isSaving}
            loadingText="Enregistrement…"
          >
            {isEditMode ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </>
      }
      size="md"
    >
      <form onSubmit={formik.handleSubmit} noValidate>
        <SimpleGrid columns={1} spacing={4}>

          {/* Zone */}
          <FormControl
            isInvalid={formik.touched.label && Boolean(formik.errors.label)}
            isRequired
          >
            <FormLabel fontSize="sm">
              label
            </FormLabel>

            <Input
              name="label"
              value={formik.values.label}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Zone 5"
            />

            <FormErrorMessage>
              {formik.errors.label}
            </FormErrorMessage>
          </FormControl>

          {/* Amount */}
          <FormControl
            isInvalid={formik.touched.amount && Boolean(formik.errors.amount)}
            isRequired
          >
            <FormLabel fontSize="sm">
              Tarif mensuel
            </FormLabel>

            <InputGroup>
              <Input
                name="amount"
                type="number"
                min="0"
                value={formik.values.amount}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="100"
              />

              <InputRightElement
                w="3.2rem"
                color="ink.400"
                fontSize="sm"
              >
                DT
              </InputRightElement>
            </InputGroup>

            <FormErrorMessage>
              {formik.errors.amount}
            </FormErrorMessage>
          </FormControl>

        </SimpleGrid>
      </form>
    </FormModal>
  );
}