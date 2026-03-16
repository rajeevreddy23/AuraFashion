import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion } from 'motion/react';
import { Upload, Sparkles, Download, RefreshCw, User, Shirt } from 'lucide-react';
import { tryOnDress } from '../services/geminiService';

export default function TryOnPage() {
  const location = useLocation();
  const initialProduct = location.state?.product;

  const [userImage, setUserImage] = useState<string | null>(null);
  const [dressImage, setDressImage] = useState<string | null>(initialProduct?.image || null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  React.useEffect(() => {
    if (location.state?.product?.image) {
      setDressImage(location.state.product.image);
    }
  }, [location.state]);

  const onDropUser = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => setUserImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const onDropDress = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => setDressImage(reader.result as string);
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
    try {
      let finalDressImage = dressImage;
      
      // If dressImage is a URL (starts with http), convert to base64
      if (dressImage.startsWith('http')) {
        try {
          const response = await fetch(dressImage);
          const blob = await response.blob();
          finalDressImage = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (fetchErr) {
          console.error("Failed to fetch dress image URL:", fetchErr);
          // If fetch fails (CORS), we might still try to send the URL but geminiService expects base64
        }
      }

      const result = await tryOnDress(userImage, finalDressImage);
      setResultImage(result);
    } catch (err) {
      console.error(err);
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
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black uppercase tracking-tighter">Virtual Try-On</h2>
        <p className="text-gray-500 font-medium">See how you look in any dress instantly.</p>
      </div>

      {!resultImage ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Photo Upload */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <User size={16} /> Step 1: Your Photo
            </h3>
            <div 
              {...getUserProps()} 
              className={`aspect-[3/4] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 cursor-pointer overflow-hidden ${
                userImage ? 'border-black' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <input {...getUserInput()} />
              {userImage ? (
                <img src={userImage} className="w-full h-full object-cover" alt="User" />
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="text-gray-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-500">Click or drag your photo here</p>
                </div>
              )}
            </div>
          </div>

          {/* Dress Photo Upload */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Shirt size={16} /> Step 2: Dress Photo
            </h3>
            <div 
              {...getDressProps()} 
              className={`aspect-[3/4] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 cursor-pointer overflow-hidden ${
                dressImage ? 'border-black' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <input {...getDressInput()} />
              {dressImage ? (
                <img src={dressImage} className="w-full h-full object-cover" alt="Dress" />
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="text-gray-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-500">Click or drag dress photo here</p>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 pt-8">
            <button
              onClick={handleTryOn}
              disabled={!userImage || !dressImage || processing}
              className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
            >
              {processing ? (
                <>
                  <RefreshCw className="animate-spin" /> Processing with AI...
                </>
              ) : (
                <>
                  <Sparkles /> Generate Virtual Try-On
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          <div className="aspect-[3/4] max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            <img src={resultImage} className="w-full h-full object-cover" alt="Result" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <button
              onClick={downloadResult}
              className="flex-1 bg-black text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-800 transition-all"
            >
              <Download size={20} /> Download
            </button>
            <button
              onClick={() => { setResultImage(null); }}
              className="flex-1 bg-white border-2 border-black text-black py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black hover:text-white transition-all"
            >
              <RefreshCw size={20} /> Try Another
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
