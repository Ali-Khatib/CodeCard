"use client";

import * as React from "react";
import { useRef } from "react";
import {
  type MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";

const cn = (...args: ClassValue[]) => twMerge(clsx(args));

export interface AnimatedDockProps {
  className?: string;
  items: DockItemData[];
}

export interface DockItemData {
  link?: string;
  Icon: React.ReactNode;
  target?: string;
  label?: string;
  active?: boolean;
  onClick?: () => void;
  role?: React.AriaRole;
  ariaSelected?: boolean;
  wide?: boolean;
  staticWidth?: number;
}

export const AnimatedDock = ({ className, items }: AnimatedDockProps) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(event) => mouseX.set(event.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "cc-animated-dock mx-auto flex h-16 items-end gap-2 rounded-2xl border px-3 pb-3",
        className,
      )}
    >
      {items.map((item, index) => (
        <DockItem
          key={`${item.link ?? item.label ?? "dock"}-${index}`}
          mouseX={mouseX}
          active={item.active}
          wide={item.wide}
          staticWidth={item.staticWidth}
        >
          {item.link ? (
            <Link
              href={item.link}
              target={item.target}
              rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
              aria-label={item.label}
              className="flex h-full w-full grow items-center justify-center"
            >
              {item.Icon}
            </Link>
          ) : (
            <button
              type="button"
              onClick={item.onClick}
              aria-pressed={item.active}
              aria-selected={item.ariaSelected}
              aria-label={item.label}
              role={item.role}
              className="flex h-full w-full grow items-center justify-center"
            >
              {item.Icon}
            </button>
          )}
        </DockItem>
      ))}
    </motion.div>
  );
};

interface DockItemProps {
  mouseX: MotionValue<number>;
  children: React.ReactNode;
  active?: boolean;
  wide?: boolean;
  staticWidth?: number;
}

export const DockItem = ({ mouseX, children, active, wide, staticWidth }: DockItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const baseWidth = staticWidth ?? (wide ? 68 : 36);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(
    distance,
    [-150, 0, 150],
    [baseWidth, baseWidth, baseWidth],
  );
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const liftSync = useTransform(distance, [-150, 0, 150], [0, staticWidth ? 0 : -12, 0]);
  const lift = useSpring(liftSync, {
    mass: 0.1,
    stiffness: 180,
    damping: 14,
  });

  const iconScale = useTransform(distance, [-150, 0, 150], [1, staticWidth ? 1 : 1.2, 1]);
  const iconSpring = useSpring(iconScale, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width, y: lift }}
      data-active={active ? "true" : "false"}
      data-wide={wide ? "true" : "false"}
      className={cn(
        "cc-animated-dock__item flex h-9 w-9 min-w-9 shrink-0 items-center justify-center rounded-full",
        wide && "h-10",
      )}
    >
      <motion.div
        style={{ scale: iconSpring }}
        className="flex h-full w-full grow items-center justify-center"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
