'use client';

import { MapPin, Users, Tag, Heart } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/header';

export default function AboutPage() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <Header />

      <div className="flex flex-1 items-center justify-center px-6">
        {/* Hero Section */}
        <section className="mx-auto w-full max-w-5xl text-center">
          <h1 className="mb-6 text-5xl font-bold text-gray-900">
            About <span className="text-skolaroid-blue">Skolaroid</span>
          </h1>
          <p className="mb-12 text-xl text-gray-600">
            A location-based memory sharing platform for university campuses.
            Capture, geo-tag, and share meaningful moments tied to specific
            campus buildings.
          </p>

          {/* Features Grid */}
          <div className="mb-12 grid gap-6 md:grid-cols-4">
            <div className="flex flex-col items-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <MapPin className="h-6 w-6 text-skolaroid-blue" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-gray-900">
                Location-Based
              </h3>
              <p className="text-xs text-gray-600">
                Attach photos to campus buildings
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-gray-900">
                Interactive Map
              </h3>
              <p className="text-xs text-gray-600">
                Explore campus with memories
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Tag className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-gray-900">
                Smart Tagging
              </h3>
              <p className="text-xs text-gray-600">
                Organize and discover moments
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pink-100">
                <Users className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-gray-900">
                Community
              </h3>
              <p className="text-xs text-gray-600">
                Connect through shared experiences
              </p>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/"
            className="inline-block rounded-lg bg-skolaroid-blue px-8 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
          >
            Get Started
          </Link>
        </section>
      </div>

      {/* Footer */}
      <footer className="py-6">
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <Heart className="h-4 w-4 text-red-500" />
          <span>Made with love for campus communities</span>
          <span>•</span>
          <a
            href="https://github.com/kiloumanjaro/Skolaroid"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-skolaroid-blue"
          >
            GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
