import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { User, Mail, Shield, CreditCard, Send, CheckCircle, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sentStatus, setSentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [messages, setMessages] = useState<any[]>([]);
  const navigate = useNavigate();

  const user = auth.currentUser;

  const isAdmin = user?.email === 'rajeevreddyakepati@gmail.com' || userData?.role === 'admin';

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchMessages();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'supportMessages'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !contactForm.subject || !contactForm.message) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'supportMessages'), {
        userId: user.uid,
        email: user.email,
        subject: contactForm.subject,
        message: contactForm.message,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setSentStatus('success');
      setContactForm({ subject: '', message: '' });
      fetchMessages();
      setTimeout(() => setSentStatus('idle'), 5000);
    } catch (err) {
      console.error("Error sending message:", err);
      setSentStatus('error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Profile Header */}
      <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <img 
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email}`} 
            className="w-32 h-32 rounded-full border-4 border-gray-50 shadow-inner" 
            alt="Profile" 
          />
          <div className="absolute bottom-1 right-1 bg-emerald-500 p-2 rounded-full border-4 border-white">
            <Shield size={16} className="text-white" />
          </div>
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="text-3xl font-black tracking-tighter">{user?.displayName || 'Fashion Enthusiast'}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-1.5"><Mail size={14} /> {user?.email}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> Joined {new Date(userData?.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-3">
            <span className="bg-black text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              {userData?.subscription?.plan} Plan
            </span>
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <Shield size={10} /> Admin Dashboard
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Subscription Details */}
        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
            <CreditCard size={20} /> Subscription
          </h3>
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Current Plan</span>
              <span className="text-lg font-black capitalize">{userData?.subscription?.plan}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Try-Ons Left</span>
              <span className="text-lg font-black">{userData?.subscription?.tryonsRemaining}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Expires</span>
              <span className="text-sm font-bold">{new Date(userData?.subscription?.expiresAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all">
            Manage Subscription
          </button>
        </section>

        {/* Contact Support */}
        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
            <MessageSquare size={20} /> Contact Support
          </h3>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Subject</label>
              <input 
                type="text" 
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                placeholder="How can we help?"
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-black outline-none transition-all text-sm font-medium"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Message</label>
              <textarea 
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                placeholder="Tell us more details..."
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-black outline-none transition-all text-sm font-medium h-32 resize-none"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={sending}
              className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} /> Send Message
                </>
              )}
            </button>
          </form>

          <AnimatePresence>
            {sentStatus === 'success' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600"
              >
                <CheckCircle size={20} />
                <span className="text-sm font-bold">Message sent successfully! We'll get back to you soon.</span>
              </motion.div>
            )}
            {sentStatus === 'error' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600"
              >
                <AlertCircle size={20} />
                <span className="text-sm font-bold">Failed to send message. Please try again.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* Message History */}
      {messages.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2 px-4">
            <Clock size={20} /> Message History
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-black text-lg">{msg.subject}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                    msg.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                    msg.status === 'replied' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {msg.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">{msg.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
