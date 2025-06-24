import { useCallback, useMemo, useRef } from 'react';

import { useProductsContext } from './ProductsContextProvider';
import { IProduct } from 'models';
import { getProducts } from 'services/products';

interface ApiError {
  message: string;
  code: string;
  retryable: boolean;
}

const useProducts = () => {
  const {
    isFetching,
    setIsFetching,
    products,
    setProducts,
    filters,
    setFilters,
    error,
    setError,
    retryCount,
    setRetryCount,
  } = useProductsContext();

  const productsCache = useRef<IProduct[] | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const fetchProducts = useCallback(async () => {
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    if (productsCache.current && !error) {
      setProducts(productsCache.current);
      return productsCache.current;
    }

    try {
      setIsFetching(true);
      setError(null);
      
      const fetchedProducts = await getProducts();
      
      if (abortController.current.signal.aborted) return;
      
      productsCache.current = fetchedProducts;
      setProducts(fetchedProducts);
      setRetryCount(0);
      
      return fetchedProducts;
    } catch (err) {
      if (abortController.current.signal.aborted) return;
      
      const apiError = err as ApiError;
      setError(apiError);
      
      if (!apiError.retryable) {
        setProducts([]);
        productsCache.current = null;
      }
      
      throw apiError;
    } finally {
      if (!abortController.current.signal.aborted) {
        setIsFetching(false);
      }
    }
  }, [setIsFetching, setProducts, setError, setRetryCount, error]);

  const retryFetch = useCallback(async () => {
    if (retryCount >= 3) {
      setError({ message: 'Maximum retry attempts reached', code: 'MAX_RETRIES', retryable: false });
      return;
    }
    
    setRetryCount(prev => prev + 1);
    return fetchProducts();
  }, [fetchProducts, retryCount, setError, setRetryCount]);

  const filteredProducts = useMemo(() => {
    try {
      if (!productsCache.current) return products;
      
      if (!filters || filters.length === 0) {
        return productsCache.current;
      }

      const filterSet = new Set(filters);
      return productsCache.current.filter((product: IProduct) =>
        product.availableSizes?.some(size => filterSet.has(size))
      );
    } catch (err) {
      setError({ message: 'Error filtering products', code: 'FILTER_ERROR', retryable: false });
      return products;
    }
  }, [filters, products, setError]);

  const filterProducts = useCallback((newFilters: string[]) => {
    try {
      setError(null);
      setFilters(newFilters);
      
      if (!productsCache.current) {
        fetchProducts();
      }
    } catch (err) {
      setError({ message: 'Error applying filters', code: 'FILTER_ERROR', retryable: false });
    }
  }, [setFilters, setError, fetchProducts]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    isFetching,
    fetchProducts,
    products: filteredProducts,
    filterProducts,
    filters,
    error,
    retryFetch,
    clearError,
    canRetry: error?.retryable && retryCount < 3,
  };
};

export default useProducts;
