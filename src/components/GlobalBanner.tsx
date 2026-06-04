import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Megaphone, X } from 'lucide-react';

export default function GlobalBanner() {
  const [banner, setBanner] = useState({ text: '', active: false });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      const { data } = await supabase.from('app_settings').select('global_banner_text, global_banner_active').eq('id', 1).single();
      if (data && data.global_banner_active && data.global_banner_text) {
        setBanner({ text: data.global_banner_text, active: true });
      }
    };
    fetchBanner();
  }, []);

  if (!banner.active || !visible) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-black px-4 py-3 flex items-center justify-between text-xs sm:text-sm font-black uppercase tracking-widest z-[100] relative shadow-lg">
      <div className="flex items-center gap-3 max-w-5xl mx-auto w-full justify-center">
        <Megaphone className="w-5 h-5 animate-pulse" />
        <span>{banner.text}</span>
      </div>
      <button onClick={() => setVisible(false)} className="p-1 hover:bg-black/20 rounded-full transition-colors shrink-0">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
