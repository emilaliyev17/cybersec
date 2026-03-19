import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const STEPS = [
  { 
    id: 'basic', 
    title: 'Basic Info', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
  { 
    id: 'bio', 
    title: 'Background', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  { 
    id: 'projects', 
    title: 'Projects', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    id: 'expertise', 
    title: 'Expertise', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    )
  },
  { 
    id: 'review', 
    title: 'Review', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
];

export default function BioEditor({ onComplete, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [bio, setBio] = useState({
    bio_text: '',
    job_title: '',
    department: '',
    location: '',
    linkedin_url: '',
    photo_url: '',
    credentials: '',
    projects: [],
    expertise: []
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Image cropping state
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [aspect] = useState(1);
  const imgRef = useRef(null);

  useEffect(() => {
    fetchBio();
  }, []);

  const fetchBio = async () => {
    try {
      const response = await axios.get(apiUrl('/api/bio'));
      if (response.data.bio) {
        setBio({
          ...response.data.bio,
          projects: response.data.bio.projects || [],
          expertise: response.data.bio.expertise || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch bio:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const uploadPhoto = async () => {
    if (!imgRef.current || !crop) return;
    
    setUploading(true);
    try {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      canvas.width = crop.width * scaleX;
      canvas.height = crop.height * scaleY;
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(
        imgRef.current,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      const formData = new FormData();
      formData.append('photo', blob, 'profile.jpg');

      const response = await axios.post(apiUrl('/api/bio/photo'), formData);
      setBio({ ...bio, photo_url: response.data.photo_url });
      setImgSrc(''); // Close cropper
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const saveBio = async () => {
    setSaving(true);
    try {
      await axios.put(apiUrl('/api/bio'), bio);
      setSaved(true);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save bio');
    } finally {
      setSaving(false);
    }
  };

  // Validation helpers
  const getSentenceCount = (text) => (text || '').split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  
  const isStepValid = () => {
    switch (STEPS[currentStep].id) {
      case 'basic': return bio.job_title && bio.photo_url;
      case 'bio': {
        const count = getSentenceCount(bio.bio_text);
        return count >= 3 && count <= 5;
      }
      case 'projects': return bio.projects.length >= 4 && bio.projects.length <= 6;
      case 'expertise': return bio.expertise.length === 5;
      default: return true;
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-purple"></div></div>;

  if (saved) return (
    <div className="glass-card p-10 max-w-xl mx-auto text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-full bg-banano-green/20 flex items-center justify-center">
        <svg className="w-10 h-10 text-banano-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white">Biography Saved Successfully</h2>
      <p className="text-gray-400">Your professional profile has been updated and now meets the StrategyBRIX standard.</p>
      <button className="btn-neon-primary px-8" onClick={() => onComplete?.()}>Close</button>
    </div>
  );

  return (
    <>
    <div className="glass-card p-6 max-w-4xl mx-auto overflow-hidden">
      {/* Stepper Header */}
      <div className="flex justify-between items-center mb-10 overflow-x-auto pb-4 px-2">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center min-w-[80px]">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
              idx <= currentStep ? 'bg-nano-purple text-white' : 'bg-white/10 text-gray-500'
            } ${idx === currentStep ? 'ring-4 ring-nano-purple/30' : ''}`}>
              {step.icon}
            </div>
            <span className={`text-xs whitespace-nowrap ${idx <= currentStep ? 'text-white' : 'text-gray-500'}`}>
              {step.title}
            </span>
            {idx < STEPS.length - 1 && (
              <div className={`h-1 w-full absolute -right-1/2 top-5 -z-10 ${idx < currentStep ? 'bg-nano-purple' : 'bg-white/10'}`}></div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          {/* STEP 1: BASIC INFO */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">General Information</h3>
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-nano-purple bg-white/5 flex items-center justify-center">
                    {bio.photo_url ? (
                      <img src={bio.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                    <span className="text-white text-xs font-bold uppercase tracking-wider">Update Photo</span>
                    <input type="file" className="hidden" accept="image/*" onChange={onSelectFile} />
                  </label>
                </div>
                
                <div className="flex-1 w-full space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1 font-medium">Job Title</label>
                      <input 
                        className="input-neon" 
                        value={bio.job_title} 
                        onChange={(e) => setBio({...bio, job_title: e.target.value})}
                        placeholder="e.g. Senior Security Analyst"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1 font-medium">Professional Credentials</label>
                      <input 
                        className="input-neon" 
                        value={bio.credentials} 
                        onChange={(e) => setBio({...bio, credentials: e.target.value})}
                        placeholder="e.g. CISSP, CISM, PMP"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1 font-medium">Department</label>
                      <input 
                        className="input-neon" 
                        value={bio.department} 
                        onChange={(e) => setBio({...bio, department: e.target.value})} 
                        placeholder="e.g. Information Security"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1 font-medium">LinkedIn Profile URL</label>
                      <input 
                        className="input-neon" 
                        value={bio.linkedin_url} 
                        onChange={(e) => setBio({...bio, linkedin_url: e.target.value})} 
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                  </div>
                </div>
              </div>
              

            </div>
          )}

          {/* STEP 2: PROFESSIONAL BACKGROUND */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <h3 className="text-xl font-bold text-white">Professional Background</h3>
                <span className={`text-sm font-medium ${getSentenceCount(bio.bio_text) >= 3 && getSentenceCount(bio.bio_text) <= 5 ? 'text-banano-green' : 'text-red-400'}`}>
                  Sentences: {getSentenceCount(bio.bio_text)} (Target: 3-4)
                </span>
              </div>
              <div className="bg-nano-purple/10 p-4 rounded-xl border border-nano-purple/20 text-sm text-gray-300 leading-relaxed">
                <span className="text-nano-purple font-bold mr-2">Guidance:</span>
                The standard format should highlight your current role at StrategyBRIX, followed by key specializations and relevant prior experience. Aim for a concise, high-impact summary.
              </div>
              <textarea 
                className="w-full h-48 input-neon resize-none p-4" 
                value={bio.bio_text} 
                onChange={(e) => setBio({...bio, bio_text: e.target.value})}
                placeholder="Enter a brief professional summary focusing on your expertise and background..."
              />
            </div>
          )}

          {/* STEP 3: PROJECT EXPERIENCE */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <h3 className="text-xl font-bold text-white">Relevant Project Experience</h3>
                <span className={`text-sm font-medium ${bio.projects.length >= 4 && bio.projects.length <= 6 ? 'text-banano-green' : 'text-red-400'}`}>
                  Entries: {bio.projects.length} (Target: 4-6)
                </span>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {bio.projects.map((proj, idx) => (
                  <div key={idx} className="glass-card p-4 border border-white/5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input className="input-neon py-2 text-sm" placeholder="Service Category (e.g. Compliance Audit)" value={proj.category} onChange={e => {
                        const newP = [...bio.projects]; newP[idx].category = e.target.value; setBio({...bio, projects: newP});
                      }} />
                      <input className="input-neon py-2 text-sm" placeholder="Client Sector (e.g. Financial Services)" value={proj.client_type} onChange={e => {
                        const newP = [...bio.projects]; newP[idx].client_type = e.target.value; setBio({...bio, projects: newP});
                      }} />
                    </div>
                    <textarea className="input-neon py-2 text-sm h-16" placeholder="Describe the scope of work and the specific value or outcome delivered." value={proj.description} onChange={e => {
                      const newP = [...bio.projects]; newP[idx].description = e.target.value; setBio({...bio, projects: newP});
                    }} />
                    <button className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors" onClick={() => {
                      const newP = bio.projects.filter((_, i) => i !== idx); setBio({...bio, projects: newP});
                    }}>Remove Entry</button>
                  </div>
                ))}
              </div>
              
              {bio.projects.length < 6 && (
                <button className="btn-neon-secondary w-full border-dashed" onClick={() => setBio({...bio, projects: [...bio.projects, {category: '', client_type: '', description: ''}]})}>
                  <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Project Experience
                </button>
              )}
            </div>
          )}

          {/* STEP 4: EXPERTISE */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <h3 className="text-xl font-bold text-white">Areas of Expertise</h3>
                <span className={`text-sm font-medium ${bio.expertise.length === 5 ? 'text-banano-green' : 'text-red-400'}`}>
                  {bio.expertise.length} of 5 items
                </span>
              </div>
              <p className="text-gray-400 text-sm">Please specify exactly 5 professional competencies or specializations.</p>
              
              <div className="space-y-3">
                {[0,1,2,3,4].map(idx => (
                  <div key={idx} className="flex gap-3 items-center">
                    <span className="text-nano-purple font-bold w-6">{idx + 1}.</span>
                    <input 
                      className="input-neon py-3" 
                      placeholder={`Internal specialization #${idx + 1}`}
                      value={bio.expertise[idx] || ''}
                      onChange={e => {
                        const newE = [...bio.expertise]; 
                        newE[idx] = e.target.value; 
                        setBio({...bio, expertise: newE});
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">Final Review</h3>
              <div className="glass-card p-6 border border-nano-purple/20 bg-nano-purple/5">
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full border-2 border-nano-purple overflow-hidden flex-shrink-0">
                    <img src={bio.photo_url} className="w-full h-full object-cover" alt="Profile Preview" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{bio.job_title}</h4>
                    <p className="text-gray-400 text-sm font-medium">{bio.credentials}</p>
                  </div>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-nano-purple font-bold uppercase tracking-wider text-[10px]">Professional Summary</span>
                    <p className="text-gray-300 mt-1 line-clamp-3 leading-relaxed">{bio.bio_text}</p>
                  </div>
                  <div className="flex gap-12">
                    <div>
                      <span className="text-nano-purple font-bold uppercase tracking-wider text-[10px]">Experience</span>
                      <p className="text-gray-300 mt-0.5">{bio.projects.length} Project Entries</p>
                    </div>
                    <div>
                      <span className="text-nano-purple font-bold uppercase tracking-wider text-[10px]">Competencies</span>
                      <p className="text-gray-300 mt-0.5">{bio.expertise.length} Key Skills</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-banano-green/10 p-4 rounded-xl border border-banano-green/20 text-sm text-banano-green flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>The drafted biography adheres to the StrategyBRIX professional standard and is ready for submission.</span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* FOOTER ACTIONS */}
      <div className="flex justify-between mt-10 pt-6 border-t border-white/10">
        <button 
          className="flex items-center gap-2 px-6 py-2 text-gray-400 hover:text-white disabled:opacity-0 transition-all font-medium"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous Step
        </button>
        
        <div className="flex gap-4">
          {onClose && (
            <button className="px-6 py-2 text-gray-400 hover:text-white transition-colors font-medium text-sm" onClick={onClose}>
              Cancel
            </button>
          )}
          {currentStep < STEPS.length - 1 ? (
            <button 
              className={`btn-neon-primary px-10 transition-all ${!isStepValid() ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
              onClick={nextStep}
              disabled={!isStepValid()}
            >
              Continue
              <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button 
              className="btn-neon-primary px-10 bg-gradient-to-r from-nano-purple to-pink-600 border-none flex items-center gap-2"
              onClick={saveBio}
              disabled={saving}
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Finalize & Submit
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Image Cropper Modal — rendered via Portal to escape backdrop-filter stacking context */}
    {imgSrc && createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4">
        <div className="bg-[#1a1f2e] rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
          <h3 className="text-white font-bold mb-4 flex-shrink-0">Crop your profile photo</h3>
          <div className="overflow-auto flex-1 min-h-0 flex items-center justify-center">
            <ReactCrop crop={crop} onChange={c => setCrop(c)} aspect={1} circularCrop>
              <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Crop" style={{ maxHeight: '60vh' }} />
            </ReactCrop>
          </div>
          <div className="flex justify-end gap-3 mt-6 flex-shrink-0">
            <button className="btn-neon-secondary" onClick={() => setImgSrc('')}>Cancel</button>
            <button className="btn-neon-primary" onClick={uploadPhoto} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Done'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}

    </>
  );
}
