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
          <p className="text-sm text-gray-600">cbckyouthministry@email.com</p>
          <p className="text-sm text-gray-600">+91 00000 00000</p>
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
        </div>
      </div>

      <div className="border-t border-gray-200 px-8 py-6 flex flex-wrap justify-between gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex gap-4">
            <p className="sr-only">Social links</p>

            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-gray-500 hover:text-[#6B1F2A] transition-colors"
            >
              <FaceSmileIcon className="h-5 w-5" aria-hidden="true" />
            </a>

            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-gray-500 hover:text-[#6B1F2A] transition-colors"
            >
              <HashtagIcon className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href={SOCIAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="text-gray-500 hover:text-[#6B1F2A] transition-colors"
            >
              <CubeIcon className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>

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
