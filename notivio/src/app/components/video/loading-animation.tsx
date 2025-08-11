"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingAnimationProps {
  stage: number;
  totalStages: number;
  stageNames: string[];
}

export function LoadingAnimation({
  stage,
  totalStages,
  stageNames,
}: LoadingAnimationProps) {
  return (   
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-6 bg-[#f5f0e8] rounded-lg p-4 border border-[#c6ac8f]/30"
    >
      <div className="flex flex-col space-y-4">   
        <div className="flex justify-between items-center">
          <h3 className="text-[#8a7559] font-medium flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing your video
          </h3>
          <div className="text-sm text-gray-500">
            Stage {stage + 1}/{totalStages}  
          </div>
        </div>

        <div className="w-full bg-white rounded-full h-2.5">
          <motion.div
            className="bg-[#8a7559] h-2.5 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${((stage + 1) / totalStages) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="text-sm text-gray-700">{stageNames[stage]}...</div>
      </div>
    </motion.div>
  );
}
