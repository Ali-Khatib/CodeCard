'use client';

import * as React from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, type Transition } from 'motion/react';

import { cn } from '@/lib/utils';

interface ProductImagesProps {
  id: string;
  color: string;
  images: string[];
}

interface ProductCardImagesProps {
  productImages: ProductImagesProps[];
  activeColor: number;
  activeImage: number;
  handleMouse: (event: 'enter' | 'leave') => void;
  className?: string;
}

const variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

function useSetActiveProduct(initialColor = 0) {
  const [state, setState] = React.useState({
    activeColor: initialColor,
    activeImage: 0,
  });

  const handleColorChange = React.useCallback((index: number) => {
    setState((prev) => ({ ...prev, activeColor: index }));
  }, []);

  const handleMouse = React.useCallback((event: 'enter' | 'leave') => {
    setState((prev) => ({
      ...prev,
      activeImage: event === 'enter' ? 1 : 0,
    }));
  }, []);

  return {
    ...state,
    handleColorChange,
    handleMouse,
  };
}

function ProductCardImages({
  productImages,
  activeColor,
  activeImage,
  handleMouse,
  className,
}: ProductCardImagesProps) {
  const handleMouseEnter = () => handleMouse('enter');
  const handleMouseLeave = () => handleMouse('leave');

  return (
    <div className={cn('relative aspect-[4/3] overflow-hidden rounded-xl', className)}>
      {productImages.map((productImage, index) => (
        <motion.div
          key={productImage.id}
          variants={variants}
          animate={index === activeColor ? 'visible' : 'hidden'}
          className="absolute inset-0 cursor-pointer overflow-hidden rounded-xl"
          exit="hidden"
        >
          <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${productImage.id}-0`}
                variants={variants}
                animate={activeImage === 0 ? 'visible' : 'hidden'}
                className="absolute inset-0"
                exit="hidden"
              >
                <Image
                  alt={`Preview ${index + 1}`}
                  fill
                  className="card-image object-cover"
                  src={productImage.images[0]}
                  sizes="320px"
                />
              </motion.div>
              {productImage.images[1] && (
                <motion.div
                  key={`${productImage.id}-1`}
                  variants={variants}
                  className="absolute inset-0"
                  animate={activeImage === 1 ? 'visible' : 'hidden'}
                  exit="hidden"
                >
                  <Image
                    alt={`Preview ${index + 1} alternate`}
                    fill
                    className="card-image object-cover"
                    src={productImage.images[1]}
                    loading="lazy"
                    sizes="320px"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

const springTransition = {
  type: 'spring',
  stiffness: 500,
  damping: 50,
  mass: 1,
} satisfies Transition;

interface ProductColorsThumbsProps {
  productId: string;
  productColors: string[];
  labels?: string[];
  activeColor: number;
  setActiveColor: (index: number) => void;
  className?: string;
}

function ProductColorsThumbs({
  productId,
  productColors,
  labels,
  activeColor,
  setActiveColor,
  className,
}: ProductColorsThumbsProps) {
  return (
    <div className={cn('mt-3 flex flex-col gap-2 px-1', className)}>
      <div className="flex gap-2">
        {productColors.map((productColor, index) => (
          <button
            key={`${productColor}-${index}`}
            type="button"
            aria-label={labels?.[index] ?? `Theme ${index + 1}`}
            aria-pressed={index === activeColor}
            className="relative size-5 appearance-none rounded-full border border-white/20 shadow-sm"
            style={{ backgroundColor: productColor }}
            onMouseEnter={() => setActiveColor(index)}
            onClick={() => setActiveColor(index)}
            title={labels?.[index] ?? productColor}
          >
            {index === activeColor && (
              <motion.div
                layoutId={productId}
                className="absolute -left-[3px] -top-[3px] size-[22px] rounded-full border-2 border-white/70"
                transition={springTransition}
              />
            )}
          </button>
        ))}
      </div>
      {labels?.[activeColor] && (
        <p className="text-[12px] font-medium text-lichen">{labels[activeColor]}</p>
      )}
    </div>
  );
}

interface ProductCardProps {
  id: string;
  images: ProductImagesProps[];
  colors: string[];
  labels?: string[];
  className?: string;
  onActiveColorChange?: (index: number) => void;
}

export function ProductCard({
  id,
  images,
  colors,
  labels,
  className,
  onActiveColorChange,
}: ProductCardProps) {
  const { activeColor, activeImage, handleColorChange, handleMouse } = useSetActiveProduct();

  React.useEffect(() => {
    onActiveColorChange?.(activeColor);
  }, [activeColor, onActiveColorChange]);

  const setColor = React.useCallback(
    (index: number) => {
      handleColorChange(index);
      onActiveColorChange?.(index);
    },
    [handleColorChange, onActiveColorChange],
  );

  return (
    <div id={id} className={cn('relative', className)}>
      <ProductCardImages
        productImages={images}
        activeColor={activeColor}
        activeImage={activeImage}
        handleMouse={handleMouse}
      />

      <ProductColorsThumbs
        productId={id}
        productColors={colors}
        labels={labels}
        activeColor={activeColor}
        setActiveColor={setColor}
      />
    </div>
  );
}
