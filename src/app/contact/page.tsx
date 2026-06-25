"use client";
import { useState } from "react";
import DiscordCopy from "@/components/DiscordCopy";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      formData.subject || `Portfolio message from ${formData.name}`
    );
    const body = encodeURIComponent(
      `${formData.message}\n\n— ${formData.name} (${formData.email})`
    );
    window.location.href = `mailto:trahantech@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold">Contact Me</h1>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Have a project in mind or want to chat about code? Drop me a message and I'll get back to you soon.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Contact Info */}
          <div className="w-full md:w-1/3">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-bold mb-6 text-ice-blue">Connect With Me</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm uppercase text-gray-400 mb-2">Discord</h3>
                  <p className="text-gray-300">
                    <DiscordCopy variant="inline" />
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Add me as a friend</p>
                </div>
                
                <div>
                  <h3 className="text-sm uppercase text-gray-400 mb-2">Email</h3>
                  <p className="flex items-center gap-2">
                    <span className="text-ice-blue">@</span>
                    <span>trahantech@gmail.com</span>
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm uppercase text-gray-400 mb-2">GitHub</h3>
                  <p className="flex items-center gap-2">
                    <span className="text-ice-blue">@</span>
                    <a href="https://github.com/icetrahan" className="hover:text-ice-blue transition-colors">
                      icetrahan
                    </a>
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-700">
                <h3 className="text-sm uppercase text-gray-400 mb-4">Response Time</h3>
                <p className="text-sm text-gray-300">
                  I typically respond to messages within 24-48 hours during business days.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="w-full md:w-2/3">
            <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-bold mb-6 text-ice-blue">Send a Message</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-ice-blue transition-colors"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-ice-blue transition-colors"
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm text-gray-400 mb-1">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-ice-blue transition-colors"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm text-gray-400 mb-1">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-ice-blue transition-colors resize-none"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full bg-ice-blue text-gray-900 font-bold rounded-lg px-4 py-3 hover:bg-ice-blue/80 transition-all duration-300"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}