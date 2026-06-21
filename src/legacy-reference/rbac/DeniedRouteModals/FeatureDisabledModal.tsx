import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { XCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface FeatureDisabledModalProps {
  open?: boolean;
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

const FeatureDisabledModal: React.FC<FeatureDisabledModalProps> = ({
  open = true,
  title = "Feature Disabled",
  description = "This feature is currently disabled.",
  ctaLabel = "Go to Home",
  ctaHref = "/",
}) => {
  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-[480px] bg-white shadow-xl p-8 rounded-2xl text-center border border-gray-200"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <div className="flex justify-center mb-4">
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="p-3 rounded-full bg-gray-100 shadow-md shadow-gray-400"
              >
                <XCircle className="text-gray-600 w-10 h-10" />
              </motion.div>
            </div>

            <DialogTitle className="text-2xl font-bold text-gray-800 mb-2">{title}</DialogTitle>
            <DialogDescription className="text-gray-600 mb-6">{description}</DialogDescription>

            <Link
              to={ctaHref}
              className="inline-block bg-gray-700 hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-lg transition"
            >
              {ctaLabel}
            </Link>
          </motion.div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureDisabledModal;
