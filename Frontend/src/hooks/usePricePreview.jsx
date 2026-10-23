// hooks/usePricePreview.js
import { useEffect, useState } from 'react';
import { AxiosToken } from '../api/Api';

export default function usePricePreview(values) {
  const [preview, setPreview] = useState({ normalMonthPrice: null,creationMonthPrice:null, loading: false, error: null });

  useEffect(() => {
    const { classe, payment_type } = values;
    if (!classe || !payment_type) {
      setPreview({ normalMonthPrice: null,creationMonthPrice:null, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setPreview((p) => ({ ...p, loading: true, error: null }));
      try {
        const { data } = await AxiosToken.get('/student/price-preview', {
          params: {
            classe,
            payment_type,
            transport: values.transport,
            is_take_book: values.is_take_book,
            is_take_uniform: values.is_take_uniform,
            zone_id: values.zone_id || undefined,
            promotion: values.promotion || undefined,
          },
          signal: controller.signal,
        });
        setPreview({ normalMonthPrice: data.normalMonthPrice,creationMonthPrice:data.creationMonthPrice, loading: false, error: null });
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setPreview({ totalPrice: null, loading: false, error: 'تعذر حساب السعر' });
        }
      }
    }, 400); // debounce

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [
    values.classe,
    values.payment_type,
    values.transport,
    values.is_take_book,
    values.is_take_uniform,
    values.zone_id,
    values.promotion,
  ]);

  return preview;
}