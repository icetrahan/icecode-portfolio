import React from 'react';
import Link from "next/link";
import DiscordCopy from "@/components/DiscordCopy";
import { CONTACT_EMAIL, socials } from "@/data/socials";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-8 md:mb-0">
            {/* Logo */}
            <Link href="/" className="text-ice-blue font-bold text-xl flex items-center">
              <span className="mr-1">ice</span>
              <span className="text-gray-300">.</span>
              <span className="ml-1">code</span>
            </Link>
            <p className="text-gray-400 mt-2 text-sm">
              Dev by trade. Dreamer by nature.
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-8 md:gap-12">
            <div>
              <h3 className="text-sm font-bold uppercase text-gray-300 mb-4">Navigation</h3>
              <ul className="space-y-2">
                {["Home", "Projects", "Skills", "About", "Contact"].map((page) => (
                  <li key={page}>
                    <Link 
                      href={page === "Home" ? "/" : `/${page.toLowerCase()}`} 
                      className="text-gray-400 hover:text-ice-blue transition-colors"
                    >
                      {page}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-bold uppercase text-gray-300 mb-4">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href={socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-ice-blue transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href={socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-ice-blue transition-colors"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <DiscordCopy variant="link" />
                </li>
                <li>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-gray-400 hover:text-ice-blue transition-colors"
                  >
                    Email
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center md:flex md:justify-between md:text-left">
          <p className="text-gray-500 text-sm">
            &copy; {currentYear} ice.code. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2 md:mt-0">
            Built with Next.js and Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
}