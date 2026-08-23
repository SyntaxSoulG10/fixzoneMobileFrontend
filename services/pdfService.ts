import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { bookingService, BookingResponseDTO } from './bookingService';
import { vehicleService } from './vehicleService';
import { serviceCenterService } from './serviceCenterService';
import { authService } from './authService';
import { request } from './api';

export interface InvoiceBackendDTO {
  invoiceId: string;
  companyCode?: string;
  centerId: string;
  bookingId: string;
  issuedToCustomerId: string;
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  status?: string;
  issuedAt?: string;
}

let isGeneratingPDF = false;

export const downloadInvoicePDF = async (bookingIdOrBooking: string | BookingResponseDTO): Promise<void> => {
  if (isGeneratingPDF) {
    return;
  }
  isGeneratingPDF = true;

  try {
    let booking: BookingResponseDTO;

    if (typeof bookingIdOrBooking === 'string') {
      booking = await bookingService.getBookingById(bookingIdOrBooking);
    } else {
      booking = bookingIdOrBooking;
    }

    // Fetch related vehicle, service center, user details, and DB invoice in parallel
    const [vehicleData, centerData, profileData, dbInvoice] = await Promise.all([
      vehicleService.getVehicleById(booking.vehicleId).catch(() => null),
      serviceCenterService.getServiceCenterById(booking.centerId).catch(() => null),
      authService.getProfile().catch(() => null),
      request<InvoiceBackendDTO>(`/invoices/booking/${booking.bookingId}`).catch(() => null),
    ]);

    const centerName = centerData?.name || 'FixZone Service Center';
    const centerAddress = centerData?.address || '125, Galle Road, Colombo 03';
    const centerPhone = centerData?.contactPhone || '+94 (11) 234-5678';
    const centerEmail = (centerData as any)?.email || 'contact@fixzone.lk';

    const fullName = profileData ? `${profileData.firstName || ''} ${profileData.secondName || ''}`.trim() : '';
    const customerName = fullName || (booking.customerId ? `Customer ${booking.customerId.substring(0, 6)}` : 'Valued Customer');
    const customerIdDisplay = booking.customerId ? booking.customerId.substring(0, 8) : 'N/A';

    const vehicleDisplay = vehicleData 
      ? `${vehicleData.brand} ${vehicleData.model} (${vehicleData.plateNumber})`
      : 'Registered Vehicle';

    const bookingRef = booking.bookingId ? booking.bookingId.substring(0, 8).toUpperCase() : 'REF-0000';
    const invoiceNo = `INV-${bookingRef}`;

    const dateToUse = dbInvoice?.issuedAt || booking.bookingDate;
    const formattedDate = dateToUse
      ? new Date(dateToUse).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Financial Breakdown
    const packageName = booking.packageName || 'Vehicle Maintenance Package';
    const basePrice = booking.estimatedCost || 0;
    
    // 1. Fetch subtotal from DB (fallback to base estimated cost)
    const subtotal = dbInvoice?.subtotal != null ? dbInvoice.subtotal : basePrice;

    // 2. Fetch discount from DB (fallback to 0)
    const discount = dbInvoice?.discount != null ? dbInvoice.discount : 0;

    // 3. Fetch advance fee paid (booking fee)
    const advancePaid = booking.bookingFee != null ? booking.bookingFee : (basePrice * 0.40);

    // 4. Calculate Balance Paid: subtotal - discount - advancePaid
    const balancePaid = Math.max(0, subtotal - discount - advancePaid);

    // Extra charges (if subtotal exceeds package base price)
    const extraCharges = subtotal > basePrice ? (subtotal - basePrice) : 0;

    // Construct HTML template matching the requested invoice structure
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #1E293B;
              background-color: #FFFFFF;
              margin: 0;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 35px;
            }
            .invoice-title {
              font-size: 36px;
              font-weight: 900;
              letter-spacing: -1px;
              margin: 0 0 10px 0;
              color: #0F172A;
            }
            .header-meta {
              font-size: 13px;
              color: #475569;
              line-height: 1.6;
            }
            .company-name {
              font-size: 22px;
              font-weight: 900;
              text-align: right;
              color: #0F172A;
              margin-bottom: 4px;
            }
            .company-info {
              font-size: 13px;
              color: #64748B;
              text-align: right;
              line-height: 1.5;
            }
            
            /* Bill To & Service Details Box */
            .bill-box {
              background-color: #F8FAFC;
              border-radius: 16px;
              padding: 22px;
              margin-bottom: 35px;
              border: 1px solid #E2E8F0;
            }
            .bill-table {
              width: 100%;
              border-collapse: collapse;
            }
            .box-title {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              color: #94A3B8;
              letter-spacing: 0.8px;
              margin-bottom: 8px;
            }
            .customer-name {
              font-size: 17px;
              font-weight: 800;
              color: #0F172A;
              margin-bottom: 6px;
            }
            .bill-detail {
              font-size: 13px;
              color: #475569;
              margin-bottom: 3px;
            }

            /* Line Items Table */
            .item-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 35px;
            }
            .item-table th {
              border-bottom: 2px solid #0F172A;
              padding-bottom: 10px;
              text-transform: uppercase;
              font-size: 11px;
              font-weight: 800;
              color: #64748B;
              letter-spacing: 0.5px;
            }
            .item-table td {
              padding: 16px 0;
              border-bottom: 1px solid #E2E8F0;
              vertical-align: top;
            }
            .item-name {
              font-size: 15px;
              font-weight: 800;
              color: #0F172A;
              margin-bottom: 4px;
            }
            .item-sub {
              font-size: 12px;
              color: #64748B;
            }
            .item-amount {
              font-size: 15px;
              font-weight: 800;
              color: #0F172A;
              text-align: right;
            }

            /* Totals Breakdown Container */
            .totals-wrapper {
              width: 100%;
              display: flex;
              justify-content: flex-end;
              margin-bottom: 40px;
            }
            .totals-container {
              width: 360px;
              background-color: #F8FAFC;
              border-radius: 16px;
              padding: 22px;
              border: 1px solid #E2E8F0;
              float: right;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-size: 13.5px;
              margin-bottom: 10px;
              color: #475569;
            }
            .total-row span {
              font-weight: 600;
            }
            .total-row b {
              color: #0F172A;
              font-weight: 800;
            }
            .advance-paid {
              color: #10B981 !important;
            }
            .final-paid-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 2px dashed #CBD5E1;
              padding-top: 14px;
              margin-top: 12px;
            }
            .final-paid-label {
              font-size: 13px;
              font-weight: 900;
              color: #0F172A;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .final-paid-amount {
              font-size: 26px;
              font-weight: 900;
              color: #0F172A;
            }

            /* Footer */
            .footer-text {
              margin-top: 60px;
              text-align: center;
              font-size: 12px;
              color: #94A3B8;
              font-weight: 600;
              clear: both;
            }
          </style>
        </head>
        <body>
          <!-- Top Header -->
          <table class="header-table">
            <tr>
              <td style="vertical-align: top;">
                <h1 class="invoice-title">INVOICE</h1>
                <div class="header-meta">
                  <b>Invoice No.</b> &nbsp;&nbsp;&nbsp;&nbsp; ${invoiceNo}<br />
                  <b>Date</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formattedDate}
                </div>
              </td>
              <td style="vertical-align: top;">
                <div class="company-name">${centerName}</div>
                <div class="company-info">${centerAddress}</div>
                <div class="company-info">${centerEmail}</div>
                <div class="company-info">${centerPhone}</div>
              </td>
            </tr>
          </table>

          <!-- Bill To & Service Details Box -->
          <div class="bill-box">
            <table class="bill-table">
              <tr>
                <td style="vertical-align: top; width: 60%;">
                  <div class="box-title">BILL TO</div>
                  <div class="customer-name">${customerName}</div>
                  <div class="bill-detail">Vehicle: <b>${vehicleDisplay}</b></div>
                  <div class="bill-detail">Customer ID: <b>${customerIdDisplay}</b></div>
                </td>
                <td style="vertical-align: top; width: 40%;">
                  <div class="box-title">SERVICE DETAILS</div>
                  <div class="bill-detail">Center: <b>${centerName}</b></div>
                  <div class="bill-detail">Booking Ref: <b>${bookingRef}</b></div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Description & Amount Table -->
          <table class="item-table">
            <thead>
              <tr>
                <th style="text-align: left;">DESCRIPTION</th>
                <th style="text-align: right;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="item-name">${packageName}</div>
                  <div class="item-sub">Base maintenance and labor cost</div>
                </td>
                <td class="item-amount">Rs ${basePrice.toLocaleString()}.00</td>
              </tr>
            </tbody>
          </table>

          <!-- Totals Breakdown -->
          <div class="totals-wrapper">
            <div class="totals-container">
              <div class="total-row">
                <span>Subtotal</span>
                <b>Rs ${subtotal.toLocaleString()}.00</b>
              </div>
              <div class="total-row" style="color: #EA580C;">
                <span>Special Discount</span>
                <b>- Rs ${discount.toLocaleString()}.00</b>
              </div>
              <div class="total-row">
                <span>Advance Fee Paid</span>
                <b class="advance-paid">- Rs ${advancePaid.toLocaleString()}.00</b>
              </div>
              <div class="final-paid-row">
                <span class="final-paid-label">BALANCE PAID</span>
                <span class="final-paid-amount">Rs ${balancePaid.toLocaleString()}.00</span>
              </div>
            </div>
          </div>

          <!-- Footer Message -->
          <div class="footer-text">
            Thank you for choosing ${centerName}. We appreciate your business!
          </div>
        </body>
      </html>
    `;

    // Render HTML to PDF file
    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    // Share/Save PDF using OS native dialog
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Invoice_${invoiceNo}.pdf`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('PDF Generated', `Invoice PDF generated successfully at:\n${uri}`);
    }
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    Alert.alert('Download Error', 'Could not generate invoice PDF. Please try again.');
  } finally {
    isGeneratingPDF = false;
  }
};
