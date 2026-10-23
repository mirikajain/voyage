import React, { useState, useEffect } from 'react';
import { Home, MapPin, Check, Trash2, Edit3, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { HomeAddress } from '../../types';

export const HomeAddressSection: React.FC = () => {
  const { userProfile, updateHomeAddress } = useApp();

  const [address, setAddress] = useState(userProfile.homeAddress?.address || '');
  const [city, setCity] = useState(userProfile.homeAddress?.city || '');
  const [state, setState] = useState(userProfile.homeAddress?.state || '');
  const [country, setCountry] = useState(userProfile.homeAddress?.country || 'India');
  const [postalCode, setPostalCode] = useState(userProfile.homeAddress?.postal_code || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(!userProfile.homeAddress?.city);

  useEffect(() => {
    if (userProfile.homeAddress) {
      setAddress(userProfile.homeAddress.address || '');
      setCity(userProfile.homeAddress.city || '');
      setState(userProfile.homeAddress.state || '');
      setCountry(userProfile.homeAddress.country || 'India');
      setPostalCode(userProfile.homeAddress.postal_code || '');
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [userProfile.homeAddress]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      return;
    }

    const newAddress: HomeAddress = {
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim() || 'India',
      postal_code: postalCode.trim(),
    };

    updateHomeAddress(newAddress);
    setSavedSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClear = () => {
    updateHomeAddress(null);
    setAddress('');
    setCity('');
    setState('');
    setCountry('India');
    setPostalCode('');
    setIsEditing(true);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-voyage-border/80 shadow-soft-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-voyage-border/70">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-voyage-gold-dark border border-voyage-gold/30 shadow-soft-xs">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif-luxury text-xl font-bold text-voyage-dark">
              Home Address
            </h2>
            <p className="text-xs text-voyage-muted">
              Used automatically as your default departure origin for intelligent trip planning
            </p>
          </div>
        </div>

        {userProfile.homeAddress?.city && !isEditing && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Default Origin: {userProfile.homeAddress.city}
            </span>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
        )}
      </div>

      {/* Saved View or Edit Form */}
      {!isEditing && userProfile.homeAddress?.city ? (
        <div className="bg-voyage-bg rounded-2xl p-5 border border-voyage-border/80 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-voyage-muted block tracking-wider">
                Street Address
              </span>
              <p className="text-voyage-dark font-medium text-sm mt-0.5">
                {userProfile.homeAddress.address || '—'}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-voyage-muted block tracking-wider">
                City / Origin
              </span>
              <p className="text-voyage-dark font-bold text-sm mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-voyage-gold-dark" />
                {userProfile.homeAddress.city}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-voyage-muted block tracking-wider">
                State & Country
              </span>
              <p className="text-voyage-dark font-medium text-sm mt-0.5">
                {[userProfile.homeAddress.state, userProfile.homeAddress.country].filter(Boolean).join(', ') || 'India'}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-voyage-muted block tracking-wider">
                PIN / Postal Code
              </span>
              <p className="text-voyage-dark font-medium text-sm mt-0.5">
                {userProfile.homeAddress.postal_code || '—'}
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-voyage-border/60">
            <div className="flex items-center gap-1.5 text-[11px] text-voyage-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Private & secure: Only city is referenced for origin routing</span>
            </div>

            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Address</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Street Address */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-voyage-dark">
                Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Flat 402, Luxury Heights, Amrita Shergill Marg"
                className="w-full px-4 py-2.5 rounded-2xl bg-voyage-bg border border-voyage-border text-voyage-dark text-xs focus:outline-none focus:border-voyage-gold placeholder:text-slate-400 transition-colors"
              />
            </div>

            {/* City (Required for origin resolution) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-voyage-dark flex items-center gap-1">
                <span>City / Home Origin</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                placeholder="e.g. Delhi"
                className="w-full px-4 py-2.5 rounded-2xl bg-voyage-bg border border-voyage-border text-voyage-dark text-xs focus:outline-none focus:border-voyage-gold placeholder:text-slate-400 transition-colors"
              />
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-voyage-dark">
                State / Province
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Delhi"
                className="w-full px-4 py-2.5 rounded-2xl bg-voyage-bg border border-voyage-border text-voyage-dark text-xs focus:outline-none focus:border-voyage-gold placeholder:text-slate-400 transition-colors"
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-voyage-dark">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. India"
                className="w-full px-4 py-2.5 rounded-2xl bg-voyage-bg border border-voyage-border text-voyage-dark text-xs focus:outline-none focus:border-voyage-gold placeholder:text-slate-400 transition-colors"
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-voyage-dark">
                PIN / Postal Code
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="e.g. 110003"
                className="w-full px-4 py-2.5 rounded-2xl bg-voyage-bg border border-voyage-border text-voyage-dark text-xs focus:outline-none focus:border-voyage-gold placeholder:text-slate-400 transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-voyage-muted">
              {savedSuccess ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  Home Address saved successfully!
                </span>
              ) : (
                <span>City will be used as default departure origin when not specified</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {userProfile.homeAddress?.city && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-voyage-dark hover:bg-slate-800 text-voyage-gold font-bold text-xs shadow-soft-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Home Address</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
