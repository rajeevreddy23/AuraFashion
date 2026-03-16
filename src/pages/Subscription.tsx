import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { SUBSCRIPTION_PLANS } from '../constants';
import { Check, CreditCard, Sparkles, Clock, Zap } from 'lucide-react';
import { UserData } from '../types';

export default function SubscriptionPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (snap.exists()) {
            setUserData(snap.data() as UserData);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  const buyPlan = async (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    if (!auth.currentUser) {
      alert('Please login to subscribe to a plan.');
      return;
    }
    if (!userData) return;
    
    const newTryons = (userData.subscription?.tryonsRemaining || 0) + plan.tryons;
    const newExpiry = new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000).toISOString();

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        'subscription.plan': plan.id,
        'subscription.tryonsRemaining': newTryons,
        'subscription.expiresAt': newExpiry
      });
      alert(`Successfully subscribed to ${plan.name}!`);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Current Status */}
      <section className="bg-black text-white rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tighter uppercase">Your Aura Status</h2>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 flex items-center gap-4">
                <Zap className="text-yellow-400" size={24} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">TryOns Left</p>
                  <p className="text-2xl font-black">{userData?.subscription?.tryonsRemaining || 0}</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 flex items-center gap-4">
                <Clock className="text-blue-400" size={24} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Plan Expiry</p>
                  <p className="text-lg font-bold">
                    {userData?.subscription?.expiresAt 
                      ? new Date(userData.subscription.expiresAt).toLocaleDateString() 
                      : 'No active plan'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <Sparkles size={120} className="text-white/10" />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl -mr-32 -mt-32" />
      </section>

      {/* Plans */}
      <section className="space-y-8">
        <div className="text-center">
          <h3 className="text-3xl font-black uppercase tracking-tighter">Choose Your Plan</h3>
          <p className="text-gray-500 font-medium">Unlock more virtual try-ons and premium features.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -10 }}
              className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-black transition-all"
            >
              <div className="space-y-6">
                <div className="space-y-1">
                  <h4 className="text-lg font-black uppercase tracking-tighter">{plan.name}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">₹{plan.price}</span>
                    <span className="text-gray-400 text-xs font-bold uppercase">/ {plan.duration} Day</span>
                  </div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Check size={16} className="text-green-500" /> {plan.tryons} AI Try-Ons
                  </li>
                  <li className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Check size={16} className="text-green-500" /> High Quality Output
                  </li>
                  <li className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Check size={16} className="text-green-500" /> Save to History
                  </li>
                </ul>
              </div>
              <button
                onClick={() => buyPlan(plan)}
                className="mt-8 w-full bg-gray-100 text-black py-4 rounded-xl font-bold uppercase tracking-widest text-xs group-hover:bg-black group-hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <CreditCard size={16} /> Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
