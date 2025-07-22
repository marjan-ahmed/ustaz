import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-100 p-4">
      {/* Electrician-themed Illustration/Icon */}
      <div className="relative mb-8">
        {/* Placeholder for your SVG icon or illustration */}
        {/* You can replace this with an actual SVG of a broken wire,
            a disconnected plug, or a stylized "404" made of wires. */}
        <svg
          className="w-32 h-32 md:w-48 md:h-48 text-[#db4b0d] animate-bounce-slow"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          ></path>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M9 10h.01M9 14h.01M15 10h.01M15 14h.01M12 6V3M12 21v-3"
          ></path>
          {/* This is a generic "broken circuit" icon.
              Consider a more specific, detailed illustration. */}
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-6xl md:text-8xl font-bold opacity-20">
          404
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-5xl md:text-7xl font-extrabold text-[#db4b0d] mb-4 text-center">
        404 - Page Not Found
      </h1>

      {/* Subheading */}
      <p className="text-xl md:text-2xl text-gray-300 mb-8 text-center max-w-lg">
        Looks like you’ve tripped a wire — this page doesn’t exist.
      </p>

      {/* Homepage Button */}
      <Link href="/">
        <button className="px-8 py-3 bg-[#db4b0d] text-white font-semibold rounded-lg shadow-lg hover:bg-[#c2400b] transition duration-300 ease-in-out transform hover:scale-105">
          Go Back to Homepage
        </button>
      </Link>
    </div>
  );
}