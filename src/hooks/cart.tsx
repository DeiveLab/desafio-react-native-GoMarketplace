import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const newProductsJSON = await AsyncStorage.getItem('@GoMarketplace:products');
      
      if (newProductsJSON) {
        const newProducts = JSON.parse(newProductsJSON);
        setProducts(newProducts);
      }

    };

    loadProducts();
  }, []);

  const addToCart = useCallback(async product => {
    const productExists = products.find(item => item.id === product.id);

    if(productExists){
      await increment(product.id);
      return;
    }

    const newProduct = {...product, quantity: 1};
    const newProducts = [...products, newProduct];
    setProducts(newProducts);

    const productsJSON = JSON.stringify(newProducts);
    await AsyncStorage.setItem('@GoMarketplace:products', productsJSON);
    // await AsyncStorage.removeItem('@GoMarketplace:products');
    // setProducts([]);
  }, [products]);

  const increment = useCallback(async id => {
    const updatedProducts = products.map(item => {
      if (item.id === id) {
        item.quantity++;
      }

      return item;
    });

    const updatedProductsJSON = JSON.stringify(updatedProducts);
    await AsyncStorage.setItem('@GoMarketplace:products', updatedProductsJSON);

    setProducts(updatedProducts);
  }, [products]);

  const decrement = useCallback(async id => {
    const updatedProducts = products.map(item => {
      if (item.id === id) {
        item.quantity--;
      }

      return item;
    }).filter(item => item.quantity !== 0);

    const updatedProductsJSON = JSON.stringify(updatedProducts);
    await AsyncStorage.setItem('@GoMarketplace:products', updatedProductsJSON);

    setProducts(updatedProducts);
  }, [products]);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
