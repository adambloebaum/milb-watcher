// Carrier Email to SMS Gateway Information
// This file contains the mapping of carrier names to their email-to-SMS gateway domains

module.exports = {
  att: 'txt.att.net',        // AT&T
  tmobile: 'tmomail.net',    // T-Mobile
  verizon: 'vtext.com',      // Verizon
  sprint: 'messaging.sprintpcs.com', // Sprint
  boost: 'sms.myboostmobile.com',    // Boost Mobile
  cricket: 'sms.cricketwireless.net', // Cricket Wireless
  uscellular: 'email.uscc.net',      // US Cellular
  metro: 'mymetropcs.com',           // Metro PCS
  virgin: 'vmobl.com',               // Virgin Mobile
  xfinity: 'vtext.com',              // Xfinity Mobile (uses Verizon)
  
  // International carriers
  rogers: 'pcs.rogers.com',   // Rogers (Canada)
  bell: 'txt.bell.ca',        // Bell (Canada)
  telus: 'msg.telus.com',     // Telus (Canada)
  
  // Add more carriers as needed
  
  // Function to get email address for a phone number and carrier
  getEmailAddress: function(phoneNumber, carrier) {
    const carrierDomain = this[carrier.toLowerCase()];
    if (!carrierDomain) {
      console.error(`Unknown carrier: ${carrier}. Using Verizon as default.`);
      return `${phoneNumber}@vtext.com`;
    }
    return `${phoneNumber}@${carrierDomain}`;
  }
}; 