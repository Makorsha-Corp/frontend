import NavigationBar from "@/components/customui/NavigationBar";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

const UnauthorizedPage = () => {
  return (
    <>
      <NavigationBar />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-xl p-8 rounded-2xl max-w-md text-center border border-red-100"
        >
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
              }}
              className="p-3 rounded-full bg-red-100 shadow-lg shadow-red-400"
            >
              <AlertTriangle className="text-red-500 w-10 h-10" />
            </motion.div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            Sorry, you don’t have permission to view this page.
          </p>
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block bg-red-500 text-white font-semibold px-6 py-2 rounded-lg shadow-red-400 shadow-md hover:bg-red-600 transition relative"
          >
            Go to Home
          </motion.a>
        </motion.div>
      </div>
    </>
  );
};

export default UnauthorizedPage;
