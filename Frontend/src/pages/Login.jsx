import { useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Checkbox,
  Divider,
} from '@chakra-ui/react';
import { Eye, EyeOff, GraduationCap, Users2, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';

const HIGHLIGHTS = [
  { icon: GraduationCap, text: '850 élèves accompagnés cette année' },
  { icon: Users2, text: 'Une équipe de 52 enseignants qualifiés' },
  { icon: ShieldCheck, text: 'Suivi administratif sécurisé et centralisé' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'L\u2019email est requis.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Format d\u2019email invalide.';
    if (!password) next.password = 'Le mot de passe est requis.';
    else if (password.length < 4) next.password = 'Mot de passe trop court.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login(email, password);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex minH="100vh" bg="ink.50">
      {/* Colonne gauche — présentation de l'école */}
      <Flex
        flex={1}
        display={{ base: 'none', lg: 'flex' }}
        position="relative"
        bgGradient="linear(160deg, brand.700, brand.900)"
        color="white"
        direction="column"
        justify="space-between"
        p={12}
        overflow="hidden"
      >
        {/* Décor géométrique discret */}
        <Box
          position="absolute"
          top="-120px"
          right="-120px"
          w="360px"
          h="360px"
          borderRadius="full"
          bg="whiteAlpha.100"
        />
        <Box
          position="absolute"
          bottom="-160px"
          left="-100px"
          w="420px"
          h="420px"
          borderRadius="full"
          bg="whiteAlpha.50"
        />

        <Box position="relative" zIndex={1}>
          <Logo variant="full" nameColor="white" size={44} />
        </Box>

        <VStack position="relative" zIndex={1} align="flex-start" spacing={6} maxW="440px">
          <HStack spacing={2} bg="whiteAlpha.150" px={3} py={1.5} borderRadius="full">
            <Sparkles size={14} />
            <Text fontSize="xs" fontWeight="600">Année scolaire 2025 / 2026</Text>
          </HStack>
          <Text fontFamily="heading" fontSize="4xl" fontWeight="800" lineHeight="1.15">
            École Privée Al Amal
          </Text>
          <Text fontSize="lg" color="whiteAlpha.800" lineHeight="1.5">
            Construire aujourd’hui les réussites de demain.
          </Text>

          <VStack align="flex-start" spacing={4} pt={4} w="full">
            {HIGHLIGHTS.map((h) => (
              <HStack key={h.text} spacing={3}>
                <Flex
                  w="38px"
                  h="38px"
                  borderRadius="lg"
                  bg="whiteAlpha.150"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <h.icon size={18} />
                </Flex>
                <Text fontSize="sm" color="whiteAlpha.900">
                  {h.text}
                </Text>
              </HStack>
            ))}
          </VStack>
        </VStack>

        <Text position="relative" zIndex={1} fontSize="xs" color="whiteAlpha.600">
          © {new Date().getFullYear()} École Privée Al Amal — Tous droits réservés.
        </Text>
      </Flex>

      {/* Colonne droite — formulaire de connexion */}
      <Flex flex={1} align="center" justify="center" px={{ base: 6, md: 12 }} py={10}>
        <VStack w="full" maxW="400px" align="stretch" spacing={7}>
          <Box display={{ base: 'block', lg: 'none' }} mb={2}>
            <Logo variant="full" />
          </Box>

          <VStack align="flex-start" spacing={1}>
            <Text fontFamily="heading" fontSize="2xl" fontWeight="700" color="ink.900">
              Bienvenue 👋
            </Text>
            <Text fontSize="sm" color="ink.500">
              Connectez-vous pour accéder à votre espace d’administration.
            </Text>
          </VStack>

          {formError && (
            <Alert status="error" borderRadius="lg" fontSize="sm">
              <AlertIcon />
              {formError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={Boolean(errors.email)}>
                <FormLabel fontSize="sm" fontWeight="600" color="ink.700">
                  Adresse email
                </FormLabel>
                <Input
                  type="email"
                  placeholder="admin@ecole.tn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="lg"
                  borderRadius="lg"
                  borderColor="ink.200"
                  _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={Boolean(errors.password)}>
                <FormLabel fontSize="sm" fontWeight="600" color="ink.700">
                  Mot de passe
                </FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    borderRadius="lg"
                    borderColor="ink.200"
                    _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword((v) => !v)}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <HStack justify="space-between">
                <Checkbox colorScheme="blue" size="sm" defaultChecked>
                  <Text fontSize="sm" color="ink.600">Se souvenir de moi</Text>
                </Checkbox>
                <Text
                  as="button"
                  type="button"
                  fontSize="sm"
                  fontWeight="600"
                  color="brand.600"
                  _hover={{ textDecoration: 'underline' }}
                >
                  Mot de passe oublié ?
                </Text>
              </HStack>

              <Button
                type="submit"
                size="lg"
                w="full"
                isLoading={isLoading}
                loadingText="Connexion en cours…"
              >
                Se connecter
              </Button>
            </VStack>
          </form>

          <Divider borderColor="ink.200" />

          <Box bg="brand.50" borderRadius="lg" px={4} py={3}>
            <Text fontSize="xs" color="brand.700" fontWeight="600" mb={1}>
              Accès de démonstration
            </Text>
            <Text fontSize="xs" color="ink.600">
              Email : admin@ecole.tn — Mot de passe : admin123
            </Text>
          </Box>
        </VStack>
      </Flex>
    </Flex>
  );
}
