import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Ticket, ArrowRight, Check, Users, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="pt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            AI-Powered Customer Support
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
          >
            Get instant answers with our intelligent chatbot. When more help is needed, we'll create a support ticket to connect you with our team.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              to={isAuthenticated ? "/chat" : "/register"}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              {isAuthenticated ? "Start Chatting" : "Get Started"} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="px-6 py-3 bg-white text-blue-500 border border-blue-200 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Log In
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our intelligent support system combines AI and human expertise to provide the best possible assistance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-blue-50 rounded-xl p-6 text-center"
            >
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chat with AI</h3>
              <p className="text-gray-600">
                Start by asking our AI assistant any question. Get immediate answers for common inquiries.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-green-50 rounded-xl p-6 text-center"
            >
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Automatic Escalation</h3>
              <p className="text-gray-600">
                If the AI can't resolve your issue, it automatically creates a support ticket for human assistance.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-purple-50 rounded-xl p-6 text-center"
            >
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Support</h3>
              <p className="text-gray-600">
                Our support team reviews your ticket and provides expert assistance to resolve complex issues.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powered By Modern Technology</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built with the MERN stack and GPT-4 for advanced natural language understanding.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <TechItem 
              title="MongoDB" 
              icon={<DatabaseIcon className="h-8 w-8 text-green-500" />} 
              description="NoSQL database for flexible data storage" 
            />
            <TechItem 
              title="Express.js" 
              icon={<ServerIcon className="h-8 w-8 text-gray-700" />} 
              description="Backend web application framework" 
            />
            <TechItem 
              title="React" 
              icon={<ReactIcon className="h-8 w-8 text-blue-400" />} 
              description="Frontend user interface library" 
            />
            <TechItem 
              title="Node.js" 
              icon={<ServerIcon className="h-8 w-8 text-green-600" />} 
              description="JavaScript runtime environment" 
            />
            <TechItem 
              title="GPT-4" 
              icon={<BrainIcon className="h-8 w-8 text-purple-500" />} 
              description="Advanced AI language model" 
            />
            <TechItem 
              title="Socket.io" 
              icon={<BoltIcon className="h-8 w-8 text-yellow-500" />} 
              description="Real-time bidirectional communication" 
            />
            <TechItem 
              title="JWT" 
              icon={<KeyIcon className="h-8 w-8 text-blue-500" />} 
              description="Secure authentication system" 
            />
            <TechItem 
              title="Tailwind CSS" 
              icon={<PaintbrushIcon className="h-8 w-8 text-teal-500" />} 
              description="Utility-first CSS framework" 
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-500 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to experience better support?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-3xl mx-auto">
            Join us today and see how our AI-powered support system can help you get answers faster and resolve issues more efficiently.
          </p>
          <Link
            to={isAuthenticated ? "/chat" : "/register"}
            className="inline-block px-6 py-3 bg-white text-blue-500 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            {isAuthenticated ? "Start Chatting Now" : "Sign Up For Free"}
          </Link>
        </div>
      </section>
    </div>
  );
};

// Tech Item Component
const TechItem: React.FC<{ title: string; icon: React.ReactNode; description: string }> = ({ 
  title, 
  icon, 
  description 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    viewport={{ once: true }}
    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex flex-col items-center text-center">
      <div className="mb-3">{icon}</div>
      <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </motion.div>
);

// Custom Icons
const ServerIcon = Server;
const DatabaseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2C6.5 2 2 3.8 2 6v12c0 2.2 4.5 4 10 4s10-1.8 10-4V6c0-2.2-4.5-4-10-4z"/>
    <path d="M2 6v4c0 2.2 4.5 4 10 4s10-1.8 10-4V6"/>
    <path d="M2 14v4c0 2.2 4.5 4 10 4s10-1.8 10-4v-4"/>
  </svg>
);

const ReactIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="2"/>
    <path d="M12 6a9.77 9.77 0 0 0-8.82 5.5C3.83 13.75 7.53 16 12 16s8.17-2.25 8.82-4.5A9.77 9.77 0 0 0 12 6z"/>
    <path d="M12 18c-4.47 0-8.17-2.25-8.82-4.5S7.53 8 12 8s8.17 2.25 8.82 4.5S16.47 18 12 18z"/>
  </svg>
);

const BrainIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 4.5 17v-2.5a2.5 2.5 0 0 1 0-5V7a2.5 2.5 0 0 1 5-5Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 19.5 17v-2.5a2.5 2.5 0 0 0 0-5V7a2.5 2.5 0 0 0-5-5Z"/>
  </svg>
);

const BoltIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

const KeyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const PaintbrushIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 9c0 1.5-1.5 3-3 3s-3-1.5-3-3 1.5-3 3-3 3 1.5 3 3z"/>
    <path d="M13 12.2l-8.7 8.7A2 2 0 0 1 3 20.4L5.6 22a2 2 0 0 1 .5-1.3L15 12"/>
  </svg>
);

export default Home;