import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App.jsx';
import theme from './theme/theme.js';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // no refetch every time the tab regains focus
      retry: 2,                    // helps with Render spin-down / Neon cold start
      retryDelay: (n) => Math.min(1000 * 2 ** n, 8000),
    },
  },
});
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider theme={theme} direction="rtl">
      <HashRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        </QueryClientProvider>
      </HashRouter>
    </ChakraProvider>
  </StrictMode>
);
