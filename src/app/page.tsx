import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <section className="py-20 h-screen mt-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-10">
          {/* Left Content */}
          <div className="flex-1">
            <h1 className="font-heading text-4xl md:text-6xl mb-6">
              Fix it with Ustaz
            </h1>
            <p className="font-sans text-lg md:text-xl mb-8 max-w-lg">
              Book trusted service providers near you for home repairs, cleaning, plumbing, and more. Fast, reliable, and hassle-free with Ustaz.
            </p>
            <button className="bg-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-purple-100 transition">
              Find the provider
            </button>
          </div>

          {/* Right Image */}
          <div className="flex-1">
          <div className="max-w-md mx-auto p-4 space-y-4">

      {/* Service Type Dropdown */}
      <div className="bg-gray-100 rounded-lg p-4">
        <Select>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select service (Electrician, Plumber, Carpenter)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="electrician">Electrician</SelectItem>
            <SelectItem value="plumber">Plumber</SelectItem>
            <SelectItem value="carpenter">Carpenter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dropoff Location */}
      <div className="flex items-center bg-gray-100 rounded-lg p-4">
        <span className="mr-2 w-2 h-2 bg-black"></span>
        <input
          type="text"
          placeholder="Dropoff location"
          className="flex-grow bg-transparent outline-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-4">
        <button className="bg-black text-white font-bold px-6 py-3 rounded-lg">
          See prices
        </button>
      </div>
    </div>
    </div>
        </div>
      </section>
    </>
  );
}
