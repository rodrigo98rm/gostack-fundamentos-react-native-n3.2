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
      const cartProducts = await AsyncStorage.getItem('@GoMarketplace:cart');

      if (cartProducts) {
        setProducts(JSON.parse(cartProducts));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      AsyncStorage.setItem('@GoMarketplace:cart', JSON.stringify(products));
    }
  }, [products]);

  const increment = useCallback(
    async id => {
      const index = products.findIndex(e => e.id === id);

      const product = products[index];

      if (product.quantity) {
        product.quantity += 1;
      } else {
        product.quantity = 1;
      }

      products[index] = product;

      setProducts([...products]);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const index = products.findIndex(e => e.id === id);

      const product = products[index];

      product.quantity -= 1;

      if (product.quantity === 0) {
        products.splice(index, 1);
      }

      setProducts([...products]);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const foundProduct = products.find(e => e.id === product.id);

      if (foundProduct) {
        increment(foundProduct.id);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }
    },
    [increment, products],
  );

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
