'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to IdeaPlate",
      subtitle: "Post Your Million-Dollar Ideas (So We Can Steal Them)",
      description: "Got a genius idea but zero motivation to build it? Dump it here and let the internet do its thing. Post your wildest, weirdest, or most 'definitely-will-make-me-rich' ideas. Who knows, maybe someone will actually build it (or just steal it).",
      features: [
        "Post your ideas and watch them get 'borrowed' by strangers",
        "Browse a goldmine of unprotected intellectual property",
        "Roast, hype, or shamelessly copy other people's ideas",
        "No NDAs. No gatekeeping. Just pure, unfiltered idea chaos"
      ],
      image: "/ip-logo.png"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Image
              src="/ip-logo.png"
              alt="IdeaPlate Logo"
              width={120}
              height={120}
              className="mx-auto mb-6"
            />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {steps[currentStep].title}
            </h1>
            <p className="text-xl md:text-2xl text-blue-600 font-medium mb-6">
              {steps[currentStep].subtitle}
            </p>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              {steps[currentStep].description}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-3xl mx-auto">
            {steps[currentStep].features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-gray-500">
          Join thousands of creators sharing and discovering amazing ideas
        </p>
      </footer>
    </div>
  );
} 