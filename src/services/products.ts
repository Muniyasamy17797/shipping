import axios, { AxiosError } from 'axios';
import { IGetProductsResponse } from 'models';

const isProduction = process.env.NODE_ENV === 'production';

interface ApiError {
  message: string;
  code: string;
  retryable: boolean;
}

const createError = (message: string, code: string, retryable = false): ApiError => ({
  message, code, retryable
});

const handleError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (!axiosError.response) {
      return createError('Network connection failed', 'NETWORK_ERROR', true);
    }
    const status = axiosError.response.status;
    if (status >= 500) return createError('Server error', 'SERVER_ERROR', true);
    if (status === 429) return createError('Too many requests', 'RATE_LIMITED', true);
    if (status === 404) return createError('Products not found', 'NOT_FOUND');
    return createError('Request failed', 'REQUEST_ERROR');
  }
  return createError('Unknown error occurred', 'UNKNOWN_ERROR');
};

const retry = async <T>(fn: () => Promise<T>, attempts = 3): Promise<T> => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
};

export const getProducts = async () => {
  try {
    const fetchProducts = async () => {
      let response: IGetProductsResponse;

      if (isProduction) {
        response = await axios.get(
          'https://react-shopping-cart-67954.firebaseio.com/products.json',
          { timeout: 10000 }
        );
      } else {
        response = require('static/json/products.json');
      }

      if (!response.data?.products || !Array.isArray(response.data.products)) {
        throw createError('Invalid response format', 'INVALID_RESPONSE');
      }

      // Validate and sanitize product data
      const validatedProducts = response.data.products.filter((product: any) => {
        return product && 
               typeof product.id === 'number' &&
               typeof product.sku === 'number' &&
               typeof product.title === 'string' &&
               typeof product.price === 'number' &&
               product.price >= 0 &&
               Array.isArray(product.availableSizes);
      });

      return validatedProducts;
    };

    return await retry(fetchProducts);
  } catch (error) {
    throw handleError(error);
  }
};
