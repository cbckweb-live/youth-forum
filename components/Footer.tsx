import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-700 mt-auto border-t border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 px-8 py-14">
        <div>
          <h3 className="font-display text-lg mb-4 text-[#231F1E]">
            Our Community
          </h3>
          <p className="text-sm text-gray-500">
            Growing together, rooted in purpose.
          </p>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-wide text-[#6B1F2A] mb-4">
            Contact
          </h4>
          <p className="text-sm text-gray-600">yourcommunity@email.com</p>
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
            Mayang Imphal,
            <br />
            Manipur, India
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 px-8 py-6 flex flex-wrap justify-between gap-4 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Our Community. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/team" className="hover:text-[#6B1F2A]">
            Team
          </Link>
          <Link href="/members" className="hover:text-[#6B1F2A]">
            Members
          </Link>
          <Link href="/gallery" className="hover:text-[#6B1F2A]">
            Gallery
          </Link>
        </div>
      </div>
    </footer>
  );
}
