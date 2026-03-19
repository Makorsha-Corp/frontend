import NavigationBar from "@/components/customui/NavigationBar";
import { motion } from "framer-motion";
import { XCircle } from "lucide-react";

const DisabledPage = () => {
  return (
    <>
      <NavigationBar />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-xl p-8 rounded-2xl max-w-md text-center border border-gray-200"
        >
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
              }}
              className="p-3 rounded-full bg-gray-100 shadow-md shadow-gray-400"
            >
              <XCircle className="text-gray-600 w-10 h-10" />
            </motion.div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Feature Disabled
          </h1>
          <p className="text-gray-600 mb-6">
            This feature is currently disabled by the administrator.
          </p>
          <a
            href="/"
            className="inline-block bg-gray-700 hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            Go to Home
          </a>
        </motion.div>
      </div>
    </>
  );
};

export default DisabledPage;
