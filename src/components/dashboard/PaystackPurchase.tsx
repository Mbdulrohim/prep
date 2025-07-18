"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { paystackService } from "@/lib/paystack";
import { CreditCard, CheckCircle, AlertCircle, Star, Zap } from "lucide-react";

export function PaystackPurchase() {
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('basic');

  const plans = {
    basic: {
      name: 'Basic Access',
      price: 2500, // 25 Naira
      originalPrice: 5000,
      features: [
        'Access to all exam categories',
        '10,000+ practice questions',
        'Basic explanations',
        'Progress tracking',
        '30 days access'
      ],
      description: 'Perfect for quick exam preparation',
      popular: false
    },
    premium: {
      name: 'Premium Access',
      price: 4000, // 40 Naira  
      originalPrice: 8000,
      features: [
        'Everything in Basic',
        'AI-powered explanations',
        'Advanced analytics',
        'Unlimited retakes',
        '90 days access',
        'Priority support',
        'Study reminders'
      ],
      description: 'Complete exam preparation package',
      popular: true
    }
  };

  const handlePayment = async () => {
    if (!user || !userProfile) {
      alert('Please complete your profile first');
      return;
    }

    setIsLoading(true);
    
    try {
      const plan = plans[selectedPlan];
      const amountInKobo = paystackService.nairaToKobo(plan.price);

      // Initialize payment with Paystack
      const response = await fetch('/api/create-payment-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: amountInKobo,
          planName: plan.name,
          userId: user.uid,
          metadata: {
            userId: user.uid,
            userEmail: user.email,
            userName: userProfile.displayName,
            university: userProfile.university,
            planType: selectedPlan,
            custom_fields: [
              {
                display_name: "Plan Type",
                variable_name: "plan_type",
                value: selectedPlan
              },
              {
                display_name: "University",
                variable_name: "university", 
                value: userProfile.university || 'Not specified'
              }
            ]
          }
        }),
      });

      const data = await response.json();

      if (data.status && data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      alert('Failed to start payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(plans) as Array<keyof typeof plans>).map((planKey) => {
            const plan = plans[planKey];
            const isSelected = selectedPlan === planKey;
            
            return (
              <div
                key={planKey}
                onClick={() => setSelectedPlan(planKey)}
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${plan.popular ? 'ring-2 ring-blue-200' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">₦{plan.price.toLocaleString()}</span>
                    <span className="text-lg text-gray-500 line-through ml-2">₦{plan.originalPrice.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                </div>
                
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Selected Plan:</span>
          <span className="font-medium">{plans[selectedPlan].name}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Original Price:</span>
          <span className="text-gray-500 line-through">₦{plans[selectedPlan].originalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Discount:</span>
          <span className="text-green-600 font-medium">
            -₦{(plans[selectedPlan].originalPrice - plans[selectedPlan].price).toLocaleString()}
          </span>
        </div>
        <div className="border-t border-gray-300 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-blue-600">₦{plans[selectedPlan].price.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-900 font-medium mb-1">Secure Payment</p>
            <p className="text-blue-800">
              Your payment is processed securely by Paystack. We support all major banks, 
              mobile money, and card payments. No additional charges apply.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <Button 
        onClick={handlePayment} 
        disabled={isLoading} 
        className="w-full py-4 text-lg font-semibold"
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Initializing Payment...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <CreditCard className="mr-3 h-5 w-5" />
            Pay ₦{plans[selectedPlan].price.toLocaleString()} with Paystack
            <Zap className="ml-2 h-4 w-4" />
          </div>
        )}
      </Button>

      {/* Payment Methods */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Accepted payment methods:</p>
        <div className="flex justify-center items-center space-x-4 text-xs text-gray-500">
          <span>💳 Debit/Credit Cards</span>
          <span>🏦 Bank Transfer</span>
          <span>📱 Mobile Money</span>
          <span>*️⃣ USSD</span>
        </div>
      </div>
    </div>
  );
}
