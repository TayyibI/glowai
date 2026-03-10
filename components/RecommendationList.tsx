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
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative flex h-full flex-col rounded-none border border-charcoal/20 bg-alabaster overflow-hidden transition-colors"
    >
      <div className="relative w-full overflow-hidden bg-champagne/10 shrink-0 aspect-[4/5] border-b border-charcoal/20">
        <img
          src={product.image || "/placeholder-product.jpg"}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute top-4 right-4 rounded-none border border-charcoal/20 bg-alabaster px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-charcoal">
          {product.category.replace(/_/g, " ")}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-charcoal/60">
          {brandName}
        </p>
        <h3 className="font-serif text-xl uppercase tracking-widest text-charcoal mb-3">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-sm text-charcoal/80 leading-relaxed mb-6">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-6 border-t border-charcoal/20">
          <div className="flex items-start gap-3 mb-6 bg-champagne/10 p-4 border border-charcoal/20">
            <CheckCircle2 className="w-5 h-5 text-charcoal mt-0.5 shrink-0" />
            <div className="text-sm text-charcoal leading-relaxed">
              <span className="font-bold uppercase tracking-widest text-charcoal text-[10px] block mb-1">Why this product for YOU</span>
              <ReactMarkdown
                components={{
                  strong: ({ node, ...props }) => <span className="font-bold text-charcoal" {...props} />
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
              className="flex w-full items-center justify-center gap-2 rounded-none border border-charcoal/20 bg-charcoal px-6 py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-alabaster hover:text-charcoal"
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
        <div className="mb-8">
          <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-2">Morning Routine</h2>
          <p className="text-sm text-charcoal/80 uppercase tracking-widest">Start your day protected and fresh</p>
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
        <div className="mb-8">
          <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-2">Evening Routine</h2>
          <p className="text-sm text-charcoal/80 uppercase tracking-widest">Repair and nourish overnight</p>
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
          <div className="mb-8">
            <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-2">Hair Care</h2>
            <p className="text-sm text-charcoal/80 uppercase tracking-widest">Tailored for your scalp and strands</p>
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
