'use client';

import { useState, useEffect } from 'react';
import { Download, Printer, FileText, CheckCircle, Calendar, CreditCard, User, Building2, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '@/lib/api';

interface Payment {
  id: number;
  amount: number;
  status: string;
  purpose: 'deposit' | 'balance';
  payment_method: string;
  transaction_id?: string;
  payment_reference?: string;
  paid_at?: string;
  created_at: string;
}

interface PaymentReceiptProps {
  bookingId: number;
  booking: {
    id: number;
    check_in: string;
    check_out: string;
    guests: number;
    total_price: number;
    accommodation: {
      id: number;
      name: string;
      city: string;
      address?: string;
    };
    user?: {
      id: number;
      name: string;
      email: string;
      phone?: string;
    };
  };
  userRole: 'user' | 'host';
  payments?: Payment[];
}

export default function PaymentReceipt({ bookingId, booking, userRole, payments: initialPayments }: PaymentReceiptProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments || []);
  const [loading, setLoading] = useState(!initialPayments);

  useEffect(() => {
    if (!initialPayments) {
      fetchPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Récupérer les paiements depuis l'API
      const response = await api.get(`/bookings/${bookingId}`);
      const bookingData = response.data;
      
      // Si l'API retourne les paiements directement (relation payments)
      if (bookingData.payments && Array.isArray(bookingData.payments)) {
        setPayments(bookingData.payments.filter((p: Payment) => p.status === 'completed'));
      } 
      // Si l'API retourne un seul paiement (relation payment)
      else if (bookingData.payment && bookingData.payment.status === 'completed') {
        setPayments([bookingData.payment]);
      } 
      // Sinon, essayer de récupérer depuis une route dédiée
      else {
        try {
          const paymentsResponse = await api.get(`/bookings/${bookingId}/payments`);
          if (Array.isArray(paymentsResponse.data)) {
            setPayments(paymentsResponse.data.filter((p: Payment) => p.status === 'completed'));
          } else if (paymentsResponse.data.payments) {
            setPayments(paymentsResponse.data.payments.filter((p: Payment) => p.status === 'completed'));
          } else {
            setPayments([]);
          }
        } catch (err) {
          // Si pas de route dédiée, on utilise les données de la réservation
          setPayments([]);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des paiements:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const receiptContent = generateReceiptHTML();
    const blob = new Blob([receiptContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recu-paiement-${booking.id}-${format(new Date(), 'yyyy-MM-dd')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateReceiptHTML = () => {
    const completedPayments = payments.filter(p => p.status === 'completed');
    const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reçu de paiement - Réservation #${booking.id}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .info-label {
      font-weight: bold;
      color: #666;
    }
    .total {
      font-size: 18px;
      font-weight: bold;
      color: #2563eb;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #333;
    }
    .payment-item {
      background: #f5f5f5;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 5px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>REÇU DE PAIEMENT</h1>
    <p>Mon Beau Pays - Plateforme de réservation</p>
  </div>

  <div class="section">
    <h2>Informations de la réservation</h2>
    <div class="info-row">
      <span class="info-label">Numéro de réservation:</span>
      <span>#${booking.id}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Hébergement:</span>
      <span>${booking.accommodation.name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Ville:</span>
      <span>${booking.accommodation.city}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Dates:</span>
      <span>${format(new Date(booking.check_in), 'dd MMMM yyyy', { locale: fr })} - ${format(new Date(booking.check_out), 'dd MMMM yyyy', { locale: fr })}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Nombre de voyageurs:</span>
      <span>${booking.guests}</span>
    </div>
  </div>

  ${userRole === 'host' && booking.user ? `
  <div class="section">
    <h2>Informations du client</h2>
    <div class="info-row">
      <span class="info-label">Nom:</span>
      <span>${booking.user.name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Email:</span>
      <span>${booking.user.email}</span>
    </div>
    ${booking.user.phone ? `
    <div class="info-row">
      <span class="info-label">Téléphone:</span>
      <span>${booking.user.phone}</span>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <div class="section">
    <h2>Détails des paiements</h2>
    ${completedPayments.map((payment, index) => `
    <div class="payment-item">
      <div class="info-row">
        <span class="info-label">Paiement #${index + 1}</span>
        <span>${formatPrice(payment.amount)} FCFA</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type:</span>
        <span>${payment.purpose === 'deposit' ? 'Acompte' : 'Solde'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Méthode:</span>
        <span>${payment.payment_method || 'Non spécifiée'}</span>
      </div>
      ${payment.transaction_id ? `
      <div class="info-row">
        <span class="info-label">Transaction ID:</span>
        <span>${payment.transaction_id}</span>
      </div>
      ` : ''}
      ${payment.payment_reference ? `
      <div class="info-row">
        <span class="info-label">Référence:</span>
        <span>${payment.payment_reference}</span>
      </div>
      ` : ''}
      ${payment.paid_at ? `
      <div class="info-row">
        <span class="info-label">Date de paiement:</span>
        <span>${format(new Date(payment.paid_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</span>
      </div>
      ` : ''}
    </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="info-row">
      <span class="info-label">Montant total de la réservation:</span>
      <span>${formatPrice(booking.total_price)} FCFA</span>
    </div>
    <div class="info-row">
      <span class="info-label">Montant total payé:</span>
      <span>${formatPrice(totalPaid)} FCFA</span>
    </div>
    <div class="total">
      <div class="info-row">
        <span>Solde restant:</span>
        <span>${formatPrice(booking.total_price - totalPaid)} FCFA</span>
      </div>
    </div>
  </div>

  <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
    <p>Reçu généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
    <p>Ce document fait foi de paiement</p>
  </div>
</body>
</html>
    `;
  };

  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (completedPayments.length === 0) {
    return null;
  }

  return (
    <div className="card print:shadow-none">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Reçu de paiement</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Réservation #{booking.id}
            </p>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <button
            onClick={handleDownload}
            className="btn-outline flex items-center gap-2 text-sm"
            title="Télécharger le reçu"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Télécharger</span>
          </button>
          <button
            onClick={handlePrint}
            className="btn-outline flex items-center gap-2 text-sm"
            title="Imprimer le reçu"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimer</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Informations de la réservation */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Hébergement
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Nom:</span>
              <span className="font-medium">{booking.accommodation.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Ville:
              </span>
              <span className="font-medium">{booking.accommodation.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Dates:
              </span>
              <span className="font-medium text-right">
                {format(new Date(booking.check_in), 'dd MMM yyyy', { locale: fr })} - {' '}
                {format(new Date(booking.check_out), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Voyageurs:</span>
              <span className="font-medium">{booking.guests}</span>
            </div>
          </div>
        </div>

        {/* Informations du client (pour les hôtes) */}
        {userRole === 'host' && booking.user && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Client
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Nom:</span>
                <span className="font-medium">{booking.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-medium break-all">{booking.user.email}</span>
              </div>
              {booking.user.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Téléphone:</span>
                  <span className="font-medium">{booking.user.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Détails des paiements */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            Paiements effectués
          </h4>
          <div className="space-y-3">
            {completedPayments.map((payment, index) => (
              <div
                key={payment.id}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold">
                      Paiement #{index + 1} - {payment.purpose === 'deposit' ? 'Acompte' : 'Solde'}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(payment.amount)} FCFA
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Méthode:</span>
                    <span className="ml-2 font-medium">{payment.payment_method || 'Non spécifiée'}</span>
                  </div>
                  {payment.transaction_id && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                      <span className="ml-2 font-medium font-mono text-xs">{payment.transaction_id}</span>
                    </div>
                  )}
                  {payment.payment_reference && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Référence:</span>
                      <span className="ml-2 font-medium font-mono text-xs">{payment.payment_reference}</span>
                    </div>
                  )}
                  {payment.paid_at && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Date:</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(payment.paid_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Récapitulatif */}
        <div className="pt-4 border-t-2 border-gray-300 dark:border-gray-600">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Montant total de la réservation:</span>
              <span className="font-medium">{formatPrice(booking.total_price)} FCFA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Montant total payé:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatPrice(totalPaid)} FCFA
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Solde restant:</span>
              <span className={booking.total_price - totalPaid > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                {formatPrice(booking.total_price - totalPaid)} FCFA
              </span>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="text-xs text-gray-500 dark:text-gray-500 text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <p>Reçu généré le {format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
          <p className="mt-1">Ce document fait foi de paiement</p>
        </div>
      </div>
    </div>
  );
}
