import Link from "next/link";
import Image from "next/image";

const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/cbck.youthforum",
  facebook: "https://www.facebook.com/groups/CBCKYouthForum/?mibextid=NSMWBT",
  youtube: "https://www.youtube.com/@cbckyouthministry8815",
} as const;

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-700 mt-auto border-t border-gray-200">
      {/* Kept your original grid settings but widened the horizontal gap safely */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-x-10 gap-y-10 px-8 pt-6 pb-2">
        
        {/* 
          Section 1: Logo & Name 
          Added a widescreen display override so the long church text expands naturally 
          without being aggressively choked by its neighbor.
        */}
        <div className="md:min-w-[240px] flex flex-col items-center text-center">
          <div className="relative h-12 w-32 mb-4">
            <Image src="/logo.png" alt="Youth Forum" fill style={{ objectFit: "contain" }} />
          </div>
          <h3 className="font-display text-lg mb-4 text-[#231F1E] leading-snug">
            Chakhesang Baptist Church Youth Ministry
          </h3>
        </div>

        {/* Section 2: Contact */}
        <div className="md:pl-12">
          <h4 className="text-sm uppercase tracking-wide text-[#6B1F2A] mb-4">
            Contact
          </h4>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                cbckyouthministry&#64;gmail.com
              </p>
              <p className="text-sm text-gray-600">+91 8974494949</p>
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
              <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true" fill="currentColor">
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
              <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true" fill="currentColor">
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
              <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true" fill="currentColor">
                <path d="M23.5 6.2a3.1 3.1 0 0 0-2.2-2.2C19.4 3.5 12 3.5 12 3.5s-7.4 0-9.3.5A3.1 3.1 0 0 0 .5 6.2 32.6 32.6 0 0 0 0 12a32.6 32.6 0 0 0 .5 5.8 3.1 3.1 0 0 0 2.2 2.2c1.9.5 9.3.5 9.3.5s7.4 0 9.3-.5a3.1 3.1 0 0 0 2.2-2.2A32.6 32.6 0 0 0 24 12a32.6 32.6 0 0 0-.5-5.8ZM9.6 15.4V8.6L15.6 12l-6 3.4Z" />
              </svg>
            </a>
          </div>
        </div>

        {/* 
          Section 3: Events 
          Added `md:pl-12` to visually nudge the content space to the right,
          closing the gap significantly between itself and the Address section.
        */}
        <div className="md:pl-12">
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

        {/* Section 4: Address */}
        <div>
          <h4 className="text-sm uppercase tracking-wide text-[#6B1F2A] mb-4">
            Address
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            Chakhesang Baptist Church, Kitsubozou Colony, Kohima
            <br />
            Nagaland, India
            <br />
            797001
          </p>
        </div>

        {/* Section 5: Map */}
        <div>
          <iframe
            title="CBCK Youth Forum location map"
            className="mt-4 h-32 w-full rounded-lg border border-gray-200"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3595.891652834068!2d94.10877407415414!3d25.674886112189345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3746210abc33ddf3%3A0x366e970c18b6490e!2sChakhesang%20Baptist%20Church!5e0!3m2!1sen!2sus!4v1782318995927!5m2!1sen!2sus"
          ></iframe>
        </div>
      </div>

      {/* Original Bottom Sub-Footer Links Bar */}
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