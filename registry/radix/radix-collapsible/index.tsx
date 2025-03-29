'use client';

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { AnimatePresence, motion, type Transition } from 'motion/react';

type CollapsibleContextType = { isOpen: boolean };
const CollapsibleContext = React.createContext<CollapsibleContextType>({
  isOpen: false,
});

type CollapsibleProps = React.ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.Root
>;
const Collapsible: React.FC<CollapsibleProps> = ({ children, ...props }) => {
  const [isOpen, setIsOpen] = React.useState(
    props?.open ?? props?.defaultOpen ?? false,
  );

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open);
      props.onOpenChange?.(open);
    },
    [props],
  );

  return (
    <CollapsiblePrimitive.Root {...props} onOpenChange={handleOpenChange}>
      <CollapsibleContext.Provider value={{ isOpen }}>
        {children}
      </CollapsibleContext.Provider>
    </CollapsiblePrimitive.Root>
  );
};

type CollapsibleTriggerProps = React.ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.Trigger
>;
const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

type CollapsibleContentProps = React.ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.Content
> & {
  transition?: Transition;
};
const CollapsibleContent = React.forwardRef<
  React.ComponentRef<typeof CollapsiblePrimitive.Content>,
  CollapsibleContentProps
>(
  (
    {
      className,
      children,
      transition = { type: 'spring', stiffness: 150, damping: 17 },
      ...props
    },
    ref,
  ) => {
    const { isOpen } = React.useContext(CollapsibleContext);

    return (
      <AnimatePresence>
        {isOpen && (
          <CollapsiblePrimitive.Content asChild forceMount ref={ref} {...props}>
            <motion.div
              key="collapsible-content"
              layout
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto', overflow: 'hidden' }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              transition={transition}
              className={className}
            >
              {children}
            </motion.div>
          </CollapsiblePrimitive.Content>
        )}
      </AnimatePresence>
    );
  },
);
CollapsibleContent.displayName = CollapsiblePrimitive.Content.displayName;

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  type CollapsibleProps,
  type CollapsibleTriggerProps,
  type CollapsibleContentProps,
};
