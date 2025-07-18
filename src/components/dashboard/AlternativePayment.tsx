"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { 
  CreditCard, 
  Smartphone, 
  QrCode, 
  AlertCircle,
  CheckCircle,
  Phone,
  Globe,
  Building,
  Users,
  Star,
  Shield,
  ArrowRight,
  Copy,
  ExternalLink,
  Clock
} from "lucide-react";

interface AlternativePaymentProps {
  isOpen: boolean;
  onClose: () => void;
  examCategory: string;
  papers: string[];
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  processingTime: string;
  available: boolean;
  instructions: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
}

export const AlternativePayment: React.FC<AlternativePaymentProps> = ({
  isOpen,
  onClose,
  examCategory,
  papers
}) => {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [paymentCode, setPaymentCode] = useState('');

  // Generate unique payment reference
  const generatePaymentCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const userCode = user?.email?.substring(0, 3).toUpperCase() || 'USR';
    const examCode = examCategory.substring(0, 2).toUpperCase();
    return `${examCode}-${userCode}-${timestamp}`;
  };

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'bank-transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer to our account',
      icon: <Building className="h-6 w-6" />,
      processingTime: '1-2 hours',
      available: true,
      instructions: [
        'Transfer ₦5,000 to the account below',
        'Use your payment reference as narration',
        'Send proof of payment via WhatsApp',
        'Wait for confirmation and access code'
      ],
      contactInfo: {
        whatsapp: '+234 123 456 7890'
      }
    },
    {
      id: 'mobile-money',
      name: 'Mobile Money',
      description: 'Opay, PalmPay, Kuda, or other mobile wallets',
      icon: <Smartphone className="h-6 w-6" />,
      processingTime: '30 minutes',
      available: true,
      instructions: [
        'Send ₦5,000 to our mobile money account',
        'Include your payment reference in the note',
        'Screenshot the transaction receipt',
        'Send screenshot via WhatsApp for instant activation'
      ],
      contactInfo: {
        whatsapp: '+234 123 456 7890'
      }
    },
    {
      id: 'ussd-code',
      name: 'USSD Banking',
      description: '*901# or other USSD codes',
      icon: <Phone className="h-6 w-6" />,
      processingTime: '1 hour',
      available: true,
      instructions: [
        'Dial your bank\'s USSD code (*901# for Access Bank)',
        'Transfer ₦5,000 to our account number',
        'Use your payment reference as beneficiary name',
        'Send confirmation message via WhatsApp'
      ],
      contactInfo: {
        whatsapp: '+234 123 456 7890'
      }
    },
    {
      id: 'pos-agent',
      name: 'POS Agent',
      description: 'Pay through any nearby POS agent',
      icon: <Users className="h-6 w-6" />,
      processingTime: '2-4 hours',
      available: true,
      instructions: [
        'Visit any trusted POS agent in your area',
        'Request to send ₦5,000 to our account',
        'Provide your payment reference to the agent',
        'Get receipt and send photo via WhatsApp'
      ],
      contactInfo: {
        whatsapp: '+234 123 456 7890'
      }
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      description: 'Bitcoin, USDT, or other crypto payments',
      icon: <Globe className="h-6 w-6" />,
      processingTime: '30 minutes',
      available: false,
      instructions: [
        'Contact us for crypto wallet address',
        'Send equivalent of ₦5,000 in your preferred crypto',
        'Include payment reference in transaction memo',
        'Wait for blockchain confirmation'
      ],
      contactInfo: {
        whatsapp: '+234 123 456 7890'
      }
    }
  ];

  const bankDetails = {
    bankName: 'Access Bank',
    accountNumber: '1234567890',
    accountName: 'NURSING EXAM PREP LTD',
    sortCode: '044'
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    const code = generatePaymentCode();
    setPaymentCode(code);
    setShowInstructions(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const openWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone.replace('+', '')}?text=${encodedMessage}`, '_blank');
  };

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);

  const whatsappMessage = `Hi! I want to pay for ${examCategory} exam access.
Payment Reference: ${paymentCode}
User Email: ${user?.email}
Exam Category: ${examCategory}
Papers: ${papers.join(', ')}
Amount: ₦5,000

I will send proof of payment shortly.`;

  if (!showInstructions) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Alternative Payment Methods">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Choose Payment Method
            </h3>
            <p className="text-gray-600">
              Select your preferred payment method to access {examCategory} exam
            </p>
          </div>

          {/* Pricing Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-900">Exam Access Package</h4>
                <p className="text-sm text-blue-700">
                  {examCategory} - {papers.join(' & ')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900">₦5,000</p>
                <p className="text-sm text-blue-600">One-time payment</p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  method.available 
                    ? 'hover:border-blue-300 hover:bg-blue-50' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => method.available && handleMethodSelect(method.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      method.available ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {method.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{method.name}</h4>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {method.processingTime}
                    </p>
                    <p className="text-xs text-gray-500">Processing time</p>
                  </div>
                </div>
                {!method.available && (
                  <div className="mt-2 text-xs text-gray-500">
                    Coming soon
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              What You Get
            </h4>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Access to 10,000+ exam questions
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                AI-powered study assistance
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                One-time exam attempt per paper
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Detailed performance analytics
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Access valid for 6 months
              </li>
            </ul>
          </div>

          {/* Support Note */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Having trouble? Contact our support team on WhatsApp
            </p>
            <Button
              variant="outline"
              onClick={() => openWhatsApp('+2341234567890', 'Hi! I need help with payment for exam access.')}
              className="mt-2"
            >
              <Phone className="h-4 w-4 mr-2" />
              Get Help
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Payment Instructions - ${selectedMethodData?.name}`}
    >
      <div className="space-y-6">
        {/* Payment Reference */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">
            Your Payment Reference
          </h4>
          <div className="flex items-center justify-between bg-white rounded border p-3">
            <code className="font-mono text-lg font-bold text-gray-900">
              {paymentCode}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(paymentCode)}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
          <p className="text-sm text-yellow-800 mt-2">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Include this reference in all communications and payments
          </p>
        </div>

        {/* Bank Details (for bank transfer) */}
        {selectedMethod === 'bank-transfer' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">Bank Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Bank Name:</span>
                <span className="font-medium text-blue-900">{bankDetails.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Account Number:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-medium text-blue-900">{bankDetails.accountNumber}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(bankDetails.accountNumber)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Account Name:</span>
                <span className="font-medium text-blue-900">{bankDetails.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Amount:</span>
                <span className="font-bold text-blue-900">₦5,000</span>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">
            Step-by-Step Instructions
          </h4>
          <div className="space-y-3">
            {selectedMethodData?.instructions.map((instruction, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-gray-700">{instruction}</p>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Contact */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-green-900">Send Proof of Payment</h4>
              <p className="text-sm text-green-700">
                Click below to send your payment details via WhatsApp
              </p>
            </div>
            <Button
              onClick={() => openWhatsApp(selectedMethodData?.contactInfo?.whatsapp || '', whatsappMessage)}
              className="bg-green-600 hover:bg-green-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Processing Info */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Processing time: {selectedMethodData?.processingTime}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowInstructions(false)}
            className="flex-1"
          >
            Back to Methods
          </Button>
          <Button
            onClick={onClose}
            className="flex-1"
          >
            I'll Pay Later
          </Button>
        </div>
      </div>
    </Modal>
  );
};
