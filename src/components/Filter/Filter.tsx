import { useProducts } from 'contexts/products-context';

import * as S from './style';

export const availableSizes = ['XS', 'S', 'M', 'ML', 'L', 'XL', 'XXL'];

// Security validation
const isValidSize = (size: string): boolean => {
  return availableSizes.includes(size) && /^[A-Z]{1,3}$/.test(size);
};

const Filter = () => {
  const { filters, filterProducts } = useProducts();

  const toggleCheckbox = (label: string) => {
    // Validate input
    if (!isValidSize(label)) {
      console.warn('Invalid filter size:', label);
      return;
    }

    const updatedFilters = filters.includes(label)
      ? filters.filter(f => f !== label)
      : [...filters, label];

    filterProducts(updatedFilters);
  };

  const createCheckbox = (label: string) => (
    <S.Checkbox label={label} handleOnChange={toggleCheckbox} key={label} />
  );

  const createCheckboxes = () => availableSizes.map(createCheckbox);

  return (
    <S.Container>
      <S.Title>Sizes:</S.Title>
      {createCheckboxes()}
    </S.Container>
  );
};

export default Filter;
