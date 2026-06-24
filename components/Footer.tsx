import Link from "next/link";
import {
  FaceSmileIcon,
  HashtagIcon,
  CubeIcon,
} from "@heroicons/react/24/solid";

const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/cbck.youthforum",
  facebook: "https://www.facebook.com/groups/CBCKYouthForum/?mibextid=NSMWBT",
  youtube: "https://www.youtube.com/@cbckyouthministry8815",
} as const;

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-700 mt-auto border-t border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 px-8 py-14">
        <div>
          <img src="/logo.png" alt="Youth Forum" className="h-12 w-auto mb-4" />
          <h3 className="font-display text-lg mb-4 text-[#231F1E]">
            Chakhesang Baptist Church, Youth Ministry
          </h3>
          <p className="text-sm text-gray-500">
            Growing together, rooted in purpose.
          </p>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-wide text-[#6B1F2A] mb-4">
            Contact
          </h4>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                cbckyouthministry@email.com
              </p>
              <p className="text-sm text-gray-600">+91 00000 00000</p>
            </div>
          </div>

          <div className="mt-4 flex gap-4" aria-label="Social media">
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-gray-500 hover:text-[#6B1F2A] transition-colors"
            >
              {/* Facebook (official-style) */}
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8"
                aria-hidden="true"
                fill="currentColor"
              >
                <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-3h2.5V9.8C10.5 7.7 11.7 6.5 13.8 6.5c1 0 2 .2 2 .2v2.3h-1.1c-1.1 0-1.4.7-1.4 1.4V12H17l-.4 3h-2.3v7A10 10 0 0 0 22 12z" />
              </svg>
            </a>

            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-gray-500 hover:text-[#6B1F2A] transition-colors"
            >
              {/* Instagram */}
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8"
                aria-hidden="true"
                fill="currentColor"
              >
                <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3h10zm-5 4.8A3.2 3.2 0 1 0 14.2 12 3.2 3.2 0 0 0 12 8.8zm0 5.2A2 2 0 1 1 14 12a2 2 0 0 1-2 2zm4.6-6.1a1 1 0 1 0-1-1 1 1 0 0 0 1 1z" />
              </svg>
            </a>

            <a
              href={SOCIAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="text-gray-500 hover:text-[#6B1F2A] transition-colors"
            >
              {/* YouTube */}
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8"
                aria-hidden="true"
                fill="currentColor"
              >
                <path d="M10 15l5.2-3L10 9v6zm12-3c0-2.7-.3-4-1-5.4-.5-.9-1.3-1.7-2.2-2.2C17.4 3.3 16.1 3 13.4 3h-3.9C6.8 3 5.5 3.3 4.8 3.9c-.9.5-1.7 1.3-2.2 2.2C2 7.5 2 8.8 2 11.5v1c0 2.7 0 4  .6 5.4.5.9 1.3 1.7 2.2 2.2.7.6 2 .9 4.7.9h3.9c2.7 0 4-.3 4.7-.9.9-.5 1.7-1.3 2.2-2.2.6-1.4 1-2.7 1-5.4v-1z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-wide text-[#6B1F2A] mb-4">
            Events
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <Link href="/events" className="hover:text-[#6B1F2A]">
                Upcoming Events
              </Link>
            </li>
            <li>
              <Link href="/events" className="hover:text-[#6B1F2A]">
                Past Events
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-wide text-[#6B1F2A] mb-4">
            Address
          </h4>
          <p className="text-sm text-gray-600">
            Kitsubozou Colony, Kohima
            <br />
            Nagaland, India
          </p>

          <a
            href="https://www.google.com/maps?q=M4F6+XG5"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#6B1F2A] hover:underline"
            aria-label="Open Google Map location"
          >
            <span aria-hidden="true">📍</span>
            View on Google Maps
          </a>
        </div>
      </div>

      <div className="border-t border-gray-200 px-8 py-6 flex flex-wrap justify-between gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex gap-6">
            <Link href="/office-bearers" className="hover:text-[#6B1F2A]">
              Office Bearers
            </Link>
            <Link href="/mathetes" className="hover:text-[#6B1F2A]">
              Mathetes
            </Link>
            <Link href="/gallery" className="hover:text-[#6B1F2A]">
              Gallery
            </Link>
            <Link href="/developers" className="hover:text-[#6B1F2A]">
              Developers
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
