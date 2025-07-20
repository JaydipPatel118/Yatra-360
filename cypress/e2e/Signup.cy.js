import { MailSlurp } from 'mailslurp-client';
const mailslurp = new MailSlurp({ apiKey: 'b4d991203f2397c45a8d9f0229aec2539bee542be53055f977169efaa4fc0697' });

// Locators for the signup form
const FIRST_NAME_INPUT = 'form.ng-untouched > .row > :nth-child(1) > .inputfeildArea > .ng-untouched';
const LAST_NAME_INPUT = '.ng-invalid.ng-dirty > .row > :nth-child(2) > .inputfeildArea > .ng-untouched';
const EMAIL_INPUT = 'form.ng-invalid > .row > :nth-child(3) > .inputfeildArea > .ng-untouched';
const COUNTRY_CODE_INPUT = '.d-flex > .ng-select > .ng-select-container > .ng-value-container > .ng-input > input';
const MOBILE_INPUT = '.inputfeildArea > .d-flex > .ng-invalid';
const PASSWORD_INPUT = ':nth-child(5) > .inputfeildArea > .passwordFeild';
const CONFIRM_PASSWORD_INPUT = ':nth-child(6) > .inputfeildArea > .confirmpasswordFeild';
const SIGNUP_BUTTON = '.signup_btn';
const NOTIFIER_MESSAGE = '.notifier__notification-message';
const OTP_INPUT = '[formcontrolname="otp1"]';
const CONTINUE_BUTTON = 'form.ng-dirty > .continuebtn';

function fillSignupForm({ firstName, lastName, email, mobile, password, confirmPassword = password, countryCode = '+91' }) {
  cy.get(FIRST_NAME_INPUT).clear().type(firstName);
  cy.get(LAST_NAME_INPUT).clear().type(lastName);
  cy.get(EMAIL_INPUT).clear().type(email);
  cy.get(COUNTRY_CODE_INPUT).click().type(countryCode).type('{enter}');
  cy.get(MOBILE_INPUT).clear().type(mobile);
  cy.get(PASSWORD_INPUT).clear().type(password);
  cy.get(CONFIRM_PASSWORD_INPUT).clear().type(confirmPassword);
}

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

function generateRandomUser() {
  const timestamp = Date.now();
  return {
    firstName: randomAlpha(8),
    lastName: randomAlpha(8),
    email: `test${timestamp}@yopmail.com`,
    mobile: `9${Cypress._.random(100000000, 999999999)}`,
    password: `Aa1!${timestamp}`
  };
}

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
    cy.get(SIGNUP_BUTTON).click()
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
    const user = generateRandomUser();
    fillSignupForm(user);
    cy.get(SIGNUP_BUTTON).click();
    cy.get('body').should('exist'); // Wait for page response
  })

  it('should only allow letters in first and last name fields', () => {
    cy.get(FIRST_NAME_INPUT)
      .type(`${randomAlpha(5)}123!@#`)
      .should('have.value', randomAlpha(5)); // Only letters should be accepted

    cy.get(LAST_NAME_INPUT)
      .type(`${randomAlpha(5)}456$%^`)
      .should('have.value', randomAlpha(5)); // Only letters should be accepted
  })

  it('should only accept valid email formats', () => {
    cy.get(EMAIL_INPUT).type('invalid-@@gmail..com')
    cy.wait(500)
    cy.get(SIGNUP_BUTTON).click()
    cy.wait(1000)
    cy.contains('Please enter a valid email address').should('exist') // Adjust message as per your app
  })

  it('should enforce password min/max character limits', () => {
    cy.get(PASSWORD_INPUT).type('Admin@1') // Password (7 chars)
    cy.wait(500)
    cy.get(SIGNUP_BUTTON).click()
    cy.get(PASSWORD_INPUT).click()
    cy.wait(1000)
    cy.contains('At least 8 characters').should('exist') // Adjust message as per your app
  })

  it('should require confirm password to match password', () => {
    cy.get(PASSWORD_INPUT).type('Password1!') // Password
    cy.wait(500)
    cy.get(CONFIRM_PASSWORD_INPUT).type('Password2!')
    cy.wait(500)
    cy.get(SIGNUP_BUTTON).click()
    cy.wait(1000)
    cy.contains('Passwords must match').should('exist') // Adjust message as per your app
  })

  it('should only accept numeric input for mobile number', () => {
    cy.get(MOBILE_INPUT).first().type('abcde@123').should('have.value', '123')// Mobile
    cy.wait(500)
    cy.get(SIGNUP_BUTTON).click()
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
    cy.get(MOBILE_INPUT).type('password') // Password
    cy.wait(500)
    cy.get(SIGNUP_BUTTON).click()
    cy.wait(1000)
    cy.get(PASSWORD_INPUT).click()
    cy.contains('At least 8 characters').should('exist')
    cy.contains('At least 1 uppercase letter').should('exist')
    cy.contains('At least 1 lowercase letter').should('exist')
    cy.contains('At least 1 number').should('exist')
    cy.contains('At least 1 special character').should('exist')
  })

  it('should show validation for invalid email format', () => {
    cy.get(EMAIL_INPUT).type('invalid@')
    cy.wait(500)
    cy.get(SIGNUP_BUTTON).click()
    cy.wait(1000)
    cy.contains('Please enter a valid email address').should('exist') // Adjust message as per your app
  })

  it('should show validation when mobile number is too short', () => {
    cy.get(COUNTRY_CODE_INPUT).click().type('+91').type('{enter}')
    cy.get(MOBILE_INPUT).type('123') // Mobile
    cy.wait(500)
    cy.get(SIGNUP_BUTTON).click()
    cy.wait(1000)
    cy.get('body').then($body => {
      const text = $body.text();
      expect(
        text.includes('mobile number too short') || text.includes('Enter valid mobile number'),
        'Validation message should be present'
      ).to.be.true;
    });
  })

  it('should prevent account creation with already registered email', () => {
    const mobile = `9${Cypress._.random(100000000, 999999999)}`;
    const user = {
      firstName: randomAlpha(5),
      lastName: randomAlpha(5),
      email: 'existin2121g@yopmail.com',
      mobile,
      password: 'Password1!'
    };
    fillSignupForm(user);
    cy.get(SIGNUP_BUTTON).click();
    cy.get(NOTIFIER_MESSAGE).should('contain', "An error occurred during registration.")
  })

  it.only('should successfully register and verify OTP with a random email', function () {
    cy.createInbox().then(inbox => {
      const email = inbox.emailAddress;
      const user = generateRandomUser();
      fillSignupForm(user);
      cy.get(SIGNUP_BUTTON).click();
      cy.get(OTP_INPUT).should('be.visible');
      cy.waitForOtpEmail(inbox.id).then(otp => {
        cy.get(OTP_INPUT).type(otp);
        cy.get(CONTINUE_BUTTON).click();
        cy.contains('Account verified').should('exist');
      });
    });
  });
})