import { useCallback, useMemo, useRef } from 'react';

import { useProductsContext } from './ProductsContextProvider';
import { IProduct } from 'models';
import { getProducts } from 'services/products';

// Performance monitoring utilities
const performanceMonitor = {
  start: (label: string) => performance.mark(`${label}-start`),
  end: (label: string) => {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const measure = performance.getEntriesByName(label)[0];
    console.log(`${label}: ${measure.duration.toFixed(2)}ms`);
    return measure.duration;
  }
};

const useProducts = () => {
  const {
    isFetching,
    setIsFetching,
    products,
    setProducts,
    filters,
    setFilters,
  } = useProductsContext();

  // Cache for products to avoid redundant API calls
  const productsCache = useRef<IProduct[] | null>(null);
  const lastFilters = useRef<string[]>([]);

  const fetchProducts = useCallback(() => {
    // Return cached products if available
    if (productsCache.current) {
      setProducts(productsCache.current);
      return Promise.resolve(productsCache.current);
    }

    performanceMonitor.start('fetchProducts');
    setIsFetching(true);
    
    return getProducts().then((products: IProduct[]) => {
      setIsFetching(false);
      productsCache.current = products; // Cache the results
      setProducts(products);
      performanceMonitor.end('fetchProducts');
      return products;
    });
  }, [setIsFetching, setProducts]);

  // Memoized filtering logic with optimized algorithm
  const filteredProducts = useMemo(() => {
    if (!productsCache.current) return products;
    
    performanceMonitor.start('filterProducts');
    
    if (!filters || filters.length === 0) {
      performanceMonitor.end('filterProducts');
      return productsCache.current;
    }

    // Convert filters to Set for O(1) lookup instead of O(n)
    const filterSet = new Set(filters);
    
    const result = productsCache.current.filter((product: IProduct) =>
      product.availableSizes.some(size => filterSet.has(size))
    );
    
    performanceMonitor.end('filterProducts');
    return result;
  }, [filters, products]);

  const filterProducts = useCallback((newFilters: string[]) => {
    // Skip if filters haven't changed
    if (JSON.stringify(newFilters) === JSON.stringify(lastFilters.current)) {
      return;
    }

    lastFilters.current = newFilters;
    setFilters(newFilters);
    
    // If no cached products, fetch them first
    if (!productsCache.current) {
      fetchProducts();
    }
  }, [setFilters, fetchProducts]);

  return {
    isFetching,
    fetchProducts,
    products: filteredProducts,
    filterProducts,
    filters,
  };
};

export default useProducts;