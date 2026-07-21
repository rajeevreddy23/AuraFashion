import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Sparkles, Download, RefreshCw, User, Shirt, Trash2, ArrowLeft } from 'lucide-react';
import { tryOnDress } from '../services/geminiService';

// Fallback public CORS proxy if the direct image fetch fails due to browser CORS policies
const convertToDataURL = async (url: string): Promise<string> => {
  if (url.startsWith('data:')) return url;
  
  // 1. Try fetching directly
  try {
    const res = await fetch(url);
    if (res.ok) {
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn("Direct image fetch failed due to CORS or network. Retrying via local backend proxy...", err);
  }

  // 2. Fallback to our super robust local server-side proxy
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error("Local proxy fetch failed with status " + res.status);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (proxyErr) {
    console.warn("Local backend proxy failed. Trying public corsproxy.io as a last resort...", proxyErr);
    
    // 3. Fallback to public corsproxy.io as a final attempt
    try {
      const publicProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const res = await fetch(publicProxyUrl);
      if (!res.ok) throw new Error("CORS proxy fetch failed with status " + res.status);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (finalErr) {
      console.error("All CORS bypass strategies failed:", finalErr);
      throw new Error("Unable to load the dress image. The image server may be blocking our requests. Please upload an image directly from your local drive.");
    }
  }
};

export default function TryOnPage() {
  const location = useLocation();
  const initialProduct = location.state?.product;
  const initialUserImage = location.state?.userImage; // Passed seamlessly from Sketcher!

  const [userImage, setUserImage] = useState<string | null>(initialUserImage || null);
  const [dressImage, setDressImage] = useState<string | null>(initialProduct?.image || null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if location parameters update
  useEffect(() => {
    if (location.state?.product?.image) {
      setDressImage(location.state.product.image);
    }
    if (location.state?.userImage) {
      setUserImage(location.state.userImage);
    }
  }, [location.state]);

  const onDropUser = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setUserImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const onDropDress = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setDressImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps: getUserProps, getInputProps: getUserInput } = useDropzone({ 
    onDrop: onDropUser, 
    accept: { 'image/*': [] }, 
    multiple: false 
  } as any);
  
  const { getRootProps: getDressProps, getInputProps: getDressInput } = useDropzone({ 
    onDrop: onDropDress, 
    accept: { 'image/*': [] }, 
    multiple: false 
  } as any);

  const handleTryOn = async () => {
    if (!userImage || !dressImage) return;
    setProcessing(true);
    setError(null);
    try {
      // 1. Ensure the dress image is converted to local base64 (resolves CORS issues for gstatic/pinterest URLs!)
      let finalDressImage = dressImage;
      if (dressImage.startsWith('http')) {
        finalDressImage = await convertToDataURL(dressImage);
      }

      // 2. Call the Gemini try-on endpoint
      const result = await tryOnDress(userImage, finalDressImage);
      setResultImage(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Virtual Try-On failed. This can happen with extremely large images or if the dress shape is complex. Please try again with different pictures.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'aura-fashion-tryon.png';
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 px-4 py-2">
      
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <span className="text-emerald-500 font-extrabold uppercase tracking-widest text-[11px] bg-emerald-50 px-3 py-1 rounded-full">AI Fitting Room</span>
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Virtual Try-On</h2>
        <p className="text-gray-500 font-medium max-w-xl mx-auto">Upload your photo and a dress, then watch Gemini blend them with perfect posture and natural draping.</p>
      </motion.div>

      {!resultImage ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* USER PHOTO PANEL */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center justify-between">
              <span className="flex items-center gap-2"><User size={15} /> 1. Model Photo</span>
              {userImage && <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Ready</span>}
            </h3>
            <div 
              {...getUserProps()} 
              className={`aspect-[3/4] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 cursor-pointer overflow-hidden bg-white shadow-sm relative group ${
                userImage ? 'border-black' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <input {...getUserInput()} />
              {userImage ? (
                <div className="relative w-full h-full">
                  <img src={userImage} className="w-full h-full object-cover rounded-2xl" alt="User Model" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                    <span className="text-xs text-white font-extrabold uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-xl">Replace Photo</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setUserImage(null); }}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full text-red-500 shadow-md hover:scale-110 transition-transform"
                    title="Remove user photo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4 p-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-gray-100">
                    <Upload className="text-gray-400" size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-gray-600 uppercase tracking-wide">Click or Drag Photo</p>
                    <p className="text-xs text-gray-400 font-medium">Upload a clear, front-facing portrait of yourself or a model</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DRESS PHOTO PANEL */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center justify-between">
              <span className="flex items-center gap-2"><Shirt size={15} /> 2. Dress Template</span>
              {dressImage && <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Selected</span>}
            </h3>
            <div 
              {...getDressProps()} 
              className={`aspect-[3/4] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 cursor-pointer overflow-hidden bg-white shadow-sm relative group ${
                dressImage ? 'border-black' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <input {...getDressInput()} />
              {dressImage ? (
                <div className="relative w-full h-full">
                  <img src={dressImage} className="w-full h-full object-cover rounded-2xl" alt="Selected Dress" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                    <span className="text-xs text-white font-extrabold uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-xl">Replace Dress</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDressImage(null); }}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full text-red-500 shadow-md hover:scale-110 transition-transform"
                    title="Remove dress photo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4 p-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-gray-100">
                    <Upload className="text-gray-400" size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-gray-600 uppercase tracking-wide">Click or Drag Dress</p>
                    <p className="text-xs text-gray-400 font-medium">Upload a custom outfit image, or navigate from store detail / sketch designs</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div className="md:col-span-2 pt-4 space-y-4">
            
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-red-50 p-4 rounded-xl border border-red-100 text-xs text-red-700 font-semibold leading-relaxed"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleTryOn}
              disabled={!userImage || !dressImage || processing}
              className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-gray-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl relative overflow-hidden group"
            >
              {processing ? (
                <>
                  <RefreshCw className="animate-spin text-emerald-400" size={20} />
                  <span>Draping garment with AI ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="text-yellow-400 group-hover:animate-pulse" size={20} />
                  <span>Generate Virtual Try-On</span>
                </>
              )}
            </button>
          </div>

        </div>
      ) : (
        /* VIRTUAL TRY-ON RESULT PREVIEW */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8 max-w-lg mx-auto"
        >
          <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative group">
            <img src={resultImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Virtual Try-On Result" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-6">
              <span className="text-white text-xs font-black uppercase tracking-widest bg-emerald-500/85 px-3 py-1.5 rounded-xl">Fitting Complete</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={downloadResult}
              className="flex-1 bg-black text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-900 transition-all shadow-md"
            >
              <Download size={18} /> Download
            </button>
            <button
              onClick={() => { setResultImage(null); setError(null); }}
              className="flex-1 bg-white border border-gray-250 text-gray-700 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm"
            >
              <RefreshCw size={18} /> Fit Another Dress
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
