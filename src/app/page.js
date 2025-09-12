"use client";

import { TopicUploader } from '../components/TopicUploader';
import { Search } from '../components/Search';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <MotionDiv 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <MotionDiv 
          variants={item}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            AI Teaching Platform
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Upload your topic or search for anything to learn
          </p>
        </MotionDiv>

        <MotionDiv variants={item} className="mt-10">
          <Search />
        </MotionDiv>

        <MotionDiv variants={item} className="mt-16">
          <TopicUploader />
        </MotionDiv>

        <MotionDiv 
          variants={item}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Feature boxes */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Smart Analysis</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our AI analyzes your topic and creates personalized lesson plans
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Visual Learning</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Enhance understanding with relevant images and videos
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Interactive Content</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Engage with interactive elements and quizzes
            </p>
          </div>
        </MotionDiv>
      </MotionDiv>
    </div>
  );
}
