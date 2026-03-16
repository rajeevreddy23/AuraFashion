import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Home, ShoppingBag, User as UserIcon, Palette, CreditCard, ShoppingCart, LogIn, Menu, X, Shirt, UserCircle, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserData } from './types';

// Pages
import HomePage from './pages/Home';
import ShoppingPage from './pages/Shopping';
import TryOnPage from './pages/TryOn';
import SketchPage from './pages/Sketch';
import SubscriptionPage from './pages/Subscription';
import CartPage from './pages/Cart';
import LoginPage from './pages/Login';
import ProductDetailPage from './pages/ProductDetail';

const Layout: React.FC<{ children: React.ReactNode; user: User | null }> = ({ children, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'shopping', icon: ShoppingBag, label: 'Shop', path: '/shopping' },
    { id: 'tryon', icon: Shirt, label: 'TryOn', path: '/tryon' },
    { id: 'sketch', icon: Palette, label: 'Sketch', path: '/sketch' },
    { id: 'subscription', icon: CreditCard, label: 'Plans', path: '/subscription' },
    { id: 'cart', icon: ShoppingCart, label: 'Cart', path: '/cart' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-2xl font-bold tracking-tighter text-black">AuraFashion</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium -mt-1">Build your Aura with Fashion</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 hidden sm:block">{user.displayName || user.email}</span>
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} className="w-8 h-8 rounded-full border border-gray-200" alt="Profile" />
              </div>
              <button 
                onClick={() => auth.signOut()}
                className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/login', { state: { mode: 'login' } })}
                className="text-sm font-semibold text-gray-600 hover:text-black transition-colors px-2"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                className="flex items-center gap-2 text-sm font-semibold bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                <UserPlus size={16} />
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl px-6 py-3 flex items-center gap-8 z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-black scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              {isActive && (
                <motion.div layoutId="activeNav" className="absolute -bottom-1 w-1 h-1 bg-black rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Ensure user exists in Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              subscription: {
                plan: 'free',
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                tryonsRemaining: 3
              },
              createdAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error("Error syncing user data:", err);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-4"
        >
          <h1 className="text-4xl font-black tracking-tighter">AuraFashion</h1>
          <div className="w-12 h-1 bg-black rounded-full overflow-hidden">
            <motion.div
              animate={{ x: [-48, 48] }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-full h-full bg-gray-300"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <Layout user={user}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/shopping/:gender" element={<ShoppingPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/tryon" element={<TryOnPage />} />
          <Route path="/sketch" element={<SketchPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
