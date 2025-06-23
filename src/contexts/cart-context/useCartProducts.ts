import { useCartContext } from './CartContextProvider';
import useCartTotal from './useCartTotal';
import { ICartProduct } from 'models';

const useCartProducts = () => {
  const { products, setProducts } = useCartContext();
  const { updateCartTotal } = useCartTotal();



  const addProduct = (newProduct: ICartProduct) => {
    const existingIndex = products.findIndex(p => p.id === newProduct.id);
    const result = existingIndex >= 0
      ? products.map(product => 
          product.id === newProduct.id
            ? { ...product, quantity: product.quantity + newProduct.quantity }
            : product
        )
      : [...products, newProduct];
    
    setProducts(result);
    updateCartTotal(result);
  };

  const updateQuantity = (id: number, change: number) => {
    const result = products.map(product =>
      product.id === id ? { ...product, quantity: product.quantity + change } : product
    );
    setProducts(result);
    updateCartTotal(result);
  };

  const removeProduct = (id: number) => {
    const result = products.filter(product => product.id !== id);
    setProducts(result);
    updateCartTotal(result);
  };

  const increaseProductQuantity = (id: number) => updateQuantity(id, 1);
  const decreaseProductQuantity = (id: number) => updateQuantity(id, -1);

  return {
    products,
    addProduct,
    removeProduct,
    increaseProductQuantity,
    decreaseProductQuantity,
  };
};

export default useCartProducts;
