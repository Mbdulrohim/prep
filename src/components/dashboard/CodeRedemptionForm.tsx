"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { accessCodeManager } from '@/lib/accessCodes';
import { useAuth } from '@/context/AuthContext';
import { 
  Gift, 
  CheckCircle, 
  AlertCircle,
  Loader
} from 'lucide-react';

interface CodeRedemptionFormProps {
  onSuccess?: () => void;
}

export const CodeRedemptionForm: React.FC<CodeRedemptionFormProps> = ({ onSuccess }) => {
  const { user, userProfile } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Please enter an access code' });
      return;
    }

    if (!user || !userProfile) {
      setMessage({ type: 'error', text: 'Please sign in to redeem codes' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await accessCodeManager.redeemAccessCode(
        code.trim().toUpperCase(),
        user.uid,
        user.email || ''
      );

      if (result.success) {
        const accessCode = result.accessCode;
        let expiryDateStr = 'N/A';
        
        if (accessCode?.expiresAt) {
          try {
            const expiryDate = (accessCode.expiresAt as any)?.toDate 
              ? (accessCode.expiresAt as any).toDate() 
              : accessCode.expiresAt;
            expiryDateStr = new Date(expiryDate).toLocaleDateString();
          } catch {
            expiryDateStr = 'N/A';
          }
        }
        
        setMessage({ 
          type: 'success', 
          text: `Success! You now have access to ${accessCode?.papers?.join(', ')} until ${expiryDateStr}` 
        });
        setCode('');
        
        // Call success callback after a delay
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to redeem code' });
      }
    } catch (error) {
      console.error('Code redemption error:', error);
      setMessage({ type: 'error', text: 'An error occurred while redeeming the code' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
          <Gift className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Have an Access Code?</h3>
          <p className="text-sm text-gray-600">Redeem your access code to unlock exam content instantly</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
            Access Code
          </label>
          <input
            type="text"
            id="accessCode"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter your access code (e.g., ABC123)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg font-mono tracking-wider"
            disabled={loading}
            maxLength={8}
          />
        </div>

        {message.text && (
          <div className={`flex items-center p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Redeeming Code...
            </>
          ) : (
            <>
              <Gift className="h-4 w-4 mr-2" />
              Redeem Access Code
            </>
          )}
        </Button>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>• Access codes are single-use and expire after the specified time</p>
        <p>• Contact support if you have issues redeeming your code</p>
      </div>
    </div>
  );
};
