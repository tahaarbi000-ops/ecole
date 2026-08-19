import { Box, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { Building2, GraduationCap, Bus, Palette } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import GeneralInfoTab from '../components/settings/GeneralInfoTab';
import TuitionFeesTab from '../components/settings/TuitionFeesTab';
import TransportFeesTab from '../components/settings/TransportFeesTab';
import AppearanceTab from '../components/settings/AppearanceTab';

const TABS = [
  { label: 'Général', icon: Building2, panel: GeneralInfoTab },
  { label: 'Tarifs scolarité', icon: GraduationCap, panel: TuitionFeesTab },
  { label: 'Tarifs transport', icon: Bus, panel: TransportFeesTab },
  { label: 'Apparence', icon: Palette, panel: AppearanceTab },
];

export default function Settings() {
  return (
    <Box>
      <PageHeader title="Paramètres" subtitle="Informations de l’école, tarifs et préférences d’affichage." />

      <Tabs variant="unstyled">
        <TabList
          bg="white"
          border="1px solid"
          borderColor="ink.200"
          borderRadius="xl"
          p={1.5}
          w="fit-content"
          maxW="full"
          overflowX="auto"
          mb={6}
        >
          {TABS.map((t) => (
            <Tab
              key={t.label}
              px={4}
              py={2}
              borderRadius="lg"
              fontSize="sm"
              fontWeight="500"
              color="ink.600"
              whiteSpace="nowrap"
              _selected={{ bg: 'brand.600', color: 'white', fontWeight: '600' }}
              _hover={{ bg: 'ink.50' }}
              transition="all 0.15s ease"
            >
              <t.icon size={16} style={{ marginRight: 8 }} />
              {t.label}
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {TABS.map((t) => (
            <TabPanel key={t.label} px={0}>
              <t.panel />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
}
