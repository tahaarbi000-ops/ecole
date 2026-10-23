import { useMemo, useState } from 'react';
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
  Text,
  IconButton,
  Flex,
  Icon,
  Skeleton,
} from '@chakra-ui/react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

/**
 * Tableau de données réutilisable — tri, pagination, état vide et loading.
 *
 * @param {Array} columns   [{ key, label, sortable, align ('start'|'center'|'end'), render(row) }]
 * @param {Array} data      Données déjà filtrées par le parent (recherche / filtres)
 * @param {Function} [renderActions] (row) => ReactNode — colonne Actions
 * @param {number} [pageSize=8]
 * @param {boolean} [isLoading=false]
 * @param {string} [emptyMessage]
 * @param {boolean} [serverPagination=false] Pagination faite côté serveur (le parent contrôle la page)
 * @param {number} [page]         Page courante (serverPagination)
 * @param {number} [totalPages]   Nombre total de pages (serverPagination)
 * @param {number} [totalItems]   Nombre total d'éléments (serverPagination)
 * @param {Function} [onPageChange] (page) => void (serverPagination)
 */
export default function DataTable({
  columns,
  data,
  renderActions,
  pageSize = 8,
  isLoading = false,
  emptyMessage = 'Aucun résultat trouvé.',
  serverPagination = false,
  page: serverPage = 1,
  totalPages: serverTotalPages = 1,
  totalItems,
  onPageChange,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [localPage, setLocalPage] = useState(1);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv), 'fr')
        : String(bv).localeCompare(String(av), 'fr');
    });
    return copy;
  }, [data, sortKey, sortDir]);

  const totalPages = serverPagination
    ? Math.max(1, serverTotalPages)
    : Math.max(1, Math.ceil(sortedData.length / pageSize));

  const currentPage = serverPagination ? serverPage : Math.min(localPage, totalPages);

  const paginated = serverPagination
    ? sortedData
    : sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalCount = serverPagination ? (totalItems ?? sortedData.length) : sortedData.length;

  const goToPage = (p) => {
    const next = Math.min(Math.max(1, p), totalPages);
    if (serverPagination) {
      onPageChange?.(next);
    } else {
      setLocalPage(next);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    if (!serverPagination) setLocalPage(1);
  };

  const from = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);

  return (
    <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="ink.200" boxShadow="card" overflow="hidden">
      <TableContainer>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              {columns.map((col) => (
                <Th key={col.key} textAlign={col.align || 'start'} whiteSpace="nowrap">
                  {col.sortable ? (
                    <HStack
                      spacing={1}
                      cursor="pointer"
                      onClick={() => handleSort(col.key)}
                      userSelect="none"
                      justify={
                        col.align === 'end'
                          ? 'flex-end'
                          : col.align === 'center'
                          ? 'center'
                          : 'flex-start'
                      }
                    >
                      <Text>{col.label}</Text>
                      <Icon
                        as={sortKey === col.key ? (sortDir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown}
                        boxSize={3.5}
                        color={sortKey === col.key ? 'brand.600' : 'ink.400'}
                      />
                    </HStack>
                  ) : (
                    col.label
                  )}
                </Th>
              ))}
              {renderActions && <Th textAlign="right">الإجراءات</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <Tr key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <Td key={col.key}><Skeleton h="16px" borderRadius="md" /></Td>
                  ))}
                  {renderActions && <Td><Skeleton h="16px" borderRadius="md" /></Td>}
                </Tr>
              ))}

            {!isLoading && paginated.length === 0 && (
              <Tr>
                <Td colSpan={columns.length + (renderActions ? 1 : 0)} border="none">
                  <Flex direction="column" align="center" justify="center" py={12} gap={2}>
                    <Icon as={Inbox} boxSize={7} color="ink.400" />
                    <Text fontSize="sm" color="ink.400">{emptyMessage}</Text>
                  </Flex>
                </Td>
              </Tr>
            )}

            {!isLoading &&
              paginated.map((row, idx) => (
                <Tr key={row.id ?? idx} _hover={{ bg: 'ink.50' }} transition="background 0.12s ease">
                  {columns.map((col) => (
                    <Td key={col.key} textAlign={col.align || 'start'} whiteSpace="nowrap">
                      {col.render ? col.render(row) : row[col.key]}
                    </Td>
                  ))}
                  {renderActions && (
                    <Td>
                      <Flex justify="flex-start">{renderActions(row)}</Flex>
                    </Td>
                  )}
                </Tr>
              ))}
          </Tbody>
        </Table>
      </TableContainer>

      {!isLoading && totalCount > 0 && (
        <Flex
          justify="space-between"
          align="center"
          px={4}
          py={3}
          borderTop="1px solid"
          borderColor="ink.100"
          flexWrap="wrap"
          gap={2}
        >
          <Text fontSize="xs" color="ink.500" dir="rtl">
            عرض{' '}
            <span dir="ltr">
              {from}–{to}
            </span>{' '}
            من{' '}
            <span dir="ltr">
              {totalCount}
            </span>
          </Text>
          <HStack spacing={1}>
            <IconButton
              aria-label="Page précédente"
              icon={<ChevronRight size={16} />}
              size="xs"
              variant="outline"
              isDisabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            />

            <Text fontSize="xs" color="ink.600" px={2}>
              صفحة {currentPage} / {totalPages}
            </Text>

            <IconButton
              aria-label="Page suivante"
              icon={<ChevronLeft size={16} />}
              size="xs"
              variant="outline"
              isDisabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
            />
          </HStack>
        </Flex>
      )}
    </Box>
  );
}