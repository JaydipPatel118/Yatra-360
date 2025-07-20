const { MailSlurp } = require('mailslurp-client');
const mailslurp = new MailSlurp({ apiKey: 'b4d991203f2397c45a8d9f0229aec2539bee542be53055f977169efaa4fc0697' });

Cypress.Commands.add('createInbox', () => {
  return mailslurp.createInbox();
});

Cypress.Commands.add('waitForOtpEmail', (inboxId) => {
  // Wait for the latest email and extract OTP (adjust regex as needed)
  return mailslurp.waitForLatestEmail(inboxId, 60000, true).then(email => {
    const match = email.body.match(/\d{4,8}/);
    if (!match) {
      throw new Error('OTP not found in email body: ' + email.body);
    }
    const otp = match[0];
    return otp;
  });
});

function randomAlpha(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function randomAlphaOnly(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const firstName = `Test${randomAlpha(5)}`;
const lastName = `User${randomAlpha(5)}`;

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test due to uncaught exceptions
  return false
})

describe('Sign Up Form Validation', () => {
  beforeEach(() => {
    cy.visit('https://myyatra360.com/home', { timeout: 120000, failOnStatusCode: false })
    cy.wait(10000)
    cy.contains('button, a', 'Sign Up').click()
    // Wait for the sign up form to appear

    cy.wait(10000)
  })

  it('should show validation when all fields are empty', () => {
    cy.get('.signup_btn').click()
    cy.wait(1000)
    cy.wait(500)
    cy.contains('First Name is required').should('be.visible')
    cy.wait(500)
    cy.contains('Last Name is required').should('be.visible')
    cy.wait(500)
    cy.contains('Email is required').should('exist')
    cy.wait(500)
    cy.contains('Mobile Number is required').should('be.visible')
    cy.wait(500)
    cy.contains('Password is required').should('exist')
    cy.wait(500)
    cy.contains('Confirm Password is required').should('be.visible')
  })

  it('should accept disposable email domains', () => {
    const timestamp = Date.now();
    const firstName = `TestFirst${timestamp}`;
    const lastName = `TestLast${timestamp}`;
    const email = `test${timestamp}@yopmail.com`;
    const mobile = `9${Cypress._.random(100000000, 999999999)}`;
    const password = `Aa1!${timestamp}`;

    cy.get('form.ng-untouched > .row > :nth-child(1) > .inputfeildArea > .ng-untouched').type(firstName);
    cy.wait(500);
    cy.get('.ng-invalid.ng-dirty > .row > :nth-child(2) > .inputfeildArea > .ng-untouched').type(lastName);
    cy.wait(500);
    cy.get('form.ng-invalid > .row > :nth-child(3) > .inputfeildArea > .ng-untouched').type(email);
    cy.wait(500);
    cy.get('.inputfeildArea > .d-flex > .ng-invalid').first().type(mobile); // Mobile
    cy.wait(500);
    cy.get(':nth-child(5) > .inputfeildArea > .passwordFeild').type(password); // Password
    cy.wait(500);
    cy.get(':nth-child(6) > .inputfeildArea > .confirmpasswordFeild').type(password);
    cy.wait(5000);
    cy.get('.signup_btn').click();
    cy.wait(1000);
     
  })

  it('should only allow letters in first and last name fields', () => {
    cy.get('form.ng-untouched > .row > :nth-child(1) > .inputfeildArea > .ng-untouched')
      .type(`${firstName}123!@#`)
      .should('have.value', firstName); // Only letters should be accepted

    cy.get('form.ng-untouched > .row > :nth-child(2) > .inputfeildArea > .ng-untouched')
      .type(`${lastName}456$%^`)
      .should('have.value', lastName); // Only letters should be accepted
  })

  it('should only accept valid email formats', () => {
    cy.get('form.ng-untouched > .row > :nth-child(3) > .inputfeildArea > .ng-untouched').type('invalid-@@gmail..com')
    cy.wait(500)
    cy.get('.signup_btn').click()
    cy.wait(1000)
    cy.contains('Please enter a valid email address').should('exist') // Adjust message as per your app
  })

  it('should enforce password min/max character limits', () => {
    cy.get(':nth-child(5) > .inputfeildArea > .passwordFeild').type('Admin@1') // Password (7 chars)
    cy.wait(500)
    cy.get('.signup_btn').click()
    cy.get(':nth-child(5) > .inputfeildArea > .passwordFeild').click()
    cy.wait(1000)
    cy.contains('At least 8 characters').should('exist') // Adjust message as per your app
  })

  it('should require confirm password to match password', () => {
    cy.get(':nth-child(5) > .inputfeildArea > .passwordFeild').type('Password1!') // Password
    cy.wait(500)
    cy.get(':nth-child(6) > .inputfeildArea > .confirmpasswordFeild').type('Password2!')
    cy.wait(500)
    cy.get('.signup_btn').click()
    cy.wait(1000)
    cy.contains('Passwords must match').should('exist') // Adjust message as per your app
  })

  it('should only accept numeric input for mobile number', () => {
    cy.get('.inputfeildArea > .d-flex > .ng-invalid').first().type('abcde@123').should('have.value', '123')// Mobile
    cy.wait(500)
    cy.get('.signup_btn').click()
    cy.wait(1000)
    cy.get('body').then($body => {
      const text = $body.text();
      expect(
        text.includes('Enter valid mobile number') || text.includes('mobile number too short'),
        'Validation message should be present'
      ).to.be.true;
    });
  })

  it('should show password validation message for weak password', () => {
    cy.get('.inputfeildArea > .d-flex > .ng-invalid').type('password') // Password
    cy.wait(500)
    cy.get('.signup_btn').click()
    cy.wait(1000)
    cy.get(':nth-child(5) > .inputfeildArea > .passwordFeild').click()
    cy.contains('At least 8 characters').should('exist')
    cy.contains('At least 1 uppercase letter').should('exist')
    cy.contains('At least 1 lowercase letter').should('exist')
    cy.contains('At least 1 number').should('exist')
    cy.contains('At least 1 special character').should('exist')
  })

  it('should prevent account creation with already registered email', () => {
    const timestamp = Date.now();
    const mobile = `9${Cypress._.random(100000000, 999999999)}`;
    const email = 'existin2121g@yopmail.com'; // Use the already registered email

    cy.get('form.ng-untouched > .row > :nth-child(1) > .inputfeildArea > .ng-untouched').type(firstName);
    cy.wait(500);
    cy.get('.ng-invalid.ng-dirty > .row > :nth-child(2) > .inputfeildArea > .ng-untouched').type(lastName);
    cy.wait(500);
    cy.get('.ng-invalid.ng-dirty > .row > :nth-child(3) > .inputfeildArea > .ng-untouched').type(email);
    cy.wait(500);
    cy.get('.inputfeildArea > .d-flex > .ng-invalid').first().type(mobile); // Mobile
    cy.wait(500);
    cy.get(':nth-child(5) > .inputfeildArea > .passwordFeild').type('Password1!'); // Password
    cy.wait(500);
    cy.get(':nth-child(6) > .inputfeildArea > .confirmpasswordFeild').type('Password1!');
    cy.wait(500);
    cy.get('.signup_btn').click();
    cy.wait(1000);
    cy.get('.notifier__notification-message').should('contain', "An error occurred during registration.")
  })

 it('should show validation for invalid email format', () => {
    cy.get('form.ng-untouched > .row > :nth-child(3) > .inputfeildArea > .ng-untouched').type('invalid@')
    cy.wait(500)
    cy.get('.signup_btn').click()
    cy.wait(1000)
    cy.contains('Please enter a valid email address').should('exist') // Adjust message as per your app
  })

  it('should show validation when mobile number is too short', () => {
    cy.get('.d-flex > .ng-select > .ng-select-container > .ng-value-container > .ng-input > input').click().type('+91').type('{enter}')
    cy.get('.inputfeildArea > .d-flex > .ng-invalid').type('123') // Mobile
    cy.wait(500)
    cy.get('.signup_btn').click()
    cy.wait(1000)
    cy.get('body').then($body => {
      const text = $body.text();
      expect(
        text.includes('mobile number too short') || text.includes('Enter valid mobile number'),
        'Validation message should be present'
      ).to.be.true;
    });
  })

  it.only('should successfully register and verify OTP with a random email', function () {
    cy.createInbox().then(inbox => {
      const email = inbox.emailAddress;
      const timestamp = Date.now()
      const mobile = `9${Cypress._.random(100000000, 999999999)}`;
      const password = `Aa1!${timestamp}`;

      // Fill first name (alphabets only)
      cy.get('form.ng-untouched > .row > :nth-child(1) > .inputfeildArea > .ng-untouched').type(randomAlphaOnly(8));
      cy.wait(300);
      // Fill last name (alphabets only)
      cy.get('.ng-invalid.ng-dirty > .row > :nth-child(2) > .inputfeildArea > .ng-untouched').type(randomAlphaOnly(8));
      cy.wait(300);
      // Fill email
      cy.get('form.ng-invalid > .row > :nth-child(3) > .inputfeildArea > .ng-untouched').type(email);
      cy.wait(300);
      // Select country code +91
      cy.get('.d-flex > .ng-select > .ng-select-container > .ng-value-container > .ng-input > input').click().type('+91').type('{enter}');
      cy.wait(300);
      // Fill mobile number
      cy.get('.inputfeildArea > .d-flex > .ng-invalid').type(mobile);
      cy.wait(300);
      // Fill password
      cy.get(':nth-child(5) > .inputfeildArea > .passwordFeild').type(password);
      cy.wait(300);
      // Fill confirm password
      cy.get(':nth-child(6) > .inputfeildArea > .confirmpasswordFeild').type(password);
      cy.wait(500);
      // Submit the form
      cy.get('.signup_btn').click();
      cy.wait(3000);

      // Wait for OTP email and extract OTP
      cy.waitForOtpEmail(inbox.id).then(otp => {
        // Enter OTP in your app
        cy.get('[formcontrolname="otp1"]').type(otp);
        cy.get('form.ng-dirty > .continuebtn').click();
        // Assert success
        cy.contains('Account verified').should('exist'); // Adjust as per your app
      });
    });
  });
})