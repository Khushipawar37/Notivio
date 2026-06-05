"use client";

import type React from "react";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Mail,
  Phone,
  Send,
  Twitter,
  Instagram,
  Linkedin,
  CheckCircle,
} from "lucide-react";

export default function ContactPage() {
  const [formStatus, setFormStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("submitting");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormStatus("success");
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
        // Reset form after 3 seconds
        setTimeout(() => {
          setFormStatus("idle");
        }, 3000);
      } else {
        setFormStatus("error");
        setTimeout(() => {
          setFormStatus("idle");
        }, 3000);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormStatus("error");
      setTimeout(() => {
        setFormStatus("idle");
      }, 3000);
    }
  };

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <section id="contact" className="bg-[#f5f0e8] px-4 py-16 sm:py-24">
      <div className="mx-auto mb-10 max-w-4xl text-center text-4xl font-bold leading-tight sm:mb-18 sm:text-6xl">
        We’re Just One <span className="text-[#8a7559]">Message</span> Away
      </div>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="flex flex-col overflow-hidden rounded-2xl shadow-2xl md:flex-row">
            {/* Left side - Contact Info */}
            <div className="relative w-full overflow-hidden bg-[#c6ac8f] p-6 sm:p-8 md:w-2/5 md:p-12">
              <div className="relative z-10">
                <h2 className="mb-6 text-2xl font-bold text-black sm:mb-8 sm:text-3xl">
                  Contact Us
                </h2>

                <div className="mb-10 sm:mb-12">
                  <div className="mb-6 flex items-start">
                    <div className="mr-3 rounded-full bg-black/10 p-2 sm:mr-4">
                      <MapPin className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h4 className="font-medium text-black">Our Location</h4>
                      <p className="text-black/70 mt-1">India</p>
                    </div>
                  </div>

                  <div className="mb-6 flex items-start">
                    <div className="mr-3 rounded-full bg-black/10 p-2 sm:mr-4">
                      <Mail className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h4 className="font-medium text-black">Email Address</h4>
                      <p className="mt-1 break-all text-black/70">
                        khushipawar987@gmail.com
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="mr-3 rounded-full bg-black/10 p-2 sm:mr-4">
                      <Phone className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h4 className="font-medium text-black">Phone Number</h4>
                      <p className="text-black/70 mt-1">+91 9355765466</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-black mb-4">Follow Us</h4>
                  <div className="flex space-x-3">
                    {socialLinks.map((social, index) => {
                      const Icon = social.icon;
                      return (
                        <motion.a
                          key={index}
                          href={social.href}
                          className="p-2 bg-black/10 rounded-full text-black hover:bg-black/20 transition-colors"
                          whileHover={{ y: -3 }}
                          aria-label={social.label}
                        >
                          <Icon className="w-5 h-5" />
                        </motion.a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Contact Form */}
            <div className="w-full bg-white p-6 sm:p-8 md:w-3/5 md:p-12">
              <div className="mb-6 flex items-center sm:mb-8">
                <h2 className="text-2xl font-bold text-black sm:text-3xl">Get in Touch</h2>
              </div>

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c6ac8f] focus:border-transparent"
                      placeholder="Khushi Pawar"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c6ac8f] focus:border-transparent"
                      placeholder="khushi@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c6ac8f] focus:border-transparent"
                    placeholder="How can we help you?"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c6ac8f] focus:border-transparent resize-none"
                    placeholder="Your message here..."
                  ></textarea>
                </div>

                <div>
                  <motion.button
                    type="submit"
                    disabled={formStatus === "submitting"}
                    className={`w-full md:w-auto px-8 py-3 rounded-lg font-medium text-white flex items-center justify-center ${
                      formStatus === "submitting"
                        ? "bg-gray-400"
                        : "bg-[#c6ac8f] hover:bg-[#b39a7d]"
                    } transition-colors`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {formStatus === "submitting" ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending...
                      </>
                    ) : formStatus === "success" ? (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Sent Successfully
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Send Message
                      </>
                    )}
                  </motion.button>
                </div>

                {formStatus === "error" && (
                  <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                    Something went wrong. Please try again later.
                  </div>
                )}
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
