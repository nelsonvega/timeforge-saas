import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '../Login';
import * as queryClient from '@/lib/queryClient';

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    confirmPayment: vi.fn(),
  })),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
  useStripe: () => ({
    confirmPayment: vi.fn(),
  }),
  useElements: () => ({}),
}));

// Mock useToast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('Login Page', () => {
  let testQueryClient: QueryClient;
  const apiRequestSpy = vi.spyOn(queryClient, 'apiRequest');

  beforeEach(() => {
    testQueryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockToast.mockClear();
    apiRequestSpy.mockClear();
    // Reset window.location
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <QueryClientProvider client={testQueryClient}>
        <Login />
      </QueryClientProvider>
    );
  };

  describe('Login Form', () => {
    it('should render login form by default', () => {
      renderLogin();

      expect(screen.getByText('Focus Flow')).toBeInTheDocument();
      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByTestId('tab-signin')).toBeInTheDocument();
      expect(screen.getByTestId('input-signin-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-signin-password')).toBeInTheDocument();
      expect(screen.getByTestId('button-signin')).toBeInTheDocument();
    });

    it('should handle login form submission with valid credentials', async () => {
      const user = userEvent.setup();
      apiRequestSpy.mockResolvedValueOnce({});

      renderLogin();

      const emailInput = screen.getByTestId('input-signin-email');
      const passwordInput = screen.getByTestId('input-signin-password');
      const submitButton = screen.getByTestId('button-signin');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiRequestSpy).toHaveBeenCalledWith('POST', '/api/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(window.location.href).toBe('/');
    });

    it('should show error toast on login failure', async () => {
      const user = userEvent.setup();
      apiRequestSpy.mockRejectedValueOnce(new Error('Invalid credentials'));

      renderLogin();

      const emailInput = screen.getByTestId('input-signin-email');
      const passwordInput = screen.getByTestId('input-signin-password');
      const submitButton = screen.getByTestId('button-signin');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Login failed',
          description: 'Invalid credentials',
          variant: 'destructive',
        });
      });
    });

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      apiRequestSpy.mockReturnValueOnce(loginPromise);

      renderLogin();

      const emailInput = screen.getByTestId('input-signin-email');
      const passwordInput = screen.getByTestId('input-signin-password');
      const submitButton = screen.getByTestId('button-signin');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent('Signing in...');
      });

      resolveLogin!({});
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByTestId('input-signin-password') as HTMLInputElement;
      const toggleButton = screen.getByTestId('toggle-signin-password');

      expect(passwordInput.type).toBe('password');

      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      await user.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });

    it('should render Google login button', () => {
      renderLogin();

      const googleButton = screen.getByTestId('button-google-login');
      expect(googleButton).toBeInTheDocument();
      expect(googleButton).toHaveTextContent('Continue with Google');
    });

    it('should redirect to OAuth on Google login click', async () => {
      const user = userEvent.setup();
      delete (window as any).location;
      window.location = { href: '' } as any;

      renderLogin();

      const googleButton = screen.getByTestId('button-google-login');
      await user.click(googleButton);

      expect(window.location.href).toBe('/api/login');
    });
  });

  describe('Registration Form', () => {
    it('should render registration form when signup tab is clicked', async () => {
      const user = userEvent.setup();
      renderLogin();

      const signupTab = screen.getByTestId('tab-signup');
      await user.click(signupTab);

      expect(screen.getByTestId('input-signup-company')).toBeInTheDocument();
      expect(screen.getByTestId('input-signup-firstname')).toBeInTheDocument();
      expect(screen.getByTestId('input-signup-lastname')).toBeInTheDocument();
      expect(screen.getByTestId('input-signup-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-signup-password')).toBeInTheDocument();
      expect(screen.getByTestId('input-signup-confirm-password')).toBeInTheDocument();
      expect(screen.getByTestId('button-signup')).toBeInTheDocument();
    });

    it('should handle registration form submission with free plan', async () => {
      const user = userEvent.setup();
      apiRequestSpy.mockResolvedValueOnce({
        selectedPlan: 'free',
        tenant: { id: 'tenant-1' },
      });

      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      await user.type(screen.getByTestId('input-signup-company'), 'Acme Inc');
      await user.type(screen.getByTestId('input-signup-firstname'), 'John');
      await user.type(screen.getByTestId('input-signup-lastname'), 'Doe');
      await user.type(screen.getByTestId('input-signup-email'), 'john@acme.com');
      await user.type(screen.getByTestId('input-signup-password'), 'password123');
      await user.type(screen.getByTestId('input-signup-confirm-password'), 'password123');

      const submitButton = screen.getByTestId('button-signup');
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiRequestSpy).toHaveBeenCalledWith('POST', '/api/auth/register', {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@acme.com',
          password: 'password123',
          tenantName: 'Acme Inc',
          plan: 'free',
        });
      });

      expect(window.location.href).toBe('/');
    });

    it('should show payment form when paid plan is selected', async () => {
      const user = userEvent.setup();
      apiRequestSpy.mockResolvedValueOnce({
        selectedPlan: 'paid',
        tenant: { id: 'tenant-1' },
      });
      apiRequestSpy.mockResolvedValueOnce({
        clientSecret: 'test-client-secret',
      });

      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      await user.type(screen.getByTestId('input-signup-company'), 'Acme Inc');
      await user.type(screen.getByTestId('input-signup-firstname'), 'John');
      await user.type(screen.getByTestId('input-signup-lastname'), 'Doe');
      await user.type(screen.getByTestId('input-signup-email'), 'john@acme.com');
      await user.type(screen.getByTestId('input-signup-password'), 'password123');
      await user.type(screen.getByTestId('input-signup-confirm-password'), 'password123');

      // Select paid plan
      const paidPlanRadio = screen.getByTestId('radio-plan-paid');
      await user.click(paidPlanRadio);

      const submitButton = screen.getByTestId('button-signup');
      expect(submitButton).toHaveTextContent('Continue to Payment');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Complete Your Payment')).toBeInTheDocument();
      });

      expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
      expect(screen.getByTestId('payment-element')).toBeInTheDocument();
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      await user.type(screen.getByTestId('input-signup-company'), 'Acme Inc');
      await user.type(screen.getByTestId('input-signup-firstname'), 'John');
      await user.type(screen.getByTestId('input-signup-lastname'), 'Doe');
      await user.type(screen.getByTestId('input-signup-email'), 'john@acme.com');
      await user.type(screen.getByTestId('input-signup-password'), 'password123');
      await user.type(screen.getByTestId('input-signup-confirm-password'), 'differentpassword');

      const submitButton = screen.getByTestId('button-signup');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Passwords don't match",
          description: 'Please make sure both passwords are the same',
          variant: 'destructive',
        });
      });

      expect(apiRequestSpy).not.toHaveBeenCalled();
    });

    it('should show password mismatch indicator while typing', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      await user.type(screen.getByTestId('input-signup-password'), 'password123');
      await user.type(screen.getByTestId('input-signup-confirm-password'), 'differentpass');

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('should show error for password less than 8 characters', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      await user.type(screen.getByTestId('input-signup-company'), 'Acme Inc');
      await user.type(screen.getByTestId('input-signup-firstname'), 'John');
      await user.type(screen.getByTestId('input-signup-lastname'), 'Doe');
      await user.type(screen.getByTestId('input-signup-email'), 'john@acme.com');

      // Remove the minLength attribute to test custom validation logic
      const passwordInput = screen.getByTestId('input-signup-password') as HTMLInputElement;
      const confirmPasswordInput = screen.getByTestId('input-signup-confirm-password') as HTMLInputElement;
      passwordInput.removeAttribute('minLength');
      confirmPasswordInput.removeAttribute('minLength');

      await user.type(passwordInput, 'pass123');
      await user.type(confirmPasswordInput, 'pass123');

      const submitButton = screen.getByTestId('button-signup');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Password too short',
          description: 'Password must be at least 8 characters long',
          variant: 'destructive',
        });
      });

      expect(apiRequestSpy).not.toHaveBeenCalled();
    });

    it('should show error toast on registration failure', async () => {
      const user = userEvent.setup();
      apiRequestSpy.mockRejectedValueOnce(new Error('Email already exists'));

      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      await user.type(screen.getByTestId('input-signup-company'), 'Acme Inc');
      await user.type(screen.getByTestId('input-signup-firstname'), 'John');
      await user.type(screen.getByTestId('input-signup-lastname'), 'Doe');
      await user.type(screen.getByTestId('input-signup-email'), 'john@acme.com');
      await user.type(screen.getByTestId('input-signup-password'), 'password123');
      await user.type(screen.getByTestId('input-signup-confirm-password'), 'password123');

      await user.click(screen.getByTestId('button-signup'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Registration failed',
          description: 'Email already exists',
          variant: 'destructive',
        });
      });
    });

    it('should toggle signup password visibility', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      const passwordInput = screen.getByTestId('input-signup-password') as HTMLInputElement;
      const toggleButton = screen.getByTestId('toggle-signup-password');

      expect(passwordInput.type).toBe('password');

      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      await user.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });

    it('should toggle confirm password visibility', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      const confirmPasswordInput = screen.getByTestId('input-signup-confirm-password') as HTMLInputElement;
      const toggleButton = screen.getByTestId('toggle-confirm-password');

      expect(confirmPasswordInput.type).toBe('password');

      await user.click(toggleButton);
      expect(confirmPasswordInput.type).toBe('text');

      await user.click(toggleButton);
      expect(confirmPasswordInput.type).toBe('password');
    });

    it('should disable submit button while registering', async () => {
      const user = userEvent.setup();
      let resolveRegister: (value: any) => void;
      const registerPromise = new Promise((resolve) => {
        resolveRegister = resolve;
      });
      apiRequestSpy.mockReturnValueOnce(registerPromise);

      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      await user.type(screen.getByTestId('input-signup-company'), 'Acme Inc');
      await user.type(screen.getByTestId('input-signup-firstname'), 'John');
      await user.type(screen.getByTestId('input-signup-lastname'), 'Doe');
      await user.type(screen.getByTestId('input-signup-email'), 'john@acme.com');
      await user.type(screen.getByTestId('input-signup-password'), 'password123');
      await user.type(screen.getByTestId('input-signup-confirm-password'), 'password123');

      const submitButton = screen.getByTestId('button-signup');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent('Creating account...');
      });

      resolveRegister!({ selectedPlan: 'free', tenant: { id: 'tenant-1' } });
    });

    it('should render Google signup button', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      const googleButton = screen.getByTestId('button-google-signup');
      expect(googleButton).toBeInTheDocument();
      expect(googleButton).toHaveTextContent('Continue with Google');
    });
  });

  describe('Plan Selection', () => {
    it('should render free plan option', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      const freePlanRadio = screen.getByTestId('radio-plan-free');
      expect(freePlanRadio).toBeInTheDocument();
      expect(screen.getByText('Free Plan')).toBeInTheDocument();
      expect(screen.getByText('Basic time tracking features')).toBeInTheDocument();
    });

    it('should render paid plan option', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      const paidPlanRadio = screen.getByTestId('radio-plan-paid');
      expect(paidPlanRadio).toBeInTheDocument();
      expect(screen.getByText('Paid Plan')).toBeInTheDocument();
      expect(screen.getByText('Advanced reporting and team features')).toBeInTheDocument();
    });

    it('should default to free plan', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      const freePlanRadio = screen.getByTestId('radio-plan-free') as HTMLInputElement;
      expect(freePlanRadio).toBeChecked();
    });

    it('should allow selecting paid plan', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      const paidPlanRadio = screen.getByTestId('radio-plan-paid');
      await user.click(paidPlanRadio);

      expect(paidPlanRadio).toBeChecked();

      const submitButton = screen.getByTestId('button-signup');
      expect(submitButton).toHaveTextContent('Continue to Payment');
    });

    it('should switch between plans', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      const freePlanRadio = screen.getByTestId('radio-plan-free') as HTMLInputElement;
      const paidPlanRadio = screen.getByTestId('radio-plan-paid') as HTMLInputElement;

      expect(freePlanRadio).toBeChecked();

      await user.click(paidPlanRadio);
      expect(paidPlanRadio).toBeChecked();
      expect(freePlanRadio).not.toBeChecked();

      await user.click(freePlanRadio);
      expect(freePlanRadio).toBeChecked();
      expect(paidPlanRadio).not.toBeChecked();
    });
  });

  describe('Tab Switching', () => {
    it('should switch from signin to signup tab', async () => {
      const user = userEvent.setup();
      renderLogin();

      expect(screen.getByTestId('input-signin-email')).toBeInTheDocument();

      await user.click(screen.getByTestId('tab-signup'));

      expect(screen.getByTestId('input-signup-email')).toBeInTheDocument();
      expect(screen.queryByTestId('input-signin-email')).not.toBeInTheDocument();
    });

    it('should switch from signup to signin tab', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));
      expect(screen.getByTestId('input-signup-email')).toBeInTheDocument();

      await user.click(screen.getByTestId('tab-signin'));

      expect(screen.getByTestId('input-signin-email')).toBeInTheDocument();
      expect(screen.queryByTestId('input-signup-email')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require email field in login form', () => {
      renderLogin();

      const emailInput = screen.getByTestId('input-signin-email') as HTMLInputElement;
      expect(emailInput).toBeRequired();
    });

    it('should require password field in login form', () => {
      renderLogin();

      const passwordInput = screen.getByTestId('input-signin-password') as HTMLInputElement;
      expect(passwordInput).toBeRequired();
    });

    it('should require all fields in registration form', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      expect(screen.getByTestId('input-signup-company') as HTMLInputElement).toBeRequired();
      expect(screen.getByTestId('input-signup-firstname') as HTMLInputElement).toBeRequired();
      expect(screen.getByTestId('input-signup-lastname') as HTMLInputElement).toBeRequired();
      expect(screen.getByTestId('input-signup-email') as HTMLInputElement).toBeRequired();
      expect(screen.getByTestId('input-signup-password') as HTMLInputElement).toBeRequired();
      expect(screen.getByTestId('input-signup-confirm-password') as HTMLInputElement).toBeRequired();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByTestId('input-signin-email') as HTMLInputElement;
      expect(emailInput.type).toBe('email');
    });

    it('should enforce minimum password length on signup', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      const passwordInput = screen.getByTestId('input-signup-password') as HTMLInputElement;
      expect(passwordInput.minLength).toBe(8);
    });

    it('should display password requirement hint', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });
  });

  describe('Payment Flow', () => {
    it('should show payment form title and description', async () => {
      const user = userEvent.setup();
      apiRequestSpy.mockResolvedValueOnce({
        selectedPlan: 'paid',
        tenant: { id: 'tenant-1' },
      });
      apiRequestSpy.mockResolvedValueOnce({
        clientSecret: 'test-client-secret',
      });

      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      await user.type(screen.getByTestId('input-signup-company'), 'Acme Inc');
      await user.type(screen.getByTestId('input-signup-firstname'), 'John');
      await user.type(screen.getByTestId('input-signup-lastname'), 'Doe');
      await user.type(screen.getByTestId('input-signup-email'), 'john@acme.com');
      await user.type(screen.getByTestId('input-signup-password'), 'password123');
      await user.type(screen.getByTestId('input-signup-confirm-password'), 'password123');

      const paidPlanRadio = screen.getByTestId('radio-plan-paid');
      await user.click(paidPlanRadio);

      await user.click(screen.getByTestId('button-signup'));

      await waitFor(() => {
        expect(screen.getByText('Complete Your Payment')).toBeInTheDocument();
      });

      expect(screen.getByText('Paid Plan - $15')).toBeInTheDocument();
      expect(screen.getByText('One-time payment for premium features')).toBeInTheDocument();
      expect(screen.getByText('Secure payment powered by Stripe')).toBeInTheDocument();
    });

    it('should create payment intent for paid plan', async () => {
      const user = userEvent.setup();
      apiRequestSpy.mockResolvedValueOnce({
        selectedPlan: 'paid',
        tenant: { id: 'tenant-1' },
      });
      apiRequestSpy.mockResolvedValueOnce({
        clientSecret: 'test-client-secret',
      });

      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      await user.type(screen.getByTestId('input-signup-company'), 'Acme Inc');
      await user.type(screen.getByTestId('input-signup-firstname'), 'John');
      await user.type(screen.getByTestId('input-signup-lastname'), 'Doe');
      await user.type(screen.getByTestId('input-signup-email'), 'john@acme.com');
      await user.type(screen.getByTestId('input-signup-password'), 'password123');
      await user.type(screen.getByTestId('input-signup-confirm-password'), 'password123');

      const paidPlanRadio = screen.getByTestId('radio-plan-paid');
      await user.click(paidPlanRadio);

      await user.click(screen.getByTestId('button-signup'));

      await waitFor(() => {
        expect(apiRequestSpy).toHaveBeenCalledWith('POST', '/api/create-payment-intent', {
          tenantId: 'tenant-1',
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should show default error message when error has no message', async () => {
      const user = userEvent.setup();
      apiRequestSpy.mockRejectedValueOnce(new Error());

      renderLogin();

      const emailInput = screen.getByTestId('input-signin-email');
      const passwordInput = screen.getByTestId('input-signin-password');
      const submitButton = screen.getByTestId('button-signin');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Login failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        });
      });
    });

    it('should show default registration error message when error has no message', async () => {
      const user = userEvent.setup();
      apiRequestSpy.mockRejectedValueOnce(new Error());

      renderLogin();

      await user.click(screen.getByTestId('tab-signup'));

      await user.type(screen.getByTestId('input-signup-company'), 'Acme Inc');
      await user.type(screen.getByTestId('input-signup-firstname'), 'John');
      await user.type(screen.getByTestId('input-signup-lastname'), 'Doe');
      await user.type(screen.getByTestId('input-signup-email'), 'john@acme.com');
      await user.type(screen.getByTestId('input-signup-password'), 'password123');
      await user.type(screen.getByTestId('input-signup-confirm-password'), 'password123');

      await user.click(screen.getByTestId('button-signup'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Registration failed',
          description: 'Unable to create account',
          variant: 'destructive',
        });
      });
    });
  });
});
