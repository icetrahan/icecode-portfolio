import DiscordCopy from "@/components/DiscordCopy";
import ContactForm from "@/components/ContactForm";
import { CONTACT_EMAIL, socials } from "@/data/socials";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold">Contact Me</h1>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Have a project in mind or want to talk shop? Send it here and it lands straight in my inbox.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Contact Info */}
          <div className="w-full md:w-1/3">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-bold mb-6 text-ice-blue">Connect With Me</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm uppercase text-gray-400 mb-2">Email</h3>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ice-blue transition-colors">{CONTACT_EMAIL}</a>
                </div>

                <div>
                  <h3 className="text-sm uppercase text-gray-400 mb-2">LinkedIn</h3>
                  <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-ice-blue transition-colors">
                    Caleb Trahan ↗
                  </a>
                </div>

                <div>
                  <h3 className="text-sm uppercase text-gray-400 mb-2">GitHub</h3>
                  <a href={socials.github} target="_blank" rel="noopener noreferrer" className="hover:text-ice-blue transition-colors">
                    icetrahan ↗
                  </a>
                </div>

                <div>
                  <h3 className="text-sm uppercase text-gray-400 mb-2">Discord</h3>
                  <p className="text-gray-300">
                    <DiscordCopy variant="inline" />
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Add me as a friend</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-700">
                <h3 className="text-sm uppercase text-gray-400 mb-4">Response Time</h3>
                <p className="text-sm text-gray-300">I usually answer within a day or two.</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="w-full md:w-2/3">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-bold mb-6 text-ice-blue">Send a Message</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
