import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PasswordModal from './PasswordModal';

describe('PasswordModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnConfirm.mockClear();
  });

  it('should not render when isOpen is false', () => {
    render(
      <PasswordModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    expect(screen.queryByText('🔐 Set Host Password')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <PasswordModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    expect(screen.getByText('🔐 Set Host Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.queryByLabelText('Confirm Password')).not.toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(
      <PasswordModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should show validation error for empty password field', async () => {
    render(
      <PasswordModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    fireEvent.click(screen.getByText('✅ Confirm'));
    
    await waitFor(() => {
      expect(screen.getByText('• Password is required')).toBeInTheDocument();
    });
    
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should show validation error for short password', async () => {
    render(
      <PasswordModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'ab' }
    });
    
    fireEvent.click(screen.getByText('✅ Confirm'));
    
    await waitFor(() => {
      expect(screen.getByText('• Password must be at least 3 characters long')).toBeInTheDocument();
    });
    
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm with password when valid input is provided', async () => {
    render(
      <PasswordModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'validpassword' }
    });
    
    fireEvent.click(screen.getByText('✅ Confirm'));
    
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('validpassword');
    });
  });

  it('should disable inputs when loading', () => {
    render(
      <PasswordModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isLoading={true}
      />
    );
    
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByText('⏳ Creating...')).toBeInTheDocument();
  });

  it('should toggle password visibility when eye icon is clicked', () => {
    render(
      <PasswordModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    const passwordInput = screen.getByLabelText('Password');
    const eyeButton = screen.getByRole('button', { name: '' }); // Eye icon button
    
    // Password should start as hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click eye icon to show password
    fireEvent.click(eyeButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click eye icon again to hide password
    fireEvent.click(eyeButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should clear form when modal is closed', () => {
    render(
      <PasswordModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    // Type password and show errors
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'ab' }
    });
    fireEvent.click(screen.getByText('✅ Confirm'));
    
    // Close modal
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});