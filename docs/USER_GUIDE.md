# User Guide - Quotation Management System

## 📖 Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Client Management](#client-management)
4. [Quotation Management](#quotation-management)
5. [Invoice Management](#invoice-management)
6. [User Management](#user-management)
7. [System Settings](#system-settings)
8. [Email Templates](#email-templates)
9. [Profile Management](#profile-management)
10. [Troubleshooting](#troubleshooting)

## 🚀 Getting Started

### First Login
1. **Access the System**: Navigate to your system URL
2. **Login**: Use your provided credentials
3. **Change Password**: Update your password on first login
4. **Complete Profile**: Fill in your profile information

### Navigation
- **Sidebar**: Main navigation menu on the left
- **Header**: User profile and notifications
- **Breadcrumbs**: Current page location
- **Quick Actions**: Common tasks accessible from any page

## 📊 Dashboard Overview

### Key Metrics
- **Total Quotations**: Number of quotations created
- **Pending Approvals**: Quotations awaiting approval
- **Revenue**: Total revenue from approved quotations
- **Active Clients**: Number of active clients

### Recent Activity
- **Latest Quotations**: Recently created quotations
- **Recent Invoices**: Recently generated invoices
- **System Notifications**: Important system updates

### Quick Actions
- **Create Quotation**: Start a new quotation
- **Add Client**: Add a new client
- **Generate Report**: Create system reports
- **View Analytics**: Access detailed analytics

## 👥 Client Management

### Adding a New Client
1. **Navigate**: Go to Clients → Add New Client
2. **Basic Information**:
   - Company Name (required)
   - Contact Person (required)
   - Email Address (required)
   - Phone Number
3. **Address Information**:
   - Street Address
   - City, State, ZIP Code
   - Country
4. **Additional Details**:
   - Tax ID
   - Custom Fields (if configured)
5. **Save**: Click "Save Client" to create

### Managing Existing Clients
1. **View Client List**: Go to Clients page
2. **Search**: Use search bar to find specific clients
3. **Filter**: Apply filters by status, date, etc.
4. **Edit**: Click on client name to edit details
5. **Delete**: Remove inactive clients (Admin only)

### Client Details View
- **Contact Information**: All client contact details
- **Quotation History**: List of all quotations for this client
- **Invoice History**: List of all invoices for this client
- **Notes**: Add internal notes about the client

## 📋 Quotation Management

### Creating a New Quotation
1. **Start Creation**: Go to Quotations → Create New
2. **Select Client**: Choose from existing clients or add new
3. **Basic Information**:
   - Quotation Title
   - Description
   - Valid Until Date
4. **Add Items**:
   - Item Name
   - Description
   - Quantity
   - Unit Price
   - Tax Rate (if applicable)
5. **Calculate Totals**: System automatically calculates:
   - Subtotal
   - Tax Amount
   - Total Amount
6. **Save**: Save as draft or send immediately

### Quotation Status Workflow
1. **Draft**: Initial creation, can be edited
2. **Pending**: Sent to client, awaiting response
3. **Approved**: Client approved the quotation
4. **Rejected**: Client rejected the quotation
5. **Expired**: Quotation past valid date

### Quotation Actions
- **Edit**: Modify quotation details
- **Duplicate**: Create a copy of existing quotation
- **Send Email**: Email quotation to client
- **Download PDF**: Generate PDF version
- **Convert to Invoice**: Create invoice from approved quotation
- **Delete**: Remove quotation (Admin only)

### Advanced Quotation Features
- **Templates**: Use pre-configured quotation templates
- **Custom Fields**: Add client-specific fields
- **Tax Calculations**: Automatic tax calculations
- **Multi-Currency**: Support for different currencies
- **Bulk Operations**: Process multiple quotations

## 🧾 Invoice Management

### Creating an Invoice
1. **From Quotation**: Convert approved quotation to invoice
2. **Manual Creation**: Create invoice from scratch
3. **Invoice Details**:
   - Invoice Number (auto-generated)
   - Client Information
   - Invoice Date
   - Due Date
   - Payment Terms

### Invoice Types
1. **Tax Invoice 1**: Standard tax invoice
2. **Tax Invoice 2**: Special tax invoice
3. **Tax Invoice 3**: Custom tax invoice

### Invoice Status
- **Pending**: Created but not sent
- **Sent**: Emailed to client
- **Paid**: Payment received
- **Overdue**: Past due date
- **Cancelled**: Invoice cancelled

### Invoice Actions
- **Send Email**: Email invoice to client
- **Download PDF**: Generate PDF version
- **Mark as Paid**: Update payment status
- **Send Reminder**: Send payment reminder
- **Print**: Print invoice

## 👤 User Management

### User Roles
1. **Super Admin**: Full system access
2. **Admin**: User management and system settings
3. **Manager**: Team management and approvals
4. **User**: Basic operations and quotations

### Adding New Users
1. **Navigate**: Go to Users → Add New User
2. **User Information**:
   - First Name, Last Name
   - Email Address
   - Role Assignment
   - Custom Permissions (if needed)
3. **Send Invitation**: System sends login credentials
4. **Activate**: User activates account on first login

### Managing User Permissions
1. **Role-Based**: Assign users to roles
2. **Custom Permissions**: Override role permissions
3. **Resource Access**: Control access to specific resources
4. **Action Permissions**: Control specific actions

### User Status
- **Active**: User can access system
- **Inactive**: User account disabled
- **Pending**: Awaiting activation
- **Suspended**: Temporarily disabled

## ⚙️ System Settings

### Company Settings
1. **Company Information**:
   - Company Name
   - Address
   - Contact Information
   - Tax ID
   - Logo Upload

2. **Business Settings**:
   - Default Currency
   - Tax Rates
   - Payment Terms
   - Quotation Validity

### Email Configuration
1. **SMTP Settings**:
   - Email Host
   - Port Number
   - Security Settings
   - Authentication

2. **Email Templates**:
   - Quotation Templates
   - Invoice Templates
   - Notification Templates
   - Custom Templates

### Tax Configuration
1. **Tax Types**:
   - GST (Goods and Services Tax)
   - PST (Provincial Sales Tax)
   - Custom Tax Rates

2. **Tax Calculations**:
   - Automatic Calculations
   - Manual Override
   - Tax Exemptions

### Notification Settings
1. **Email Notifications**:
   - Quotation Status Changes
   - Invoice Reminders
   - System Alerts
   - User Activities

2. **System Notifications**:
   - Dashboard Alerts
   - Pop-up Notifications
   - Email Summaries

## 📧 Email Templates

### Template Types
1. **Quotation Templates**:
   - Quotation Sent
   - Quotation Approved
   - Quotation Rejected
   - Quotation Reminder

2. **Invoice Templates**:
   - Invoice Sent
   - Payment Reminder
   - Payment Received
   - Overdue Notice

3. **System Templates**:
   - User Welcome
   - Password Reset
   - System Notifications

### Customizing Templates
1. **Template Editor**: Visual template editor
2. **Variables**: Dynamic content insertion
3. **Styling**: Custom CSS styling
4. **Preview**: Test template appearance

### Template Variables
- **Client Variables**: {{clientName}}, {{clientEmail}}
- **Quotation Variables**: {{quotationNumber}}, {{totalAmount}}
- **Invoice Variables**: {{invoiceNumber}}, {{dueDate}}
- **System Variables**: {{companyName}}, {{currentDate}}

## 👤 Profile Management

### Personal Information
1. **Basic Details**:
   - First Name, Last Name
   - Email Address (read-only)
   - Phone Number
   - Profile Picture

2. **Account Settings**:
   - Change Password
   - Two-Factor Authentication
   - Login History
   - Session Management

### Preferences
1. **Display Settings**:
   - Language
   - Timezone
   - Date Format
   - Currency Display

2. **Notification Preferences**:
   - Email Notifications
   - Dashboard Alerts
   - Mobile Notifications

## 🔧 Troubleshooting

### Common Issues

#### Login Problems
- **Forgot Password**: Use "Forgot Password" link
- **Account Locked**: Contact administrator
- **Invalid Credentials**: Check username/password

#### Quotation Issues
- **Cannot Create Quotation**: Check permissions
- **PDF Generation Fails**: Check file permissions
- **Email Not Sending**: Verify email settings

#### Invoice Problems
- **Cannot Generate Invoice**: Ensure quotation is approved
- **Tax Calculations Wrong**: Check tax settings
- **PDF Issues**: Verify PDF generation settings

### Getting Help
1. **System Documentation**: Check this guide
2. **Contact Support**: Email support team
3. **System Logs**: Check error logs
4. **User Forums**: Community support

### Best Practices
1. **Regular Backups**: Ensure data is backed up
2. **Password Security**: Use strong passwords
3. **System Updates**: Keep system updated
4. **User Training**: Train users on system features

## 📞 Support Contacts

- **Technical Support**: support@yourcompany.com
- **System Administrator**: admin@yourcompany.com
- **Emergency Support**: +1-XXX-XXX-XXXX
- **Documentation**: docs.yourcompany.com

---

*This user guide is regularly updated. Check for the latest version in the system documentation section.*
