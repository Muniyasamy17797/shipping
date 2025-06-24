import formatPrice from 'utils/formatPrice';
import { ICartProduct } from 'models';

import { useCart } from 'contexts/cart-context';

import * as S from './style';

// Security utilities
const sanitizeText = (text: string): string => {
  return text.replace(/[<>"'&]/g, (match) => {
    const escapeMap: { [key: string]: string } = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    };
    return escapeMap[match];
  });
};

const validateSku = (sku: number): boolean => {
  return Number.isInteger(sku) && sku > 0;
};

const validateQuantity = (quantity: number): boolean => {
  return Number.isInteger(quantity) && quantity > 0 && quantity <= 99;
};

interface IProps {
  product: ICartProduct;
}
const CartProduct = ({ product }: IProps) => {
  const { removeProduct, increaseProductQuantity, decreaseProductQuantity } =
    useCart();
  const {
    id,
    sku,
    title,
    price,
    style,
    currencyId,
    currencyFormat,
    availableSizes,
    quantity,
  } = product;

  // Input validation
  if (!validateSku(sku) || !validateQuantity(quantity)) {
    return null;
  }

  const safeTitle = sanitizeText(title || '');
  const safeStyle = sanitizeText(style || '');
  const safeCurrencyFormat = sanitizeText(currencyFormat || '$');
  const safeSku = String(sku).replace(/[^0-9]/g, '');

  const handleRemoveProduct = () => removeProduct(id);
  const handleIncreaseProductQuantity = () => increaseProductQuantity(id);
  const handleDecreaseProductQuantity = () => decreaseProductQuantity(id);

  return (
    <S.Container>
      <S.DeleteButton
        onClick={handleRemoveProduct}
        title="remove product from cart"
      />
      <S.Image
        src={safeSku ? require(`static/products/${safeSku}-1-cart.webp`) : ''}
        alt={safeTitle}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <S.Details>
        <S.Title>{safeTitle}</S.Title>
        <S.Desc>
          {`${availableSizes[0] || 'N/A'} | ${safeStyle}`} <br />
          Quantity: {quantity}
        </S.Desc>
      </S.Details>
      <S.Price>
        <p>{`${safeCurrencyFormat}  ${formatPrice(price, currencyId)}`}</p>
        <div>
          <S.ChangeQuantity
            onClick={handleDecreaseProductQuantity}
            disabled={quantity === 1 ? true : false}
          >
            -
          </S.ChangeQuantity>
          <S.ChangeQuantity onClick={handleIncreaseProductQuantity}>
            +
          </S.ChangeQuantity>
        </div>
      </S.Price>
    </S.Container>
  );
};

export default CartProduct;
