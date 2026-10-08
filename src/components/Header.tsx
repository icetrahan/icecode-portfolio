"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Navigation links
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Projects", path: "/#work" },
    { name: "Skills", path: "/#skills" },
    { name: "About", path: "/#about" },
    { name: "Contact", path: "/#contact" },
  ];

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-gray-900/90 backdrop-blur-md shadow-md" 
          : "bg-gray-900"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-ice-blue font-bold text-xl flex items-center">
            <span className="mr-1">ice</span>
            <span className="text-gray-300">.</span>
            <span className="ml-1">code</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path}
                aria-current={pathname === link.path ? "page" : undefined}
                className={`transition-colors hover:text-ice-blue ${
                  pathname === link.path ? "text-ice-blue" : "text-gray-300"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <Link href="/#contact" className="hidden lg:inline-flex items-center gap-3 rounded-lg border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300 hover:bg-cyan-300/10">
            Let&apos;s build something <span className="text-ice-blue">↗</span>
          </Link>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-300 hover:text-ice-blue"
            aria-label="Toggle navigation"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  href={link.path}
                  className={`transition-colors px-1 py-2 ${
                    pathname === link.path 
                      ? "text-ice-blue bg-gray-800 rounded" 
                      : "text-gray-300"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
