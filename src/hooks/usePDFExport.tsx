import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const usePDFExport = () => {
  const exportToPDF = useCallback(async (elementId: string, filename: string = 'organigramme') => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      // Configuration pour une meilleure qualité
      const canvas = await html2canvas(element, {
        scale: 2, // Améliore la résolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calculer les dimensions du PDF
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgHeight / imgWidth;
      
      // Format A4 en paysage pour les organigrammes larges
      const pageWidth = 297; // A4 landscape width in mm
      const pageHeight = 210; // A4 landscape height in mm
      
      let finalWidth = pageWidth - 20; // margins
      let finalHeight = finalWidth * ratio;
      
      // Si trop haut, ajuster
      if (finalHeight > pageHeight - 20) {
        finalHeight = pageHeight - 20;
        finalWidth = finalHeight / ratio;
      }

      const pdf = new jsPDF({
        orientation: finalWidth > finalHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Centrer l'image
      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      pdf.save(`${filename}.pdf`);
      
      return true;
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  }, []);

  return { exportToPDF };
};