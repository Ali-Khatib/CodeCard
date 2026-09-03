"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import "swiper/css";
import "swiper/css/effect-creative";
import "swiper/css/pagination";
import "swiper/css/autoplay";

import { cn } from "@/lib/utils";

const Skiper52 = () => {
  const images = [
    {
      src: "https://cdn.21st.dev/assets/mirror/b3/b38b11120084476aaf6ba3bfe8a0cd62837cd3b7f0ebc9dc4dbd01e2415f0542.jpg",
      alt: "Mountain landscape",
      code: "# 23",
    },
    {
      src: "https://cdn.21st.dev/assets/mirror/2c/2ce25185a2e9705e91ccb9de3249f3b04b3806d819c03cf7b123416f1f3cd62b.jpg",
      alt: "Abstract illustration",
      code: "# 23",
    },
    {
      src: "https://cdn.21st.dev/assets/mirror/3b/3b172768c91187c4f9350a4e26babed55625584393674f9109ecd0ddb847cab0.jpg",
      alt: "City skyline at night",
      code: "# 23",
    },
    {
      src: "https://cdn.21st.dev/assets/mirror/0a/0ac670bd21f70d977fea48b0327f07c80dbbe5c05729844853db585a60897944.jpg",
      alt: "Modern architecture",
      code: "# 23",
    },
    {
      src: "https://cdn.21st.dev/assets/mirror/17/17bcd5f4aabe2bc0e73731897b4dcb17b7bf5c48a9995fa36fb8927f439d10ad.jpg",
      alt: "Laptop workspace",
      code: "# 23",
    },
    {
      src: "https://cdn.21st.dev/assets/mirror/7b/7b6cad4f5f9aed24a464d9bb2104aac31bdab6e9d47173db06b6322d79e17119.jpg",
      alt: "Ocean waves",
      code: "# 23",
    },
    {
      src: "https://cdn.21st.dev/assets/mirror/65/654a77994e78900fcecbd9a720c1651e2106691878086fa51b28b7833203afdf.jpg",
      alt: "Forest path",
      code: "# 23",
    },
    {
      src: "https://cdn.21st.dev/assets/mirror/25/25e4b5017e4096963a55d1cb6d0f79d8876fe69e2a4c4f01b587d42e387b4655.jpg",
      alt: "Colorful building",
      code: "# 23",
    },
    {
      src: "https://cdn.21st.dev/assets/mirror/72/72f92301628bced732873f6f31f0687ca8336e90b0629d2805f766c30506cf94.jpg",
      alt: "Sunset view",
      code: "# 23",
    },
  ];

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-[#f5f4f3]">
      <HoverExpand_001 className="" images={images} />
    </div>
  );
};

export { Skiper52 };

const HoverExpand_001 = ({
  images,
  className,
}: {
  images: { src: string; alt: string; code: string }[];
  className?: string;
}) => {
  const [activeImage, setActiveImage] = useState<number | null>(1);

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        duration: 0.3,
        delay: 0.5,
      }}
      className={cn("relative w-full max-w-6xl px-5", className)}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <div className="flex w-full items-center justify-center gap-1">
          {images.map((image, index) => (
            <motion.div
              key={index}
              className="relative cursor-pointer overflow-hidden rounded-3xl"
              initial={{ width: "2.5rem", height: "20rem" }}
              animate={{
                width: activeImage === index ? "24rem" : "5rem",
                height: activeImage === index ? "24rem" : "24rem",
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              onClick={() => setActiveImage(index)}
              onHoverStart={() => setActiveImage(index)}
            >
              <AnimatePresence>
                {activeImage === index && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute h-full w-full bg-gradient-to-t from-black/40 to-transparent"
                  />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {activeImage === index && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute flex h-full w-full flex-col items-end justify-end p-4"
                  >
                    <p className="text-left text-xs text-white/50">
                      {image.code}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              <img
                src={image.src}
                className="size-full object-cover"
                alt={image.alt}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export { HoverExpand_001 };

