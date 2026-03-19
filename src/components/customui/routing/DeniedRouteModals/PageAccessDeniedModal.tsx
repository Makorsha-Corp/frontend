// src/components/customui/routing/PageAccessDeniedModal.tsx
import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface PageAccessDeniedModalProps {
  open?: boolean; // defaults to true
  title?: string;
  description?: string;
  /** Override CTA text (default: "Go to Home") */
  ctaLabel?: string;
  /** Where CTA goes (default: "/") */
  ctaHref?: string;
}

const PageAccessDeniedModal: React.FC<PageAccessDeniedModalProps> = ({
  open = true,
  title = "Access Denied",
  description = "Sorry, you don’t have permission to view this page.",
  ctaLabel = "Go to Home",
  ctaHref = "/",
}) => {
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000]">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      {/* centered card */}
      <div className="relative z-[1001] min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white shadow-xl p-8 rounded-2xl max-w-md w-full text-center border border-red-100"
        >
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="p-3 rounded-full bg-red-100 shadow-lg shadow-red-400"
            >
              <AlertTriangle className="text-red-500 w-10 h-10" />
            </motion.div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
          <p className="text-gray-600 mb-6">{description}</p>

          <Link
            to={ctaHref}
            className="inline-block bg-red-500 text-white font-semibold px-6 py-2 rounded-lg shadow-red-400 shadow-md hover:bg-red-600 transition"
          >
            {ctaLabel}
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default PageAccessDeniedModal;
