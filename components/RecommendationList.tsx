"use client";

import type { Product, Routine, RecommendedProduct } from "@/types/Product";
import { Card, CardTitle } from "@/components/ui/Card";
import { motion, Variants } from "framer-motion";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface RecommendationListProps {
  routine: Routine & { hair: RecommendedProduct[] };
  showBuyNow?: boolean;
  userTags?: string[];
}

// Map the ID prefix to a beautiful brand name
function getBrandName(id: string) {
  if (id.startsWith("ponds")) return "Pond's";
  if (id.startsWith("simple")) return "Simple";
  if (id.startsWith("sunsilk")) return "Sunsilk";
  if (id.startsWith("dove")) return "Dove";
  return "Premium Brand";
}

// Helper to determine why a product was recommended
function getWhyThis(product: Product, userTags: string[]) {
  const matches = product.tags.filter(tag => userTags.includes(tag));
  if (matches.length === 0) return "A solid essential for your routine";

  const labels = matches.slice(0, 2).map(m => m.replace(/_/g, " "));
  return `Matches your ${labels.join(" + ")}`;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

function AnimatedProductCard({ rec, showBuyNow }: { rec: RecommendedProduct; showBuyNow?: boolean }) {
  const { product, reason } = rec;
  const brandName = getBrandName(product.id);

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.01, boxShadow: "0px 10px 20px rgba(0,0,0,0.06)" }}
      className="relative flex h-full flex-col rounded-2xl border border-nude/60 bg-white/90 backdrop-blur-sm overflow-hidden transition-colors hover:border-blush/40"
    >
      <div className="relative w-full overflow-hidden bg-ivory/60 shrink-0 aspect-[4/5]">
        <img
          src={product.image || "/placeholder-product.jpg"}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute top-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brown shadow-card backdrop-blur-md">
          {product.category.replace(/_/g, " ")}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brown/60">
          {brandName}
        </p>
        <h3 className="font-semibold text-lg leading-tight text-brown mb-2">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-sm text-brown/80 leading-relaxed mb-4">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-nude/50">
          <div className="flex items-start gap-2 mb-4 bg-nude/30 p-3 rounded-xl border border-nude/60">
            <CheckCircle2 className="w-4 h-4 text-blush mt-1 shrink-0" />
            <div className="text-sm text-brown leading-relaxed">
              <span className="font-semibold text-brown block mb-0.5">Why this product for YOU</span>
              <ReactMarkdown
                components={{
                  strong: ({ node, ...props }) => <span className="font-bold text-brown" {...props} />
                }}
              >
                {reason}
              </ReactMarkdown>
            </div>
          </div>

          {showBuyNow && product.purchaseLink && (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={product.purchaseLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blush px-4 py-3 text-sm font-semibold text-white shadow-blush-soft transition-colors hover:bg-blush/90"
            >
              Buy on Daraz
              <ExternalLink className="w-4 h-4" />
            </motion.a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export function RecommendationList({ routine, showBuyNow, userTags = [] }: RecommendationListProps) {
  return (
    <div className="space-y-10">
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-brown">Morning Routine</h2>
          <p className="text-sm text-brown/80">Start your day protected and fresh</p>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {routine.day.map((rec) => (
            <AnimatedProductCard key={rec.product.id} rec={rec} showBuyNow={showBuyNow} />
          ))}
        </motion.div>
      </section>

      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-brown">Evening Routine</h2>
          <p className="text-sm text-brown/80">Repair and nourish overnight</p>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {routine.night.map((rec) => (
            <AnimatedProductCard key={rec.product.id} rec={rec} showBuyNow={showBuyNow} />
          ))}
        </motion.div>
      </section>

      {routine.hair.length > 0 && (
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-brown">Hair Care</h2>
            <p className="text-sm text-brown/80">Tailored for your scalp and strands</p>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {routine.hair.map((rec) => (
              <AnimatedProductCard key={rec.product.id} rec={rec} showBuyNow={showBuyNow} />
            ))}
          </motion.div>
        </section>
      )}
    </div>
  );
}
