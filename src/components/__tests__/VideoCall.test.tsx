import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import VideoCall from '../VideoCall';
import { supabase } from '@/integrations/supabase/client';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'test-persona-id',
              name: 'Test Persona',
              voice_style: 'friendly',
              personality: 'helpful',
            },
            error: null,
          }),
        })),
      })),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
  },
}));

describe('VideoCall Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes video call session when start call button is clicked', async () => {
    render(
      <BrowserRouter>
        <VideoCall />
      </BrowserRouter>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText(/Start Call/i)).toBeInTheDocument();
    });

    // Click the start call button
    const startCallButton = screen.getByText(/Start Call/i);
    fireEvent.click(startCallButton);

    // Verify that the Azure video chat function was called
    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('azure-video-chat', {
        body: expect.objectContaining({
          action: 'initialize',
          personaId: expect.any(String),
        }),
      });
    });
  });

  it('shows consent dialog before starting the call', async () => {
    render(
      <BrowserRouter>
        <VideoCall />
      </BrowserRouter>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText(/Start Call/i)).toBeInTheDocument();
    });

    // Click the start call button
    const startCallButton = screen.getByText(/Start Call/i);
    fireEvent.click(startCallButton);

    // Verify that the consent dialog appears
    await waitFor(() => {
      expect(screen.getByText(/Before starting the call/i)).toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    // Mock an error response
    vi.mocked(supabase.functions.invoke).mockRejectedValueOnce(new Error('Test error'));

    render(
      <BrowserRouter>
        <VideoCall />
      </BrowserRouter>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText(/Start Call/i)).toBeInTheDocument();
    });

    // Click the start call button
    const startCallButton = screen.getByText(/Start Call/i);
    fireEvent.click(startCallButton);

    // Verify that the error message appears
    await waitFor(() => {
      expect(screen.getByText(/Failed to initialize video call/i)).toBeInTheDocument();
    });
  });
});