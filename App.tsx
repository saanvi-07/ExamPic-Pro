
import React, { useState, useEffect, useMemo } from 'react';
import { ExamType, ExamRequirement, ImageFile, ImageTransform, Language, Theme } from './types';
import { EXAM_REQUIREMENTS, REVENUE_PER_DOWNLOAD } from './constants';
import { TRANSLATIONS } from './translations';
import { ExamSelector } from './components/ExamSelector';
import { FileUpload } from './components/FileUpload';
import { ImageEditor } from './components/ImageEditor';
import { processImage } from './utils/imageProcessor';
import { verifyImageQuality } from './services/geminiService';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [theme, setTheme] = useState<Theme>(Theme.VIBRANT);
  const [activeTab, setActiveTab] = useState<'photo' | 'signature'>('photo');
  const [selectedExam, setSelectedExam] = useState<ExamType>(ExamType.SSC);
  const [requirement, setRequirement] = useState<ExamRequirement>(EXAM_REQUIREMENTS[ExamType.SSC]);
  
  const [photo, setPhoto] = useState<ImageFile | null>(null);
  const [signature, setSignature] = useState<ImageFile | null>(null);
  const [editingFile, setEditingFile] = useState<{ file: File; type: 'photo' | 'signature'; preview: string } | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGateVisible, setIsGateVisible] = useState(false);
  const [gateLoading, setGateLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  const [isOwnerMode, setIsOwnerMode] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  
  const [stats, setStats] = useState({
    downloads: parseInt(localStorage.getItem('ep_downloads') || '0'),
    earnings: parseFloat(localStorage.getItem('ep_earnings') || '0.00'),
    visitors: parseInt(localStorage.getItem('ep_visitors') || '1')
  });

  const t = TRANSLATIONS[language];

  // Professional Theme Palette
  const themeClasses = useMemo(() => {
    switch (theme) {
      case Theme.VIBRANT:
        return {
          bg: 'bg-[#030712] relative overflow-hidden',
          textPrimary: 'text-slate-100',
          textHeading: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 font-black',
          textSecondary: 'text-slate-400',
          accent: 'indigo-500',
          card: 'bg-slate-900/60 backdrop-blur-3xl border-slate-800/50 shadow-2xl',
          nav: 'bg-[#030712]/90 border-slate-800/80 backdrop-blur-xl',
          heroGradient: 'from-cyan-400 via-indigo-500 to-purple-500',
          button: 'bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 shadow-[0_10px_40px_rgba(79,70,229,0.3)]',
          aiBox: 'bg-indigo-500/5 border-indigo-500/20 text-cyan-300',
          tabActive: 'bg-indigo-600 text-white',
          tabInactive: 'bg-slate-800/50 text-slate-400 border-slate-800'
        };
      case Theme.DAYLIGHT:
        return {
          bg: 'bg-slate-50',
          textPrimary: 'text-slate-900',
          textHeading: 'text-slate-900 font-black',
          textSecondary: 'text-slate-500',
          accent: 'indigo-600',
          card: 'bg-white border-slate-100 shadow-xl',
          nav: 'bg-white/90 border-slate-100 backdrop-blur-md',
          heroGradient: 'from-indigo-600 to-purple-600',
          button: 'bg-indigo-600 shadow-xl shadow-indigo-100',
          aiBox: 'bg-indigo-50 border-indigo-100 text-indigo-900',
          tabActive: 'bg-indigo-600 text-white',
          tabInactive: 'bg-white text-slate-500 border-slate-200 shadow-sm'
        };
      case Theme.MIDNIGHT:
      default:
        return {
          bg: 'bg-[#0f172a]',
          textPrimary: 'text-white',
          textHeading: 'text-white font-black',
          textSecondary: 'text-slate-400',
          accent: 'indigo-400',
          card: 'bg-slate-900/80 border-slate-800 shadow-2xl',
          nav: 'bg-slate-900/90 border-slate-800 backdrop-blur-md',
          heroGradient: 'from-indigo-400 to-violet-500',
          button: 'bg-indigo-500 shadow-xl shadow-indigo-500/20',
          aiBox: 'bg-slate-800 border-slate-700 text-slate-300',
          tabActive: 'bg-indigo-500 text-white',
          tabInactive: 'bg-slate-800 text-slate-400 border-slate-700'
        };
    }
  }, [theme]);

  useEffect(() => {
    setRequirement(EXAM_REQUIREMENTS[selectedExam]);
    setIsUnlocked(false); // Reset unlock state when exam changes
  }, [selectedExam]);

  useEffect(() => {
    if (!localStorage.getItem('ep_visited')) {
      const newV = stats.visitors + 1;
      localStorage.setItem('ep_visitors', newV.toString());
      localStorage.setItem('ep_visited', 'true');
      setStats(prev => ({ ...prev, visitors: newV }));
    }
  }, []);

  const handleLogoClick = () => {
    setLogoClicks(p => p + 1);
    if (logoClicks >= 2) {
      setIsOwnerMode(true);
      setLogoClicks(0);
    }
    setTimeout(() => setLogoClicks(0), 3000);
  };

  const handleFileSelect = (file: File, type: 'photo' | 'signature') => {
    const preview = URL.createObjectURL(file);
    setEditingFile({ file, type, preview });
  };

  const handleSaveTransform = async (transform: ImageTransform) => {
    if (!editingFile) return;
    const { file, type } = editingFile;
    const targetDims = type === 'photo' ? requirement.photo.dimensions : requirement.signature.dimensions;
    const targetSize = type === 'photo' ? requirement.photo.size : requirement.signature.size;
    
    setIsProcessing(true);
    setEditingFile(null);

    try {
      const processed = await processImage(file, targetDims, targetSize, transform);
      const processedPreview = URL.createObjectURL(processed.blob);

      const newImageFile: ImageFile = {
        file,
        preview: URL.createObjectURL(file),
        type,
        transform,
        processed: processed.blob,
        processedPreview,
        processedSizeKB: processed.sizeKB,
        processedDimensions: { width: processed.width, height: processed.height }
      };

      if (type === 'photo') setPhoto(newImageFile);
      else setSignature(newImageFile);

      const aiCheck = await verifyImageQuality(file, type);
      
      if (type === 'photo') {
        setPhoto(prev => prev ? { ...prev, aiFeedback: aiCheck.feedback, isAiValid: aiCheck.isValid } : null);
      } else {
        setSignature(prev => prev ? { ...prev, aiFeedback: aiCheck.feedback, isAiValid: aiCheck.isValid } : null);
      }
    } catch (error) {
      console.error("Processing failed", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const initiateUnlock = () => {
    setIsGateVisible(true);
  };

  const simulatePaytm = () => {
    setGateLoading(true);
    // Simulate Paytm JS Checkout / UPI Flow
    setTimeout(() => {
      setGateLoading(false);
      setIsUnlocked(true);
      setIsGateVisible(false);
      executeDownload();
    }, 2500);
  };

  const executeDownload = () => {
    const downloadBlob = (blob: Blob, name: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    if (photo?.processed) downloadBlob(photo.processed, `photo_${selectedExam.toLowerCase()}.jpg`);
    if (signature?.processed) downloadBlob(signature.processed, `signature_${selectedExam.toLowerCase()}.jpg`);
    
    const newDownloads = stats.downloads + 1;
    const newEarnings = stats.earnings + REVENUE_PER_DOWNLOAD;
    localStorage.setItem('ep_downloads', newDownloads.toString());
    localStorage.setItem('ep_earnings', newEarnings.toFixed(2));
    setStats(prev => ({ ...prev, downloads: newDownloads, earnings: newEarnings }));
  };

  return (
    <div className={`min-h-screen pb-20 transition-all duration-700 ${themeClasses.bg} ${themeClasses.textPrimary}`}>
      {/* Dynamic Background (Vibrant Only) */}
      {theme === Theme.VIBRANT && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-indigo-500/20 blur-[200px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-500/20 blur-[200px] rounded-full"></div>
          <div className="absolute top-[30%] right-[10%] w-[10%] h-[10%] bg-cyan-400/10 blur-[100px] rounded-full"></div>
        </div>
      )}

      {/* Monetization Gate (Paytm / Sponsor) */}
      {isGateVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6">
          <div className={`${theme === Theme.DAYLIGHT ? 'bg-white' : 'bg-slate-900 border border-slate-800'} rounded-[3.5rem] w-full max-w-lg p-10 text-center shadow-2xl animate-in zoom-in duration-500`}>
            {gateLoading ? (
              <div className="py-16">
                 <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
                 <h3 className="text-2xl font-black mb-2">{t.processing}</h3>
                 <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Initiating Gateway</p>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                  <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-4">{t.officialUnlock}</h2>
                <p className="text-slate-400 font-medium mb-10 leading-relaxed">{t.unlockDesc}</p>
                
                <div className="space-y-4 mb-10">
                   <button 
                    onClick={simulatePaytm}
                    className="w-full flex items-center justify-between p-6 bg-indigo-600 hover:bg-indigo-500 rounded-3xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-600/20"
                   >
                     <div className="text-left">
                       <p className="text-xs font-black text-indigo-100 uppercase tracking-widest mb-1">{t.instantUnlock}</p>
                       <p className="text-xl font-black text-white">{t.payVia}</p>
                     </div>
                     <div className="bg-white/10 p-2.5 rounded-xl">
                       <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     </div>
                   </button>

                   <button 
                    onClick={simulatePaytm}
                    className="w-full flex items-center justify-between p-6 bg-slate-800 hover:bg-slate-700 rounded-3xl transition-all transform hover:scale-[1.02] active:scale-95 border border-slate-700"
                   >
                     <div className="text-left">
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t.adSupported}</p>
                       <p className="text-xl font-black text-white">{t.watchSponsor}</p>
                     </div>
                     <div className="bg-white/5 p-2.5 rounded-xl">
                       <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                   </button>
                </div>

                <div className="flex items-center justify-center space-x-3 opacity-40">
                   <div className="h-px bg-slate-700 flex-1"></div>
                   <span className="text-[9px] font-black uppercase tracking-[0.3em]">Encrypted Gateway</span>
                   <div className="h-px bg-slate-700 flex-1"></div>
                </div>

                <button 
                  onClick={() => setIsGateVisible(false)}
                  className="mt-8 text-slate-500 hover:text-slate-300 text-xs font-bold transition-colors"
                >
                  {t.returnToEditor}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Owner Console Overlay */}
      {isOwnerMode && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-4xl p-12 text-white shadow-2xl animate-in slide-in-from-bottom-12">
            <div className="flex justify-between items-start mb-12">
               <div>
                  <h3 className="text-4xl font-black tracking-tight mb-2">Creator Hub</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Administrative Performance & Payouts</p>
               </div>
               <button onClick={() => setIsOwnerMode(false)} className="p-3 hover:bg-slate-800 rounded-full transition-all hover:rotate-90">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
               <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2.5rem]">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Visitor Count</p>
                  <p className="text-5xl font-black">{stats.visitors}</p>
               </div>
               <div className="p-8 bg-purple-500/10 border border-purple-500/20 rounded-[2.5rem]">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Downloads</p>
                  <p className="text-5xl font-black">{stats.downloads}</p>
               </div>
               <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem]">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Revenue (Est.)</p>
                  <p className="text-5xl font-black text-emerald-400">${stats.earnings.toFixed(2)}</p>
               </div>
            </div>

            <div className="bg-slate-800/50 p-10 rounded-[3.5rem] border border-slate-700">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                     <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                     <h4 className="text-xl font-bold">Banking Gateway Status</h4>
                  </div>
                  <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded-full border border-emerald-500/30">Auto-Settlement On</span>
               </div>
               <p className="text-slate-400 text-sm leading-relaxed mb-10">Aggregating payouts via **CPM-50 Protocol**. Next settlement scheduled for Friday. Minimum payout threshold: $50.00.</p>
               <div className="flex gap-4">
                  <button onClick={() => window.open('https://billing.exampic.pro/portal/owner-v4', '_blank')} className="flex-1 py-5 bg-white text-slate-900 rounded-3xl font-black text-sm hover:scale-[1.02] transition-transform">Payout Settings</button>
                  <button className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm hover:scale-[1.02] transition-transform">Withdraw Funds</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${themeClasses.nav} border-b px-8 py-5 flex items-center justify-between`}>
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={handleLogoClick}
        >
          <div className={`w-12 h-12 ${theme === Theme.VIBRANT ? 'bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500' : 'bg-indigo-600'} rounded-2xl flex items-center justify-center shadow-xl transform group-hover:rotate-12 transition-all duration-500`}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className={`text-2xl font-black tracking-tighter ${themeClasses.textHeading}`}>ExamPic Pro</span>
        </div>

        <div className="flex items-center space-x-4">
           <div className="hidden lg:flex items-center space-x-1.5 p-1 rounded-2xl border border-slate-700/50 bg-slate-800/30">
              {Object.values(Theme).map(tOpt => (
                <button
                  key={tOpt}
                  onClick={() => setTheme(tOpt)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${theme === tOpt ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {tOpt}
                </button>
              ))}
           </div>

           <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-slate-800/50 border border-slate-700 text-slate-200 rounded-2xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-slate-800"
          >
            {Object.values(Language).map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </nav>

      {/* Hero / Landing Section */}
      {!photo && !signature && (
        <section className="pt-40 pb-20 px-8 text-center max-w-5xl mx-auto relative z-10">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 ${theme === Theme.DAYLIGHT ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'} rounded-full text-[10px] font-black uppercase tracking-widest mb-10 border border-indigo-500/20 animate-bounce`}>
            <span>⚡ COMPLIANCE ENGINE v2.4</span>
          </div>
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.85]">
            {t.heroTitle1} <br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${themeClasses.heroGradient}`}>{t.heroTitle2}</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 mb-16 max-w-3xl mx-auto font-medium tracking-tight">
            {t.heroSub} <br />
            <span className="opacity-50 font-bold uppercase text-xs tracking-[0.4em] mt-6 block">{t.examsList}</span>
          </p>

          {/* Core Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-24">
             <div className={`${themeClasses.card} p-10 rounded-[3rem] border`}>
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 font-black">AI</div>
                <h4 className="text-lg font-black mb-3">{t.feature1Title}</h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{t.feature1Desc}</p>
             </div>
             <div className={`${themeClasses.card} p-10 rounded-[3rem] border`}>
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 font-black">⚡</div>
                <h4 className="text-lg font-black mb-3">{t.feature2Title}</h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{t.feature2Desc}</p>
             </div>
             <div className={`${themeClasses.card} p-10 rounded-[3rem] border`}>
                <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-6 font-black">🔒</div>
                <h4 className="text-lg font-black mb-3">{t.feature3Title}</h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{t.feature3Desc}</p>
             </div>
          </div>
        </section>
      )}

      {/* Main App Container */}
      <main className={`max-w-7xl mx-auto px-8 relative z-10 transition-all duration-1000 ${photo || signature ? 'pt-32' : ''}`}>
        <div className={`${themeClasses.card} rounded-[4rem] border overflow-hidden`}>
          <div className="p-10 md:p-16">
             <div className="flex flex-col lg:flex-row gap-16">
                
                {/* Left: Configuration */}
                <div className="w-full lg:w-1/3">
                   <div className="sticky top-28 space-y-10">
                      <ExamSelector selected={selectedExam} onChange={setSelectedExam} label={t.step1} />

                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-60">{t.selectionMode}</label>
                         <div className="flex p-1.5 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
                            <button 
                              onClick={() => setActiveTab('photo')}
                              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'photo' ? themeClasses.tabActive : themeClasses.tabInactive}`}
                            >
                              {t.photo}
                            </button>
                            <button 
                              onClick={() => setActiveTab('signature')}
                              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'signature' ? themeClasses.tabActive : themeClasses.tabInactive}`}
                            >
                              {t.signature}
                            </button>
                         </div>
                      </div>

                      <div className={`${theme === Theme.DAYLIGHT ? 'bg-slate-50 border-slate-100' : 'bg-black/30 border-slate-800'} p-10 rounded-[3rem] border`}>
                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">{t.reqSummary}</h4>
                         <div className="space-y-8">
                            <div className="flex justify-between items-center text-sm">
                               <span className="opacity-40 font-black uppercase text-[10px]">Type</span>
                               <span className="font-black text-indigo-400 uppercase tracking-widest">{activeTab === 'photo' ? t.photo : t.signature}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                               <span className="opacity-40 font-black uppercase text-[10px]">{t.size} Limit</span>
                               <span className="font-black text-white">{activeTab === 'photo' ? requirement.photo.size.minKB : requirement.signature.size.minKB}-{activeTab === 'photo' ? requirement.photo.size.maxKB : requirement.signature.size.maxKB} KB</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                               <span className="opacity-40 font-black uppercase text-[10px]">Aspect Ratio</span>
                               <span className="font-black text-white">{activeTab === 'photo' ? requirement.photo.dimensions.width : requirement.signature.dimensions.width}×{activeTab === 'photo' ? requirement.photo.dimensions.height : requirement.signature.dimensions.height} PX</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Right: Interaction Area */}
                <div className="flex-1 space-y-12">
                   {activeTab === 'photo' ? (
                     <FileUpload 
                      label={t.uploadPhoto} 
                      type="photo" 
                      onFileSelect={(f) => handleFileSelect(f, 'photo')} 
                      preview={photo?.preview}
                      isLoading={isProcessing && !photo?.processed}
                      t={t}
                    />
                   ) : (
                    <FileUpload 
                      label={t.uploadSig} 
                      type="signature" 
                      onFileSelect={(f) => handleFileSelect(f, 'signature')} 
                      preview={signature?.preview}
                      isLoading={isProcessing && !signature?.processed}
                      t={t}
                    />
                   )}

                   {/* AI Feedback Section */}
                   {((activeTab === 'photo' && photo?.aiFeedback) || (activeTab === 'signature' && signature?.aiFeedback)) && (
                      <div className={`${themeClasses.aiBox} p-10 rounded-[3rem] border animate-in zoom-in duration-500`}>
                        <div className="flex items-center space-x-3 mb-4">
                           <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-50">Compliance Verification Result</span>
                           {((activeTab === 'photo' && photo?.isAiValid) || (activeTab === 'signature' && signature?.isAiValid)) && (
                             <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black border border-emerald-500/30">PASSED</span>
                           )}
                        </div>
                        <p className="text-lg font-bold leading-relaxed">{activeTab === 'photo' ? photo?.aiFeedback : signature?.aiFeedback}</p>
                      </div>
                   )}

                   {/* Results Display */}
                   {((activeTab === 'photo' && photo?.processed) || (activeTab === 'signature' && signature?.processed)) && (
                     <div className="pt-12 border-t border-slate-800/50 space-y-12">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                           <h3 className="text-4xl font-black tracking-tighter">{t.readyToOutput}</h3>
                           <button 
                             onClick={initiateUnlock}
                             className={`${themeClasses.button} px-14 py-6 text-white rounded-[2.5rem] font-black text-xl hover:scale-[1.05] transition-all flex items-center space-x-4`}
                           >
                             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                             <span>{isUnlocked ? t.downloadAgain : t.unlockDownload}</span>
                           </button>
                        </div>

                        <div className="flex justify-center">
                           {activeTab === 'photo' && photo?.processedPreview && (
                              <div className="bg-black/30 p-10 rounded-[3.5rem] border border-slate-800/50 text-center max-w-sm w-full group overflow-hidden">
                                 <img src={photo.processedPreview} className="h-64 mx-auto rounded-3xl shadow-2xl border-4 border-indigo-500/30 mb-8 transition-all group-hover:scale-110" alt="Result" />
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-800/50 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                       {t.size}: {photo.processedSizeKB?.toFixed(1)} KB
                                    </div>
                                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                       {t.ready}
                                    </div>
                                 </div>
                              </div>
                           )}
                           {activeTab === 'signature' && signature?.processedPreview && (
                              <div className="bg-black/30 p-10 rounded-[3.5rem] border border-slate-800/50 text-center max-w-lg w-full group overflow-hidden">
                                 <div className="bg-white p-6 rounded-3xl mb-8 shadow-inner transition-all group-hover:scale-105">
                                    <img src={signature.processedPreview} className="h-40 mx-auto object-contain" alt="Result" />
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-800/50 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                       {t.size}: {signature.processedSizeKB?.toFixed(1)} KB
                                    </div>
                                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-[10px] font-black text-purple-400 uppercase tracking-widest">
                                       {t.ready}
                                    </div>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </main>

      <footer className="mt-40 text-center px-8 border-t border-slate-800/20 pt-24 relative z-10">
         <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-[10px] mb-8">Official Portal Compliance Engine</p>
         <div className="flex flex-wrap justify-center gap-12 text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-20 opacity-40">
            <span>UPSC Standards</span>
            <span>SSC Ver 2.4</span>
            <span>SBI/IBPS Compliant</span>
            <span>State PCS Ready</span>
         </div>
         
         <div className="mb-20">
            <h4 className="text-3xl font-black mb-12">ExamPic Pro</h4>
            <div className="flex justify-center space-x-10 text-[10px] font-black uppercase tracking-widest text-slate-400">
               <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
               <a href="#" className="hover:text-indigo-400 transition-colors">Terms of Use</a>
               <a href="#" className="hover:text-indigo-400 transition-colors">System Status</a>
            </div>
         </div>

         {isOwnerMode && (
           <div className="pb-10 animate-in fade-in slide-in-from-bottom-4 duration-[2000ms]">
              <button 
                onClick={() => window.open('https://billing.exampic.pro/portal/owner-v4', '_blank')}
                className="text-[10px] font-black text-slate-900 hover:text-indigo-500/20 uppercase tracking-[1.5em] transition-all cursor-default select-none"
              >
                . SYSTEM_ENGINE_ROOT_AUTH .
              </button>
           </div>
         )}
      </footer>

      {editingFile && (
        <ImageEditor 
          imageSrc={editingFile.preview}
          targetDims={editingFile.type === 'photo' ? requirement.photo.dimensions : requirement.signature.dimensions}
          onSave={handleSaveTransform}
          onCancel={() => setEditingFile(null)}
          t={t}
        />
      )}
    </div>
  );
};

export default App;
