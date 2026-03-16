import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MEN_PRODUCTS, WOMEN_PRODUCTS } from '../constants';
import { Star, ShoppingCart, Sparkles } from 'lucide-react';

const MEN_CATEGORIES = ['all', 'shirts', 'tshirts', 'pants', 'blazzers', 'watches', 'shoes'];
const WOMEN_CATEGORIES = ['all', 'saries', 'pants', 'shirts', 'lehangas', 'punjabhi dress'];

export default function ShoppingPage() {
  const { gender = 'men' } = useParams<{ gender: 'men' | 'women' }>();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');

  const products = gender === 'men' ? MEN_PRODUCTS : WOMEN_PRODUCTS;
  const categories = gender === 'men' ? MEN_CATEGORIES : WOMEN_CATEGORIES;

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">
            {gender === 'men' ? "Men's Collection" : "Women's Collection"}
          </h2>
          <p className="text-gray-500 font-medium">Discover the perfect fit for your aura.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => navigate('/shopping/men')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${gender === 'men' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
          >
            Men
          </button>
          <button
            onClick={() => navigate('/shopping/women')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${gender === 'women' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
          >
            Women
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
              activeCategory === cat 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -8 }}
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <img 
                src={product.image} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt={product.name}
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-colors">
                  <ShoppingCart size={18} className="text-black" />
                </button>
                <button className="p-3 bg-black/80 backdrop-blur-md rounded-full shadow-lg hover:bg-black transition-colors">
                  <Sparkles size={18} className="text-white" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 px-3 py-1 bg-white/80 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                <Star size={10} className="fill-yellow-400 text-yellow-400" />
                {product.rating}
              </div>
            </div>
            <div className="p-6 space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.category}</p>
              <h3 className="text-lg font-bold text-black leading-tight">{product.name}</h3>
              <p className="text-xl font-black text-black">₹{product.price.toLocaleString()}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
