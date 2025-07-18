"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { paymentManager } from "@/lib/payment";
import {
  CreditCard,
  Gift,
  CheckCircle,
  Clock,
  Star,
  Users,
  BookOpen,
  Brain,
  Loader2,
  AlertCircle
} from "lucide-react";

interface PaymentComponentProps {
  onAccessGranted: (accessDetails: any) => void;
}

export function PaymentComponent({ onAccessGranted }: PaymentComponentProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'purchase' | 'redeem'>('purchase');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const products = paymentManager.getAvailableProducts();

  const handlePurchase = async (productId: string) => {
    if (!user?.email) {
      setError('Please sign in to make a purchase');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const session = await paymentManager.createPaymentSession(productId, user.email);
      
      if (!session.success) {
        setError(session.error || 'Failed to create payment session');
        return;
      }

      // Redirect to Stripe Checkout
      const redirectSuccess = await paymentManager.redirectToCheckout(session.sessionId);
      
      if (!redirectSuccess) {
        setError('Failed to redirect to payment');
      }

    } catch (error) {
      setError('Payment initialization failed');
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!user?.uid) {
      setError('Please sign in to redeem access code');
      return;
    }

    if (!accessCode.trim()) {
      setError('Please enter an access code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // First validate the code
      const validation = await paymentManager.validateAccessCode(accessCode);
      
      if (!validation.valid) {
        setError(validation.error || 'Invalid access code');
        return;
      }

      // Redeem the code
      const redemption = await paymentManager.redeemAccessCode(accessCode, user.uid);
      
      if (redemption.success) {
        setSuccess(redemption.message || 'Access code redeemed successfully!');
        setAccessCode('');
        onAccessGranted(validation.accessCode);
      } else {
        setError(redemption.error || 'Failed to redeem access code');
      }

    } catch (error) {
      setError('Failed to redeem access code');
      console.error('Redemption error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Get Access to Premium Exam Questions
        </h1>
        <p className="text-lg text-gray-600">
          Choose your preferred method to access our comprehensive question banks
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('purchase')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'purchase'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CreditCard className="h-4 w-4 inline mr-2" />
            Purchase Access
          </button>
          <button
            onClick={() => setActiveTab('redeem')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'redeem'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Gift className="h-4 w-4 inline mr-2" />
            Redeem Code
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            {success}
          </p>
        </div>
      )}

      {/* Purchase Tab */}
      {activeTab === 'purchase' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-xl shadow-lg border-2 p-6 relative ${
                product.id.includes('complete') 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {product.id.includes('complete') && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {product.description}
                </p>
                <div className="text-3xl font-bold text-blue-600">
                  {paymentManager.formatPrice(product.price, product.currency)}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <BookOpen className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">Papers</div>
                  <div className="font-semibold">{product.papers.length}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <Clock className="h-4 w-4 text-green-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">Days</div>
                  <div className="font-semibold">{product.validityDays}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <Brain className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">AI Help</div>
                  <div className="font-semibold">Yes</div>
                </div>
              </div>

              <Button
                onClick={() => handlePurchase(product.id)}
                disabled={loading}
                className={`w-full ${
                  product.id.includes('complete')
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-800 hover:bg-gray-900'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Purchase Now
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Redeem Code Tab */}
      {activeTab === 'redeem' && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Redeem Access Code
              </h2>
              <p className="text-gray-600">
                Enter your access code to unlock exam questions
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Code
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono tracking-wider"
                  maxLength={14}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: XXXX-XXXX-XXXX (dashes are optional)
                </p>
              </div>

              <Button
                onClick={handleRedeemCode}
                disabled={loading || !accessCode.trim()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redeeming...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Redeem Code
                  </>
                )}
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                How to get an access code:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Purchase directly from our website</li>
                <li>• Receive from your institution</li>
                <li>• Get from promotional campaigns</li>
                <li>• Contact support for assistance</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Trust Indicators */}
      <div className="mt-12 text-center">
        <div className="flex justify-center items-center space-x-8 text-gray-500">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            <span className="text-sm">10,000+ Students</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="text-sm">Secure Payment</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            <span className="text-sm">Instant Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
