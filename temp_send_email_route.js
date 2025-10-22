router.post('/:id/send-email', [
  validateUUIDParam('id'),
  requirePermission(PERMISSIONS.QUOTATIONS.READ)
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { departmentId } = req.body;
    const { prisma } = require('../config/database');
    const { canAccessRecord } = require('../middleware/userFiltering');
    const { generateQuotationPDF } = require('../services/pdfService');
    const { sendEmail, getTransporter } = require('../services/emailService');

    console.log(`🔄 Starting email send for quotation: ${id}`, departmentId ? `to department: ${departmentId}` : 'to all departments');

    // Get quotation with full details
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            department: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    console.log(`✅ Quotation found: ${quotation.quotationNumber}`);

    // Check access permissions
    const canAccess = await canAccessRecord(req, quotation.userId);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get company settings from database
    const companyData = await settingsService.getCompanySettings();

    // Generate PDF
    console.log('📄 Generating PDF...');
    const pdfResult = await generateQuotationPDF(
      quotation,
      quotation.client,
      quotation.user,
      companyData
    );

    if (!pdfResult || !pdfResult.pdf) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF'
      });
    }

    console.log('✅ PDF generated successfully');

    // Get target clients based on department selection
    let targetClients = [];
    
    if (departmentId) {
      // Send to specific department
      console.log(`📧 Sending to department: ${departmentId}`);
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        include: {
          clients: {
            where: {
              email: { not: null },
              isActive: true
            }
          }
        }
      });
      
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
      
      targetClients = department.clients;
      console.log(`📧 Found ${targetClients.length} clients in department: ${department.name}`);
    } else {
      // Send to all departments
      console.log('📧 Sending to all departments');
      targetClients = await prisma.client.findMany({
        where: {
          email: { not: null },
          isActive: true
        }
      });
      console.log(`📧 Found ${targetClients.length} total clients`);
    }

    if (targetClients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No clients found to send email to'
      });
    }

    // Send emails to all target clients
    console.log(`📧 Sending emails to ${targetClients.length} clients...`);
    
    const emailResults = [];
    const failedEmails = [];
    
    for (const client of targetClients) {
      try {
        console.log(`📧 Sending to: ${client.email}`);
        
        // Use existing sendQuotationEmail function for each client
        const { sendQuotationEmail } = require('../services/emailService');
        const emailResult = await sendQuotationEmail(
          quotation,
          client,
          pdfResult.pdf
        );
        
        emailResults.push({
          clientId: client.id,
          email: client.email,
          success: true,
          messageId: emailResult.messageId
        });
        
        console.log(`✅ Email sent to ${client.email}`);
        
      } catch (clientError) {
        console.error(`❌ Failed to send email to ${client.email}:`, clientError.message);
        failedEmails.push({
          clientId: client.id,
          email: client.email,
          error: clientError.message
        });
      }
    }

    // Update quotation status
    console.log('💾 Updating quotation status...');
    await prisma.quotation.update({
      where: { id },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Quotation status updated');

    const successCount = emailResults.length;
    const failureCount = failedEmails.length;
    
    res.json({
      success: true,
      message: `Quotation email sent to ${successCount} clients${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      data: {
        totalSent: successCount,
        totalFailed: failureCount,
        successfulEmails: emailResults,
        failedEmails: failedEmails,
        departmentId: departmentId || null
      }
    });

  } catch (error) {
    console.error('❌ Error sending quotation email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send quotation email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Email sending failed'
    });
  }
});
