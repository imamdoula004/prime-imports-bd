import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export interface InvoiceData {
    orderId: string;
    customerInfo: {
        name: string;
        phone: string;
        address: string;
        city: string;
    };
    items: {
        name: string;
        quantity: number;
        price: number;
    }[];
    pricing: {
        subtotal: number;
        deliveryFee: number;
        discount: number;
        total: number;
    };
    paymentMethod: string;
    paymentStatus?: string;
    status?: string;
    createdAt: any;
}

export const generateInvoicePDF = async (order: InvoiceData) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const isPaid = (order.paymentMethod === 'bkash' && order.paymentStatus === 'verified') || 
                   (order.paymentMethod === 'cod' && (order.status === 'Completed' || order.status === 'Delivered'));
    const paymentStatusLabel = isPaid ? 'PAID' : 'DUE';

    const date = order.createdAt?.toDate ? order.createdAt.toDate() : (order.createdAt instanceof Date ? order.createdAt : new Date());
    const formattedDate = format(date, 'dd MMM yyyy, hh:mm a');

    // Add Logo
    try {
        const logoImg = new Image();
        logoImg.src = '/brand_logo.jpeg';
        await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve; // Continue even if logo fails
        });
        if (logoImg.complete && logoImg.naturalWidth > 0) {
            doc.addImage(logoImg, 'JPEG', 20, 15, 20, 20, undefined, 'FAST');
        }
    } catch (e) {
        console.error('Error adding logo to PDF', e);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42); // brand-blue-900
    doc.text('PRIME IMPORTS', 45, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-400
    doc.text('PREMIUM GLOBAL SOURCING', 45, 31);

    // Invoice Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('INVOICE TO:', 20, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.text(order.customerInfo.name.toUpperCase(), 20, 61);
    doc.text(order.customerInfo.phone, 20, 66);
    doc.text(order.customerInfo.address.toUpperCase(), 20, 71);
    doc.text(order.customerInfo.city.toUpperCase(), 20, 76);

    // Order Details Side
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER DETAILS:', 130, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID: #${order.orderId.toUpperCase()}`, 130, 61);
    doc.text(`Date: ${formattedDate}`, 130, 66);
    doc.text(`Method: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'bKash Wallet'}`, 130, 71);

    // Watermark
    doc.saveGraphicsState();
    const gState = new (doc as any).GState({ opacity: 0.03 });
    doc.setGState(gState);
    
    // Add Logo Watermark if possible
    try {
        const watermarkImg = new Image();
        watermarkImg.src = '/brand_logo.jpeg';
        await new Promise((resolve) => {
            watermarkImg.onload = resolve;
            watermarkImg.onerror = resolve;
        });
        if (watermarkImg.complete && watermarkImg.naturalWidth > 0) {
            doc.addImage(watermarkImg, 'JPEG', 55, 120, 100, 100, undefined, 'FAST');
        }
    } catch (e) {}

    doc.setFontSize(50);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('PRIME IMPORTS', 40, 150, { angle: 45 });
    doc.restoreGraphicsState();

    // Table
    const tableData = order.items.map(item => [
        item.name.toUpperCase(),
        item.quantity.toString(),
        `BDT ${item.price.toLocaleString()}`,
        `BDT ${(item.price * item.quantity).toLocaleString()}`
    ]);

    autoTable(doc, {
        startY: 90,
        head: [['PRODUCT DESCRIPTION', 'QTY', 'UNIT PRICE', 'SUBTOTAL']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' }
        },
        styles: {
            fontSize: 8,
            font: 'helvetica',
            cellPadding: 4
        }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    const totalsX = 130;
    const valueX = 190;

    // Totals
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('ITEMS SUBTOTAL:', totalsX, finalY + 10);
    doc.setTextColor(15, 23, 42);
    doc.text(`BDT ${order.pricing.subtotal.toLocaleString()}`, valueX, finalY + 10, { align: 'right' });

    doc.setTextColor(100, 116, 139);
    doc.text('SHIPPING COST:', totalsX, finalY + 16);
    doc.setTextColor(15, 23, 42);
    doc.text(`BDT ${order.pricing.deliveryFee.toLocaleString()}`, valueX, finalY + 16, { align: 'right' });

    let currentY = finalY + 16;

    if (order.pricing.discount > 0) {
        currentY += 6;
        doc.setTextColor(5, 150, 105); // emerald-600
        doc.text('DISCOUNT:', totalsX, currentY);
        doc.text(`-BDT ${order.pricing.discount.toLocaleString()}`, valueX, currentY, { align: 'right' });
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('GRAND TOTAL:', totalsX, currentY + 10);
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(`BDT ${order.pricing.total.toLocaleString()}`, valueX, currentY + 10, { align: 'right' });

    // Payment Status Stamp
    doc.saveGraphicsState();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    if (isPaid) {
        doc.setTextColor(5, 150, 105); // emerald-600
        doc.setDrawColor(5, 150, 105);
    } else {
        doc.setTextColor(225, 29, 72); // rose-600
        doc.setDrawColor(225, 29, 72);
    }
    
    // Draw status badge
    const badgeText = paymentStatusLabel;
    const badgeWidth = 25;
    const badgeHeight = 8;
    const badgeX = valueX - badgeWidth;
    const badgeY = currentY + 15;
    
    doc.setLineWidth(0.5);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1, 1, 'D');
    doc.text(badgeText, badgeX + (badgeWidth/2), badgeY + 5.5, { align: 'center' });
    doc.restoreGraphicsState();


    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('This is a computer generated invoice. Thank you for choosing Prime Imports.', 105, 285, { align: 'center' });

    doc.save(`Invoice-${order.orderId.slice(0, 8).toUpperCase()}.pdf`);
};
